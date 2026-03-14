import React, { useState, useEffect } from 'react';
import { Card, CheckIcon } from '../components/ui';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import HabitTracker from '../components/habits/HabitTracker';
import QuickReminder from '../components/reminders/QuickReminder';

const Dashboard = () => {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventInput, setEventInput] = useState('');
  const [savingEvents, setSavingEvents] = useState(false);
  const [showEventInput, setShowEventInput] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showQuickReminder, setShowQuickReminder] = useState(false);
  const [quickNote, setQuickNote] = useState({ title: '', content: '' });
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/briefing`);
      if (!response.ok) throw new Error('Failed to load briefing');
      const data = await response.json();
      setBriefing(data.briefing);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveManualEvents = async () => {
    if (!eventInput.trim()) return;
    try {
      setSavingEvents(true);
      const response = await fetch(`${apiUrl}/api/calendar/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: eventInput }),
      });
      if (!response.ok) throw new Error('Failed to save events');
      setEventInput('');
      setShowEventInput(false);
      await fetchBriefing();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEvents(false);
    }
  };

  const clearManualEvents = async () => {
    try {
      await fetch(`${apiUrl}/api/calendar/manual`, { method: 'DELETE' });
      setShowEventInput(false);
      await fetchBriefing();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveQuickNote = async () => {
    if (!quickNote.title.trim() || !quickNote.content.trim()) return;
    try {
      setSavingNote(true);
      const response = await fetch(`${apiUrl}/api/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickNote.title,
          content: quickNote.content,
          type: 'note',
          category: 'general',
          tags: [],
          autoClassify: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to save note');
      setQuickNote({ title: '', content: '' });
      setNoteSaved(true);
      setTimeout(() => {
        setNoteSaved(false);
        setShowQuickCapture(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, Adventurer';
    if (hour < 17) return 'Good Afternoon, Adventurer';
    return 'Good Evening, Adventurer';
  };

  const getReadinessAdvice = (score) => {
    if (!score) return null;
    if (score >= 85) return { text: 'You\'re in peak form — tackle your hardest challenge today.', tone: 'excellent' };
    if (score >= 70) return { text: 'Solid readiness. A good day for focused, steady progress.', tone: 'good' };
    if (score >= 55) return { text: 'Take it easy where you can. Prioritize and protect your energy.', tone: 'fair' };
    return { text: 'Rest is part of the adventure. Go light today and recover well tonight.', tone: 'low' };
  };

  const getToneColor = (tone) => {
    switch (tone) {
      case 'excellent': return 'text-jungle';
      case 'good': return 'text-teal';
      case 'fair': return 'text-mustard-dark';
      case 'low': return 'text-terracotta';
      default: return 'text-vintage-text';
    }
  };

  const getToneBg = (tone) => {
    switch (tone) {
      case 'excellent': return 'bg-jungle bg-opacity-10 border-jungle';
      case 'good': return 'bg-teal bg-opacity-10 border-teal';
      case 'fair': return 'bg-mustard bg-opacity-10 border-mustard';
      case 'low': return 'bg-terracotta bg-opacity-10 border-terracotta';
      default: return 'bg-sand border-vintage-text';
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatSleepDuration = (seconds) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getEventStatusStyle = (showAs) => {
    switch (showAs) {
      case 'busy': return 'border-l-terracotta bg-terracotta bg-opacity-5';
      case 'tentative': return 'border-l-sunset bg-sunset bg-opacity-5';
      case 'oof': return 'border-l-jungle bg-jungle bg-opacity-5';
      default: return 'border-l-teal bg-teal bg-opacity-5';
    }
  };

  // Habits state (initialized from briefing, updated optimistically)
  const [habitList, setHabitList] = useState([]);
  const [habitCompleted, setHabitCompleted] = useState({});

  useEffect(() => {
    if (briefing?.habits) {
      setHabitList(briefing.habits.habits);
      setHabitCompleted(briefing.habits.completed);
    }
  }, [briefing]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4 animate-pulse">&#x1F3D5;</div>
          <h1 className="text-5xl font-poster text-vintage-text text-letterpress mb-2">
            Preparing Your Briefing...
          </h1>
          <p className="text-lg text-vintage-text opacity-60 font-serif">
            Gathering intel from all outposts
          </p>
        </div>
      </div>
    );
  }

  const wellness = briefing?.wellness;
  const advice = getReadinessAdvice(wellness?.readiness);
  const events = briefing?.events || [];
  const upcomingEvents = events.filter(e => !e.isPast && !e.isAllDay);
  const allDayEvents = events.filter(e => e.isAllDay);
  const jira = briefing?.jira;
  const lastRetro = briefing?.lastRetro;
  const todayPlan = briefing?.todayPlan;

  const handleToggleHabit = async (habitId) => {
    setHabitCompleted(prev => ({ ...prev, [habitId]: !prev[habitId] }));
    try {
      await fetch(`${apiUrl}/api/habits/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId }),
      });
    } catch (err) {
      setHabitCompleted(prev => ({ ...prev, [habitId]: !prev[habitId] }));
    }
  };

  const handleAddHabit = async (name) => {
    try {
      const res = await fetch(`${apiUrl}/api/habits/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to add habit');
      const { habit } = await res.json();
      setHabitList(prev => [...prev, habit]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveHabit = async (habitId) => {
    const prev = habitList;
    setHabitList(list => list.filter(h => h.id !== habitId));
    try {
      await fetch(`${apiUrl}/api/habits/config/${habitId}`, { method: 'DELETE' });
    } catch (err) {
      setHabitList(prev);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Greeting */}
      <div className="text-center py-10">
        <h1 className="text-6xl md:text-7xl font-poster text-vintage-text text-letterpress mb-3">
          {getGreeting()}
        </h1>
        <p className="text-xl text-vintage-text opacity-70 font-serif max-w-2xl mx-auto">
          {briefing?.weather || 'Your daily expedition briefing is ready.'}
        </p>
      </div>

      {/* Main Briefing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Row 1, Col 1: Wellness + Habits */}
        <Card variant="canvas" className={wellness && advice ? getToneBg(advice.tone) : ''}>
          {wellness && advice && (
            <div>
              <div className="text-center mb-4">
                <div className="flex justify-center mb-2">
                  <DashIcon src="/images/dashboard/wellness.png" alt="Wellness" fallback="&#x1F49A;" size="w-36 h-36" />
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-poster text-vintage-text text-letterpress">
                    Wellness
                  </h2>
                  <Link to="/medic">
                    <span className="text-sm font-ui uppercase text-terracotta hover:text-terracotta-dark">
                      Full Vitals
                    </span>
                  </Link>
                </div>
              </div>

              {/* Scores Row */}
              <div className="flex items-center justify-around mb-4">
                {wellness.readiness && (
                  <div className="text-center">
                    <div className={`text-4xl font-poster ${getToneColor(advice.tone)}`}>
                      {wellness.readiness}
                    </div>
                    <div className="text-xs font-ui uppercase text-vintage-text opacity-60 mt-1">
                      Readiness
                    </div>
                  </div>
                )}
                {wellness.sleep && (
                  <div className="text-center">
                    <div className="text-2xl font-poster text-vintage-text opacity-80">
                      {wellness.sleep}
                    </div>
                    <div className="text-xs font-ui uppercase text-vintage-text opacity-60 mt-1">
                      Sleep
                      {wellness.sleepDuration && (
                        <span className="block text-vintage-text opacity-50">
                          {formatSleepDuration(wellness.sleepDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {wellness.activity && (
                  <div className="text-center">
                    <div className="text-2xl font-poster text-vintage-text opacity-80">
                      {wellness.activity}
                    </div>
                    <div className="text-xs font-ui uppercase text-vintage-text opacity-60 mt-1">
                      Activity
                    </div>
                  </div>
                )}
              </div>

              {/* Advice */}
              <p className={`text-sm font-serif ${getToneColor(advice.tone)}`}>
                {advice.text}
              </p>
              {wellness.date === 'yesterday' && (
                <p className="text-xs text-vintage-text opacity-50 mt-2 font-ui uppercase">
                  Based on yesterday's data
                </p>
              )}

              {/* Divider before habits */}
              <div className="h-px w-full bg-vintage-text opacity-20 my-4" />
            </div>
          )}

          {/* Daily Habits */}
          <HabitTracker
            habits={habitList}
            completed={habitCompleted}
            onToggle={handleToggleHabit}
            onAdd={handleAddHabit}
            onRemove={handleRemoveHabit}
          />
        </Card>

        {/* Row 1, Col 2: Trail Notes (or On Deck / No Data fallback) */}
        <div className="space-y-6">
          {(lastRetro?.notesForTomorrow || todayPlan) && (
            <Card variant="canvas" className="border-mustard">
              <div className="text-center mb-4">
                <div className="flex justify-center mb-2">
                  <DashIcon src="/images/dashboard/trail-notes.png" alt="Trail Notes" fallback="&#x1F4D3;" size="w-36 h-36" />
                </div>
                <h2 className="text-2xl font-poster text-vintage-text text-letterpress">
                  Trail Notes
                </h2>
              </div>

              {todayPlan ? (
                <div>
                  <h3 className="text-xs font-ui uppercase text-jungle mb-2 tracking-wide">
                    Today's Plan
                  </h3>
                  <p className="font-serif text-vintage-text text-sm leading-relaxed">
                    {todayPlan}
                  </p>
                </div>
              ) : lastRetro?.notesForTomorrow && (
                <div>
                  <h3 className="text-xs font-ui uppercase text-mustard-dark mb-2 tracking-wide">
                    From Last Evening's Retro
                  </h3>
                  <p className="font-serif text-vintage-text text-sm leading-relaxed">
                    {lastRetro.notesForTomorrow}
                  </p>
                </div>
              )}

              {lastRetro?.accomplishments?.length > 0 && (
                <div className="mt-4 pt-3 border-t-2 border-sand-dark">
                  <h3 className="text-xs font-ui uppercase text-vintage-text opacity-50 mb-2 tracking-wide">
                    Recent Wins
                  </h3>
                  <ul className="space-y-1">
                    {lastRetro.accomplishments.slice(0, 4).map((item, i) => (
                      <li key={i} className="font-serif text-vintage-text text-sm opacity-70 flex items-start gap-2">
                        <span className="text-jungle mt-0.5 flex-shrink-0">&#x2713;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* On Deck Today (Recurring Agenda) */}
          {briefing?.agendaItems?.length > 0 && (
            <Card variant="canvas" className="border-jungle">
              <div className="text-center mb-4">
                <div className="flex justify-center mb-2">
                  <DashIcon src="/images/dashboard/agenda.png" alt="Agenda" fallback="&#x1F4CB;" size="w-36 h-36" />
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-poster text-vintage-text text-letterpress">
                    On Deck Today
                  </h2>
                  <Link to="/outbound-passage">
                    <span className="text-sm font-ui uppercase text-terracotta hover:text-terracotta-dark">
                      Manage
                    </span>
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
                {briefing.agendaItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-lg border-l-3 border-l-jungle bg-jungle bg-opacity-5"
                  >
                    <div className="min-w-0">
                      <div className="font-serif text-sm text-vintage-text font-bold">
                        {item.name}
                      </div>
                      {item.notes && (
                        <div className="text-xs font-serif text-vintage-text opacity-60 mt-0.5">
                          {item.notes}
                        </div>
                      )}
                      <div className="text-xs font-ui text-vintage-text opacity-40 mt-0.5 capitalize">
                        {item.recurrence}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* No Data Fallback */}
          {!wellness && !lastRetro && !todayPlan && (
            <Card variant="canvas" className="border-terracotta-light">
              <div className="text-center py-4">
                <div className="text-3xl mb-2">&#x1F9ED;</div>
                <p className="font-serif text-sm text-vintage-text opacity-70 mb-3">
                  Your briefing gets richer as you use the system — connect Oura Ring, Outlook, and Jira in Settings to fill in the map.
                </p>
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    Configure Integrations
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Row 1-3, Col 3: Base Camp (spans all rows) */}
        <div className="lg:row-span-3 space-y-6">
          <Card variant="canvas">
            <div className="text-center mb-4">
              <div className="flex justify-center mb-2">
                <DashIcon src="/images/dashboard/base-camp.png" alt="Base Camp" fallback="&#x26FA;" size="w-36 h-36" />
              </div>
              <h2 className="text-2xl font-poster text-vintage-text text-letterpress">
                Base Camp
              </h2>
            </div>
            <div className="space-y-3">
              {!briefing?.standupDone && (
                <Link to="/base-camp" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-sunset bg-opacity-10 border-2 border-sunset-light hover:border-sunset transition-[border-color] cursor-pointer">
                    <DashIcon src="/images/dashboard/morning-standup.png" alt="Standup" fallback="&#x1F305;" size="w-20 h-20" />
                    <div>
                      <div className="font-ui uppercase text-sm text-sunset-dark font-bold">
                        Morning Standup
                      </div>
                      <div className="text-xs text-vintage-text opacity-60 font-serif">
                        Plan today's expedition
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {briefing?.standupDone && !briefing?.retroDone && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-jungle bg-opacity-10 border-2 border-jungle-light">
                  <CheckIcon size="w-10 h-10" className="text-jungle" />
                  <div>
                    <div className="font-ui uppercase text-sm text-jungle font-bold">
                      Standup Complete
                    </div>
                    <div className="text-xs text-vintage-text opacity-60 font-serif">
                      Your day is charted
                    </div>
                  </div>
                </div>
              )}
              <Link to="/expedition" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-sand-dark hover:border-vintage-text transition-[border-color] cursor-pointer">
                  <DashIcon src="/images/dashboard/expedition.png" alt="Expedition" fallback="&#x1F5FA;" size="w-20 h-20" />
                  <div>
                    <div className="font-ui uppercase text-sm text-vintage-text font-bold">
                      Expedition
                    </div>
                    <div className="text-xs text-vintage-text opacity-60 font-serif">
                      Talk to your AI agents
                    </div>
                  </div>
                </div>
              </Link>
              <Link to="/medic" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-sand-dark hover:border-vintage-text transition-[border-color] cursor-pointer">
                  <DashIcon src="/images/dashboard/medic.png" alt="Medic" fallback="&#x1F3E5;" size="w-20 h-20" />
                  <div>
                    <div className="font-ui uppercase text-sm text-vintage-text font-bold">
                      Medic Station
                    </div>
                    <div className="text-xs text-vintage-text opacity-60 font-serif">
                      Detailed wellness vitals
                    </div>
                  </div>
                </div>
              </Link>
              <div>
                <div
                  onClick={() => setShowQuickCapture(!showQuickCapture)}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-sand-dark hover:border-vintage-text transition-[border-color] cursor-pointer"
                >
                  <DashIcon src="/images/dashboard/map-room.png" alt="Map Room" fallback="&#x1F4CD;" size="w-20 h-20" />
                  <div className="flex-1">
                    <div className="font-ui uppercase text-sm text-vintage-text font-bold">
                      Map Room
                    </div>
                    <div className="text-xs text-vintage-text opacity-60 font-serif">
                      Jot a note to your second brain
                    </div>
                  </div>
                  <Link
                    to="/map-room"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-ui text-terracotta hover:text-terracotta-dark uppercase flex-shrink-0"
                  >
                    Open
                  </Link>
                </div>
                {showQuickCapture && (
                  <div className="mt-2 p-3 rounded-lg border-2 border-teal bg-teal bg-opacity-5 space-y-2">
                    {noteSaved ? (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <CheckIcon size="w-6 h-6" className="text-jungle" />
                        <span className="font-ui text-sm text-jungle uppercase">Saved to Map Room</span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={quickNote.title}
                          onChange={(e) => setQuickNote({ ...quickNote, title: e.target.value })}
                          placeholder="Title"
                          className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none"
                        />
                        <textarea
                          value={quickNote.content}
                          onChange={(e) => setQuickNote({ ...quickNote, content: e.target.value })}
                          placeholder="What's on your mind?"
                          rows={3}
                          className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveQuickNote}
                            disabled={savingNote || !quickNote.title.trim() || !quickNote.content.trim()}
                            className="px-3 py-1.5 rounded bg-teal text-cream font-ui text-xs uppercase tracking-wide hover:bg-teal-dark disabled:opacity-40 transition-colors"
                          >
                            {savingNote ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setShowQuickCapture(false); setQuickNote({ title: '', content: '' }); }}
                            className="px-3 py-1.5 rounded border border-sand-dark text-vintage-text font-ui text-xs uppercase tracking-wide hover:border-vintage-text transition-[border-color]"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-xs text-vintage-text opacity-40 font-ui">
                          AI auto-classifies tags and category
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div
                  onClick={() => setShowQuickReminder(!showQuickReminder)}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-sand-dark hover:border-vintage-text transition-[border-color] cursor-pointer"
                >
                  <DashIcon src="/images/dashboard/reminder.png" alt="Reminder" fallback="&#x23F0;" size="w-20 h-20" />
                  <div className="flex-1">
                    <div className="font-ui uppercase text-sm text-vintage-text font-bold">
                      Set Reminder
                    </div>
                    <div className="text-xs text-vintage-text opacity-60 font-serif">
                      One-time, daily, or weekday alerts
                    </div>
                  </div>
                  <Link
                    to="/outbound-passage"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-ui text-terracotta hover:text-terracotta-dark uppercase flex-shrink-0"
                  >
                    Manage
                  </Link>
                </div>
                {showQuickReminder && (
                  <div className="mt-2 p-3 rounded-lg border-2 border-teal bg-teal bg-opacity-5">
                    <QuickReminder apiUrl={apiUrl} onScheduled={() => setShowQuickReminder(false)} />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Row 2, Col 1-2: Today's Route (Calendar) */}
        <div className="lg:col-span-2">
          <Card variant="canvas">
            {/* Banner Header */}
            <div className="-mx-6 -mt-6 mb-5 rounded-t-[calc(0.5rem-1px)] overflow-hidden relative">
              <img
                src="/images/dashboard/calendar-banner.png"
                alt="Today's Route"
                className="w-full h-24 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-cream via-transparent to-cream opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-0 left-0 right-0 px-6 py-3 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-poster text-vintage-text text-letterpress drop-shadow-sm">
                    Today's Route
                  </h2>
                </div>
                <Link to="/outbound-passage">
                  <span className="text-sm font-ui uppercase text-terracotta hover:text-terracotta-dark drop-shadow-sm">
                    Full Calendar
                  </span>
                </Link>
              </div>
            </div>

            {briefing?.eventsSource === 'manual' && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-ui uppercase text-mustard-dark bg-mustard bg-opacity-10 px-2 py-0.5 rounded">
                  Manually entered
                </span>
                <button
                  onClick={() => setShowEventInput(true)}
                  className="text-xs font-ui text-terracotta hover:text-terracotta-dark uppercase"
                >
                  Edit
                </button>
                <button
                  onClick={clearManualEvents}
                  className="text-xs font-ui text-vintage-text opacity-40 hover:opacity-70 uppercase"
                >
                  Clear
                </button>
              </div>
            )}

            {allDayEvents.length > 0 && (
              <div className="mb-4">
                {allDayEvents.map((event, i) => (
                  <div key={i} className="inline-block mr-2 mb-2 px-3 py-1 rounded-full bg-jungle bg-opacity-10 border border-jungle text-sm font-ui text-jungle">
                    {event.subject}
                  </div>
                ))}
              </div>
            )}

            {showEventInput ? (
              <div className="space-y-3">
                <p className="text-sm font-serif text-vintage-text opacity-70">
                  Paste your schedule below — one event per line. Times are optional.
                </p>
                <div className="text-xs font-ui text-vintage-text opacity-50 space-y-0.5">
                  <p>Formats: <span className="font-mono">9:00 AM - 10:00 AM - Team Standup</span></p>
                  <p>or: <span className="font-mono">2:30 PM - Design Review</span></p>
                  <p>or just: <span className="font-mono">Sprint Planning</span> (all-day)</p>
                </div>
                <textarea
                  value={eventInput}
                  onChange={(e) => setEventInput(e.target.value)}
                  placeholder={"9:00 AM - 9:30 AM - Morning Standup\n10:00 AM - 11:00 AM - Sprint Planning\n1:00 PM - Design Review\nCompany All-Hands"}
                  className="w-full h-40 p-3 rounded-lg border-2 border-sand-dark bg-cream bg-opacity-50 font-mono text-sm text-vintage-text placeholder:text-vintage-text placeholder:opacity-30 focus:border-teal focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveManualEvents}
                    disabled={savingEvents || !eventInput.trim()}
                    className="px-4 py-2 rounded-lg bg-teal text-cream font-ui text-sm uppercase tracking-wide hover:bg-teal-dark disabled:opacity-40 transition-colors"
                  >
                    {savingEvents ? 'Saving...' : 'Save Schedule'}
                  </button>
                  <button
                    onClick={() => { setShowEventInput(false); setEventInput(''); }}
                    className="px-4 py-2 rounded-lg border-2 border-sand-dark text-vintage-text font-ui text-sm uppercase tracking-wide hover:border-vintage-text transition-[border-color]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 6).map((event, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 p-3 rounded-lg border-l-4 ${getEventStatusStyle(event.showAs)}`}
                  >
                    <div className="flex-shrink-0 w-20 text-right">
                      <div className="font-ui text-sm font-bold text-vintage-text">
                        {formatTime(event.start)}
                      </div>
                      <div className="font-ui text-xs text-vintage-text opacity-50">
                        {formatTime(event.end)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-vintage-text font-bold truncate">
                        {event.subject}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-vintage-text opacity-60 font-ui mt-1">
                        {event.location && (
                          <span className="truncate max-w-[200px]">{event.location}</span>
                        )}
                        {event.organizer && (
                          <span>{event.organizer}</span>
                        )}
                        {event.attendeeCount > 0 && (
                          <span>{event.attendeeCount} attendee{event.attendeeCount !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length > 6 && (
                  <p className="text-sm text-vintage-text opacity-50 font-ui text-center pt-2">
                    + {upcomingEvents.length - 6} more event{upcomingEvents.length - 6 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ) : events.length > 0 ? (
              <div className="text-center py-6">
                <CheckIcon size="w-10 h-10" className="mx-auto mb-2 text-jungle" />
                <p className="text-vintage-text font-serif opacity-70">All done for today!</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">&#x1F3DC;</div>
                <p className="text-vintage-text font-serif opacity-70 mb-3">
                  No calendar connected yet.
                </p>
                <button
                  onClick={() => setShowEventInput(true)}
                  className="px-4 py-2 rounded-lg bg-teal bg-opacity-10 border-2 border-teal text-teal font-ui text-sm uppercase tracking-wide hover:bg-teal hover:text-cream transition-colors"
                >
                  Paste Today's Schedule
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Row 3, Col 1-2: Field Assignments (Jira) */}
        {jira && (jira.inProgress.length > 0 || jira.inReview.length > 0 || jira.todo.length > 0) && (
          <div className="lg:col-span-2">
            <Card variant="canvas">
              {/* Banner Header */}
              <div className="-mx-6 -mt-6 mb-5 rounded-t-[calc(0.5rem-1px)] overflow-hidden relative">
                <img
                  src="/images/dashboard/assignments-banner.png"
                  alt="Field Assignments"
                  className="w-full h-24 object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-cream via-transparent to-cream opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-0 left-0 right-0 px-6 py-3 flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-poster text-vintage-text text-letterpress drop-shadow-sm">
                      Field Assignments
                    </h2>
                  </div>
                  <Link to="/jira">
                    <span className="text-sm font-ui uppercase text-terracotta hover:text-terracotta-dark drop-shadow-sm">
                      Full Board
                    </span>
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {/* In Progress */}
                {jira.inProgress.length > 0 && (
                  <div>
                    <h3 className="text-sm font-ui uppercase text-jungle mb-2 tracking-wide">
                      In Progress ({jira.inProgress.length})
                    </h3>
                    <div className="space-y-2">
                      {jira.inProgress.slice(0, 4).map((issue) => (
                        <JiraItem key={issue.key} issue={issue} accent="jungle" />
                      ))}
                    </div>
                  </div>
                )}

                {/* In Review */}
                {jira.inReview.length > 0 && (
                  <div>
                    <h3 className="text-sm font-ui uppercase text-teal mb-2 tracking-wide">
                      In Review ({jira.inReview.length})
                    </h3>
                    <div className="space-y-2">
                      {jira.inReview.slice(0, 3).map((issue) => (
                        <JiraItem key={issue.key} issue={issue} accent="teal" />
                      ))}
                    </div>
                  </div>
                )}

                {/* To Do (compact) */}
                {jira.todo.length > 0 && (
                  <div>
                    <h3 className="text-sm font-ui uppercase text-mustard-dark mb-2 tracking-wide">
                      Up Next ({jira.todo.length})
                    </h3>
                    <div className="space-y-2">
                      {jira.todo.slice(0, 3).map((issue) => (
                        <JiraItem key={issue.key} issue={issue} accent="mustard" />
                      ))}
                      {jira.todo.length > 3 && (
                        <p className="text-xs text-vintage-text opacity-50 font-ui pl-4">
                          + {jira.todo.length - 3} more in the backlog
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const DashIcon = ({ src, alt, fallback, size = 'w-20 h-20' }) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${size} flex-shrink-0 relative`}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <span className="w-full h-full flex items-center justify-center text-2xl" role="img" aria-label={alt}>
          {fallback}
        </span>
      )}
    </div>
  );
};

const jiraAccentStyles = {
  jungle: 'border-l-jungle bg-jungle bg-opacity-5',
  teal: 'border-l-teal bg-teal bg-opacity-5',
  mustard: 'border-l-mustard bg-mustard bg-opacity-5',
};

const jiraKeyStyles = {
  jungle: 'text-jungle',
  teal: 'text-teal',
  mustard: 'text-mustard-dark',
};

const JiraItem = ({ issue, accent }) => (
  <div className={`flex items-center gap-3 p-2 rounded border-l-3 ${jiraAccentStyles[accent] || ''}`}>
    <span className={`text-xs font-mono font-bold flex-shrink-0 ${jiraKeyStyles[accent] || ''}`}>
      {issue.key}
    </span>
    <span className="font-serif text-sm text-vintage-text truncate">
      {issue.summary}
    </span>
  </div>
);

export default Dashboard;
