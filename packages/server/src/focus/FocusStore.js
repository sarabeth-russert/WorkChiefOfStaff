import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

class FocusStore {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'focus');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');
    this.sessions = [];
    this.ensureDataDirectory();
    this.load();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  load() {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        this.sessions = JSON.parse(fs.readFileSync(this.sessionsFile, 'utf8'));
      }
    } catch (error) {
      logger.error('Error loading focus sessions', { error: error.message });
      this.sessions = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.sessionsFile, JSON.stringify(this.sessions, null, 2), 'utf8');
    } catch (error) {
      logger.error('Error saving focus sessions', { error: error.message });
    }
  }

  getAll() {
    return this.sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  }

  getByDate(date) {
    return this.sessions.filter(s => s.date === date)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  }

  start({ duration, label = '', goalId = null }) {
    const session = {
      id: `focus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      duration, // in minutes
      label,
      goalId,
      date: new Date().toISOString().split('T')[0],
      startedAt: new Date().toISOString(),
      completedAt: null,
      completed: false, // true = ran full duration, false = cancelled early
      status: 'active'
    };
    this.sessions.push(session);
    this.save();
    return session;
  }

  complete(id, completed = true) {
    const session = this.sessions.find(s => s.id === id);
    if (!session) return null;

    session.completedAt = new Date().toISOString();
    session.completed = completed;
    session.status = completed ? 'completed' : 'cancelled';
    this.save();
    return session;
  }

  getStats(startDate, endDate) {
    let filtered = this.sessions;

    if (startDate) {
      filtered = filtered.filter(s => s.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(s => s.date <= endDate);
    }

    const completed = filtered.filter(s => s.status === 'completed');
    const totalMinutes = completed.reduce((sum, s) => sum + s.duration, 0);

    // Group by date
    const byDate = {};
    completed.forEach(s => {
      if (!byDate[s.date]) byDate[s.date] = { count: 0, minutes: 0 };
      byDate[s.date].count++;
      byDate[s.date].minutes += s.duration;
    });

    return {
      totalSessions: completed.length,
      totalMinutes,
      averagePerDay: Object.keys(byDate).length > 0
        ? Math.round(totalMinutes / Object.keys(byDate).length)
        : 0,
      byDate,
      streak: this.calculateStreak()
    };
  }

  calculateStreak() {
    const dates = [...new Set(
      this.sessions.filter(s => s.status === 'completed').map(s => s.date)
    )].sort().reverse();

    if (dates.length === 0) return 0;

    let streak = 1;
    const today = new Date().toISOString().split('T')[0];

    // If no session today, check if there was one yesterday
    if (dates[0] !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (dates[0] !== yesterday) return 0;
    }

    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i] + 'T00:00:00Z');
      const prev = new Date(dates[i + 1] + 'T00:00:00Z');
      const diffDays = (current - prev) / 86400000;
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

const focusStore = new FocusStore();
export default focusStore;
