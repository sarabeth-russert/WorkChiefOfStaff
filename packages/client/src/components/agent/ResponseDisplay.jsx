import React from 'react';
import { Card } from '../ui';

const ResponseDisplay = ({ response, agent }) => {
  if (!response) {
    return null;
  }

  return (
    <Card variant="canvas">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{agent?.icon || '🤖'}</span>
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

// Simple markdown formatter
function formatMarkdown(text) {
  let html = text;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-poster mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-poster mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-poster mt-8 mb-4">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-vintage-text text-cream p-4 rounded my-4 overflow-x-auto"><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code class="bg-sand px-2 py-1 rounded text-sm font-mono">$1</code>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li.*<\/li>)/s, '<ul class="my-2">$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="mb-4">');
  html = '<p class="mb-4">' + html + '</p>';

  return html;
}

export default ResponseDisplay;
