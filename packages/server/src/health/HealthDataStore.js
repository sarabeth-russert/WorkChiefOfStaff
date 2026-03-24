import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';
import { SUM_METRICS } from './HealthMetrics.js';

/**
 * HealthDataStore - Day-partitioned JSON storage for Apple Health metrics.
 * Files live in data/health/YYYY-MM-DD.json, separate from Oura wellness data.
 */
class HealthDataStore {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'health');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      logger.info('[HealthDataStore] Created health data directory', { path: this.dataDir });
    }
  }

  getFilePath(date) {
    return path.join(this.dataDir, `${date}.json`);
  }

  isValidDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date));
  }

  /**
   * Read a day file, returning default structure if missing.
   */
  readDayFile(date) {
    const filePath = this.getFilePath(date);
    if (!fs.existsSync(filePath)) {
      return { date, metrics: {}, lastUpdated: null };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Write a day file.
   */
  writeDayFile(date, data) {
    data.lastUpdated = new Date().toISOString();
    data.date = date;
    fs.writeFileSync(this.getFilePath(date), JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Merge new data points into a day file, deduplicating by timestamp.
   * @returns {number} Count of newly added points.
   */
  upsertMetrics(date, metricName, newPoints) {
    if (!this.isValidDate(date)) return 0;

    const dayData = this.readDayFile(date);
    const existing = dayData.metrics[metricName] || [];
    const existingDates = new Set(existing.map(p => p.date));
    const unique = newPoints.filter(p => !existingDates.has(p.date));

    if (unique.length > 0) {
      dayData.metrics[metricName] = existing.concat(unique);
      this.writeDayFile(date, dayData);
    }

    return unique.length;
  }

  /**
   * Get raw metrics for a single day.
   */
  getDailyMetrics(date) {
    if (!this.isValidDate(date)) return null;
    const filePath = this.getFilePath(date);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  /**
   * Get daily aggregates: sum for step-like metrics, avg/min/max for rate metrics,
   * latest for body metrics, and sleep stage summary for sleep.
   */
  getDailyAggregates(date) {
    const data = this.getDailyMetrics(date);
    if (!data || !data.metrics) return null;

    const aggregates = {};

    for (const [metricName, points] of Object.entries(data.metrics)) {
      if (!points || points.length === 0) continue;

      if (metricName === 'sleep_analysis') {
        aggregates[metricName] = this._aggregateSleep(points);
        continue;
      }

      const values = points.map(p => p.qty).filter(v => v != null && Number.isFinite(v));
      if (values.length === 0) continue;

      if (SUM_METRICS.has(metricName)) {
        aggregates[metricName] = {
          total: Math.round(values.reduce((s, v) => s + v, 0) * 100) / 100,
          count: values.length,
        };
      } else {
        const sorted = [...values].sort((a, b) => a - b);
        aggregates[metricName] = {
          avg: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          count: values.length,
          latest: points[points.length - 1].qty,
        };
      }
    }

    return { date, aggregates };
  }

  _aggregateSleep(points) {
    const summary = { totalSleep: 0, deep: 0, rem: 0, core: 0, awake: 0, inBed: 0 };
    for (const p of points) {
      const dur = p.durationHours || 0;
      if (p.stage === 'deep') summary.deep += dur;
      else if (p.stage === 'rem') summary.rem += dur;
      else if (p.stage === 'core') summary.core += dur;
      else if (p.stage === 'awake') summary.awake += dur;
      else if (p.stage === 'inBed') summary.inBed += dur;
    }
    summary.totalSleep = Math.round((summary.deep + summary.rem + summary.core) * 100) / 100;
    summary.deep = Math.round(summary.deep * 100) / 100;
    summary.rem = Math.round(summary.rem * 100) / 100;
    summary.core = Math.round(summary.core * 100) / 100;
    summary.awake = Math.round(summary.awake * 100) / 100;
    summary.inBed = Math.round(summary.inBed * 100) / 100;
    return summary;
  }

  /**
   * Get metrics across a date range.
   */
  getMetricsRange(startDate, endDate) {
    const results = [];
    const current = new Date(startDate + 'T00:00:00Z');
    const last = new Date(endDate + 'T00:00:00Z');

    while (current <= last) {
      const dateStr = current.toISOString().split('T')[0];
      const data = this.getDailyMetrics(dateStr);
      if (data) results.push(data);
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return results;
  }

  /**
   * Get daily aggregate trend for a single metric over N days.
   * Returns array of { date, value } for charting.
   */
  getMetricTrend(metricName, days = 7) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));

    const trend = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const agg = this.getDailyAggregates(dateStr);

      if (agg && agg.aggregates[metricName]) {
        const metricAgg = agg.aggregates[metricName];
        // Use total for sum metrics, avg for rate metrics, latest for body metrics
        const value = metricAgg.total ?? metricAgg.avg ?? metricAgg.latest ?? metricAgg.totalSleep ?? null;
        if (value != null) {
          trend.push({ date: dateStr, value });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return trend;
  }

  /**
   * Scan backward from today to find the most recent value for each requested metric.
   * @param {string[]} metricNames - List of metric names to look up
   * @param {number} maxDays - How far back to search (default 90)
   */
  getLatestValues(metricNames = null, maxDays = 90) {
    const results = {};
    const remaining = new Set(metricNames || this._discoverMetrics());
    const today = new Date();

    for (let i = 0; i < maxDays && remaining.size > 0; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const agg = this.getDailyAggregates(dateStr);
      if (!agg) continue;

      for (const metric of [...remaining]) {
        if (agg.aggregates[metric]) {
          const a = agg.aggregates[metric];
          results[metric] = {
            date: dateStr,
            value: a.total ?? a.avg ?? a.latest ?? a.totalSleep ?? null,
            ...a,
          };
          remaining.delete(metric);
        }
      }
    }

    return results;
  }

  /**
   * Discover all metric names that have data by scanning recent files.
   */
  _discoverMetrics() {
    const metrics = new Set();
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .slice(-30); // Last 30 days

      for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(this.dataDir, file), 'utf8'));
        if (data.metrics) {
          Object.keys(data.metrics).forEach(k => metrics.add(k));
        }
      }
    } catch {
      // Empty dir or parse error
    }
    return [...metrics];
  }

  /**
   * Get list of all dates that have health data.
   */
  getAllDates() {
    try {
      return fs.readdirSync(this.dataDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * Get the available date range (earliest and latest dates with data).
   */
  getDateRange() {
    const dates = this.getAllDates();
    if (dates.length === 0) return null;
    return { earliest: dates[0], latest: dates[dates.length - 1], totalDays: dates.length };
  }
}

const healthDataStore = new HealthDataStore();
export default healthDataStore;
