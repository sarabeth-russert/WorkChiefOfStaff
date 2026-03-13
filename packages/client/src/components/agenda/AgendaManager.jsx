import React, { useState, useEffect } from 'react';
import { Card } from '../ui';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AgendaManager = ({ apiUrl }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', recurrence: 'weekly', dayOfWeek: 1, startDate: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/agenda`);
      const data = await res.json();
      if (data.success) setItems(data.items || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        recurrence: form.recurrence,
        dayOfWeek: Number(form.dayOfWeek),
        notes: form.notes.trim() || null,
      };
      // For biweekly, include startDate as anchor
      if (form.recurrence === 'biweekly' && form.startDate) {
        body.startDate = form.startDate;
      }
      const res = await fetch(`${apiUrl}/api/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(prev => [...prev, data.item]);
      setForm({ name: '', recurrence: 'weekly', dayOfWeek: 1, startDate: '', notes: '' });
      setShowAdd(false);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id) => {
    const prev = items;
    setItems(i => i.filter(x => x.id !== id));
    try {
      await fetch(`${apiUrl}/api/agenda/${id}`, { method: 'DELETE' });
    } catch {
      setItems(prev);
    }
  };

  // Get the next occurrence date string for display
  const getNextOccurrence = (item) => {
    const today = new Date();
    const todayDay = today.getDay();
    let daysUntil = item.dayOfWeek - todayDay;
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0) return 'Today';

    if (item.recurrence === 'biweekly') {
      const anchor = new Date(item.startDate + 'T12:00:00Z');
      const candidate = new Date(today);
      candidate.setDate(candidate.getDate() + daysUntil);
      const diffMs = candidate - anchor;
      const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks % 2 !== 0) daysUntil += 7;
    }

    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    const next = new Date(today);
    next.setDate(next.getDate() + daysUntil);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card variant="canvas">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-poster text-vintage-text text-letterpress">
          Recurring Agenda
        </h2>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs font-ui text-teal hover:text-teal-dark uppercase tracking-wide"
          >
            + Add Item
          </button>
        )}
      </div>

      <p className="text-sm font-serif text-vintage-text opacity-70 mb-4">
        Items here automatically surface in your morning standup on the days they occur.
      </p>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-5 p-4 rounded-lg border-2 border-sand-dark bg-sand bg-opacity-30 space-y-3">
          <input
            autoFocus
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Production Release, Sprint Notes..."
            className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none"
          />
          <div className="flex gap-3">
            {/* Day of week */}
            <div className="flex-1">
              <label className="text-xs font-ui uppercase text-vintage-text opacity-60 block mb-1">Day</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text focus:border-teal focus:outline-none"
              >
                {DAY_NAMES_FULL.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            {/* Recurrence */}
            <div className="flex-1">
              <label className="text-xs font-ui uppercase text-vintage-text opacity-60 block mb-1">Repeat</label>
              <div className="flex rounded border-2 border-sand-dark overflow-hidden">
                {['weekly', 'biweekly'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ ...form, recurrence: opt })}
                    className={`flex-1 px-3 py-2 text-xs font-ui uppercase tracking-wide transition-colors ${
                      form.recurrence === opt
                        ? 'bg-teal text-cream'
                        : 'bg-cream text-vintage-text opacity-60 hover:opacity-100'
                    }`}
                  >
                    {opt === 'weekly' ? 'Weekly' : 'Biweekly'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Start date for biweekly */}
          {form.recurrence === 'biweekly' && (
            <div>
              <label className="text-xs font-ui uppercase text-vintage-text opacity-60 block mb-1">
                Next occurrence (anchor date)
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text focus:border-teal focus:outline-none"
              />
              <p className="text-xs text-vintage-text opacity-40 font-ui mt-1">
                Pick the date of the next occurrence so we know which weeks are "on"
              </p>
            </div>
          )}
          {/* Notes */}
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes (shown in standup)"
            className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="px-3 py-1.5 rounded bg-teal text-cream font-ui text-xs uppercase tracking-wide hover:bg-teal-dark disabled:opacity-40 transition-colors"
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setForm({ name: '', recurrence: 'weekly', dayOfWeek: 1, startDate: '', notes: '' }); }}
              className="px-3 py-1.5 rounded border border-sand-dark text-vintage-text font-ui text-xs uppercase tracking-wide hover:border-vintage-text transition-[border-color]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      {loading ? (
        <p className="text-sm font-serif text-vintage-text opacity-60 py-4 text-center">Loading...</p>
      ) : items.length === 0 && !showAdd ? (
        <p className="text-sm font-serif text-vintage-text opacity-60 py-4 text-center">
          No recurring agenda items yet. Add one to have it appear in your standups automatically.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="group flex items-center gap-3 p-3 rounded-lg border-l-3 border-l-jungle bg-jungle bg-opacity-5"
            >
              <div className="flex-1 min-w-0">
                <div className="font-serif text-sm text-vintage-text font-bold truncate">
                  {item.name}
                </div>
                <div className="flex items-center gap-2 text-xs font-ui text-vintage-text opacity-50 mt-0.5">
                  <span>{DAY_NAMES_FULL[item.dayOfWeek]}s</span>
                  <span className="opacity-30">|</span>
                  <span className="capitalize">{item.recurrence}</span>
                  <span className="opacity-30">|</span>
                  <span>Next: {getNextOccurrence(item)}</span>
                </div>
                {item.notes && (
                  <div className="text-xs font-serif text-vintage-text opacity-50 mt-1 truncate">
                    {item.notes}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-xs font-ui uppercase text-terracotta opacity-0 group-hover:opacity-100 hover:text-terracotta-dark transition-opacity flex-shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default AgendaManager;
