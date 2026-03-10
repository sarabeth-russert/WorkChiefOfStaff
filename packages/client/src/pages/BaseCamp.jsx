import { useEffect, useState } from 'react';
import { Card, Loading } from '../components/ui';
import Button from '../components/ui/Button';
import { SessionJournalEntry } from '../components/wellness';

const BaseCamp = () => {
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('recent'); // 'recent' or specific date range key
  const [showArchive, setShowArchive] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

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
      console.error('Error fetching session history:', err);
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

  const handleTriggerStandup = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/wellness/standup/trigger`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success && !result.alreadyDelivered) {
        alert('Morning standup triggered! Check your notifications.');
        // Refresh the session history after a short delay to see the new session
        setTimeout(() => fetchSessionHistory(), 2000);
      } else if (result.alreadyDelivered) {
        alert('Morning standup already delivered today.');
      } else {
        alert('Failed to trigger standup: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error triggering standup:', err);
      alert('Error triggering standup: ' + err.message);
    }
  };

  const handleTriggerRetro = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/wellness/retro/trigger`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success && !result.alreadyDelivered) {
        alert('Evening retro triggered! Check your notifications.');
        // Refresh the session history after a short delay to see the new session
        setTimeout(() => fetchSessionHistory(), 2000);
      } else if (result.alreadyDelivered) {
        alert('Evening retro already delivered today.');
      } else {
        alert('Failed to trigger retro: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error triggering retro:', err);
      alert('Error triggering retro: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-cream paper-texture py-8 px-6">
      {/* Hero Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="relative rounded-lg overflow-hidden shadow-vintage">
          <img
            src="/images/pages/base-camp-header.png"
            alt="Base Camp"
            className="w-full h-48 md:h-64 object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream opacity-60" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
            <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress drop-shadow-lg mb-2">
              Base Camp
            </h1>
            <p className="text-lg text-vintage-text opacity-90 drop-shadow">
              Your daily planning and reflection journal. Track your standup plans and retrospective notes.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Session Triggers */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card variant="canvas">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-poster text-vintage-text mb-1">Start a Session</h2>
              <p className="text-sm text-vintage-text opacity-70">
                Manually trigger your daily planning and reflection sessions
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleTriggerStandup}
              >
                🌅 Morning Standup
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleTriggerRetro}
              >
                🌙 Evening Retro
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Session Journal with Archive Sidebar */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Archive Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <Card variant="canvas" className="sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-poster text-vintage-text">📚 Archive</h3>
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="lg:hidden text-vintage-text"
                >
                  {showArchive ? '✕' : '☰'}
                </button>
              </div>

              <div className={`space-y-2 ${showArchive ? 'block' : 'hidden lg:block'}`}>
                {Object.entries(sessionGroups).map(([key, group]) => {
                  const isSelected = selectedDateRange === key;
                  const count = group.sessions.length;

                  if (count === 0) return null;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedDateRange(key);
                        setShowArchive(false); // Close on mobile after selection
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        isSelected
                          ? 'bg-vintage-brown bg-opacity-20 border-l-4 border-vintage-brown'
                          : 'hover:bg-vintage-brown hover:bg-opacity-10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-ui text-vintage-text">
                          {group.label}
                        </span>
                        <span className="text-xs bg-vintage-brown bg-opacity-20 px-2 py-1 rounded-full text-vintage-text">
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isLoadingHistory ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔄</div>
                  <p className="text-vintage-text font-ui uppercase">Loading your journal...</p>
                </div>
              </Card>
            ) : sessionHistory.length > 0 ? (
              <>
                {/* Current Selection Header */}
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-poster text-vintage-text">
                    {sessionGroups[selectedDateRange]?.label || 'Recent Entries'}
                  </h2>
                  <span className="text-sm text-vintage-text opacity-70">
                    {displayedSessions.length} {displayedSessions.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Session List */}
                {displayedSessions.length > 0 ? (
                  <div className="space-y-4">
                    {displayedSessions.map((session) => (
                      <SessionJournalEntry
                        key={session.id}
                        session={session}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📭</div>
                      <h3 className="text-2xl font-poster text-vintage-text mb-2">
                        No Entries in This Period
                      </h3>
                      <p className="text-vintage-text max-w-md mx-auto">
                        Select a different time period from the archive to view older entries.
                      </p>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📓</div>
                  <h3 className="text-2xl font-poster text-vintage-text mb-2">
                    No Journal Entries Yet
                  </h3>
                  <p className="text-vintage-text max-w-md mx-auto">
                    Your completed standup and retrospective sessions will appear here. Click on a wellness notification to start a session and add your first journal entry.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseCamp;
