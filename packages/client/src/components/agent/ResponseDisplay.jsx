import React, { useState } from 'react';
import { Card, CheckIcon } from '../ui';
import { formatMarkdown } from '../../utils/markdown';

const ResponseDisplay = ({ response, agent }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!response) {
    return null;
  }

  const saveToMapRoom = async () => {
    try {
      setSaving(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${agent?.name || 'Agent'} Response`,
          content: response,
          type: 'note',
          category: 'agent-responses',
          tags: [agent?.type || 'agent'].filter(Boolean),
          autoClassify: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail — user can retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="canvas">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {agent?.imagePath ? (
            <img
              src={agent.imagePath}
              alt={agent.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-vintage-text shadow-sm"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline';
              }}
            />
          ) : null}
          <span className="text-3xl" style={{ display: agent?.imagePath ? 'none' : 'inline' }}>
            {agent?.icon || '🤖'}
          </span>
          <h3 className="text-2xl font-poster text-vintage-text">
            {agent?.name || 'Agent'} Response
          </h3>
        </div>
        <button
          onClick={saveToMapRoom}
          disabled={saving || saved}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-teal text-teal font-ui text-xs uppercase tracking-wide hover:bg-teal hover:text-cream disabled:opacity-60 transition-colors flex-shrink-0"
        >
          {saved ? (
            <>
              <CheckIcon size="w-4 h-4" />
              Saved
            </>
          ) : saving ? (
            'Saving...'
          ) : (
            'Save to Map Room'
          )}
        </button>
      </div>
      <div className="prose prose-vintage max-w-none">
        <div
          className="text-vintage-text whitespace-pre-wrap font-serif leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: formatMarkdown(response)
          }}
        />
      </div>
    </Card>
  );
};

export default ResponseDisplay;
