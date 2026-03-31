import React, { useState, useEffect, useRef } from 'react';
import { Button, Card } from '../ui';
import useAppStore from '../../stores/appStore';

const LogViewerModal = ({ app, onClose }) => {
  const { getLogs } = useAppStore();
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lines, setLines] = useState(100);
  const logRef = useRef(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLogs(app.id, lines);
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [app.id, lines]);

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!logRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  };

  const formatLogLines = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return raw.split('\n');
  };

  const allLogs = (() => {
    if (!logs) return [];
    // Handle { out, err } format
    if (logs.out || logs.err) {
      return [
        ...formatLogLines(logs.out).map(line => ({ line, type: 'out' })),
        ...formatLogLines(logs.err).map(line => ({ line, type: 'err' })),
      ];
    }
    // Handle { logs: "string" } format (PM2 tailing output)
    if (logs.logs) {
      return formatLogLines(logs.logs)
        .filter(line => !line.startsWith('[TAILING]') && line.trim() !== '')
        .map(line => ({ line, type: 'out' }));
    }
    return [];
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-cream rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <Card className="border-jungle flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{app.icon || '\uD83D\uDCDC'}</span>
              <div>
                <h2 className="text-2xl font-poster text-vintage-text">
                  {app.name} Logs
                </h2>
                <p className="text-xs font-ui text-vintage-text opacity-60">
                  Auto-refreshes every 5 seconds
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-3xl text-vintage-text hover:text-terracotta"
            >
              &times;
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-ui uppercase text-vintage-text opacity-70">Lines:</label>
              <select
                value={lines}
                onChange={(e) => setLines(Number(e.target.value))}
                className="px-2 py-1 text-sm font-mono bg-cream border-2 border-vintage-text border-opacity-30 rounded text-vintage-text"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchLogs}>
              Refresh
            </Button>
            <label className="flex items-center gap-1 text-xs font-ui text-vintage-text opacity-70 ml-auto cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-jungle"
              />
              Auto-scroll
            </label>
          </div>

          {/* Log Output */}
          {error ? (
            <div className="p-4 bg-terracotta bg-opacity-10 border-2 border-terracotta rounded text-sm text-terracotta-dark">
              {error}
            </div>
          ) : loading && !logs ? (
            <div className="p-8 text-center text-vintage-text opacity-70">
              Loading logs...
            </div>
          ) : (
            <div
              ref={logRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 max-h-[60vh] overflow-y-auto bg-vintage-text rounded p-4 font-mono text-xs leading-relaxed"
            >
              {allLogs.length === 0 ? (
                app.status === 'running' && app.status !== 'online' ? (
                  <div className="text-cream opacity-50 space-y-2">
                    <p>No logs available — this app is managed by a separate PM2 instance.</p>
                    <p className="font-mono text-xs opacity-70">
                      Try: pm2 logs {app.pm2Name || app.name.toLowerCase()}
                    </p>
                  </div>
                ) : (
                  <p className="text-cream opacity-50">No log output yet.</p>
                )
              ) : (
                allLogs.map((entry, i) => (
                  <div
                    key={i}
                    className={entry.type === 'err' ? 'text-terracotta' : 'text-cream opacity-90'}
                  >
                    {entry.line}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end mt-4 pt-3 border-t-2 border-vintage-text border-opacity-20">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LogViewerModal;
