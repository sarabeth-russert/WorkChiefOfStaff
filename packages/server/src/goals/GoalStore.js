import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

class GoalStore {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'goals');
    this.goalsFile = path.join(this.dataDir, 'goals.json');
    this.goals = [];
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
      if (fs.existsSync(this.goalsFile)) {
        this.goals = JSON.parse(fs.readFileSync(this.goalsFile, 'utf8'));
      }
    } catch (error) {
      logger.error('Error loading goals', { error: error.message });
      this.goals = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.goalsFile, JSON.stringify(this.goals, null, 2), 'utf8');
    } catch (error) {
      logger.error('Error saving goals', { error: error.message });
    }
  }

  getAll() {
    return this.goals;
  }

  getActive() {
    return this.goals.filter(g => g.status === 'active');
  }

  getByWeek(weekOf) {
    return this.goals.filter(g => g.weekOf === weekOf);
  }

  create({ title, description, weekOf, category = 'general', milestones = [] }) {
    const goal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: description || '',
      weekOf,
      category,
      status: 'active',
      progress: 0,
      milestones: milestones.map((m, i) => ({
        id: `ms-${i}-${Date.now()}`,
        text: typeof m === 'string' ? m : m.text,
        completed: false
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.goals.push(goal);
    this.save();
    return goal;
  }

  update(id, updates) {
    const index = this.goals.findIndex(g => g.id === id);
    if (index < 0) return null;

    const goal = this.goals[index];
    if (updates.title !== undefined) goal.title = updates.title;
    if (updates.description !== undefined) goal.description = updates.description;
    if (updates.status !== undefined) goal.status = updates.status;
    if (updates.progress !== undefined) goal.progress = Math.min(100, Math.max(0, updates.progress));
    if (updates.category !== undefined) goal.category = updates.category;

    goal.updatedAt = new Date().toISOString();
    this.save();
    return goal;
  }

  toggleMilestone(goalId, milestoneId) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return null;

    const milestone = goal.milestones.find(m => m.id === milestoneId);
    if (!milestone) return null;

    milestone.completed = !milestone.completed;

    // Auto-calculate progress from milestones
    if (goal.milestones.length > 0) {
      const completed = goal.milestones.filter(m => m.completed).length;
      goal.progress = Math.round((completed / goal.milestones.length) * 100);
    }

    // Auto-complete goal if all milestones done
    if (goal.milestones.length > 0 && goal.milestones.every(m => m.completed)) {
      goal.status = 'completed';
    } else if (goal.status === 'completed') {
      goal.status = 'active';
    }

    goal.updatedAt = new Date().toISOString();
    this.save();
    return goal;
  }

  addMilestone(goalId, text) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return null;

    const milestone = {
      id: `ms-${goal.milestones.length}-${Date.now()}`,
      text,
      completed: false
    };
    goal.milestones.push(milestone);

    // Recalculate progress
    const completed = goal.milestones.filter(m => m.completed).length;
    goal.progress = Math.round((completed / goal.milestones.length) * 100);

    goal.updatedAt = new Date().toISOString();
    this.save();
    return goal;
  }

  delete(id) {
    const index = this.goals.findIndex(g => g.id === id);
    if (index < 0) return false;
    this.goals.splice(index, 1);
    this.save();
    return true;
  }

  // Get current week string (Monday-based) in YYYY-MM-DD format
  static getCurrentWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  // Get weekly review data: goals + their status for a given week
  getWeeklyReview(weekOf) {
    const weekGoals = this.getByWeek(weekOf);
    const completed = weekGoals.filter(g => g.status === 'completed');
    const active = weekGoals.filter(g => g.status === 'active');
    const abandoned = weekGoals.filter(g => g.status === 'abandoned');

    return {
      weekOf,
      total: weekGoals.length,
      completed: completed.length,
      active: active.length,
      abandoned: abandoned.length,
      completionRate: weekGoals.length > 0
        ? Math.round((completed.length / weekGoals.length) * 100)
        : 0,
      goals: weekGoals
    };
  }
}

const goalStore = new GoalStore();
export default goalStore;
