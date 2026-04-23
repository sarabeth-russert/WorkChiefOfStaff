import { useEffect, useState } from 'react';
import { Card, Loading } from '../components/ui';
import Button from '../components/ui/Button';
import { SessionJournalEntry, WeeklyInsightsCard } from '../components/wellness';
import GoalTracker from '../components/goals/GoalTracker';
import FocusTimer from '../components/focus/FocusTimer';
import useToastStore from '../stores/toastStore';

const BaseCamp = () => {
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('recent'); // 'recent' or specific date range key
  const [showArchive, setShowArchive] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [journalTab, setJournalTab] = useState('all'); // 'all', 'standup', 'retro'

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const toast = useToastStore;

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  const fetchSessionHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const response = await fetch(`${apiUrl}/api/wellness/sessions?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only show completed sessions
        const completedSessions = (data.sessions || []).filter(s => s.status === 'completed');
        // Sort by date (newest first)
        const sortedSessions = completedSessions.sort((a, b) => {
          return new Date(b.startedAt) - new Date(a.startedAt);
        });
        setSessionHistory(sortedSessions);
      }
    } catch (err) {
      // Session history fetch failed; UI shows empty state
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Group sessions by date ranges for archive
  const groupSessionsByDateRange = () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const groups = {
      recent: {
        label: 'Last 5 Days',
        sessions: []
      }
    };

    sessionHistory.forEach(session => {
      const sessionDate = new Date(session.startedAt);

      if (sessionDate >= fiveDaysAgo) {
        groups.recent.sessions.push(session);
      } else {
        // Group older sessions by week
        const weekStart = new Date(sessionDate);
        weekStart.setDate(sessionDate.getDate() - sessionDate.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!groups[weekKey]) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          groups[weekKey] = {
            label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            sessions: []
          };
        }
        groups[weekKey].sessions.push(session);
      }
    });

    return groups;
  };

  const sessionGroups = groupSessionsByDateRange();
  const displayedSessions = sessionGroups[selectedDateRange]?.sessions || [];

  // Camp status metadata for the hero banner
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessionHistory.filter(s => s.startedAt?.startsWith(todayStr));
  const hasStandup = todaySessions.some(s => s.type === 'standup');
  const hasRetro = todaySessions.some(s => s.type === 'retro');

  // Expedition day: count from first session, or day 1
  const firstSession = sessionHistory.length > 0
    ? sessionHistory[sessionHistory.length - 1]
    : null;
  const expeditionDay = firstSession
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstSession.startedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Morning fire lit' : hour < 17 ? 'Afternoon watch' : 'Evening campfire';

  // Dashboard strip data
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekSessions = sessionHistory.filter(s => new Date(s.startedAt) >= weekStart).length;
  const isWorkHours = hour >= 7 && hour < 21;

  // Tab-filtered sessions
  const tabFilteredSessions = displayedSessions.filter(s => {
    if (journalTab === 'all') return true;
    return s.type === journalTab;
  });

  const handleTriggerStandup = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/wellness/standup/trigger`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success && !result.alreadyDelivered) {
        toast.getState().success('Morning standup triggered! Check your notifications.');
        setTimeout(() => fetchSessionHistory(), 2000);
      } else if (result.alreadyDelivered) {
        toast.getState().info('Morning standup already delivered today.');
      } else {
        toast.getState().error('Failed to trigger standup: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      toast.getState().error('Error triggering standup: ' + err.message);
    }
  };

  const handleTriggerRetro = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/wellness/retro/trigger`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success && !result.alreadyDelivered) {
        toast.getState().success('Evening retro triggered! Check your notifications.');
        setTimeout(() => fetchSessionHistory(), 2000);
      } else if (result.alreadyDelivered) {
        toast.getState().info('Evening retro already delivered today.');
      } else {
        toast.getState().error('Failed to trigger retro: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      toast.getState().error('Error triggering retro: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-cream paper-texture py-8 px-6">
      {/* Hero Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="relative rounded-lg overflow-hidden shadow-vintage mb-2">
          <img
            src="/images/pages/base-camp-header.png"
            alt="Base Camp expedition headquarters"
            className="w-full h-52 md:h-72 object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/40" />
          {/* Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-block bg-vintage-text/60 text-cream px-3 py-1 rounded font-ui text-xs uppercase tracking-widest">
              Daily Operations
            </span>
          </div>
          {/* Atmospheric camp status */}
          <div className="absolute bottom-4 right-4 bg-vintage-text/50 backdrop-blur-sm rounded px-4 py-2.5 text-right">
            <div className="font-ui text-[10px] uppercase tracking-widest text-cream/70 mb-1">
              Expedition Day {expeditionDay}
            </div>
            <div className="flex items-center gap-3 font-ui text-[10px] uppercase tracking-widest text-cream/50">
              <span>{timeOfDay}</span>
              <span>·</span>
              <span className={hasStandup ? 'text-mustard' : ''}>
                {hasStandup ? '✓ Standup' : '○ Standup'}
              </span>
              <span className={hasRetro ? 'text-teal' : ''}>
                {hasRetro ? '✓ Retro' : '○ Retro'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress mb-1">
            Base Camp
          </h1>
          <p className="font-serif text-vintage-text/50 text-base italic">
            Daily planning and reflection journal
          </p>
        </div>
      </div>

      {/* Camp Dashboard Strip */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-8 md:gap-12 py-4">
          {/* Fire Lit — standup done */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${hasStandup ? 'bg-mustard shadow-[0_0_6px_rgba(218,165,32,0.4)]' : 'bg-vintage-text/15'}`} />
            <span className="font-ui text-[9px] uppercase tracking-widest text-vintage-text/35">Fire Lit</span>
          </div>
          {/* Supplies — sessions logged this week */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${weekSessions >= 5 ? 'bg-jungle shadow-[0_0_6px_rgba(74,120,89,0.4)]' : weekSessions > 0 ? 'bg-mustard/70' : 'bg-vintage-text/15'}`} />
            <span className="font-ui text-[9px] uppercase tracking-widest text-vintage-text/35">Supplies</span>
          </div>
          {/* Morale — both rituals done */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${hasStandup && hasRetro ? 'bg-jungle shadow-[0_0_6px_rgba(74,120,89,0.4)]' : (hasStandup || hasRetro) ? 'bg-mustard/70' : 'bg-vintage-text/15'}`} />
            <span className="font-ui text-[9px] uppercase tracking-widest text-vintage-text/35">Morale</span>
          </div>
          {/* Focus — active watch */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isWorkHours ? 'bg-teal shadow-[0_0_6px_rgba(71,155,153,0.4)]' : 'bg-vintage-text/15'}`} />
            <span className="font-ui text-[9px] uppercase tracking-widest text-vintage-text/35">Focus</span>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-vintage-text/10" />

          {/* Focus Timer — compact action button */}
          <button
            onClick={() => setShowFocusTimer(true)}
            className="flex items-center gap-1.5 text-vintage-text/35 hover:text-terracotta transition-colors"
          >
            <span className="text-sm">🎯</span>
            <span className="font-ui text-[9px] uppercase tracking-widest">Focus Timer</span>
          </button>
        </div>
      </div>

      {/* Weekly Goals */}
      <div className="max-w-6xl mx-auto mb-6">
        <GoalTracker />
      </div>

      {/* Weekly Insights */}
      <div className="max-w-6xl mx-auto mb-6">
        <WeeklyInsightsCard />
      </div>

      {/* Focus Timer Modal */}
      {showFocusTimer && (
        <FocusTimer onClose={() => setShowFocusTimer(false)} />
      )}

      {/* Session Journal with Field Log Index */}
      <div className="max-w-6xl mx-auto">
        {/* Journal mode tabs — expedition folder tabs */}
        <div className="relative mb-5">
          <div className="flex items-end gap-1.5">
            {[
              { key: 'all', label: 'All Entries', icon: '📓' },
              { key: 'standup', label: 'Dawn Watch', icon: '🌅' },
              { key: 'retro', label: 'Evening Watch', icon: '🌙' },
            ].map(tab => {
              const isActive = journalTab === tab.key;
              const activeColor = tab.key === 'standup' ? 'text-mustard border-mustard/30'
                : tab.key === 'retro' ? 'text-teal border-teal/30'
                : 'text-vintage-text/60 border-sand-dark/25';
              return (
                <button
                  key={tab.key}
                  onClick={() => setJournalTab(tab.key)}
                  className={`flex items-center gap-2 px-5 font-ui text-xs uppercase tracking-widest transition-all rounded-t-lg ${
                    isActive
                      ? `py-3 bg-sand/30 border-2 border-b-0 ${activeColor} shadow-sm relative z-10`
                      : 'py-2.5 text-vintage-text/25 hover:text-vintage-text/45 hover:bg-sand/10 border-2 border-transparent border-b-0 rounded-t-lg'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
          {/* Tab rail */}
          <div className="h-0.5 bg-sand-dark/15" />
        </div>

        {/* Inline trigger — shown when on a specific tab and ritual not yet done */}
        {journalTab === 'standup' && !hasStandup && (
          <button
            onClick={handleTriggerStandup}
            className="w-full mb-5 p-4 bg-mustard/5 border-2 border-dashed border-mustard/30 rounded-lg text-left hover:bg-mustard/10 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-poster text-lg text-mustard">Set Today's Heading</div>
                <p className="font-serif text-xs text-vintage-text/40 italic mt-0.5">
                  The morning fire hasn't been lit — start your standup to plan the day
                </p>
              </div>
              <span className="font-ui text-[10px] uppercase tracking-widest text-mustard/50 group-hover:text-mustard transition-colors">
                Begin ▸
              </span>
            </div>
          </button>
        )}
        {journalTab === 'retro' && !hasRetro && (
          <button
            onClick={handleTriggerRetro}
            className="w-full mb-5 p-4 bg-teal/5 border-2 border-dashed border-teal/30 rounded-lg text-left hover:bg-teal/10 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-poster text-lg text-teal">File Evening Report</div>
                <p className="font-serif text-xs text-vintage-text/40 italic mt-0.5">
                  The campfire is still burning — log what you learned before it fades
                </p>
              </div>
              <span className="font-ui text-[10px] uppercase tracking-widest text-teal/50 group-hover:text-teal transition-colors">
                Begin ▸
              </span>
            </div>
          </button>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Field Log Index — light ledger sidebar */}
          <div className="lg:w-48 flex-shrink-0">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-3 lg:mb-2">
                <h3 className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/35">Log Index</h3>
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="lg:hidden font-ui text-xs text-vintage-text/40"
                >
                  {showArchive ? '✕' : '☰'}
                </button>
              </div>

              <div className={`space-y-0.5 ${showArchive ? 'block' : 'hidden lg:block'}`}>
                {Object.entries(sessionGroups).map(([key, group]) => {
                  const isSelected = selectedDateRange === key;
                  const count = group.sessions.length;

                  if (count === 0) return null;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedDateRange(key);
                        setShowArchive(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-sand/40 border-l-2 border-vintage-text/30'
                          : 'hover:bg-sand/20 border-l-2 border-transparent'
                      }`}
                    >
                      <span className={`font-serif text-xs ${isSelected ? 'text-vintage-text/70' : 'text-vintage-text/40'}`}>
                        {group.label}
                      </span>
                      <span className={`font-mono text-[10px] ${isSelected ? 'text-vintage-text/50' : 'text-vintage-text/25'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isLoadingHistory ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3 animate-pulse">📓</div>
                <p className="font-ui text-xs uppercase tracking-widest text-vintage-text/35">Loading field journal...</p>
              </div>
            ) : sessionHistory.length > 0 ? (
              <>
                {/* Current Selection Header */}
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-poster text-vintage-text">
                    {sessionGroups[selectedDateRange]?.label || 'Recent Entries'}
                  </h3>
                  <span className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/35">
                    {tabFilteredSessions.length} {tabFilteredSessions.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Session List */}
                {tabFilteredSessions.length > 0 ? (
                  <div className="space-y-4">
                    {tabFilteredSessions.map((session) => (
                      <SessionJournalEntry
                        key={session.id}
                        session={session}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📭</div>
                    <h3 className="text-xl font-poster text-vintage-text mb-1">
                      {journalTab === 'all' ? 'No Entries in This Period' : `No ${journalTab === 'standup' ? 'Dawn Watch' : 'Evening Watch'} Entries`}
                    </h3>
                    <p className="font-serif text-sm text-vintage-text/40 italic">
                      {journalTab === 'all' ? 'Select a different period from the log index.' : 'Try a different date range or switch tabs.'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📓</div>
                <h3 className="text-xl font-poster text-vintage-text mb-1">No Journal Entries Yet</h3>
                <p className="font-serif text-sm text-vintage-text/40 italic max-w-md mx-auto">
                  Completed standup and retrospective sessions will appear here as field journal entries.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseCamp;
