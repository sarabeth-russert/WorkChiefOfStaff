import React from 'react';

const MessageBubble = ({
  role = 'assistant',
  content,
  timestamp
}) => {
  const isUser = role === 'user';

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMarkdownContent = (text) => {
    if (!text) return null;

    // Split by paragraphs
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((para, idx) => {
      // Check for bold **text**
      let processed = para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Check for italic *text*
      processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Check for bullet points
      const isBullet = para.trim().startsWith('- ') || para.trim().startsWith('* ');

      if (isBullet) {
        const items = para.split('\n').filter(line => line.trim());
        return (
          <ul key={idx} className="list-disc list-inside mb-2 space-y-1">
            {items.map((item, i) => (
              <li
                key={i}
                className="text-sm"
                dangerouslySetInnerHTML={{
                  __html: item.replace(/^[-*]\s+/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                }}
              />
            ))}
          </ul>
        );
      }

      return (
        <p
          key={idx}
          className="mb-2 last:mb-0"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label="Guide">
              📖
            </span>
          </div>
        )}

        <div className="flex flex-col">
          <div
            className={`
              rounded-lg border-3 shadow-vintage p-4
              ${isUser
                ? 'bg-jungle text-cream border-jungle-dark'
                : 'bg-sand text-vintage-text border-sand-dark'
              }
            `}
          >
            <div className="text-sm font-serif">
              {renderMarkdownContent(content)}
            </div>
          </div>

          {timestamp && (
            <div className={`text-xs text-vintage-text opacity-60 font-ui mt-1 ${
              isUser ? 'text-right' : 'text-left'
            }`}>
              {formatTimestamp(timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
