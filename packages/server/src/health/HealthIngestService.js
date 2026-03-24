/**
 * HealthIngestService - Handles both JSON (Health Auto Export app) and
 * XML (Apple Health export.zip) ingest paths.
 */

import sax from 'sax';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { spawn } from 'child_process';
import logger from '../config/logger.js';
import healthDataStore from './HealthDataStore.js';
import { resolveMetricName, HK_TO_METRIC, SLEEP_STAGE_MAP } from './HealthMetrics.js';

/**
 * Extract YYYY-MM-DD from an Apple Health timestamp string.
 * Uses substring to avoid timezone conversion issues.
 */
function extractDateStr(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  const candidate = dateString.substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null;
  return candidate;
}

// ========================
// JSON Ingest (Health Auto Export app)
// ========================

/**
 * Ingest a JSON payload from the Health Auto Export iOS app.
 * Expected shape: { data: { metrics: [{ name, units, data: [{ date, qty, ... }] }] } }
 */
export async function ingestJSON(payload) {
  const metrics = payload?.data?.metrics || [];
  let metricsProcessed = 0;
  let recordsIngested = 0;
  let recordsSkipped = 0;
  const affectedDays = new Set();

  for (const metric of metrics) {
    const metricName = resolveMetricName(metric.name);
    const dataPoints = metric.data ?? [];
    metricsProcessed++;

    // Group by day
    const byDay = new Map();
    for (const point of dataPoints) {
      const dateStr = extractDateStr(point.date);
      if (!dateStr) { recordsSkipped++; continue; }
      if (!byDay.has(dateStr)) byDay.set(dateStr, []);
      byDay.get(dateStr).push(point);
    }

    for (const [dateStr, points] of byDay) {
      const added = healthDataStore.upsertMetrics(dateStr, metricName, points);
      recordsIngested += added;
      recordsSkipped += (points.length - added);
      if (added > 0) affectedDays.add(dateStr);
    }
  }

  logger.info('[HealthIngest] JSON ingest complete', {
    metricsProcessed, recordsIngested, recordsSkipped, daysAffected: affectedDays.size
  });

  return { metricsProcessed, recordsIngested, recordsSkipped, daysAffected: affectedDays.size };
}

// ========================
// XML Ingest (Apple Health export.xml)
// ========================

/**
 * Normalize an XML Record node into a standard data point.
 */
function normalizeXmlRecord(attrs) {
  const type = attrs.type;
  const value = attrs.value;
  const startdate = attrs.startdate;
  const enddate = attrs.enddate;
  const unit = attrs.unit;
  const sourcename = attrs.sourcename;

  if (!type || !startdate) return null;

  const typeLower = type.toLowerCase();
  const metricName = HK_TO_METRIC[typeLower] ?? typeLower;
  const dateStr = extractDateStr(startdate);
  if (!dateStr) return null;

  // Sleep analysis: categorical value -> duration-based stage data
  if (typeLower === 'hkcategorytypeidentifiersleepanalysis') {
    const durationHours = enddate
      ? (new Date(enddate) - new Date(startdate)) / 3600000
      : 0;
    const valueLower = value?.toLowerCase() ?? '';
    const stage = SLEEP_STAGE_MAP[valueLower] ?? value ?? 'unknown';
    return { metricName, dateStr, dataPoint: { date: startdate, stage, durationHours } };
  }

  // All other numeric types
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return null;

  const dataPoint = {
    date: startdate,
    qty: parsed,
    unit: unit ?? null,
    src: sourcename ?? null,
  };

  // Heart rate: include end timestamp
  if (typeLower === 'hkquantitytypeidentifierheartrate') {
    dataPoint.end = enddate ?? null;
  }

  return { metricName, dateStr, dataPoint };
}

/**
 * Stream-parse an Apple Health export.xml using SAX.
 * Flushes to disk in batches to handle huge files.
 */
export async function importXML(filePath, io = null) {
  const FLUSH_INTERVAL = 100000;
  const dayBuckets = {};
  let processedRecords = 0;
  let lastFlush = 0;
  const allDays = new Set();

  const inputStream = createReadStream(filePath);

  await new Promise((resolve, reject) => {
    const saxStream = sax.createStream(false, { lowercase: true });

    saxStream.on('opentag', (node) => {
      if (node.name !== 'record') return;

      const normalized = normalizeXmlRecord(node.attributes);
      if (!normalized) return;

      const { metricName, dateStr, dataPoint } = normalized;

      if (!dayBuckets[dateStr]) dayBuckets[dateStr] = {};
      if (!dayBuckets[dateStr][metricName]) dayBuckets[dateStr][metricName] = [];
      dayBuckets[dateStr][metricName].push(dataPoint);
      allDays.add(dateStr);
      processedRecords++;

      if (processedRecords % 10000 === 0) {
        io?.emit('health:xml:progress', { processed: processedRecords });
      }

      // Batch flush to prevent OOM
      if (processedRecords - lastFlush >= FLUSH_INTERVAL) {
        lastFlush = processedRecords;
        inputStream.pause();
        flushBuckets(dayBuckets).then(() => {
          logger.info('[HealthIngest] Flushed batch', { records: processedRecords, days: allDays.size });
          inputStream.resume();
        }).catch(reject);
      }
    });

    saxStream.on('error', function (e) {
      logger.warn('[HealthIngest] XML parse error, resuming', { error: e.message });
      this._parser.error = null;
      this._parser.resume();
    });

    saxStream.on('end', resolve);
    saxStream.on('close', resolve);
    inputStream.on('error', reject);
    inputStream.pipe(saxStream);
  });

  // Final flush
  await flushBuckets(dayBuckets);

  // Clean up temp file
  try { await unlink(filePath); } catch { /* ignore */ }

  io?.emit('health:xml:complete', { days: allDays.size, records: processedRecords });
  logger.info('[HealthIngest] XML import complete', { records: processedRecords, days: allDays.size });

  return { days: allDays.size, records: processedRecords };
}

/**
 * Flush accumulated day buckets to disk via HealthDataStore.
 */
async function flushBuckets(dayBuckets) {
  for (const dateStr of Object.keys(dayBuckets)) {
    const metrics = dayBuckets[dateStr];

    // Aggregate step_count: sum into single daily entry
    if (metrics.step_count) {
      const total = metrics.step_count.reduce((sum, p) => sum + (p.qty || 0), 0);
      metrics.step_count = [{ date: metrics.step_count[0].date, qty: total, unit: metrics.step_count[0].unit }];
    }

    for (const [metricName, points] of Object.entries(metrics)) {
      healthDataStore.upsertMetrics(dateStr, metricName, points);
    }

    delete dayBuckets[dateStr];
  }
}

/**
 * Import from an Apple Health export.zip file.
 * Extracts export.xml and pipes to the SAX parser.
 */
export async function importZip(zipPath, io = null) {
  const xmlPath = join(tmpdir(), `apple-health-${Date.now()}.xml`);

  // Use unzip to extract export.xml from the zip
  await new Promise((resolve, reject) => {
    const ws = createWriteStream(xmlPath);
    const proc = spawn('unzip', ['-p', zipPath, 'apple_health_export/export.xml']);

    proc.stdout.pipe(ws);
    proc.stderr.on('data', (data) => {
      logger.debug('[HealthIngest] unzip stderr', { data: data.toString() });
    });

    ws.on('finish', resolve);
    proc.on('error', (err) => {
      // If unzip not available, try with alternate path
      reject(new Error(`Failed to extract XML from zip: ${err.message}`));
    });
    proc.on('exit', (code) => {
      if (code !== 0) {
        // Try alternate path (some exports use just export.xml at root)
        const proc2 = spawn('unzip', ['-p', zipPath, 'export.xml']);
        const ws2 = createWriteStream(xmlPath);
        proc2.stdout.pipe(ws2);
        ws2.on('finish', resolve);
        proc2.on('error', reject);
        proc2.on('exit', (code2) => {
          if (code2 !== 0) reject(new Error('Could not find export.xml in zip'));
        });
      }
    });
  });

  // Clean up zip, import XML
  try { await unlink(zipPath); } catch { /* ignore */ }
  return importXML(xmlPath, io);
}
