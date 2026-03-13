import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import QuickReminder from './QuickReminder';

const ReminderManager = ({ apiUrl }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/wellness/notifications`);
      const data = await res.json();
      if (data.success) {
        setReminders(data.notifications || []);
      }
    } catch (err) {
      // silently fail, list just stays empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const cancelReminder = async (id) => {
    // Optimistic remove
    const prev = reminders;
    setReminders(r => r.filter(n => n.id !== id));
    try {
      const res = await fetch(`${apiUrl}/api/wellness/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setReminders(prev);
    }
  };

  const recurring = reminders.filter(r => r.type === 'recurring');
  const oneTime = reminders.filter(r => r.type === 'one-time');

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getCronLabel = (notification) => {
    if (notification.label) return notification.label;
    if (!notification.cronExpression) return 'Recurring';
    const cron = notification.cronExpression;
    if (cron.includes('1-5')) return 'Weekdays';
    if (cron.match(/^\d+ \d+ \* \* \*$/)) return 'Daily';
    return 'Recurring';
  };

  return (
    <Card variant="canvas">
      <h2 className="text-3xl font-poster text-vintage-text text-letterpress mb-4">
        Reminders
      </h2>

      {/* Quick add */}
      <div className="mb-6 p-4 rounded-lg border-2 border-sand-dark bg-sand bg-opacity-30">
        <h3 className="text-xs font-ui uppercase text-vintage-text opacity-60 tracking-wide mb-3">
          New Reminder
        </h3>
        <QuickReminder apiUrl={apiUrl} onScheduled={fetchReminders} />
      </div>

      {loading ? (
        <p className="text-sm font-serif text-vintage-text opacity-60 py-4 text-center">
          Loading reminders...
        </p>
      ) : reminders.length === 0 ? (
        <p className="text-sm font-serif text-vintage-text opacity-60 py-4 text-center">
          No active reminders. Add one above!
        </p>
      ) : (
        <div className="space-y-4">
          {/* Recurring reminders */}
          {recurring.length > 0 && (
            <div>
              <h3 className="text-xs font-ui uppercase text-teal tracking-wide mb-2">
                Recurring ({recurring.length})
              </h3>
              <div className="space-y-2">
                {recurring.map(r => (
                  <div
                    key={r.id}
                    className="group flex items-center gap-3 p-3 rounded-lg border-l-3 border-l-teal bg-teal bg-opacity-5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-sm text-vintage-text truncate">
                        {r.message}
                      </div>
                      <div className="text-xs font-ui text-vintage-text opacity-50 mt-0.5">
                        {getCronLabel(r)}
                      </div>
                    </div>
                    <button
                      onClick={() => cancelReminder(r.id)}
                      className="text-xs font-ui uppercase text-terracotta opacity-0 group-hover:opacity-100 hover:text-terracotta-dark transition-opacity flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* One-time reminders */}
          {oneTime.length > 0 && (
            <div>
              <h3 className="text-xs font-ui uppercase text-mustard-dark tracking-wide mb-2">
                Upcoming ({oneTime.length})
              </h3>
              <div className="space-y-2">
                {oneTime
                  .sort((a, b) => new Date(a.time) - new Date(b.time))
                  .map(r => (
                    <div
                      key={r.id}
                      className="group flex items-center gap-3 p-3 rounded-lg border-l-3 border-l-mustard bg-mustard bg-opacity-5"
                    >
                      <div className="flex-shrink-0 text-right w-16">
                        <div className="font-ui text-xs font-bold text-vintage-text">
                          {formatTime(r.time)}
                        </div>
                        <div className="font-ui text-xs text-vintage-text opacity-50">
                          {formatDate(r.time)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-sm text-vintage-text truncate">
                          {r.message}
                        </div>
                      </div>
                      <button
                        onClick={() => cancelReminder(r.id)}
                        className="text-xs font-ui uppercase text-terracotta opacity-0 group-hover:opacity-100 hover:text-terracotta-dark transition-opacity flex-shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ReminderManager;
