import React, { useEffect } from 'react';
import SimpleTerminal from '../components/terminal/SimpleTerminal';
import GitStatus from '../components/git/GitStatus';
import useAppStore from '../stores/appStore';

const Outpost = () => {
  const { systemStats, fetchSystemStats } = useAppStore();

  useEffect(() => {
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const serverProcess = systemStats?.processes?.find(p => p.status === 'online');
  const serverUptime = serverProcess?.uptime;

  const formatUptime = (ms) => {
    if (!ms) return '--';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-8">
      {/* Hero Header with Image */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage">
        <img
          src="/images/pages/outpost-header.png"
          alt="Outpost"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress drop-shadow-lg mb-2">
            Outpost
          </h1>
          <p className="text-lg text-vintage-text opacity-90 drop-shadow">
            Developer Tools - Terminal & Git Operations
          </p>
        </div>
      </div>

      {/* Git Status + System Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GitStatus />
        </div>

        {/* System Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <div className="bg-canvas-texture border-3 border-jungle rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">{'\uD83D\uDCBE'}</div>
            <h3 className="text-2xl font-poster text-vintage-text mb-1">Server</h3>
            {systemStats ? (
              <>
                <p className={`text-sm font-ui uppercase ${systemStats.runningCount > 0 ? 'text-jungle' : 'text-terracotta'}`}>
                  {systemStats.runningCount > 0 ? 'Online' : 'Offline'}
                </p>
                {serverUptime && (
                  <p className="text-xs font-mono text-vintage-text opacity-50 mt-1">
                    Uptime: {formatUptime(serverUptime)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-mono text-vintage-text opacity-70">Checking...</p>
            )}
          </div>

          <div className="bg-canvas-texture border-3 border-sunset rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">{'\uD83D\uDD27'}</div>
            <h3 className="text-2xl font-poster text-vintage-text mb-1">PM2</h3>
            {systemStats ? (
              <>
                <p className="text-sm font-ui uppercase text-vintage-text">
                  {systemStats.processCount} process{systemStats.processCount !== 1 ? 'es' : ''}
                </p>
                <p className="text-xs font-mono text-vintage-text opacity-50 mt-1">
                  {systemStats.runningCount} running &middot; {systemStats.totalMemory}MB
                </p>
              </>
            ) : (
              <p className="text-sm font-mono text-vintage-text opacity-70">Checking...</p>
            )}
          </div>

          <div className="bg-canvas-texture border-3 border-teal rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">{'\u26A1'}</div>
            <h3 className="text-2xl font-poster text-vintage-text mb-1">CPU</h3>
            {systemStats ? (
              <p className="text-lg font-poster text-vintage-text">
                {systemStats.totalCpu != null ? `${Math.round(systemStats.totalCpu)}%` : '--'}
              </p>
            ) : (
              <p className="text-sm font-mono text-vintage-text opacity-70">Checking...</p>
            )}
          </div>

          <div className="bg-canvas-texture border-3 border-mustard rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">{'\uD83D\uDCCA'}</div>
            <h3 className="text-2xl font-poster text-vintage-text mb-1">Memory</h3>
            {systemStats ? (
              <p className="text-lg font-poster text-vintage-text">
                {systemStats.totalMemory}MB
              </p>
            ) : (
              <p className="text-sm font-mono text-vintage-text opacity-70">Checking...</p>
            )}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <SimpleTerminal />
    </div>
  );
};

export default Outpost;
