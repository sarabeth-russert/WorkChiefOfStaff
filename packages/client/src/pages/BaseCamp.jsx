import { useEffect, useState } from 'react';
import { Card, Loading } from '../components/ui';
import { SessionJournalEntry } from '../components/wellness';

const BaseCamp = () => {
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  const fetchSessionHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
              🏕️ Base Camp
            </h1>
            <p className="text-lg text-vintage-text opacity-90 drop-shadow">
              Your daily planning and reflection journal. Track your standup plans and retrospective notes.
            </p>
          </div>
        </div>
      </div>

      {/* Session Journal */}
      <div className="max-w-4xl mx-auto">
        {isLoadingHistory ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔄</div>
              <p className="text-vintage-text font-ui uppercase">Loading your journal...</p>
            </div>
          </Card>
        ) : sessionHistory.length > 0 ? (
          <div className="space-y-4">
            {sessionHistory.map((session) => (
              <SessionJournalEntry
                key={session.id}
                session={session}
              />
            ))}
          </div>
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
  );
};

export default BaseCamp;
