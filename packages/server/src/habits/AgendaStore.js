import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

/**
 * AgendaStore manages recurring agenda items that surface in standups.
 * Items have a recurrence pattern (weekly/biweekly) and a day of week.
 */
class AgendaStore {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'agenda');
    this.configPath = path.join(this.dataDir, 'items.json');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      logger.info('Created agenda data directory', { path: this.dataDir });
    }
  }

  getItems() {
    if (!fs.existsSync(this.configPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  saveItems(items) {
    fs.writeFileSync(this.configPath, JSON.stringify(items, null, 2), 'utf8');
    logger.info('Saved agenda items', { count: items.length });
  }

  addItem(item) {
    const items = this.getItems();
    const newItem = {
      id: `agenda-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: item.name,
      recurrence: item.recurrence, // 'weekly' or 'biweekly'
      dayOfWeek: item.dayOfWeek,   // 0=Sun, 1=Mon, ..., 6=Sat
      startDate: item.startDate || new Date().toISOString().split('T')[0], // anchor for biweekly
      notes: item.notes || null,
      createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    this.saveItems(items);
    return newItem;
  }

  updateItem(id, updates) {
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return null;
    items[idx] = { ...items[idx], ...updates, id };
    this.saveItems(items);
    return items[idx];
  }

  removeItem(id) {
    const items = this.getItems();
    const filtered = items.filter(i => i.id !== id);
    this.saveItems(filtered);
    return true;
  }

  /**
   * Get agenda items that fall on a given date.
   * @param {string} dateStr - YYYY-MM-DD
   * @returns {Array} items active on that date
   */
  getItemsForDate(dateStr) {
    const items = this.getItems();
    const date = new Date(dateStr + 'T12:00:00Z'); // noon UTC to avoid TZ edge cases
    const dayOfWeek = date.getUTCDay(); // 0=Sun..6=Sat

    return items.filter(item => {
      // Day of week must match
      if (item.dayOfWeek !== dayOfWeek) return false;

      if (item.recurrence === 'weekly') return true;

      if (item.recurrence === 'biweekly') {
        // Calculate weeks since anchor date
        const anchor = new Date(item.startDate + 'T12:00:00Z');
        const diffMs = date - anchor;
        const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
        return diffWeeks % 2 === 0;
      }

      return false;
    });
  }
}

const agendaStore = new AgendaStore();
export default agendaStore;
