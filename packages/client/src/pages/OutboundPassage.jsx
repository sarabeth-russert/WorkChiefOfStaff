import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import Button from '../components/ui/Button';

const OutboundPassage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    checkOutlookStatus();
  }, []);

  useEffect(() => {
    if (isConfigured) {
      fetchWeekEvents();
    }
  }, [isConfigured, selectedDate]);

  const checkOutlookStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/outlook/status`);
      const data = await response.json();
      setIsConfigured(data.configured && data.hasToken);

      if (!data.configured || !data.hasToken) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error checking Outlook status:', err);
      setIsLoading(false);
    }
  };

  const fetchWeekEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/outlook/events/week`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const connectOutlook = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/outlook/auth-url`);
      const data = await response.json();

      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error('Error connecting Outlook:', err);
      setError('Failed to connect to Outlook');
    }
  };

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const eventDate = new Date(event.start).toISOString().split('T')[0];
    if (!acc[eventDate]) {
      acc[eventDate] = [];
    }
    acc[eventDate].push(event);
    return acc;
  }, {});

  // Get week days
  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const todayStr = new Date().toISOString().split('T')[0];

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isToday = (date) => {
    return date.toISOString().split('T')[0] === todayStr;
  };

  const getEventStatusColor = (event) => {
    if (event.isCancelled) return 'bg-gray-300 text-gray-600';
    if (event.showAs === 'busy') return 'bg-terracotta text-cream';
    if (event.showAs === 'tentative') return 'bg-sunset text-cream';
    if (event.showAs === 'oof') return 'bg-jungle text-cream'; // out of office
    return 'bg-ocean text-cream';
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage">
        <img
          src="/images/pages/outbound-passage-header.png"
          alt="Outbound Passage"
          className="w-full h-48 md:h-64 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress drop-shadow-lg mb-2">
            Outbound Passage
          </h1>
          <p className="text-lg text-vintage-text opacity-90 drop-shadow">
            Chart your course through the week ahead
          </p>
        </div>
      </div>

      {/* Not Connected State */}
      {!isConfigured && !isLoading && (
        <Card className="border-terracotta-dark">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="text-xl font-poster text-terracotta-dark mb-2">
                Connect Your Outlook Calendar
              </h3>
              <p className="text-vintage-text mb-4">
                Connect your Microsoft Outlook calendar to see your schedule and plan your journey through the week.
              </p>
              <Button variant="primary" onClick={connectOutlook}>
                Connect Outlook Calendar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-terracotta-dark">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-xl font-poster text-terracotta-dark mb-2">
                Unable to Load Calendar
              </h3>
              <p className="text-vintage-text mb-4">{error}</p>
              <div className="flex gap-3">
                <Button variant="primary" size="sm" onClick={fetchWeekEvents}>
                  Retry
                </Button>
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    Check Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && isConfigured && (
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔄</div>
            <p className="text-vintage-text font-ui uppercase">Loading your calendar...</p>
          </div>
        </Card>
      )}

      {/* Week View */}
      {!isLoading && isConfigured && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-poster text-vintage-text">This Week's Journey</h2>
            <Button variant="secondary" size="sm" onClick={fetchWeekEvents}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayStr = day.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dayStr] || [];
              const isTodayCard = isToday(day);

              return (
                <Card
                  key={dayStr}
                  variant={isTodayCard ? 'canvas' : 'default'}
                  className={`${
                    isTodayCard
                      ? 'border-4 border-jungle shadow-vintage-strong'
                      : 'border-2 border-vintage-text'
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="font-poster text-lg text-vintage-text">
                      {formatDayName(day)}
                    </div>
                    <div className={`font-serif text-sm ${
                      isTodayCard ? 'text-jungle font-bold' : 'text-vintage-text opacity-70'
                    }`}>
                      {formatDate(day)}
                    </div>
                    {isTodayCard && (
                      <div className="text-xs font-ui uppercase text-jungle mt-1">
                        Today
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-4 text-vintage-text opacity-50 text-sm">
                        No events
                      </div>
                    ) : (
                      dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-2 rounded text-xs ${getEventStatusColor(event)}`}
                        >
                          <div className="font-ui font-bold">
                            {formatTime(event.start)}
                          </div>
                          <div className="font-serif line-clamp-2 mt-1">
                            {event.subject}
                          </div>
                          {event.location && (
                            <div className="font-ui text-xs opacity-80 mt-1">
                              📍 {event.location}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {isTodayCard && dayEvents.length > 0 && (
                    <div className="mt-3 pt-3 border-t-2 border-jungle text-center">
                      <div className="text-xs font-ui uppercase text-jungle">
                        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} today
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Today's Detailed View */}
          {eventsByDate[todayStr] && eventsByDate[todayStr].length > 0 && (
            <div className="mt-8">
              <h2 className="text-3xl font-poster text-vintage-text mb-4">
                Today's Detailed Itinerary
              </h2>
              <Card variant="canvas">
                <div className="space-y-4">
                  {eventsByDate[todayStr].map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border-2 ${
                        event.isCancelled ? 'border-gray-300 opacity-60' : 'border-vintage-text'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-poster text-xl text-vintage-text mb-1">
                            {event.subject}
                            {event.isCancelled && (
                              <span className="ml-2 text-sm text-gray-500">(Cancelled)</span>
                            )}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-vintage-text opacity-80 mb-2">
                            <span>🕐 {formatTime(event.start)} - {formatTime(event.end)}</span>
                            {event.location && <span>📍 {event.location}</span>}
                            {event.isAllDay && <span>📅 All Day</span>}
                          </div>
                          {event.organizer && (
                            <div className="text-sm text-vintage-text opacity-70">
                              Organized by {event.organizer}
                            </div>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="text-sm text-vintage-text opacity-70 mt-1">
                              {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                            </div>
                          )}
                          {event.bodyPreview && (
                            <p className="text-sm text-vintage-text opacity-80 mt-2 line-clamp-2">
                              {event.bodyPreview}
                            </p>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-ui uppercase ${getEventStatusColor(event)}`}>
                          {event.showAs}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Info Card */}
      <Card variant="canvas">
        <h3 className="text-xl font-poster text-vintage-text mb-4">About Outbound Passage</h3>
        <div className="space-y-3 text-vintage-text">
          <p>
            The Outbound Passage shows your weekly calendar at a glance, helping you navigate your scheduled commitments and plan your expedition through the workweek.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Week view shows all your calendar events across 7 days</li>
            <li>Today's events are highlighted for quick reference</li>
            <li>Detailed view shows meeting descriptions and attendees</li>
            <li>Event colors indicate availability status (busy, tentative, free)</li>
          </ul>
          <p className="text-sm opacity-80 pt-2 border-t-2 border-vintage-text">
            Your calendar data is fetched securely from Microsoft Outlook and cached locally for fast access.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default OutboundPassage;
