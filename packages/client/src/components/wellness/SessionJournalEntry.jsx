import React, { useState } from 'react';
import { CheckIcon } from '../ui';
import MessageBubble from './MessageBubble';
import { SESSION_TYPE_CONFIG } from '../../utils/wellness';

// Watch-period labels based on hour
const getWatchLabel = (dateString) => {
  if (!dateString) return '';
  const hour = new Date(dateString).getHours();
  if (hour < 6) return 'Pre-Dawn Watch';
  if (hour < 12) return 'Dawn Watch';
  if (hour < 17) return 'Afternoon Watch';
  if (hour < 21) return 'Evening Watch';
  return 'Night Watch';
};

const formatLogDate = (dateString) => {
  if (!dateString) return { date: '', watch: '' };
  const d = new Date(dateString);
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const watch = getWatchLabel(dateString);
  return { date, watch };
};

const SessionJournalEntry = ({
  session
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const jiraMetrics = session.jiraMetrics || null;

  if (!session) return null;

  const config = SESSION_TYPE_CONFIG[session.type] || SESSION_TYPE_CONFIG.standup;
  const { date: logDate, watch: logWatch } = formatLogDate(session.startedAt);
  // Semantic colors: mustard = planning (standup), teal = reflection (retro)
  const accentColor = session.type === 'standup' ? 'bg-mustard' : 'bg-teal';
  const accentText = session.type === 'standup' ? 'text-mustard' : 'text-teal';
  const accentBorder = session.type === 'standup' ? 'border-mustard/30' : 'border-teal/30';

  const renderSummaryPreview = () => {
    const summary = session.summary || {};
    const items = [];

    if (summary.plan) {
      items.push(
        <div key="plan" className="mb-3">
          <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/40 mb-1">Heading</div>
          <p className="text-sm font-serif text-vintage-text/70 leading-relaxed">{summary.plan}</p>
        </div>
      );
    }

    if (summary.accomplishments) {
      const accomplishmentsList = Array.isArray(summary.accomplishments)
        ? summary.accomplishments
        : summary.accomplishments.split('\n').filter(item => item.trim());

      items.push(
        <div key="accomplishments" className="mb-3">
          <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/40 mb-1">Accomplishments</div>
          {accomplishmentsList.length > 0 ? (
            <ul className="space-y-1 ml-1">
              {accomplishmentsList.map((item, idx) => (
                <li key={idx} className="text-sm font-serif text-vintage-text/70 leading-relaxed flex items-start gap-2">
                  <span className="text-jungle/50 mt-0.5 flex-shrink-0">•</span>
                  {item.trim()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-serif text-vintage-text/70">{summary.accomplishments}</p>
          )}
        </div>
      );
    }

    if (summary.notesForTomorrow) {
      items.push(
        <div key="notes" className="mb-3">
          <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/40 mb-1">Notes for Tomorrow</div>
          <p className="text-sm font-serif text-vintage-text/70 italic leading-relaxed">{summary.notesForTomorrow}</p>
        </div>
      );
    }

    if (session.type === 'retro' && session.jiraStats) {
      items.push(
        <div key="jira" className="mb-3">
          <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/40 mb-1">Mission Progress</div>
          <div className="text-sm font-serif text-vintage-text/70 flex gap-4">
            <span>Created: {session.jiraStats.issuesCreated} issues ({session.jiraStats.storyPointsAdded} pts)</span>
            <span className="text-jungle/70">Closed: {session.jiraStats.issuesClosed} issues ({session.jiraStats.storyPointsClosed} pts)</span>
          </div>
        </div>
      );
    }

    return items.length > 0 ? items : (
      <p className="text-sm font-serif text-vintage-text/40 italic">No field notes recorded</p>
    );
  };

  return (
    <div className="bg-gradient-to-br from-cream via-cream to-sand/20 border-2 border-sand rounded-lg overflow-hidden shadow-sm">
      {/* Accent stripe */}
      <div className={`h-1 ${accentColor} opacity-50`} />

      <div className="p-5">
        {/* Log header — type, date, watch period, status badge */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`font-poster text-xl ${accentText} leading-tight`}>
              {config.label}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-serif text-sm text-vintage-text/50 italic">
                {logDate}, {logWatch}
              </span>
            </div>
            {/* Jira metrics */}
            {jiraMetrics && (
              <div className="mt-2 flex gap-3 text-xs font-ui">
                {session.type === 'standup' && (
                  <div className="flex items-center gap-1 text-jungle/60">
                    <span>🎫</span>
                    <span>
                      {jiraMetrics.inProgressTickets || 0} in progress
                      {jiraMetrics.totalPoints ? ` · ${jiraMetrics.totalPoints} pts` : ''}
                    </span>
                  </div>
                )}
                {session.type === 'retro' && (
                  <>
                    <div className="flex items-center gap-1 text-jungle/60">
                      <CheckIcon size="w-4 h-4" />
                      <span>{jiraMetrics.closedPoints || 0} pts closed</span>
                    </div>
                    <div className="flex items-center gap-1 text-mustard/70">
                      <span>🎫</span>
                      <span>{jiraMetrics.inProgressTickets || 0} active</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Document seal — jungle = filed, accent = in progress */}
          <div className="flex-shrink-0 mt-1">
            <div className={`inline-flex items-center justify-center border-2 ${session.status === 'completed' ? 'border-jungle/25' : accentBorder} rounded-sm px-3 py-1.5 rotate-[-3deg]`}>
              <div className={`border ${session.status === 'completed' ? 'border-jungle/20' : accentBorder} rounded-sm px-2 py-0.5`}>
                <span className={`font-poster text-[11px] uppercase tracking-[0.2em] ${session.status === 'completed' ? 'text-jungle/70' : `${accentText} opacity-70`}`}>
                  {session.status === 'completed' ? 'Filed' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thin rule */}
        <div className="h-px bg-vintage-text/10 mb-4" />

        {/* Summary content */}
        <div>
          {renderSummaryPreview()}
        </div>

        {/* Open Log / Close Log toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-2 text-vintage-text/35 hover:text-vintage-text/55 transition-colors"
          aria-expanded={isExpanded}
        >
          <div className="h-px w-6 bg-current" />
          <span className="font-ui text-[10px] uppercase tracking-widest">
            {isExpanded ? 'Close Log' : 'Open Log'}
          </span>
          <span className={`text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
          <div className="h-px flex-1 bg-current" />
        </button>

        {/* Expanded conversation transcript */}
        {isExpanded && (
          <div className="mt-4">
            <div className="h-px bg-vintage-text/10 mb-4" />

            <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/30 mb-3">
              Full Transcript
            </div>

            <div className="bg-sand/20 rounded-lg p-4 max-h-96 overflow-y-auto border border-sand">
              {session.conversation && session.conversation.length > 0 ? (
                <div className="space-y-1">
                  {session.conversation.map((message, idx) => (
                    <MessageBubble
                      key={idx}
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm font-serif text-vintage-text/40 italic text-center py-4">
                  No transcript recorded for this entry
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionJournalEntry;
