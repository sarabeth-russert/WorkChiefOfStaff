import React from 'react';
import { Card, Button } from '../ui';

const AppCard = ({ app, onStart, onStop, onRestart, onViewLogs, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-jungle text-cream';
      case 'stopped':
        return 'bg-terracotta-dark text-cream';
      case 'not_running':
        return 'bg-sand-dark text-vintage-text';
      default:
        return 'bg-mustard text-vintage-text';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Running';
      case 'stopped':
        return 'Stopped';
      case 'not_running':
        return 'Not Running';
      default:
        return status;
    }
  };

  const isRunning = app.status === 'online';

  return (
    <Card variant="canvas" className="border-mustard">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{app.icon}</span>
          <div>
            <h3 className="text-2xl font-poster text-vintage-text">
              {app.name}
            </h3>
            <span className={`inline-block px-3 py-1 rounded text-xs font-ui uppercase ${getStatusColor(app.status)}`}>
              {getStatusText(app.status)}
            </span>
          </div>
        </div>
      </div>

      {app.description && (
        <p className="text-sm text-vintage-text mb-4 opacity-80">
          {app.description}
        </p>
      )}

      {/* Stats */}
      {isRunning && (
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-cream rounded">
          <div>
            <div className="text-xs font-ui uppercase text-vintage-text opacity-70">CPU</div>
            <div className="text-lg font-poster text-vintage-text">{app.cpu}%</div>
          </div>
          <div>
            <div className="text-xs font-ui uppercase text-vintage-text opacity-70">Memory</div>
            <div className="text-lg font-poster text-vintage-text">
              {Math.round(app.memory / 1024 / 1024)}MB
            </div>
          </div>
          <div>
            <div className="text-xs font-ui uppercase text-vintage-text opacity-70">Restarts</div>
            <div className="text-lg font-poster text-vintage-text">{app.restarts || 0}</div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2 mb-4 text-sm">
        {app.port && (
          <div className="flex items-center gap-2">
            <span className="font-ui uppercase text-xs text-vintage-text opacity-70">Port:</span>
            <span className="font-mono text-vintage-text">{app.port}</span>
          </div>
        )}
        {app.category && (
          <div className="flex items-center gap-2">
            <span className="font-ui uppercase text-xs text-vintage-text opacity-70">Category:</span>
            <span className="text-vintage-text">{app.category}</span>
          </div>
        )}
        {app.tags && app.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {app.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-sand text-vintage-text text-xs font-ui uppercase rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {!isRunning && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStart(app.id)}
            >
              Start
            </Button>
          )}
          {isRunning && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRestart(app.id)}
              >
                Restart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStop(app.id)}
              >
                Stop
              </Button>
            </>
          )}
          {isRunning && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewLogs(app)}
            >
              Logs
            </Button>
          )}
        </div>
        {!isRunning && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(app.id)}
            className="w-full text-terracotta hover:text-terracotta-dark hover:bg-terracotta hover:bg-opacity-10"
          >
            Unregister App
          </Button>
        )}
      </div>
    </Card>
  );
};

export default AppCard;
