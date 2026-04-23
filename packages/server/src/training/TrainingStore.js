import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data/training');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const DEFAULT_CONFIG = {
  domains: {
    math: {
      enabled: true,
      label: 'Mental Math',
      timeBudget: 60,
      drillTypes: {
        'doubling-chain': { enabled: true, steps: 6 },
        'serial-subtraction': { enabled: true, steps: 8, subtrahend: 7 },
        'multiplication': { enabled: true, questions: 5 },
        'estimation': { enabled: true, questions: 4, tolerance: 0.15 }
      }
    },
    memory: {
      enabled: true,
      label: 'Memory',
      timeBudget: 90,
      drillTypes: {
        'sequence-recall': { enabled: true, length: 7 }
      }
    },
    wordplay: {
      enabled: true,
      label: 'Wordplay',
      timeBudget: 60,
      drillTypes: {
        'word-association': { enabled: true, prompts: 3 },
        'pun-creation': { enabled: true, prompts: 2 }
      }
    },
    verbal: {
      enabled: true,
      label: 'Verbal Agility',
      timeBudget: 60,
      drillTypes: {
        'wit-comeback': { enabled: true, prompts: 3 },
        'verbal-fluency': { enabled: true, category: null, target: 8 }
      }
    },
    imagination: {
      enabled: true,
      label: 'Imagination',
      timeBudget: 60,
      drillTypes: {
        'what-if': { enabled: true, prompts: 2 },
        'alternative-uses': { enabled: true, prompts: 2 }
      }
    },
    'ear-training': {
      enabled: true,
      label: 'Ear Training',
      timeBudget: 60,
      drillTypes: {
        'interval-id': { enabled: true, questions: 5 }
      }
    },
    spatial: {
      enabled: true,
      label: 'Spatial',
      timeBudget: 60,
      drillTypes: {
        'pattern-sequence': { enabled: true, questions: 5 },
        'coordinate-tracking': { enabled: true, questions: 4 }
      }
    },
    processing: {
      enabled: true,
      label: 'Processing Speed',
      timeBudget: 45,
      drillTypes: {
        'stroop': { enabled: true, questions: 6 },
        'rapid-compare': { enabled: true, questions: 6 }
      }
    },
    logic: {
      enabled: true,
      label: 'Logic',
      timeBudget: 90,
      drillTypes: {
        'syllogism': { enabled: true, questions: 4 },
        'ordering': { enabled: true, questions: 4 }
      }
    },
    attention: {
      enabled: true,
      label: 'Attention',
      timeBudget: 45,
      drillTypes: {
        'flanker': { enabled: true, questions: 8 },
        'odd-one-out': { enabled: true, questions: 6 }
      }
    },
    temporal: {
      enabled: true,
      label: 'Time Sense',
      timeBudget: 60,
      drillTypes: {
        'time-estimation': { enabled: true, questions: 4 }
      }
    }
  }
};

class TrainingStore {
  constructor() {
    this.sessions = [];
    this.config = { ...DEFAULT_CONFIG };
    this.ensureDataDir();
    this.load();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  load() {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        this.sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      }
    } catch (err) {
      logger.error('Failed to load training sessions', { error: err.message });
      this.sessions = [];
    }

    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        this.config = this.mergeConfig(DEFAULT_CONFIG, saved);
      }
    } catch (err) {
      logger.error('Failed to load training config', { error: err.message });
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  mergeConfig(defaults, saved) {
    const merged = JSON.parse(JSON.stringify(defaults));
    if (saved.domains) {
      for (const [domain, val] of Object.entries(saved.domains)) {
        if (merged.domains[domain]) {
          merged.domains[domain] = { ...merged.domains[domain], ...val };
          if (val.drillTypes && merged.domains[domain].drillTypes) {
            merged.domains[domain].drillTypes = { ...merged.domains[domain].drillTypes, ...val.drillTypes };
          }
        }
      }
    }
    return merged;
  }

  saveSessions() {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(this.sessions, null, 2));
    } catch (err) {
      logger.error('Failed to save training sessions', { error: err.message });
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (err) {
      logger.error('Failed to save training config', { error: err.message });
    }
  }

  getConfig() {
    return this.config;
  }

  updateConfig(updates) {
    this.config = this.mergeConfig(this.config, updates);
    this.saveConfig();
    return this.config;
  }

  addSession(session) {
    this.sessions.push(session);
    this.saveSessions();
    return session;
  }

  getSessions(limit = 30) {
    return [...this.sessions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  getTodaySession() {
    const today = new Date().toISOString().split('T')[0];
    return this.sessions.find(s => s.date === today);
  }

  getStats() {
    if (this.sessions.length === 0) {
      return { totalSessions: 0, averageScore: 0, streak: 0, bestScore: 0 };
    }

    const scores = this.sessions.map(s => s.overallScore).filter(s => s != null);
    const sorted = [...this.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const sessionDate = new Date(sorted[i].date);
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (sessionDate.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }

    return {
      totalSessions: this.sessions.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      streak,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0
    };
  }
}

export default new TrainingStore();
