import React, { useState } from 'react';

const SCHEDULE_OPTIONS = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
];

const QuickReminder = ({ apiUrl, onScheduled }) => {
  const [message, setMessage] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [schedule, setSchedule] = useState('once');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !timeStr.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/wellness/notifications/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), timeStr: timeStr.trim(), schedule }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to schedule');
      }
      setMessage('');
      setTimeStr('');
      setSchedule('once');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onScheduled?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex items-center gap-2 py-2">
        <span className="text-jungle text-sm">&#x2713;</span>
        <span className="text-sm font-serif text-jungle">Reminder set!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Remind me to..."
        className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={timeStr}
          onChange={(e) => setTimeStr(e.target.value)}
          placeholder="2pm, 3:30pm, noon..."
          className="flex-1 px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none"
        />
        <div className="flex rounded border-2 border-sand-dark overflow-hidden">
          {SCHEDULE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSchedule(opt.value)}
              className={`px-2 py-1.5 text-xs font-ui uppercase tracking-wide transition-colors ${
                schedule === opt.value
                  ? 'bg-teal text-cream'
                  : 'bg-cream text-vintage-text opacity-60 hover:opacity-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !message.trim() || !timeStr.trim()}
          className="px-3 py-1.5 rounded bg-teal text-cream font-ui text-xs uppercase tracking-wide hover:bg-teal-dark disabled:opacity-40 transition-colors"
        >
          {saving ? 'Setting...' : 'Set Reminder'}
        </button>
        {error && (
          <span className="text-xs text-terracotta font-ui">{error}</span>
        )}
      </div>
    </form>
  );
};

export default QuickReminder;
