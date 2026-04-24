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
    note: '\u{1F4DD}',
    code: '\u{1F4BB}',
    link: '\u{1F517}',
    doc: '\u{1F4C4}',
    idea: '\u{1F4A1}',
    reference: '\u{1F4DA}',
    tutorial: '\u{1F393}'
  };

  const accentColors = {
    code: 'bg-jungle',
    documentation: 'bg-teal',
    tutorial: 'bg-burgundy',
    reference: 'bg-mustard',
    note: 'bg-sand-dark',
    idea: 'bg-sunset',
    link: 'bg-terracotta',
    general: 'bg-vintage-text/40'
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
  const accentBar = accentColors[item.category] || accentColors.general;
  const accessionId = item.id ? item.id.slice(-6).toUpperCase() : '\u2014';

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
            <label className="block text-xs font-ui uppercase text-vintage-text opacity-60 mb-1">Classification</label>
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
            <label className="block text-xs font-ui uppercase text-vintage-text opacity-60 mb-1">Index Tags (comma-separated)</label>
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
              {saving ? 'Filing...' : 'File'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative bg-cream rounded-lg border border-sand-dark/30 overflow-visible hover:shadow-vintage-pressed transition-shadow mt-3">
      {/* Drawer-label tab — subtle catalog flourish */}
      <div className="absolute -top-2.5 left-4 flex items-end">
        <div className={`h-2.5 w-10 rounded-t-sm ${accentBar} opacity-70`} />
      </div>
      {/* Classification strip — colored top bar by category */}
      <div className={`h-1 ${accentBar} rounded-t-lg`} />

      <div className="px-4 py-4">
        {/* Accession row — stamped catalog number + category tab */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-mono text-[11px] text-vintage-text/25 uppercase tracking-[0.25em]"
            style={{ textShadow: '0.5px 0.5px 0px rgba(58,50,38,0.06)' }}
          >
            Acc. {accessionId}
          </span>
          <span className="font-ui text-[10px] uppercase tracking-[0.15em] text-vintage-text/50 border border-dashed border-sand-dark/25 px-1.5 py-0.5 rounded-sm bg-sand/30">
            {item.category}
          </span>
        </div>

        {/* Title — dominant */}
        <div className="flex items-start gap-2 mb-3">
          <span className="text-lg leading-none mt-0.5">
            {typeIcons[item.type] || typeIcons.note}
          </span>
          <h3 className="text-xl font-poster text-vintage-text leading-tight line-clamp-2">
            {item.title}
          </h3>
        </div>

        {/* Relevance badge (search results only) */}
        {item.relevance && (
          <span className="inline-block px-2 py-0.5 bg-jungle text-cream text-[10px] font-ui uppercase rounded mb-3">
            {Math.round(item.relevance * 100)}% match
          </span>
        )}

        {/* Content preview */}
        <p className="text-sm text-vintage-text/70 font-serif leading-relaxed whitespace-pre-wrap line-clamp-3 mb-3.5">
          {item.content}
        </p>

        {/* Tags — typed label strips */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-sand/60 text-vintage-text/60 text-[10px] font-mono uppercase tracking-wide border-b border-sand-dark/30"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 5 && (
              <span className="px-1 text-[10px] text-vintage-text/30 italic font-serif">
                +{item.tags.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Footer — date stamp + actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-sand/60">
          <span className="font-mono text-[10px] text-vintage-text/30">
            {formatDate(item.createdAt)}
          </span>
          <div className="flex items-center gap-3">
            {isLong && (
              <button
                onClick={() => onExpand(item)}
                className="text-[10px] font-ui uppercase tracking-wide text-terracotta hover:text-terracotta-dark transition-colors"
              >
                Open Record
              </button>
            )}
            <button
              onClick={startEdit}
              className="text-[10px] font-ui uppercase tracking-wide text-vintage-text/40 hover:text-vintage-text transition-colors"
            >
              Revise
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="text-[10px] font-ui uppercase tracking-wide text-vintage-text/30 hover:text-terracotta-dark transition-colors"
            >
              Retire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCard;
