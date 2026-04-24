import React from 'react';

const IssueCard = ({ issue }) => {
  const getPriorityDot = (priorityName) => {
    const p = (priorityName || '').toLowerCase();
    if (p.includes('highest') || p.includes('critical')) return 'bg-terracotta-dark';
    if (p.includes('high')) return 'bg-terracotta';
    if (p.includes('medium')) return 'bg-mustard';
    if (p.includes('low')) return 'bg-teal';
    return 'bg-sand-dark';
  };

  const getTypeIcon = (typeName) => {
    switch (typeName) {
      case 'Bug': return '\u{1F41B}';
      case 'Story': return '\u{1F4D6}';
      case 'Epic': return '\u{1F3AF}';
      default: return null;
    }
  };

  const openDossier = () => {
    const match = issue.self?.match(/https:\/\/([^\/]+)\//);
    if (match) {
      window.open(`https://${match[1]}/browse/${issue.key}`, '_blank');
    }
  };

  const typeIcon = getTypeIcon(issue.fields.issuetype?.name);
  const description = typeof issue.fields.description === 'string'
    ? issue.fields.description
    : issue.fields.description?.content?.[0]?.content?.[0]?.text || '';

  return (
    <div
      className="bg-cream rounded border border-sand-dark/20 px-3 py-2.5 hover:shadow-vintage-pressed transition-shadow cursor-pointer group"
      onClick={openDossier}
    >
      {/* Top row: type icon + key + priority dot */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {typeIcon && <span className="text-sm">{typeIcon}</span>}
          <span className="font-mono text-[11px] text-terracotta">
            {issue.key}
          </span>
        </div>
        <div
          className={`w-2 h-2 rounded-full ${getPriorityDot(issue.fields.priority?.name)}`}
          title={issue.fields.priority?.name || 'None'}
        />
      </div>

      {/* Title — dominant */}
      <h4 className="text-sm font-poster text-vintage-text leading-snug mb-1">
        {issue.fields.summary}
      </h4>

      {/* Description — secondary, quiet */}
      {description && (
        <p className="text-[11px] text-vintage-text/50 leading-relaxed line-clamp-2 mb-1.5">
          {description}
        </p>
      )}

      {/* Footer — minimal metadata + hover action */}
      <div className="flex items-center justify-between">
        {issue.fields.assignee ? (
          <span className="text-[10px] font-ui text-vintage-text/35 uppercase tracking-wide truncate max-w-[60%]">
            {issue.fields.assignee.displayName}
          </span>
        ) : (
          <span />
        )}
        <span className="text-[10px] font-ui text-terracotta/50 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
          Open Dossier &rarr;
        </span>
      </div>
    </div>
  );
};

export default IssueCard;
