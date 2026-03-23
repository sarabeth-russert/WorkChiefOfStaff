import logger from '../config/logger.js';
import wellnessDataStore from './WellnessDataStore.js';

/**
 * WeeklyInsights analyzes completed standup/retro sessions over a rolling
 * window to surface patterns, aggregate accomplishments, and flag recurring
 * blockers so that insights "feed forward" into future standups.
 */
class WeeklyInsights {
  /**
   * Generate weekly insights for the 7 days ending on `endDate`.
   * @param {string} endDate - YYYY-MM-DD (inclusive)
   * @param {number} days - lookback window (default 7)
   */
  async generateInsights(endDate, days = 7) {
    const start = new Date(endDate + 'T00:00:00Z');
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const startDate = start.toISOString().split('T')[0];

    logger.info('[WeeklyInsights] Generating insights', { startDate, endDate, days });

    const dailyData = await wellnessDataStore.getMetricsRange(startDate, endDate);

    // Collect all completed sessions in the window
    const sessions = dailyData.flatMap(day =>
      (day.sessions || [])
        .filter(s => s.status === 'completed')
        .map(s => ({ ...s, date: day.date }))
    );

    const standups = sessions.filter(s => s.type === 'standup');
    const retros = sessions.filter(s => s.type === 'retro');

    return {
      dateRange: { startDate, endDate },
      daysWithSessions: new Set(sessions.map(s => s.date)).size,
      totalSessions: sessions.length,
      weeklyWins: this._aggregateAccomplishments(retros),
      moodPatterns: this._analyzeMoodPatterns(sessions, dailyData),
      recurringBlockers: this._detectBlockers(sessions),
      themes: this._extractThemes(sessions),
      planFollowThrough: this._analyzePlanFollowThrough(standups, retros),
    };
  }

  /**
   * Collect all accomplishments from retro sessions for a "weekly wins" list.
   */
  _aggregateAccomplishments(retros) {
    const wins = [];
    for (const retro of retros) {
      const items = retro.summary?.accomplishments;
      if (!items) continue;
      const list = Array.isArray(items)
        ? items
        : items.split('\n').map(l => l.trim()).filter(Boolean);
      wins.push(...list.map(text => ({ text, date: retro.date })));
    }
    return wins;
  }

  /**
   * Look at user-reported sleep/readiness scores and conversation sentiment
   * keywords to build a simple daily mood timeline.
   */
  _analyzeMoodPatterns(sessions, dailyData) {
    const positiveWords = [
      'great', 'good', 'amazing', 'productive', 'energized', 'focused',
      'accomplished', 'happy', 'strong', 'rested', 'motivated', 'awesome',
      'excellent', 'solid', 'fantastic', 'refreshed', 'nailed'
    ];
    const negativeWords = [
      'tired', 'exhausted', 'overwhelmed', 'stressed', 'frustrated',
      'blocked', 'stuck', 'anxious', 'drained', 'behind', 'struggling',
      'difficult', 'rough', 'bad', 'poor', 'terrible', 'burnt', 'burnout'
    ];

    const dayMap = new Map();

    for (const session of sessions) {
      if (!dayMap.has(session.date)) {
        dayMap.set(session.date, { positive: 0, negative: 0, date: session.date });
      }
      const entry = dayMap.get(session.date);

      const text = this._getAllUserText(session).toLowerCase();
      for (const w of positiveWords) {
        const re = new RegExp(`\\b${w}\\b`, 'g');
        entry.positive += (text.match(re) || []).length;
      }
      for (const w of negativeWords) {
        const re = new RegExp(`\\b${w}\\b`, 'g');
        entry.negative += (text.match(re) || []).length;
      }
    }

    // Add Oura scores where available
    for (const day of dailyData) {
      const sleep = day.metrics?.sleep?.data?.[0]?.score;
      const readiness = day.metrics?.readiness?.data?.[0]?.score;
      if (dayMap.has(day.date)) {
        const entry = dayMap.get(day.date);
        if (sleep != null) entry.sleepScore = sleep;
        if (readiness != null) entry.readinessScore = readiness;
      }
    }

    const timeline = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    // Detect repeated negative patterns
    const alerts = [];
    const negDays = timeline.filter(d => d.negative > d.positive);
    if (negDays.length >= 3) {
      alerts.push(`You've mentioned feeling stressed or drained ${negDays.length} of ${timeline.length} days this week.`);
    }

    const lowEnergy = timeline.filter(d => (d.readinessScore ?? 100) < 60);
    if (lowEnergy.length >= 3) {
      alerts.push(`Your readiness score was below 60 on ${lowEnergy.length} days — your body may need extra recovery.`);
    }

    return { timeline, alerts };
  }

  /**
   * Scan user messages for recurring blocker-like language.
   */
  _detectBlockers(sessions) {
    const blockerPatterns = [
      /block(?:ed|er|ing)\b/i,
      /stuck\b/i,
      /waiting (?:on|for)\b/i,
      /can'?t (?:move forward|proceed|progress)/i,
      /depend(?:ency|ing|ent)/i,
      /bottleneck/i,
      /no response/i,
      /delayed/i,
    ];

    const hits = [];

    for (const session of sessions) {
      const userMessages = (session.conversation || []).filter(m => m.role === 'user');
      for (const msg of userMessages) {
        for (const pattern of blockerPatterns) {
          if (pattern.test(msg.content)) {
            // Grab the sentence containing the match
            const sentences = msg.content.split(/[.!?\n]+/).filter(Boolean);
            const matched = sentences.find(s => pattern.test(s));
            if (matched) {
              hits.push({ text: matched.trim(), date: session.date, type: session.type });
            }
            break; // one hit per message is enough
          }
        }
      }
    }

    // Group similar blockers by simple word overlap
    const grouped = this._groupSimilar(hits.map(h => h.text));
    const recurring = grouped
      .filter(g => g.count >= 2)
      .map(g => ({
        theme: g.representative,
        occurrences: g.count,
        dates: hits.filter(h => g.items.includes(h.text)).map(h => h.date),
      }));

    return recurring;
  }

  /**
   * Extract high-frequency themes from user text across all sessions.
   * Returns the top phrases that appear on multiple days.
   */
  _extractThemes(sessions) {
    // Collect user text per day
    const dayTexts = new Map();
    for (const session of sessions) {
      const text = this._getAllUserText(session).toLowerCase();
      if (!dayTexts.has(session.date)) {
        dayTexts.set(session.date, '');
      }
      dayTexts.set(session.date, dayTexts.get(session.date) + ' ' + text);
    }

    // Extract meaningful 2-3 word phrases (bigrams/trigrams)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'shall', 'can', 'need', 'must', 'i', 'my',
      'me', 'we', 'our', 'you', 'your', 'it', 'its', 'this', 'that', 'these',
      'those', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
      'not', 'no', 'so', 'if', 'then', 'just', 'also', 'very', 'really',
      'about', 'up', 'out', 'some', 'all', 'more', 'from', 'get', 'got',
      'going', 'went', 'like', 'feel', 'feeling', 'today', 'tomorrow',
      'yesterday', 'morning', 'evening', 'day', 'week', 'time',
    ]);

    const phrasesByDay = new Map(); // phrase -> Set<date>

    for (const [date, text] of dayTexts) {
      const words = text.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
      const seen = new Set();

      // Bigrams
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (!seen.has(phrase)) {
          seen.add(phrase);
          if (!phrasesByDay.has(phrase)) phrasesByDay.set(phrase, new Set());
          phrasesByDay.get(phrase).add(date);
        }
      }
    }

    // Return phrases that appear on 2+ days
    return [...phrasesByDay.entries()]
      .filter(([, dates]) => dates.size >= 2)
      .map(([phrase, dates]) => ({ phrase, dayCount: dates.size, dates: [...dates] }))
      .sort((a, b) => b.dayCount - a.dayCount)
      .slice(0, 10);
  }

  /**
   * Compare morning plans to evening accomplishments to see follow-through.
   */
  _analyzePlanFollowThrough(standups, retros) {
    const results = [];

    // Group by date
    const standupByDate = new Map();
    for (const s of standups) {
      if (s.summary?.plan) standupByDate.set(s.date, s.summary.plan);
    }

    const retroByDate = new Map();
    for (const r of retros) {
      if (r.summary?.accomplishments) {
        const list = Array.isArray(r.summary.accomplishments)
          ? r.summary.accomplishments
          : r.summary.accomplishments.split('\n').filter(Boolean);
        retroByDate.set(r.date, list);
      }
    }

    // For days with both plan and retro, measure simple word overlap
    for (const [date, plan] of standupByDate) {
      const accomplishments = retroByDate.get(date);
      if (!accomplishments) continue;

      const planWords = new Set(plan.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3));
      const accWords = new Set(accomplishments.join(' ').toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3));
      const overlap = [...planWords].filter(w => accWords.has(w)).length;
      const score = planWords.size > 0 ? Math.round((overlap / planWords.size) * 100) : 0;

      results.push({ date, alignmentScore: score });
    }

    const avgAlignment = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.alignmentScore, 0) / results.length)
      : null;

    return { daily: results, averageAlignment: avgAlignment };
  }

  /**
   * Get all user-authored text from a session (messages + summary fields).
   */
  _getAllUserText(session) {
    const parts = [];
    for (const msg of (session.conversation || [])) {
      if (msg.role === 'user') parts.push(msg.content);
    }
    if (session.summary?.plan) parts.push(session.summary.plan);
    if (session.summary?.accomplishments) {
      const acc = session.summary.accomplishments;
      parts.push(Array.isArray(acc) ? acc.join(' ') : acc);
    }
    if (session.summary?.notesForTomorrow) parts.push(session.summary.notesForTomorrow);
    return parts.join(' ');
  }

  /**
   * Very simple similarity grouping: two strings are "similar" if they share
   * more than 50% of their significant words.
   */
  _groupSimilar(strings) {
    const groups = [];
    const assigned = new Set();

    for (let i = 0; i < strings.length; i++) {
      if (assigned.has(i)) continue;
      const group = { representative: strings[i], items: [strings[i]], count: 1 };
      assigned.add(i);

      const wordsA = new Set(strings[i].toLowerCase().split(/\s+/).filter(w => w.length > 3));

      for (let j = i + 1; j < strings.length; j++) {
        if (assigned.has(j)) continue;
        const wordsB = new Set(strings[j].toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
        const similarity = Math.max(wordsA.size, wordsB.size) > 0
          ? overlap / Math.max(wordsA.size, wordsB.size)
          : 0;

        if (similarity > 0.5) {
          group.items.push(strings[j]);
          group.count++;
          assigned.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Build a concise text summary suitable for embedding in a standup prompt.
   * @param {Object} insights - output from generateInsights()
   */
  formatForStandup(insights) {
    const lines = [];

    // Weekly wins summary
    if (insights.weeklyWins.length > 0) {
      lines.push('**Last Week\'s Wins:**');
      const capped = insights.weeklyWins.slice(0, 5);
      for (const win of capped) lines.push(`- ${win.text}`);
      if (insights.weeklyWins.length > 5) {
        lines.push(`- ...and ${insights.weeklyWins.length - 5} more`);
      }
      lines.push('');
    }

    // Mood alerts
    if (insights.moodPatterns.alerts.length > 0) {
      lines.push('**Patterns to Watch:**');
      for (const alert of insights.moodPatterns.alerts) lines.push(`- ${alert}`);
      lines.push('');
    }

    // Recurring blockers
    if (insights.recurringBlockers.length > 0) {
      lines.push('**Recurring Blockers:**');
      for (const b of insights.recurringBlockers) {
        lines.push(`- "${b.theme}" (mentioned ${b.occurrences} times)`);
      }
      lines.push('');
    }

    // Plan alignment
    if (insights.planFollowThrough.averageAlignment != null) {
      lines.push(`**Plan Follow-Through:** ~${insights.planFollowThrough.averageAlignment}% alignment between morning plans and evening accomplishments`);
      lines.push('');
    }

    return lines.length > 0 ? lines.join('\n') : null;
  }
}

const weeklyInsights = new WeeklyInsights();
export default weeklyInsights;
