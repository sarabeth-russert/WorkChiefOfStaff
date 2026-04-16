import React, { useState, useEffect, useRef, useCallback } from 'react';
import useToastStore from '../../stores/toastStore';

const API_URL = import.meta.env.VITE_API_URL || '';

const PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
];

const FocusTimer = ({ onClose, goals = [] }) => {
  const [phase, setPhase] = useState('setup'); // setup | running | paused | break | done
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [label, setLabel] = useState('');
  const [goalId, setGoalId] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [stats, setStats] = useState(null);
  const intervalRef = useRef(null);
  const totalSeconds = useRef(0);

  useEffect(() => {
    fetchStats();
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const res = await fetch(`${API_URL}/api/focus/stats?startDate=${weekAgo}&endDate=${today}`);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      // Stats fetch is non-critical
    }
  };

  const startSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/focus/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: selectedMinutes,
          label: label || `${selectedMinutes}min focus`,
          goalId: goalId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.session.id);
        totalSeconds.current = selectedMinutes * 60;
        setRemaining(selectedMinutes * 60);
        setPhase('running');
        startTimer();
      }
    } catch (err) {
      useToastStore.getState().error('Failed to start focus session');
    }
  }, [selectedMinutes, label, goalId]);

  const startTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePause = () => {
    clearInterval(intervalRef.current);
    setPhase('paused');
  };

  const handleResume = () => {
    setPhase('running');
    startTimer();
  };

  const handleComplete = async (completed) => {
    clearInterval(intervalRef.current);

    if (sessionId) {
      try {
        await fetch(`${API_URL}/api/focus/sessions/${sessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed }),
        });
      } catch (err) {
        // Non-critical
      }
    }

    if (completed) {
      setPhase('done');
      useToastStore.getState().success(`Focus session complete! ${selectedMinutes} minutes of deep work.`);
      fetchStats();
    } else {
      setPhase('setup');
      setSessionId(null);
    }
  };

  const handleCancel = async () => {
    const confirmed = await useToastStore.getState().confirm(
      'End this focus session early?',
      { title: 'End Session', confirmLabel: 'End', cancelLabel: 'Keep Going' }
    );
    if (confirmed) {
      handleComplete(false);
    }
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds.current > 0 ? 1 - (remaining / totalSeconds.current) : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-vintage-text bg-opacity-60 backdrop-blur-sm" />

      <div className="bg-cream bg-opacity-95 rounded-lg shadow-vintage border-3 border-sand-dark w-full max-w-md mx-4 p-6 sm:p-8 relative z-10">
        <button
          onClick={() => {
            if (phase === 'running' || phase === 'paused') {
              handleCancel();
            } else {
              onClose();
            }
          }}
          className="absolute top-4 right-4 text-vintage-text opacity-40 hover:opacity-80 text-xl leading-none"
        >
          &times;
        </button>

        <h2 className="text-3xl font-poster text-vintage-text text-letterpress text-center mb-4">
          Focus Timer
        </h2>

        {/* Stats bar */}
        {stats && (
          <div className="flex justify-center gap-4 text-center mb-6">
            <div>
              <span className="text-lg font-poster text-teal">{stats.totalSessions}</span>
              <p className="text-xs font-ui uppercase text-vintage-text opacity-60">This Week</p>
            </div>
            <div>
              <span className="text-lg font-poster text-teal">{Math.round(stats.totalMinutes / 60)}h</span>
              <p className="text-xs font-ui uppercase text-vintage-text opacity-60">Focus Time</p>
            </div>
            <div>
              <span className="text-lg font-poster text-teal">{stats.streak}</span>
              <p className="text-xs font-ui uppercase text-vintage-text opacity-60">Day Streak</p>
            </div>
          </div>
        )}

        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {PRESETS.map(p => (
                <button
                  key={p.minutes}
                  onClick={() => setSelectedMinutes(p.minutes)}
                  className={`
                    w-16 h-16 rounded-full border-3 flex flex-col items-center justify-center transition-colors
                    ${selectedMinutes === p.minutes
                      ? 'border-teal bg-teal bg-opacity-20 text-teal'
                      : 'border-sand-dark bg-transparent text-vintage-text opacity-60 hover:opacity-100'
                    }
                  `}
                >
                  <span className="text-lg font-poster">{p.minutes}</span>
                  <span className="text-[10px] font-ui uppercase">min</span>
                </button>
              ))}
            </div>

            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What are you working on?"
              className="w-full px-3 py-2 border-2 border-vintage-text rounded font-serif text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />

            {goals.length > 0 && (
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2 border-2 border-vintage-text rounded font-ui text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <option value="">Link to a goal (optional)</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            )}

            <button
              onClick={startSession}
              className="w-full py-3 rounded border-3 border-teal bg-teal text-cream font-ui uppercase text-sm tracking-wide shadow-vintage hover:shadow-vintage-hover hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-vintage-pressed transition-all duration-150"
            >
              Start Focus Session
            </button>
          </div>
        )}

        {/* Running / Paused Phase */}
        {(phase === 'running' || phase === 'paused') && (
          <div className="text-center space-y-4">
            {label && (
              <p className="font-serif text-sm text-vintage-text opacity-70">{label}</p>
            )}
            <div className="relative inline-block">
              <svg width="260" height="260" className="transform -rotate-90">
                <circle
                  cx="130" cy="130" r="120"
                  fill="none" stroke="currentColor"
                  className="text-sand-dark" strokeWidth="6"
                />
                <circle
                  cx="130" cy="130" r="120"
                  fill="none" stroke="currentColor"
                  className="text-teal transition-all duration-1000 ease-linear"
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-poster text-vintage-text tabular-nums">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-xs font-ui uppercase text-vintage-text opacity-50 mt-1">
                  {phase === 'paused' ? 'paused' : 'remaining'}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={phase === 'running' ? handlePause : handleResume}
                className="px-6 py-3 rounded border-3 border-teal bg-teal bg-opacity-10 font-ui uppercase text-sm text-teal tracking-wide hover:bg-opacity-20 transition-colors"
              >
                {phase === 'running' ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 rounded border-3 border-sand-dark font-ui uppercase text-sm text-vintage-text opacity-60 tracking-wide hover:opacity-100 transition-opacity"
              >
                End Early
              </button>
            </div>
          </div>
        )}

        {/* Done Phase */}
        {phase === 'done' && (
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <svg width="260" height="260" className="transform -rotate-90">
                <circle
                  cx="130" cy="130" r="120"
                  fill="none" stroke="currentColor"
                  className="text-jungle" strokeWidth="6"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-poster text-jungle">Done</span>
                <span className="text-sm font-serif text-vintage-text opacity-60 mt-2">
                  {selectedMinutes} minutes of deep work
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => { setPhase('setup'); setSessionId(null); }}
                className="px-6 py-3 rounded border-3 border-teal bg-teal bg-opacity-10 font-ui uppercase text-sm text-teal tracking-wide hover:bg-opacity-20 transition-colors"
              >
                Go Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded border-3 border-sand-dark font-ui uppercase text-sm text-vintage-text opacity-60 tracking-wide hover:opacity-100 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusTimer;
