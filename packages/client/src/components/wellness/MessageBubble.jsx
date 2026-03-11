import React from 'react';
import { formatMarkdown } from '../../utils/markdown';

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
            <div
              className="text-sm font-serif"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
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
