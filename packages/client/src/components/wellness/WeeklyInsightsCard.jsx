import React, { useState, useEffect } from 'react';
import { Card } from '../ui';

const WeeklyInsightsCard = () => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/wellness/weekly-insights`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch {
      // Non-critical; silently fail
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !insights || insights.totalSessions === 0) {
    return null;
  }

  const { weeklyWins, moodPatterns, recurringBlockers, planFollowThrough, themes, dateRange } = insights;

  const hasContent = weeklyWins.length > 0 ||
    moodPatterns.alerts.length > 0 ||
    recurringBlockers.length > 0 ||
    (planFollowThrough.averageAlignment != null);

  if (!hasContent) return null;

  const formatDateRange = () => {
    const start = new Date(dateRange.startDate + 'T12:00:00Z');
    const end = new Date(dateRange.endDate + 'T12:00:00Z');
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Mood timeline mini-visualization
  const moodDots = moodPatterns.timeline.map(day => {
    if (day.negative > day.positive) return 'low';
    if (day.positive > day.negative) return 'high';
    return 'neutral';
  });

  return (
    <Card variant="canvas" className="mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl" role="img" aria-label="Weekly Insights">
            {'\u{1F4CA}'}
          </span>
          <div>
            <h3 className="text-xl font-poster text-vintage-text">
              Weekly Insights
            </h3>
            <p className="text-xs text-vintage-text opacity-60 font-ui">
              {formatDateRange()} &middot; {insights.daysWithSessions} days with entries
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 font-ui text-sm uppercase tracking-wide
                     bg-terracotta text-cream border-2 border-terracotta-dark
                     rounded shadow-vintage hover:shadow-vintage-hover
                     transition-all duration-150"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? '\u25BC' : '\u25B6'}</span>
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </button>
      </div>

      {/* Mood dots bar (always visible) */}
      {moodDots.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-ui uppercase text-vintage-text opacity-60 w-16">Mood</span>
          <div className="flex gap-1 items-center">
            {moodDots.map((mood, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-poster ${
                  mood === 'high'
                    ? 'bg-jungle bg-opacity-20 border-jungle text-jungle'
                    : mood === 'low'
                      ? 'bg-terracotta bg-opacity-20 border-terracotta text-terracotta'
                      : 'bg-sand border-vintage-text border-opacity-30 text-vintage-text opacity-40'
                }`}
                title={`${moodPatterns.timeline[i]?.date}: ${mood}`}
              >
                {mood === 'high' ? '+' : mood === 'low' ? '-' : '\u00B7'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts banner */}
      {moodPatterns.alerts.length > 0 && (
        <div className="p-3 bg-terracotta bg-opacity-10 border-2 border-terracotta rounded-lg mb-4">
          {moodPatterns.alerts.map((alert, i) => (
            <p key={i} className="text-sm text-terracotta-dark font-serif">
              {alert}
            </p>
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-5">
          <div className="border-t-2 border-vintage-text opacity-20" />

          {/* Weekly Wins */}
          {weeklyWins.length > 0 && (
            <div>
              <h4 className="font-poster text-sm text-jungle uppercase mb-2">
                Weekly Wins ({weeklyWins.length})
              </h4>
              <ul className="space-y-1">
                {weeklyWins.map((win, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-vintage-text">
                    <span className="text-jungle mt-0.5 flex-shrink-0">{'\u2713'}</span>
                    <span className="font-serif">{win.text}</span>
                    <span className="text-xs opacity-50 font-ui flex-shrink-0">
                      {new Date(win.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recurring Blockers */}
          {recurringBlockers.length > 0 && (
            <div>
              <h4 className="font-poster text-sm text-terracotta uppercase mb-2">
                Recurring Blockers
              </h4>
              {recurringBlockers.map((blocker, i) => (
                <div key={i} className="p-3 bg-terracotta bg-opacity-5 border border-terracotta border-opacity-30 rounded mb-2">
                  <p className="text-sm font-serif text-vintage-text">"{blocker.theme}"</p>
                  <p className="text-xs font-ui text-vintage-text opacity-50 mt-1">
                    Mentioned {blocker.occurrences}x &middot; {blocker.dates.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Plan Follow-Through */}
          {planFollowThrough.averageAlignment != null && (
            <div>
              <h4 className="font-poster text-sm text-sunset uppercase mb-2">
                Plan Follow-Through
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-sand rounded-full overflow-hidden border border-vintage-text border-opacity-20">
                  <div
                    className="h-full bg-sunset rounded-full transition-all"
                    style={{ width: `${Math.min(planFollowThrough.averageAlignment, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-poster text-sunset w-12 text-right">
                  {planFollowThrough.averageAlignment}%
                </span>
              </div>
              <p className="text-xs font-ui text-vintage-text opacity-50 mt-1">
                Average alignment between morning plans and evening accomplishments
              </p>
            </div>
          )}

          {/* Recurring Themes */}
          {themes.length > 0 && (
            <div>
              <h4 className="font-poster text-sm text-mustard uppercase mb-2">
                Recurring Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {themes.slice(0, 8).map((theme, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-mustard bg-opacity-15 border border-mustard border-opacity-30 rounded-full text-xs font-ui text-vintage-text"
                  >
                    {theme.phrase} <span className="opacity-50">({theme.dayCount}d)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default WeeklyInsightsCard;
