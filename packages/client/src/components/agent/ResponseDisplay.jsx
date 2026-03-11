import React from 'react';
import { Card } from '../ui';
import { formatMarkdown } from '../../utils/markdown';

const ResponseDisplay = ({ response, agent }) => {
  if (!response) {
    return null;
  }

  return (
    <Card variant="canvas">
      <div className="flex items-center gap-3 mb-4">
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
