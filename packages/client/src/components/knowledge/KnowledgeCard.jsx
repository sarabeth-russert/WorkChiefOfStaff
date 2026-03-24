import React, { useState } from 'react';
import { Card, Button } from '../ui';

const KnowledgeCard = ({ item, onDelete, onEdit, onExpand }) => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setEditData({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: (item.tags || []).join(', '),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = editData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      await onEdit({ ...item, ...editData, tags });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

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

  const isLong = item.content && item.content.length > 200;

  if (editing) {
    return (
      <Card variant="canvas" className="border-teal">
        <div className="space-y-3">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-poster text-lg text-vintage-text focus:border-teal focus:outline-none"
          />
          <textarea
            value={editData.content}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text focus:border-teal focus:outline-none resize-none"
          />
          <div>
            <label className="block text-xs font-ui uppercase text-vintage-text opacity-60 mb-1">Category</label>
            <select
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text focus:border-teal focus:outline-none"
            >
              <option value="general">General</option>
              <option value="code">Code</option>
              <option value="documentation">Documentation</option>
              <option value="tutorial">Tutorial</option>
              <option value="reference">Reference</option>
              <option value="note">Note</option>
              <option value="idea">Idea</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-ui uppercase text-vintage-text opacity-60 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={editData.tags}
              onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
              className="w-full px-3 py-2 rounded border-2 border-sand-dark bg-cream bg-opacity-50 font-serif text-sm text-vintage-text focus:border-teal focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving || !editData.title.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

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

      <p className="text-sm text-vintage-text mb-1 whitespace-pre-wrap line-clamp-3">
        {item.content}
      </p>
      {isLong && (
        <button
          onClick={() => onExpand(item)}
          className="text-xs font-ui text-terracotta hover:text-terracotta-dark uppercase mb-3"
        >
          Show more
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
          onClick={startEdit}
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
