import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import Button from '../components/ui/Button';
import WellnessMetricCard from '../components/wellness/WellnessMetricCard';
import WellnessTrendChart from '../components/wellness/WellnessTrendChart';
import WellnessSettings from '../components/wellness/WellnessSettings';

const Medic = () => {
  const [wellnessData, setWellnessData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Fetch wellness data on component mount
  useEffect(() => {
    fetchWellnessData();
    fetchTrendData();
    fetchSettings();
  }, []);

  // Trigger on-demand standup if in work hours and not delivered
  useEffect(() => {
    const triggerStandupIfNeeded = async () => {
      try {
        const now = new Date();
        const hour = now.getHours();

        // Check if we're in work hours (7 AM - 4 PM Pacific)
        if (hour >= 7 && hour < 16) {
          // Check if standup already delivered
          const statusResponse = await fetch(`${apiUrl}/api/wellness/standup/status`);
          if (statusResponse.ok) {
            const { delivered } = await statusResponse.json();

            if (!delivered) {
              // Trigger on-demand standup
              await fetch(`${apiUrl}/api/wellness/standup/trigger`, {
                method: 'POST'
              });
            }
          }
        }
      } catch (err) {
        console.error('Error triggering standup:', err);
      }
    };

    // Small delay to let the page load first
    const timer = setTimeout(triggerStandupIfNeeded, 2000);
    return () => clearTimeout(timer);
  }, []);

  const fetchWellnessData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/wellness/daily`);
      if (!response.ok) {
        throw new Error('Failed to fetch wellness data');
      }

      const data = await response.json();
      setWellnessData(data);
    } catch (err) {
      console.error('Error fetching wellness data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/wellness/trends?days=7`);
      if (response.ok) {
        const data = await response.json();
        setTrendData(data.trends || []);
      }
    } catch (err) {
      console.error('Error fetching trend data:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/wellness/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWellnessData();
    await fetchTrendData();
    setIsRefreshing(false);
  };

  const handleTriggerRetro = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/wellness/retro/trigger`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success && !result.alreadyDelivered) {
        alert('Evening retro triggered! Check your notifications.');
      } else if (result.alreadyDelivered) {
        alert('Evening retro already delivered today.');
      } else {
        alert('Failed to trigger retro: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error triggering retro:', err);
      alert('Error triggering retro: ' + err.message);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const response = await fetch(`${apiUrl}/api/wellness/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Error saving settings:', err);
      throw err;
    }
  };

  const getMetricStatus = (score) => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage">
        <img
          src="/images/pages/medic-header.png"
          alt="Medic Station"
          className="w-full h-48 md:h-64 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress drop-shadow-lg mb-2">
            🏥 Medic
          </h1>
          <p className="text-lg text-vintage-text opacity-90 drop-shadow">
            Monitor your adventurer's vitals and optimize your journey
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-terracotta-dark">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-xl font-poster text-terracotta-dark mb-2">
                Unable to Load Vitals Data
              </h3>
              <p className="text-vintage-text mb-4">
                {error}
              </p>
              <div className="flex gap-3">
                <Button variant="primary" size="sm" onClick={handleRefresh}>
                  Retry
                </Button>
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    Configure Oura Ring
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !wellnessData && (
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔄</div>
            <p className="text-vintage-text font-ui uppercase">Loading wellness data...</p>
          </div>
        </Card>
      )}

      {/* Today's Metrics */}
      {!isLoading && wellnessData && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-poster text-vintage-text">Today's Metrics</h2>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerRetro}
              >
                🌙 End Day
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wellnessData.sleep && (
              <WellnessMetricCard
                title="Sleep"
                score={wellnessData.sleep.score}
                icon="😴"
                iconImage="/images/wellness/sleep.png"
                description={`${wellnessData.sleep.total_hours || 0}h total, ${wellnessData.sleep.deep_hours || 0}h deep`}
                status={getMetricStatus(wellnessData.sleep.score)}
                lastUpdated={wellnessData.sleep.timestamp}
              />
            )}

            {wellnessData.activity && (
              <WellnessMetricCard
                title="Activity"
                score={wellnessData.activity.score}
                icon="🏃"
                iconImage="/images/wellness/activity.png"
                description={`${wellnessData.activity.steps || 0} steps, ${wellnessData.activity.calories || 0} cal`}
                status={getMetricStatus(wellnessData.activity.score)}
                lastUpdated={wellnessData.activity.timestamp}
              />
            )}

            {wellnessData.readiness && (
              <WellnessMetricCard
                title="Readiness"
                score={wellnessData.readiness.score}
                icon="💪"
                iconImage="/images/wellness/readiness.png"
                description={`HRV: ${wellnessData.readiness.hrv || 0}ms, RHR: ${wellnessData.readiness.resting_hr || 0}bpm`}
                status={getMetricStatus(wellnessData.readiness.score)}
                lastUpdated={wellnessData.readiness.timestamp}
              />
            )}
          </div>
        </>
      )}

      {/* Trend Visualization */}
      {!isLoading && trendData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WellnessTrendChart
            title="Sleep Trend (7 Days)"
            data={trendData.filter(d => d.type === 'sleep')}
            metricKey="sleep"
            scoreKey="score"
          />
          <WellnessTrendChart
            title="Readiness Trend (7 Days)"
            data={trendData.filter(d => d.type === 'readiness')}
            metricKey="readiness"
            scoreKey="score"
          />
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !wellnessData && !error && (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💤</div>
            <h3 className="text-2xl font-poster text-vintage-text mb-2">
              No Vitals Data Available
            </h3>
            <p className="text-vintage-text mb-6 max-w-md mx-auto">
              The Medic hasn't collected any vitals yet. Configure your Oura Ring in Settings to begin tracking.
            </p>
            <Link to="/settings">
              <Button variant="primary">
                Go to Settings
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Settings Panel */}
      <WellnessSettings
        currentSettings={settings}
        onSave={handleSaveSettings}
      />

      {/* Info Card */}
      <Card variant="canvas">
        <h3 className="text-xl font-poster text-vintage-text mb-4">About the Medic Station</h3>
        <div className="space-y-3 text-vintage-text">
          <p>
            The Medic monitors your adventurer's vitals via Oura Ring and provides daily health reports.
            Your daily planning and reflection sessions are tracked in <strong>Base Camp</strong>.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Hourly vitals sync keeps your health data current</li>
            <li>Morning reports assess your readiness for the day's quest</li>
            <li>7-day trend analysis tracks sleep, activity, and recovery</li>
            <li>Configure your Oura Ring connection in Settings</li>
          </ul>
          <p className="text-sm opacity-80 pt-2 border-t-2 border-vintage-text">
            Your health data is stored locally and never shared with third parties.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Medic;
