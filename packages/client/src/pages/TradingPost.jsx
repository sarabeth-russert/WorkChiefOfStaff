import React, { useEffect, useState } from 'react';
import { Card, Button } from '../components/ui';
import useAppStore from '../stores/appStore';
import AppCard from '../components/app/AppCard';

const TradingPost = () => {
  const {
    apps,
    pm2Available,
    systemStats,
    loading,
    error,
    fetchApps,
    startApp,
    stopApp,
    restartApp,
    fetchSystemStats,
    clearError
  } = useAppStore();

  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApps();
    fetchSystemStats();

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchApps();
      fetchSystemStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async (appId) => {
    try {
      await startApp(appId);
    } catch (error) {
      console.error('Error starting app:', error);
    }
  };

  const handleStop = async (appId) => {
    try {
      await stopApp(appId);
    } catch (error) {
      console.error('Error stopping app:', error);
    }
  };

  const handleRestart = async (appId) => {
    try {
      await restartApp(appId);
    } catch (error) {
      console.error('Error restarting app:', error);
    }
  };

  const handleViewLogs = (app) => {
    setSelectedApp(app);
    // TODO: Implement log viewer modal
    alert(`Log viewer for ${app.name} coming soon!`);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-6xl font-poster text-vintage-text text-letterpress mb-4">
          💰 Trading Post
        </h1>
        <p className="text-lg text-vintage-text opacity-80">
          Application Management Dashboard
        </p>
        {!pm2Available && (
          <p className="text-terracotta-dark mt-2">
            ⚠️ PM2 is not available. Some features may be limited.
          </p>
        )}
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="canvas" className="text-center border-jungle">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-1">
              {systemStats.processCount}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Total Processes
            </p>
          </Card>

          <Card variant="canvas" className="text-center border-jungle">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-1">
              {systemStats.runningCount}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Running
            </p>
          </Card>

          <Card variant="canvas" className="text-center border-terracotta">
            <div className="text-4xl mb-2">⏸️</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-1">
              {systemStats.stoppedCount}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Stopped
            </p>
          </Card>

          <Card variant="canvas" className="text-center border-sunset">
            <div className="text-4xl mb-2">💾</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-1">
              {systemStats.totalMemory}MB
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Total Memory
            </p>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-terracotta-dark">
          <div className="flex items-center justify-between">
            <p className="text-terracotta-dark">
              <strong>Error:</strong> {error}
            </p>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Apps List */}
      {loading && apps.length === 0 ? (
        <Card>
          <p className="text-center text-vintage-text py-8">
            Loading applications...
          </p>
        </Card>
      ) : apps.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-vintage-text mb-4">
              No applications registered yet.
            </p>
            <p className="text-sm text-vintage-text opacity-70">
              Register your applications to manage them through the Trading Post.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-poster text-vintage-text">
              Your Applications
            </h2>
            <Button variant="primary" size="sm">
              + Register App
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onStart={handleStart}
                onStop={handleStop}
                onRestart={handleRestart}
                onViewLogs={handleViewLogs}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TradingPost;
