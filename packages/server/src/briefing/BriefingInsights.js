/**
 * BriefingInsights generates cross-feature intelligence by analyzing
 * the combined briefing data (wellness, calendar, jira, habits, etc.)
 * and surfacing actionable patterns. Pure heuristics — no AI call needed.
 */

class BriefingInsights {
  generate(briefing) {
    const insights = [];

    this._meetingLoadVsReadiness(briefing, insights);
    this._backToBackMeetings(briefing, insights);
    this._staleJiraTickets(briefing, insights);
    this._jiraWorkloadBalance(briefing, insights);
    this._lowReadinessProtection(briefing, insights);
    this._habitWellnessNudge(briefing, insights);
    this._busyDayNoStandup(briefing, insights);
    this._goodDaySummary(briefing, insights);
    this._allHabitsDone(briefing, insights);
    this._clearScheduleFocus(briefing, insights);

    // Sort by priority (highest first) and cap at 3
    insights.sort((a, b) => b.priority - a.priority);
    return insights.slice(0, 3);
  }

  _meetingLoadVsReadiness(briefing, insights) {
    const events = briefing.events || [];
    const meetings = events.filter(e => !e.isAllDay);
    const readiness = briefing.wellness?.readiness;

    if (meetings.length >= 4 && readiness && readiness < 75) {
      const optional = meetings.filter(
        e => e.showAs === 'tentative' || e.showAs === 'free'
      );
      const optionalNote = optional.length > 0
        ? ` You have ${optional.length} tentative meeting${optional.length !== 1 ? 's' : ''} — consider declining to protect your energy.`
        : ' Look for meetings you can skip or shorten.';

      insights.push({
        type: 'meeting-load',
        icon: 'calendar-warning',
        text: `Heavy meeting day (${meetings.length} meetings) with readiness at ${readiness}.${optionalNote}`,
        priority: 8,
      });
    }
  }

  _backToBackMeetings(briefing, insights) {
    const events = briefing.events || [];
    const meetings = events
      .filter(e => !e.isAllDay && e.start && e.end)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    let consecutive = 1;
    let maxConsecutive = 1;

    for (let i = 1; i < meetings.length; i++) {
      const prevEnd = new Date(meetings[i - 1].end);
      const currStart = new Date(meetings[i].start);
      const gapMinutes = (currStart - prevEnd) / 60000;

      if (gapMinutes <= 10) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 1;
      }
    }

    if (maxConsecutive >= 3) {
      insights.push({
        type: 'back-to-back',
        icon: 'break-reminder',
        text: `${maxConsecutive} back-to-back meetings today — try to grab a break between them.`,
        priority: 6,
      });
    }
  }

  _staleJiraTickets(briefing, insights) {
    if (!briefing.jiraRaw) return;

    const now = new Date();
    const staleTickets = [];

    for (const issue of briefing.jiraRaw) {
      const status = issue.fields?.status?.name?.toLowerCase() || '';
      if (!status.includes('progress') && !status.includes('development')) continue;

      const updated = issue.fields?.updated;
      if (!updated) continue;

      const daysSinceUpdate = (now - new Date(updated)) / 86400000;
      if (daysSinceUpdate >= 3) {
        staleTickets.push({
          key: issue.key,
          summary: issue.fields?.summary,
          days: Math.floor(daysSinceUpdate),
        });
      }
    }

    if (staleTickets.length > 0) {
      staleTickets.sort((a, b) => b.days - a.days);
      const ticket = staleTickets[0];
      const moreNote = staleTickets.length > 1
        ? ` (and ${staleTickets.length - 1} more)`
        : '';

      insights.push({
        type: 'stale-ticket',
        icon: 'ticket-warning',
        text: `${ticket.key} has been in progress for ${ticket.days} days without updates${moreNote} — worth a check-in or breakdown.`,
        priority: 7,
      });
    }
  }

  _jiraWorkloadBalance(briefing, insights) {
    const jira = briefing.jira;
    if (!jira) return;

    const inProgress = jira.inProgress?.length || 0;
    if (inProgress >= 4) {
      insights.push({
        type: 'wip-limit',
        icon: 'workload',
        text: `${inProgress} tickets in progress — consider finishing some before pulling new work.`,
        priority: 5,
      });
    }
  }

  _lowReadinessProtection(briefing, insights) {
    const readiness = briefing.wellness?.readiness;
    const jira = briefing.jira;

    if (readiness && readiness < 60 && jira) {
      const totalActive = (jira.inProgress?.length || 0) + (jira.inReview?.length || 0);
      if (totalActive > 0) {
        insights.push({
          type: 'energy-protect',
          icon: 'shield',
          text: `Readiness is low at ${readiness} — lean into reviews and lighter tasks rather than deep new work.`,
          priority: 9,
        });
      }
    }
  }

  _habitWellnessNudge(briefing, insights) {
    const habits = briefing.habits;
    const readiness = briefing.wellness?.readiness;

    if (!habits || !readiness || readiness >= 75) return;

    const totalHabits = habits.habits?.length || 0;
    const completedCount = Object.values(habits.completed || {}).filter(Boolean).length;

    if (totalHabits > 0 && completedCount === 0) {
      insights.push({
        type: 'habit-nudge',
        icon: 'habit',
        text: `Readiness is ${readiness} — knocking out a daily habit can help build momentum on tougher days.`,
        priority: 4,
      });
    }
  }

  _busyDayNoStandup(briefing, insights) {
    const events = briefing.events || [];
    const meetings = events.filter(e => !e.isAllDay);

    if (meetings.length >= 2 && !briefing.standupDone) {
      insights.push({
        type: 'standup-reminder',
        icon: 'compass',
        text: `${meetings.length} meetings on the schedule — a quick standup will help you set priorities before the day takes over.`,
        priority: 6,
      });
    }
  }

  _goodDaySummary(briefing, insights) {
    const readiness = briefing.wellness?.readiness;
    if (!readiness || readiness < 80) return;

    const events = briefing.events || [];
    const meetings = events.filter(e => !e.isAllDay);
    const jira = briefing.jira;
    const inProgress = jira?.inProgress?.length || 0;

    // High readiness + manageable workload = great conditions
    if (meetings.length <= 3 && inProgress <= 3) {
      const parts = [];
      parts.push(`Readiness is ${readiness}`);
      if (meetings.length === 0) {
        parts.push('no meetings on the calendar');
      } else {
        parts.push(`only ${meetings.length} meeting${meetings.length !== 1 ? 's' : ''}`);
      }
      if (inProgress > 0) {
        parts.push(`${inProgress} ticket${inProgress !== 1 ? 's' : ''} in flight`);
      }

      insights.push({
        type: 'good-day',
        icon: 'peak',
        text: `${parts.join(', ')} — great conditions for deep focus work.`,
        priority: 3,
      });
    }
  }

  _allHabitsDone(briefing, insights) {
    const habits = briefing.habits;
    if (!habits) return;

    const totalHabits = habits.habits?.length || 0;
    if (totalHabits === 0) return;

    const completedCount = Object.values(habits.completed || {}).filter(Boolean).length;
    if (completedCount === totalHabits) {
      insights.push({
        type: 'habits-complete',
        icon: 'checkmark',
        text: `All ${totalHabits} daily habit${totalHabits !== 1 ? 's' : ''} done — solid consistency builds over time.`,
        priority: 2,
      });
    }
  }

  _clearScheduleFocus(briefing, insights) {
    const events = briefing.events || [];
    const meetings = events.filter(e => !e.isAllDay);
    const jira = briefing.jira;

    if (meetings.length === 0 && jira) {
      const inProgress = jira.inProgress?.length || 0;
      if (inProgress > 0) {
        insights.push({
          type: 'clear-schedule',
          icon: 'focus',
          text: `No meetings today — a clean runway to make progress on your ${inProgress} active ticket${inProgress !== 1 ? 's' : ''}.`,
          priority: 3,
        });
      }
    }
  }
}

const briefingInsights = new BriefingInsights();
export default briefingInsights;
