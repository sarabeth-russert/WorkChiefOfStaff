import React, { useState } from 'react';
import { Card } from '../ui';
import MessageBubble from './MessageBubble';

const SessionJournalEntry = ({
  session
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!session) return null;

  const sessionTypeConfig = {
    standup: {
      icon: '🌅',
      label: 'Morning Standup',
      color: 'text-sunset'
    },
    retro: {
      icon: '🌙',
      label: 'Evening Retro',
      color: 'text-teal'
    }
  };

  const config = sessionTypeConfig[session.type] || sessionTypeConfig.standup;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderSummaryPreview = () => {
    const summary = session.summary || {};
    const items = [];

    if (summary.plan) {
      items.push(
        <div key="plan" className="mb-2">
          <span className="font-poster text-sm text-sunset uppercase">Plan:</span>
          <p className="text-sm ml-2">{summary.plan}</p>
        </div>
      );
    }

    if (summary.accomplishments) {
      // Handle accomplishments as array or string
      const accomplishmentsList = Array.isArray(summary.accomplishments)
        ? summary.accomplishments
        : summary.accomplishments.split('\n').filter(item => item.trim());

      items.push(
        <div key="accomplishments" className="mb-2">
          <span className="font-poster text-sm text-jungle uppercase">Accomplishments:</span>
          {accomplishmentsList.length > 0 ? (
            <ul className="list-disc list-inside ml-4 mt-1">
              {accomplishmentsList.map((item, idx) => (
                <li key={idx} className="text-sm mb-1">{item.trim()}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm ml-2">{summary.accomplishments}</p>
          )}
        </div>
      );
    }

    if (summary.notesForTomorrow) {
      items.push(
        <div key="notes" className="mb-2">
          <span className="font-poster text-sm text-mustard uppercase">Notes for Tomorrow:</span>
          <p className="text-sm ml-2">{summary.notesForTomorrow}</p>
        </div>
      );
    }

    // Add Jira stats for retro sessions
    if (session.type === 'retro' && session.jiraStats) {
      items.push(
        <div key="jira" className="mb-2">
          <span className="font-poster text-sm text-jungle uppercase">Jira Progress:</span>
          <div className="text-sm ml-2 flex gap-4">
            <span>Created: {session.jiraStats.issuesCreated} issues ({session.jiraStats.storyPointsAdded} pts)</span>
            <span className="text-jungle">Closed: {session.jiraStats.issuesClosed} issues ({session.jiraStats.storyPointsClosed} pts)</span>
          </div>
        </div>
      );
    }

    return items.length > 0 ? items : (
      <p className="text-sm text-vintage-text opacity-60 italic">No summary available</p>
    );
  };

  return (
    <Card variant="canvas" className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl" role="img" aria-label={config.label}>
            {config.icon}
          </span>
          <div>
            <h3 className={`text-xl font-poster ${config.color}`}>
              {config.label}
            </h3>
            <p className="text-xs text-vintage-text opacity-60 font-ui">
              {formatDate(session.startedAt)}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 font-ui text-sm uppercase tracking-wide
                     bg-terracotta text-cream border-2 border-terracotta-dark
                     rounded shadow-vintage hover:shadow-vintage-hover
                     transition-all duration-150"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </button>
      </div>

      <div className="border-t-2 border-vintage-text opacity-20 mb-4" />

      {!isExpanded ? (
        <div className="space-y-2">
          {renderSummaryPreview()}
        </div>
      ) : (
        <div>
          <div className="mb-4 space-y-2">
            {renderSummaryPreview()}
          </div>

          <div className="border-t-2 border-vintage-text opacity-20 mb-4" />

          <div className="bg-cream rounded-lg p-4 max-h-96 overflow-y-auto">
            <h4 className="font-poster text-lg text-vintage-text mb-3 uppercase">
              Conversation History
            </h4>

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
              <p className="text-sm text-vintage-text opacity-60 italic text-center py-4">
                No conversation history available
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SessionJournalEntry;
