import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

class HabitStore {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'habits');
    this.configPath = path.join(this.dataDir, 'config.json');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      logger.info('Created habits data directory', { path: this.dataDir });
    }
  }

  // --- Config: which habits the user is tracking ---

  getConfig() {
    if (!fs.existsSync(this.configPath)) {
      return { habits: [] };
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  saveConfig(config) {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
    logger.info('Saved habit config', { count: config.habits.length });
    return config;
  }

  addHabit(habit) {
    const config = this.getConfig();
    const newHabit = {
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: habit.name,
      icon: habit.icon || null,
      createdAt: new Date().toISOString(),
    };
    config.habits.push(newHabit);
    this.saveConfig(config);
    return newHabit;
  }

  removeHabit(habitId) {
    const config = this.getConfig();
    config.habits = config.habits.filter(h => h.id !== habitId);
    this.saveConfig(config);
    return true;
  }

  updateHabit(habitId, updates) {
    const config = this.getConfig();
    const idx = config.habits.findIndex(h => h.id === habitId);
    if (idx < 0) return null;
    config.habits[idx] = { ...config.habits[idx], ...updates, id: habitId };
    this.saveConfig(config);
    return config.habits[idx];
  }

  // --- Daily logs: check-offs per day ---

  getDayPath(date) {
    return path.join(this.dataDir, `day-${date}.json`);
  }

  getDayLog(date) {
    const filePath = this.getDayPath(date);
    if (!fs.existsSync(filePath)) {
      return { date, completed: {} };
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  toggleHabit(date, habitId) {
    const dayLog = this.getDayLog(date);
    dayLog.completed[habitId] = !dayLog.completed[habitId];
    dayLog.date = date;
    dayLog.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.getDayPath(date), JSON.stringify(dayLog, null, 2), 'utf8');
    logger.info('Toggled habit', { date, habitId, value: dayLog.completed[habitId] });
    return dayLog;
  }

  setHabit(date, habitId, value) {
    const dayLog = this.getDayLog(date);
    dayLog.completed[habitId] = !!value;
    dayLog.date = date;
    dayLog.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.getDayPath(date), JSON.stringify(dayLog, null, 2), 'utf8');
    return dayLog;
  }

  getWeekSummary(endDate) {
    const end = new Date(endDate + 'T00:00:00Z');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(this.getDayLog(dateStr));
    }
    return days;
  }
}

const habitStore = new HabitStore();
export default habitStore;
