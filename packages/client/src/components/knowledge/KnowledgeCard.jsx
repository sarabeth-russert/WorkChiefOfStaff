import React, { useState } from 'react';
import { Card, Button } from '../ui';

const KnowledgeCard = ({ item, onDelete, onEdit }) => {
  const typeIcons = {
    note: '📝',
    code: '💻',
    link: '🔗',
    doc: '📄',
    idea: '💡',
    reference: '📚',
    tutorial: '🎓'
  };

  const categoryColors = {
    code: 'border-jungle',
    documentation: 'border-teal',
    tutorial: 'border-burgundy',
    reference: 'border-mustard',
    note: 'border-sand-dark',
    idea: 'border-sunset',
    link: 'border-terracotta',
    general: 'border-vintage-text'
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const [expanded, setExpanded] = useState(false);
  const isLong = item.content && item.content.length > 200;

  return (
    <Card
      variant="canvas"
      className={`${categoryColors[item.category] || categoryColors.general} hover:scale-102 transition-transform`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {typeIcons[item.type] || typeIcons.note}
          </span>
          <h3 className="text-xl font-poster text-vintage-text line-clamp-1">
            {item.title}
          </h3>
        </div>
        {item.relevance && (
          <span className="px-2 py-1 bg-jungle text-cream text-xs font-ui uppercase rounded">
            {Math.round(item.relevance * 100)}% match
          </span>
        )}
      </div>

      <p className={`text-sm text-vintage-text mb-1 whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}>
        {item.content}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-ui text-terracotta hover:text-terracotta-dark uppercase mb-3"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      {!isLong && <div className="mb-3" />}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.slice(0, 5).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-sand text-vintage-text text-xs font-ui rounded"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 5 && (
            <span className="px-2 py-1 text-vintage-text text-xs opacity-70">
              +{item.tags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-vintage-text opacity-70 mb-3">
        <span className="font-ui uppercase">{item.category}</span>
        <span>{formatDate(item.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item.id)}
          className="text-terracotta-dark"
        >
          Delete
        </Button>
      </div>
    </Card>
  );
};

export default KnowledgeCard;
