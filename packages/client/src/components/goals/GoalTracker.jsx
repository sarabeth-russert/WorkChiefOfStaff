import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import Button from '../ui/Button';
import useToastStore from '../../stores/toastStore';

const API_URL = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'career', label: 'Career' },
];

const CATEGORY_COLORS = {
  general: 'border-teal',
  engineering: 'border-jungle',
  health: 'border-terracotta',
  learning: 'border-mustard',
  career: 'border-sunset',
};

const GoalTracker = () => {
  const [goals, setGoals] = useState([]);
  const [currentWeek, setCurrentWeek] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'general', milestones: '' });
  const [newMilestoneText, setNewMilestoneText] = useState({});
  const [reviewWeek, setReviewWeek] = useState(null);
  const [review, setReview] = useState(null);

  useEffect(() => {
    fetchCurrentWeek();
  }, []);

  useEffect(() => {
    if (currentWeek) fetchGoals();
  }, [currentWeek]);

  const fetchCurrentWeek = async () => {
    try {
      const res = await fetch(`${API_URL}/api/goals/current-week`);
      const data = await res.json();
      if (data.success) setCurrentWeek(data.weekOf);
    } catch (err) {
      // Fallback: calculate locally
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      setCurrentWeek(new Date(now.setDate(diff)).toISOString().split('T')[0]);
    }
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/goals?weekOf=${currentWeek}`);
      const data = await res.json();
      if (data.success) setGoals(data.goals);
    } catch (err) {
      useToastStore.getState().error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) {
      useToastStore.getState().warning('Please enter a goal title');
      return;
    }

    try {
      const milestones = newGoal.milestones
        .split('\n')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoal.title,
          description: newGoal.description,
          weekOf: currentWeek,
          category: newGoal.category,
          milestones,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGoals([...goals, data.goal]);
        setNewGoal({ title: '', description: '', category: 'general', milestones: '' });
        setShowAddForm(false);
        useToastStore.getState().success('Goal added');
      }
    } catch (err) {
      useToastStore.getState().error('Failed to add goal');
    }
  };

  const handleToggleMilestone = async (goalId, milestoneId) => {
    try {
      const res = await fetch(`${API_URL}/api/goals/${goalId}/milestones/${milestoneId}/toggle`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setGoals(goals.map(g => g.id === goalId ? data.goal : g));
      }
    } catch (err) {
      useToastStore.getState().error('Failed to toggle milestone');
    }
  };

  const handleAddMilestone = async (goalId) => {
    const text = newMilestoneText[goalId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_URL}/api/goals/${goalId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setGoals(goals.map(g => g.id === goalId ? data.goal : g));
        setNewMilestoneText({ ...newMilestoneText, [goalId]: '' });
      }
    } catch (err) {
      useToastStore.getState().error('Failed to add milestone');
    }
  };

  const handleUpdateStatus = async (goalId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setGoals(goals.map(g => g.id === goalId ? data.goal : g));
      }
    } catch (err) {
      useToastStore.getState().error('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const confirmed = await useToastStore.getState().confirm(
      'Are you sure you want to delete this goal?',
      { title: 'Delete Goal', confirmLabel: 'Delete', cancelLabel: 'Cancel' }
    );
    if (!confirmed) return;

    try {
      await fetch(`${API_URL}/api/goals/${goalId}`, { method: 'DELETE' });
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (err) {
      useToastStore.getState().error('Failed to delete goal');
    }
  };

  const fetchWeeklyReview = async (weekOf) => {
    try {
      const res = await fetch(`${API_URL}/api/goals/review/${weekOf}`);
      const data = await res.json();
      if (data.success) {
        setReview(data.review);
        setReviewWeek(weekOf);
      }
    } catch (err) {
      useToastStore.getState().error('Failed to load review');
    }
  };

  // Calculate previous week
  const prevWeek = currentWeek
    ? new Date(new Date(currentWeek + 'T00:00:00Z').getTime() - 7 * 86400000).toISOString().split('T')[0]
    : '';

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const totalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  if (loading || !currentWeek) {
    return (
      <Card variant="canvas">
        <p className="text-center text-vintage-text py-6 font-ui uppercase">Loading goals...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-poster text-vintage-text">Weekly Goals</h2>
          <p className="text-sm text-vintage-text opacity-70 font-ui">
            Week of {new Date(currentWeek + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchWeeklyReview(prevWeek)}
          >
            Last Week Review
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Goal'}
          </Button>
        </div>
      </div>

      {/* Weekly Progress Bar */}
      {goals.length > 0 && (
        <div className="bg-sand rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-ui text-xs uppercase text-vintage-text opacity-70">
              Weekly Progress
            </span>
            <span className="font-poster text-lg text-vintage-text">
              {completedGoals.length}/{goals.length} goals &middot; {totalProgress}%
            </span>
          </div>
          <div className="h-3 bg-cream rounded-full overflow-hidden border border-sand-dark">
            <div
              className="h-full bg-jungle transition-all duration-500 rounded-full"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Goal Form */}
      {showAddForm && (
        <Card variant="canvas">
          <div className="space-y-3">
            <input
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="Goal title..."
              className="w-full px-3 py-2 border-2 border-vintage-text rounded font-serif text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              placeholder="Description (optional)..."
              className="w-full px-3 py-2 border-2 border-vintage-text rounded font-serif text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta"
              rows={2}
            />
            <div className="flex gap-3">
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                className="px-3 py-2 border-2 border-vintage-text rounded font-ui text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <textarea
              value={newGoal.milestones}
              onChange={(e) => setNewGoal({ ...newGoal, milestones: e.target.value })}
              placeholder="Milestones (one per line)..."
              className="w-full px-3 py-2 border-2 border-vintage-text rounded font-serif text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta"
              rows={3}
            />
            <Button variant="secondary" size="sm" onClick={handleAddGoal}>
              Create Goal
            </Button>
          </div>
        </Card>
      )}

      {/* Weekly Review Modal */}
      {review && reviewWeek && (
        <Card variant="canvas" className="border-mustard">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-poster text-vintage-text">
              Week of {new Date(reviewWeek + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Review
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setReview(null); setReviewWeek(null); }}>
              Close
            </Button>
          </div>
          {review.total === 0 ? (
            <p className="text-vintage-text opacity-70 font-serif">No goals were set for this week.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-jungle bg-opacity-10 rounded p-2">
                  <span className="text-2xl font-poster text-jungle">{review.completed}</span>
                  <p className="text-xs font-ui uppercase text-vintage-text opacity-70">Completed</p>
                </div>
                <div className="bg-mustard bg-opacity-10 rounded p-2">
                  <span className="text-2xl font-poster text-mustard-dark">{review.active}</span>
                  <p className="text-xs font-ui uppercase text-vintage-text opacity-70">In Progress</p>
                </div>
                <div className="bg-terracotta bg-opacity-10 rounded p-2">
                  <span className="text-2xl font-poster text-terracotta">{review.completionRate}%</span>
                  <p className="text-xs font-ui uppercase text-vintage-text opacity-70">Completion</p>
                </div>
              </div>
              {review.goals.map(g => (
                <div key={g.id} className={`flex items-center gap-2 text-sm ${g.status === 'completed' ? 'text-jungle' : 'text-vintage-text opacity-70'}`}>
                  <span>{g.status === 'completed' ? '\u2713' : '\u2022'}</span>
                  <span className={`font-serif ${g.status === 'completed' ? 'line-through' : ''}`}>{g.title}</span>
                  <span className="font-ui text-xs">({g.progress}%)</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Goal Cards */}
      {goals.length === 0 && !showAddForm ? (
        <div className="space-y-4">
          <div className="text-center py-6">
            <h3 className="text-2xl font-poster text-vintage-text mb-1">No Active Objectives Posted</h3>
            <p className="font-serif text-vintage-text/40 text-sm italic mb-5">
              Pin your expedition objectives for the week to keep the team aligned.
            </p>
            <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
              + Post First Objective
            </Button>
          </div>

          {/* Ghosted sample objectives */}
          <div className="space-y-3 opacity-[0.35] pointer-events-none select-none" aria-hidden="true">
            <div className="border-3 rounded-lg bg-cream p-4 border-jungle">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-poster text-lg text-vintage-text">Complete field survey of eastern ridge</h4>
                    <span className="font-ui text-xs uppercase px-2 py-0.5 rounded bg-sand text-vintage-text">engineering</span>
                  </div>
                  <p className="text-sm text-vintage-text font-serif mt-1">Map terrain features and log coordinates</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-poster text-sm text-vintage-text">60%</span>
                  <div className="w-16 h-2 bg-sand rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-teal" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-3 rounded-lg bg-cream p-4 border-mustard">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-poster text-lg text-vintage-text">Catalog provisions and update supply ledger</h4>
                    <span className="font-ui text-xs uppercase px-2 py-0.5 rounded bg-sand text-vintage-text">general</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-poster text-sm text-vintage-text">0%</span>
                  <div className="w-16 h-2 bg-sand rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-teal" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-3 rounded-lg bg-cream p-4 border-terracotta">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-poster text-lg text-vintage-text">Morning conditioning — 3 sessions this week</h4>
                    <span className="font-ui text-xs uppercase px-2 py-0.5 rounded bg-sand text-vintage-text">health</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-poster text-sm text-vintage-text">33%</span>
                  <div className="w-16 h-2 bg-sand rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-teal" style={{ width: '33%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleMilestone={handleToggleMilestone}
              onAddMilestone={handleAddMilestone}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteGoal}
              newMilestoneText={newMilestoneText[goal.id] || ''}
              onNewMilestoneChange={(text) => setNewMilestoneText({ ...newMilestoneText, [goal.id]: text })}
            />
          ))}
          {completedGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleMilestone={handleToggleMilestone}
              onAddMilestone={handleAddMilestone}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteGoal}
              newMilestoneText={newMilestoneText[goal.id] || ''}
              onNewMilestoneChange={(text) => setNewMilestoneText({ ...newMilestoneText, [goal.id]: text })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GoalCard = ({ goal, onToggleMilestone, onAddMilestone, onUpdateStatus, onDelete, newMilestoneText, onNewMilestoneChange }) => {
  const [expanded, setExpanded] = useState(goal.status === 'active');
  const isCompleted = goal.status === 'completed';
  const categoryColor = CATEGORY_COLORS[goal.category] || 'border-teal';

  return (
    <div className={`border-3 rounded-lg shadow-vintage bg-cream p-4 ${categoryColor} ${isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2">
            <h4 className={`font-poster text-lg text-vintage-text ${isCompleted ? 'line-through' : ''}`}>
              {goal.title}
            </h4>
            <span className="font-ui text-xs uppercase px-2 py-0.5 rounded bg-sand text-vintage-text opacity-70">
              {goal.category}
            </span>
          </div>
          {goal.description && (
            <p className="text-sm text-vintage-text opacity-70 font-serif mt-1">{goal.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-poster text-sm text-vintage-text">{goal.progress}%</span>
          <div className="w-16 h-2 bg-sand rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-jungle' : 'bg-teal'}`}
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {goal.milestones.map(ms => (
            <label
              key={ms.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={ms.completed}
                onChange={() => onToggleMilestone(goal.id, ms.id)}
                className="w-4 h-4 accent-jungle"
              />
              <span className={`font-serif text-sm ${ms.completed ? 'line-through text-vintage-text opacity-50' : 'text-vintage-text'}`}>
                {ms.text}
              </span>
            </label>
          ))}

          {/* Add milestone inline */}
          <div className="flex gap-2 mt-2">
            <input
              value={newMilestoneText}
              onChange={(e) => onNewMilestoneChange(e.target.value)}
              placeholder="Add a milestone..."
              className="flex-1 px-2 py-1 text-sm border border-sand-dark rounded font-serif focus:outline-none focus:ring-1 focus:ring-teal"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddMilestone(goal.id);
                }
              }}
            />
            <button
              onClick={() => onAddMilestone(goal.id)}
              className="text-sm font-ui uppercase text-teal hover:text-teal-dark"
            >
              Add
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-2 pt-2 border-t border-sand">
            {!isCompleted && (
              <button
                onClick={() => onUpdateStatus(goal.id, 'completed')}
                className="text-xs font-ui uppercase text-jungle hover:text-jungle-dark"
              >
                Mark Complete
              </button>
            )}
            {isCompleted && (
              <button
                onClick={() => onUpdateStatus(goal.id, 'active')}
                className="text-xs font-ui uppercase text-teal hover:text-teal-dark"
              >
                Reopen
              </button>
            )}
            <button
              onClick={() => onUpdateStatus(goal.id, 'abandoned')}
              className="text-xs font-ui uppercase text-vintage-text opacity-50 hover:opacity-80"
            >
              Abandon
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="text-xs font-ui uppercase text-terracotta hover:text-terracotta-dark ml-auto"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTracker;
