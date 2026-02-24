import React from 'react';
import { Card } from '../ui';

const IssueCard = ({ issue }) => {
  const getStatusColor = (statusName) => {
    const status = statusName?.toLowerCase() || '';
    if (status.includes('done') || status.includes('closed')) {
      return 'bg-jungle text-cream';
    } else if (status.includes('progress') || status.includes('dev')) {
      return 'bg-teal text-cream';
    } else if (status.includes('review')) {
      return 'bg-mustard text-vintage-text';
    } else {
      return 'bg-sand-dark text-vintage-text';
    }
  };

  const getPriorityIcon = (priorityName) => {
    const priority = priorityName?.toLowerCase() || '';
    if (priority.includes('highest') || priority.includes('critical')) return '🔴';
    if (priority.includes('high')) return '🟠';
    if (priority.includes('medium')) return '🟡';
    if (priority.includes('low')) return '🔵';
    return '⚪';
  };

  const openInJira = () => {
    // Extract domain from issue self URL
    const selfUrl = issue.self;
    const match = selfUrl.match(/https:\/\/([^\/]+)\//);
    if (match) {
      const domain = match[1];
      window.open(`https://${domain}/browse/${issue.key}`, '_blank');
    }
  };

  return (
    <Card variant="canvas" className="border-teal hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {issue.fields.issuetype?.name === 'Bug' ? '🐛' :
               issue.fields.issuetype?.name === 'Story' ? '📖' :
               issue.fields.issuetype?.name === 'Task' ? '✅' :
               issue.fields.issuetype?.name === 'Epic' ? '🎯' : '📝'}
            </span>
            <span
              className="font-mono text-sm text-terracotta hover:text-terracotta-dark cursor-pointer"
              onClick={openInJira}
            >
              {issue.key}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-ui uppercase ${getStatusColor(
                issue.fields.status?.name
              )}`}
            >
              {issue.fields.status?.name || 'Unknown'}
            </span>
          </div>
          <h3 className="text-xl font-poster text-vintage-text mb-2">
            {issue.fields.summary}
          </h3>
        </div>
        <span className="text-2xl">{getPriorityIcon(issue.fields.priority?.name)}</span>
      </div>

      {issue.fields.description && (
        <p className="text-sm text-vintage-text opacity-80 mb-3 line-clamp-2">
          {typeof issue.fields.description === 'string'
            ? issue.fields.description
            : issue.fields.description?.content?.[0]?.content?.[0]?.text || ''}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-vintage-text opacity-70">
        <div>
          <span className="font-ui uppercase">Type:</span>{' '}
          {issue.fields.issuetype?.name || 'Unknown'}
        </div>
        {issue.fields.assignee && (
          <div>
            <span className="font-ui uppercase">Assignee:</span>{' '}
            {issue.fields.assignee.displayName}
          </div>
        )}
      </div>

      {issue.fields.updated && (
        <div className="mt-2 text-xs text-vintage-text opacity-60">
          Updated: {new Date(issue.fields.updated).toLocaleDateString()}
        </div>
      )}

      <button
        onClick={openInJira}
        className="mt-3 text-sm font-ui uppercase text-terracotta hover:text-terracotta-dark transition-colors"
      >
        Open in Jira →
      </button>
    </Card>
  );
};

export default IssueCard;
