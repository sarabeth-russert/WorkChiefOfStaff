import React, { useState } from 'react';
import { CheckIcon } from '../ui';

const HabitTracker = ({ habits, completed, onToggle, onAdd, onRemove }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState('');
  const [adding, setAdding] = useState(false);

  const total = habits.length;
  const done = habits.filter(h => completed[h.id]).length;

  const handleAdd = async () => {
    if (!newHabit.trim()) return;
    setAdding(true);
    await onAdd(newHabit.trim());
    setNewHabit('');
    setShowAdd(false);
    setAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') { setShowAdd(false); setNewHabit(''); }
  };

  if (habits.length === 0 && !showAdd) {
    return (
      <div>
        <p className="text-sm font-serif text-vintage-text opacity-70 mb-3">
          Track daily habits to build consistency.
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs font-ui text-teal hover:text-teal-dark uppercase tracking-wide"
        >
          + Add First Habit
        </button>
        {showAdd && (
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Exercise, Drink water..."
              className="flex-1 px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newHabit.trim()}
              className="px-3 py-2 rounded bg-teal text-cream font-ui text-xs uppercase tracking-wide hover:bg-teal-dark disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header row with count */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-ui uppercase text-vintage-text opacity-60 tracking-wide">
          Daily Habits
        </h3>
        <span className="text-xs font-ui text-vintage-text opacity-60">
          {done}/{total}
        </span>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full h-1.5 rounded-full bg-sand-dark mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-jungle transition-all duration-300"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      {/* Habit list */}
      <div className="space-y-1.5">
        {habits.map(habit => {
          const isDone = !!completed[habit.id];
          return (
            <div
              key={habit.id}
              onClick={() => onToggle(habit.id)}
              className={`group flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                isDone
                  ? 'bg-jungle bg-opacity-10'
                  : 'hover:bg-sand'
              }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                isDone ? 'bg-jungle border-jungle' : 'border-sand-dark'
              }`}>
                {isDone && (
                  <CheckIcon size="w-2.5 h-2.5" className="text-cream" />
                )}
              </div>
              <span className={`font-serif text-sm flex-1 ${
                isDone ? 'text-jungle line-through opacity-70' : 'text-vintage-text'
              }`}>
                {habit.icon && <span className="mr-1">{habit.icon}</span>}
                {habit.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(habit.id); }}
                className="text-vintage-text opacity-0 group-hover:opacity-40 hover:!opacity-70 text-xs leading-none"
                title="Remove habit"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>

      {/* Add habit */}
      {showAdd ? (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New habit..."
            className="flex-1 px-2 py-1.5 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newHabit.trim()}
            className="px-2 py-1.5 rounded bg-teal text-cream font-ui text-xs uppercase tracking-wide hover:bg-teal-dark disabled:opacity-40 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAdd(false); setNewHabit(''); }}
            className="px-2 py-1.5 rounded border border-sand-dark text-vintage-text font-ui text-xs uppercase tracking-wide hover:border-vintage-text transition-[border-color]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-2 text-xs font-ui text-teal hover:text-teal-dark uppercase tracking-wide"
        >
          + Add Habit
        </button>
      )}

      {/* All done message */}
      {total > 0 && done === total && (
        <div className="mt-2 text-center">
          <span className="text-xs font-serif text-jungle">All done today!</span>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
