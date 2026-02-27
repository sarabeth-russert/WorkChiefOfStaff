import React, { useState, useEffect, useRef } from 'react';
import useWellnessStore from '../../stores/wellnessStore';
import Button from '../ui/Button';
import MessageBubble from './MessageBubble';

const WellnessSessionPanel = () => {
  const {
    activeSession,
    sessionPanelOpen,
    sessionMessages,
    sendingMessage,
    sendSessionMessage,
    completeSession,
    closeSessionPanel
  } = useWellnessStore();

  const [messageInput, setMessageInput] = useState('');
  const [planSummary, setPlanSummary] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [notesForTomorrow, setNotesForTomorrow] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionMessages]);

  // Reset form fields when session changes
  useEffect(() => {
    if (activeSession) {
      setPlanSummary('');
      setAccomplishments('');
      setNotesForTomorrow('');
      setMessageInput('');
    }
  }, [activeSession?.id]);

  if (!sessionPanelOpen || !activeSession) {
    return null;
  }

  const isStandup = activeSession.type === 'standup';
  const isRetro = activeSession.type === 'retro';

  const sessionTypeConfig = {
    standup: {
      icon: '🌅',
      label: 'Morning Standup',
      bgColor: 'bg-sunset',
      borderColor: 'border-sunset-dark',
      textColor: 'text-cream'
    },
    retro: {
      icon: '🌙',
      label: 'Evening Retro',
      bgColor: 'bg-teal',
      borderColor: 'border-teal-dark',
      textColor: 'text-cream'
    }
  };

  const config = sessionTypeConfig[activeSession.type] || sessionTypeConfig.standup;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || sendingMessage) return;

    const message = messageInput.trim();
    setMessageInput('');

    try {
      await sendSessionMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessageInput(message);
    }
  };

  const handleCompleteSession = async () => {
    const summary = {};

    if (isStandup) {
      if (!planSummary.trim()) {
        alert('Please provide a plan summary before completing the standup.');
        return;
      }
      summary.plan = planSummary.trim();
    }

    if (isRetro) {
      if (!accomplishments.trim() && !notesForTomorrow.trim()) {
        alert('Please provide accomplishments or notes before completing the retro.');
        return;
      }
      summary.accomplishments = accomplishments
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      summary.notesForTomorrow = notesForTomorrow.trim();
    }

    try {
      await completeSession(summary);
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('Failed to complete session. Please try again.');
    }
  };

  const handleClose = () => {
    if (confirm('Are you sure you want to close this session? You can reopen it from the notification.')) {
      closeSessionPanel();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-vintage-text bg-opacity-50 z-40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Side Panel */}
      <div
        className="fixed top-0 right-0 h-full w-[500px] bg-cream border-l-4 border-vintage-text shadow-vintage z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-panel-title"
      >
        {/* Header */}
        <div className={`${config.bgColor} ${config.textColor} border-b-3 ${config.borderColor} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label={config.label}>
              {config.icon}
            </span>
            <h2 id="session-panel-title" className="font-poster text-2xl">
              {config.label}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-20 transition-colors"
            aria-label="Close panel"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-sand-light"
        >
          {/* Display morning plan for retro sessions */}
          {isRetro && activeSession.morningPlan && (
            <div className="mb-4 p-4 bg-sunset bg-opacity-10 border-2 border-sunset rounded-lg">
              <h3 className="font-poster text-sm text-sunset uppercase mb-2">
                🌅 Morning Plan
              </h3>
              <p className="text-sm text-vintage-text font-serif">
                {activeSession.morningPlan}
              </p>
            </div>
          )}

          {/* Display Jira stats for retro sessions */}
          {isRetro && activeSession.jiraStats && (
            <div className="mb-4 p-4 bg-jungle bg-opacity-10 border-2 border-jungle rounded-lg">
              <h3 className="font-poster text-sm text-jungle uppercase mb-2">
                🎫 Jira Progress Today
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm text-vintage-text font-ui">
                <div className="flex flex-col">
                  <span className="text-xs opacity-70 uppercase">Created</span>
                  <span className="font-poster text-lg">{activeSession.jiraStats.issuesCreated} issues</span>
                  <span className="text-xs opacity-70">{activeSession.jiraStats.storyPointsAdded} story points</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs opacity-70 uppercase">Closed</span>
                  <span className="font-poster text-lg text-jungle">{activeSession.jiraStats.issuesClosed} issues</span>
                  <span className="text-xs opacity-70 text-jungle">{activeSession.jiraStats.storyPointsClosed} story points</span>
                </div>
              </div>
            </div>
          )}

          {sessionMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-vintage-text opacity-60 font-serif text-center">
                No messages yet. Start the conversation below.
              </p>
            </div>
          ) : (
            <>
              {sessionMessages.map((message, idx) => (
                <MessageBubble
                  key={idx}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t-3 border-vintage-text p-4 bg-cream">
          <div className="flex gap-2">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border-2 border-vintage-text rounded font-serif text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta"
              rows={2}
              disabled={sendingMessage}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!messageInput.trim() || sendingMessage}
              className="self-end"
            >
              {sendingMessage ? '...' : 'Send'}
            </Button>
          </div>
          <p className="text-xs text-vintage-text opacity-60 mt-1 font-ui">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>

        {/* Complete Session Section */}
        <div className="border-t-3 border-vintage-text p-4 bg-sand space-y-3">
          <h3 className="font-poster text-lg text-vintage-text uppercase">
            Complete Session
          </h3>

          {isStandup && (
            <div>
              <label className="block text-sm font-poster text-vintage-text mb-1 uppercase">
                Plan Summary
              </label>
              <textarea
                value={planSummary}
                onChange={(e) => setPlanSummary(e.target.value)}
                placeholder="Summarize your plan for today..."
                className="w-full px-3 py-2 border-2 border-vintage-text rounded font-serif text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sunset"
                rows={3}
              />
            </div>
          )}

          {isRetro && (
            <>
              <div>
                <label className="block text-sm font-poster text-vintage-text mb-1 uppercase">
                  Accomplishments
                </label>
                <textarea
                  value={accomplishments}
                  onChange={(e) => setAccomplishments(e.target.value)}
                  placeholder="What did you accomplish today? (one per line)"
                  className="w-full px-3 py-2 border-2 border-vintage-text rounded font-serif text-sm resize-none focus:outline-none focus:ring-2 focus:ring-jungle"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-poster text-vintage-text mb-1 uppercase">
                  Notes for Tomorrow
                </label>
                <textarea
                  value={notesForTomorrow}
                  onChange={(e) => setNotesForTomorrow(e.target.value)}
                  placeholder="What should you remember for tomorrow?"
                  className="w-full px-3 py-2 border-2 border-vintage-text rounded font-serif text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mustard"
                  rows={2}
                />
              </div>
            </>
          )}

          <Button
            variant="secondary"
            onClick={handleCompleteSession}
            className="w-full"
          >
            Complete & Save
          </Button>
        </div>
      </div>
    </>
  );
};

export default WellnessSessionPanel;
