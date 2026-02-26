import React from 'react';
import Button from '../ui/Button';
import useWellnessStore from '../../stores/wellnessStore';

const NotificationBanner = ({ notification, onDismiss, onStartBreathing }) => {
  const startSession = useWellnessStore((state) => state.startSession);

  if (!notification) return null;

  // Determine styling based on notification type
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'stress':
        return {
          bg: 'bg-terracotta',
          border: 'border-terracotta-dark',
          text: 'text-cream',
          animation: 'animate-pulse'
        };
      case 'standup':
        return {
          bg: 'bg-jungle',
          border: 'border-jungle-dark',
          text: 'text-cream',
          animation: ''
        };
      case 'retro':
        return {
          bg: 'bg-teal',
          border: 'border-teal-dark',
          text: 'text-cream',
          animation: ''
        };
      default:
        return {
          bg: 'bg-sand',
          border: 'border-sand-dark',
          text: 'text-vintage-text',
          animation: ''
        };
    }
  };

  const styles = getTypeStyles();

  const getIcon = () => {
    switch (notification.type) {
      case 'stress':
        return '⚠️';
      case 'standup':
        return '📋';
      case 'retro':
        return '🔄';
      default:
        return '📢';
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'stress':
        return 'Stress Alert';
      case 'standup':
        return 'Standup Time';
      case 'retro':
        return 'Retrospective Reminder';
      default:
        return 'Notification';
    }
  };

  const handleBannerClick = () => {
    // Check if notification has sessionId and is standup/retro type
    if (notification.sessionId && (notification.type === 'standup' || notification.type === 'retro')) {
      // Extract date from notification data, or use today's date as fallback
      const date = notification.data?.date || new Date().toISOString().split('T')[0];
      startSession(notification.sessionId, date);
      // Dismiss notification after opening panel
      if (onDismiss) {
        onDismiss();
      }
    }
  };

  const isClickable = notification.sessionId && (notification.type === 'standup' || notification.type === 'retro');

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${styles.bg} ${styles.text} border-b-4 ${styles.border} shadow-vintage ${styles.animation}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Icon and Content */}
          <div
            className={`flex items-center gap-4 flex-1 ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={handleBannerClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBannerClick();
              }
            } : undefined}
          >
            <span className="text-4xl flex-shrink-0">{getIcon()}</span>
            <div className="flex-1">
              <h3 className="font-poster text-xl mb-1">{getTitle()}</h3>
              <p className="font-serif text-sm opacity-90">
                {notification.message}
              </p>
              {isClickable && (
                <p className="font-serif text-xs opacity-70 mt-1">
                  Click to open session
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {notification.type === 'stress' && onStartBreathing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onStartBreathing}
                className="whitespace-nowrap"
              >
                Start Breathing Exercise
              </Button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-20 transition-colors"
                aria-label="Dismiss notification"
              >
                <span className="text-2xl leading-none">×</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;
