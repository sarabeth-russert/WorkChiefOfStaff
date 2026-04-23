import React, { useState, useEffect } from 'react';
import { Card } from '../ui';

const WeeklyInsightsCard = () => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

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
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Mood timeline
  const moodDots = moodPatterns.timeline.map(day => {
    if (day.negative > day.positive) return 'low';
    if (day.positive > day.negative) return 'high';
    return 'neutral';
  });

  const highDays = moodDots.filter(m => m === 'high').length;
  const lowDays = moodDots.filter(m => m === 'low').length;

  // Follow-through score color
  const ftScore = planFollowThrough.averageAlignment;
  const ftColor = ftScore >= 75 ? 'text-jungle' : ftScore >= 50 ? 'text-mustard' : 'text-terracotta';
  const ftBg = ftScore >= 75 ? 'bg-jungle' : ftScore >= 50 ? 'bg-mustard' : 'bg-terracotta';

  // Hero insight — pick the most notable signal to anchor the scorecard
  const heroInsight = (() => {
    if (ftScore != null && ftScore >= 75) return { label: 'Expedition Readiness', value: `${ftScore}%`, note: 'Strong alignment between plans and outcomes', color: 'text-jungle' };
    if (ftScore != null && ftScore < 50) return { label: 'Expedition Readiness', value: `${ftScore}%`, note: 'Plans and outcomes are drifting — recalibrate your heading', color: 'text-terracotta' };
    if (highDays >= 4) return { label: 'Morale Report', value: `${highDays} strong days`, note: 'Positive momentum building this week', color: 'text-jungle' };
    if (lowDays >= 3) return { label: 'Morale Report', value: `${lowDays} rough days`, note: 'Consider what\'s draining expedition energy', color: 'text-terracotta' };
    if (ftScore != null) return { label: 'Expedition Readiness', value: `${ftScore}%`, note: 'Alignment between morning headings and evening reports', color: ftColor };
    return { label: 'Days in the Field', value: `${insights.daysWithSessions}/${moodDots.length}`, note: 'Sessions logged this week', color: 'text-vintage-text' };
  })();

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-vintage-text/15" />
        <h2 className="font-ui text-sm uppercase tracking-widest text-vintage-text/40">Weekly Scorecard</h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-vintage-text/15" />
      </div>

      {/* Hero insight — anchor metric with compass watermark */}
      <div className="relative text-center py-3 mb-1">
        {/* Compass dial watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 100 100" className="w-36 h-36 text-vintage-text opacity-[0.04]">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="15" y1="15" x2="85" y2="85" stroke="currentColor" strokeWidth="0.3" />
            <line x1="85" y1="15" x2="15" y2="85" stroke="currentColor" strokeWidth="0.3" />
            <polygon points="50,8 53,18 47,18" fill="currentColor" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/35 mb-1">{heroInsight.label}</div>
          <div className={`font-poster text-4xl leading-none ${heroInsight.color}`}>{heroInsight.value}</div>
          <p className="font-serif text-xs text-vintage-text/40 italic mt-2">{heroInsight.note}</p>
        </div>
      </div>

      {/* Scorecard instruments row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Sessions logged */}
        <div className="bg-gradient-to-b from-sand/40 to-sand/20 border-2 border-sand-dark/30 rounded-lg p-4 text-center shadow-vintage">
          <div className="text-2xl mb-1.5">📓</div>
          <div className="font-poster text-3xl text-vintage-text leading-tight">
            {insights.daysWithSessions}<span className="text-xl text-vintage-text/60">/{moodDots.length}</span>
          </div>
          <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/50 mt-1">Days Logged</div>
        </div>

        {/* Mood balance */}
        <div className="bg-gradient-to-b from-sand/40 to-sand/20 border-2 border-sand-dark/30 rounded-lg p-4 text-center shadow-vintage">
          <div className="text-2xl mb-1.5">{highDays >= lowDays ? '☀️' : '🌧'}</div>
          <div className="font-poster text-3xl text-vintage-text leading-tight">
            {highDays}<span className="text-xl text-vintage-text/60"> ↑ </span>{lowDays}<span className="text-xl text-vintage-text/60"> ↓</span>
          </div>
          <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/50 mt-1">Mood Balance</div>
        </div>

        {/* Follow-through */}
        {ftScore != null ? (
          <div className="bg-gradient-to-b from-sand/40 to-sand/20 border-2 border-sand-dark/30 rounded-lg p-4 text-center shadow-vintage">
            <div className="text-2xl mb-1.5">🧭</div>
            <div className={`font-poster text-3xl leading-tight ${ftColor}`}>
              {ftScore}<span className="text-xl">%</span>
            </div>
            <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/50 mt-1">Follow-Through</div>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-sand/40 to-sand/20 border-2 border-sand-dark/30 rounded-lg p-4 text-center shadow-vintage">
            <div className="text-2xl mb-1.5">🧭</div>
            <div className="font-poster text-3xl text-vintage-text/30 leading-tight">—</div>
            <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/50 mt-1">Follow-Through</div>
          </div>
        )}

        {/* Wins */}
        <div className="bg-gradient-to-b from-sand/40 to-sand/20 border-2 border-sand-dark/30 rounded-lg p-4 text-center shadow-vintage">
          <div className="text-2xl mb-1.5">🏅</div>
          <div className="font-poster text-3xl text-vintage-text leading-tight">
            {weeklyWins.length}
          </div>
          <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/50 mt-1">Wins Logged</div>
        </div>
      </div>

      {/* Mood trail — route marker visualization */}
      {moodDots.length > 0 && (
        <div className="relative bg-cream border-2 border-sand rounded-lg p-4 shadow-sm overflow-hidden">
          {/* Compass watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <img
              src="/images/compass-watermark.png"
              alt=""
              className="w-64 h-64 object-contain opacity-[0.10]"
            />
          </div>

          <div className="relative z-10 font-ui text-[10px] uppercase tracking-widest text-vintage-text/40 mb-4">
            {formatDateRange()} — Expedition Route
          </div>
          <div className="relative z-10">
            {/* Trail path — dashed line behind markers */}
            <div className="absolute top-[14px] left-[8%] right-[8%] z-0">
              <div className="h-px border-t-2 border-dashed border-vintage-text/10" />
            </div>

            <div className="flex items-start gap-1 relative z-10">
              {moodDots.map((mood, i) => {
                const day = moodPatterns.timeline[i];
                const dayLabel = day?.date
                  ? new Date(day.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short' })
                  : '';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    {/* Trail marker — survey stake */}
                    <div className={`w-7 h-7 rounded-sm border-2 flex items-center justify-center transition-all ${
                      mood === 'high'
                        ? 'bg-jungle/15 border-jungle text-jungle shadow-[0_0_4px_rgba(74,120,89,0.2)]'
                        : mood === 'low'
                          ? 'bg-terracotta/15 border-terracotta text-terracotta shadow-[0_0_4px_rgba(212,115,94,0.2)]'
                          : 'bg-sand/40 border-sand-dark/25 text-vintage-text/25'
                    }`}
                      title={`${dayLabel}: ${mood}`}
                    >
                      {mood === 'high' ? (
                        <span className="text-[10px]">★</span>
                      ) : mood === 'low' ? (
                        <span className="text-[10px]">▿</span>
                      ) : (
                        <span className="text-[8px]">◦</span>
                      )}
                    </div>
                    {/* Stake pin */}
                    <div className={`w-0.5 h-2 ${
                      mood === 'high' ? 'bg-jungle/30' : mood === 'low' ? 'bg-terracotta/30' : 'bg-sand-dark/15'
                    }`} />
                    {/* Day label */}
                    <span className="font-ui text-[9px] uppercase tracking-wide text-vintage-text/30 mt-0.5">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Alerts banner */}
      {moodPatterns.alerts.length > 0 && (
        <div className="p-4 bg-terracotta/10 border-2 border-terracotta/30 rounded-lg">
          <div className="font-ui text-[10px] uppercase tracking-widest text-terracotta mb-1.5">Field Advisory</div>
          {moodPatterns.alerts.map((alert, i) => (
            <p key={i} className="text-sm text-terracotta-dark font-serif italic">
              {alert}
            </p>
          ))}
        </div>
      )}

      {/* Expandable detail sections */}
      {(weeklyWins.length > 0 || recurringBlockers.length > 0 || themes.length > 0 || ftScore != null) && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-2 py-3 text-vintage-text/35 hover:text-vintage-text/55 transition-colors"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-vintage-text/15" />
            <span className="text-[10px]">✦</span>
            <span className="font-ui text-[11px] uppercase tracking-widest">
              {showDetails ? 'Collapse Debrief' : 'Full Debrief'}
            </span>
            <span className={`text-xs transition-transform ${showDetails ? 'rotate-180' : ''}`}>▾</span>
            <span className="text-[10px]">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-vintage-text/15" />
          </button>

          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Weekly Wins */}
              {weeklyWins.length > 0 && (
                <div className="bg-cream border-2 border-sand rounded-lg overflow-hidden shadow-sm">
                  <div className="h-1.5 bg-jungle opacity-60" />
                  <div className="p-4">
                    <h4 className="font-ui text-xs uppercase tracking-widest text-jungle/70 mb-3">
                      Expedition Wins
                    </h4>
                    <ul className="space-y-2">
                      {weeklyWins.map((win, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-jungle mt-0.5 flex-shrink-0">✓</span>
                          <span className="font-serif text-vintage-text/70">{win.text}</span>
                          <span className="text-[10px] font-ui text-vintage-text/30 flex-shrink-0 mt-0.5">
                            {new Date(win.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Recurring Blockers */}
              {recurringBlockers.length > 0 && (
                <div className="bg-cream border-2 border-sand rounded-lg overflow-hidden shadow-sm">
                  <div className="h-1.5 bg-terracotta opacity-60" />
                  <div className="p-4">
                    <h4 className="font-ui text-xs uppercase tracking-widest text-terracotta/70 mb-3">
                      Recurring Obstacles
                    </h4>
                    {recurringBlockers.map((blocker, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-sm font-serif text-vintage-text/70 italic">"{blocker.theme}"</p>
                        <p className="font-ui text-[10px] uppercase tracking-wide text-vintage-text/30 mt-0.5">
                          Mentioned {blocker.occurrences}x · {blocker.dates.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan Follow-Through detail */}
              {ftScore != null && (
                <div className="bg-cream border-2 border-sand rounded-lg overflow-hidden shadow-sm">
                  <div className={`h-1.5 ${ftBg} opacity-60`} />
                  <div className="p-4">
                    <h4 className="font-ui text-xs uppercase tracking-widest text-sunset/70 mb-3">
                      Plan Follow-Through
                    </h4>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2.5 bg-sand rounded-full overflow-hidden">
                        <div
                          className={`h-full ${ftBg} rounded-full transition-all`}
                          style={{ width: `${Math.min(ftScore, 100)}%` }}
                        />
                      </div>
                      <span className={`font-poster text-lg ${ftColor}`}>{ftScore}%</span>
                    </div>
                    <p className="font-serif text-[11px] text-vintage-text/35 italic">
                      Alignment between morning headings and evening reports
                    </p>
                  </div>
                </div>
              )}

              {/* Recurring Themes */}
              {themes.length > 0 && (
                <div className="bg-cream border-2 border-sand rounded-lg overflow-hidden shadow-sm">
                  <div className="h-1.5 bg-mustard opacity-60" />
                  <div className="p-4">
                    <h4 className="font-ui text-xs uppercase tracking-widest text-mustard/70 mb-3">
                      Recurring Topics
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {themes.slice(0, 8).map((theme, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-mustard/10 border border-mustard/20 rounded-full text-[11px] font-ui text-vintage-text/60"
                        >
                          {theme.phrase} <span className="text-vintage-text/30">({theme.dayCount}d)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyInsightsCard;
