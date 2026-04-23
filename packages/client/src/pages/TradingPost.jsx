import React, { useEffect, useState } from 'react';
import { Card, Button, CheckIcon } from '../components/ui';
import useAppStore from '../stores/appStore';
import useToastStore from '../stores/toastStore';
import AppCard from '../components/app/AppCard';
import AddAppModal from '../components/app/AddAppModal';
import LogViewerModal from '../components/app/LogViewerModal';

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
    registerApp,
    deleteApp,
    fetchSystemStats,
    clearError
  } = useAppStore();

  const [selectedApp, setSelectedApp] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogViewer, setShowLogViewer] = useState(false);

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
      // Error handled by store
    }
  };

  const handleStop = async (appId) => {
    try {
      await stopApp(appId);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleRestart = async (appId) => {
    try {
      await restartApp(appId);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleViewLogs = (app) => {
    setSelectedApp(app);
    setShowLogViewer(true);
  };

  const handleAddApp = async (appData) => {
    try {
      await registerApp(appData);
      setShowAddModal(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDeleteApp = async (appId) => {
    const confirmed = await useToastStore.getState().confirm(
      'Are you sure you want to unregister this app? This will not delete the app files.',
      { title: 'Unregister App', confirmLabel: 'Unregister', cancelLabel: 'Cancel' }
    );
    if (confirmed) {
      try {
        await deleteApp(appId);
      } catch (error) {
        // Error handled by store
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero — let the art breathe */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage mb-2">
        <img
          src="/images/pages/trading-post-header.png"
          alt="Trading Post supply depot"
          className="w-full h-52 md:h-72 object-cover"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/40" />
        <div className="absolute top-4 left-4">
          <span className="inline-block bg-vintage-text/60 text-cream px-3 py-1 rounded font-ui text-xs uppercase tracking-widest">
            Application Management
          </span>
        </div>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress mb-1">
          Trading Post
        </h1>
        <p className="font-serif text-vintage-text/50 text-base italic">
          Manage your fleet of services and supplies
        </p>
        {!pm2Available && (
          <p className="text-terracotta-dark mt-2 font-serif text-sm">
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
            <CheckIcon size="w-10 h-10" className="mx-auto mb-2 text-jungle" />
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
            <p className="text-sm text-vintage-text opacity-70 mb-6">
              Register your applications to manage them through the Trading Post.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              + Register Your First App
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-poster text-vintage-text">
              Your Applications
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
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
                onDelete={handleDeleteApp}
              />
            ))}
          </div>
        </>
      )}

      {/* Add App Modal */}
      {showAddModal && (
        <AddAppModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddApp}
        />
      )}

      {/* Log Viewer Modal */}
      {showLogViewer && selectedApp && (
        <LogViewerModal
          app={selectedApp}
          onClose={() => {
            setShowLogViewer(false);
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
};

export default TradingPost;
