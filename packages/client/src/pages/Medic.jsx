import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import Button from '../components/ui/Button';
import WellnessMetricCard from '../components/wellness/WellnessMetricCard';
import WellnessTrendChart from '../components/wellness/WellnessTrendChart';
import WellnessSettings from '../components/wellness/WellnessSettings';
import ReadinessContributors from '../components/wellness/ReadinessContributors';
import SleepContributors from '../components/wellness/SleepContributors';
import OuraScoreChart from '../components/wellness/OuraScoreChart';
import ScoreGauge from '../components/wellness/ScoreGauge';
import HeartRateInfo from '../components/wellness/HeartRateInfo';

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
        // Non-critical background trigger; silently fail
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
      // Error is displayed in the UI via setError
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

        // Transform trend data for charting
        const transformed = {};
        data.trends?.forEach(dayData => {
          const date = dayData.date;
          if (!transformed[date]) {
            transformed[date] = { date };
          }

          // Extract readiness score
          if (dayData.metrics?.readiness?.data?.[0]?.score) {
            transformed[date].readiness = dayData.metrics.readiness.data[0].score;
          }

          // Extract sleep score
          if (dayData.metrics?.sleep?.data?.[0]?.score) {
            transformed[date].sleep = dayData.metrics.sleep.data[0].score;
          }

          // Extract activity score
          if (dayData.metrics?.activity?.data?.[0]?.score) {
            transformed[date].activity = dayData.metrics.activity.data[0].score;
          }
        });

        const chartData = Object.values(transformed).sort((a, b) =>
          new Date(a.date) - new Date(b.date)
        );

        setTrendData(chartData);
      }
    } catch (err) {
      // Trend data is non-critical; silently fail
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
      // Settings fetch is non-critical; silently fail
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWellnessData();
    await fetchTrendData();
    setIsRefreshing(false);
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
      // Re-thrown below for caller to handle
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
            Medic
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
      {!isLoading && wellnessData && wellnessData.metrics && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-poster text-vintage-text">Today's Metrics</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>

          {/* Score Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wellnessData.metrics.metrics?.readiness?.data?.[0] && (
              <ScoreGauge
                score={wellnessData.metrics.metrics.readiness.data[0].score}
                title="Readiness"
                subtitle="How ready you are for the day"
                icon="💪"
              />
            )}

            {wellnessData.metrics.metrics?.sleep?.data?.[0] && (
              <ScoreGauge
                score={wellnessData.metrics.metrics.sleep.data[0].score}
                title="Sleep"
                subtitle="Quality of last night's sleep"
                icon="😴"
              />
            )}

            {wellnessData.metrics.metrics?.activity?.data?.[0] && (
              <ScoreGauge
                score={wellnessData.metrics.metrics.activity.data[0].score}
                title="Activity"
                subtitle="Yesterday's activity level"
                icon="🏃"
              />
            )}
          </div>

          {/* Detailed Contributors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {wellnessData.metrics.metrics?.readiness?.data?.[0]?.contributors && (
              <ReadinessContributors
                contributors={wellnessData.metrics.metrics.readiness.data[0].contributors}
              />
            )}

            {wellnessData.metrics.metrics?.sleep?.data?.[0]?.contributors && (
              <SleepContributors
                contributors={wellnessData.metrics.metrics.sleep.data[0].contributors}
              />
            )}
          </div>

          {/* Heart Rate Data */}
          {wellnessData.metrics.metrics?.heartRate && (
            <HeartRateInfo heartRateData={wellnessData.metrics.metrics.heartRate} />
          )}

          {/* Body Temperature */}
          {wellnessData.metrics.metrics?.readiness?.data?.[0]?.temperature_deviation !== undefined && (
            <Card variant="canvas">
              <h3 className="text-2xl font-poster text-vintage-text mb-4">Body Temperature</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-poster text-vintage-text">
                    {wellnessData.metrics.metrics.readiness.data[0].temperature_deviation > 0 ? '+' : ''}
                    {wellnessData.metrics.metrics.readiness.data[0].temperature_deviation.toFixed(2)}°C
                  </div>
                  <div className="text-sm font-ui uppercase text-vintage-text opacity-70">
                    Temperature Deviation
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-poster text-vintage-text">
                    {wellnessData.metrics.metrics.readiness.data[0].temperature_trend_deviation > 0 ? '+' : ''}
                    {wellnessData.metrics.metrics.readiness.data[0].temperature_trend_deviation.toFixed(2)}°C
                  </div>
                  <div className="text-sm font-ui uppercase text-vintage-text opacity-70">
                    Trend Deviation
                  </div>
                </div>
              </div>
              <p className="text-sm text-vintage-text opacity-70 mt-4 text-center">
                Relative to your baseline body temperature
              </p>
            </Card>
          )}
        </>
      )}

      {/* Trend Visualization */}
      {!isLoading && trendData.length > 0 && (
        <OuraScoreChart
          data={trendData}
          title="7-Day Wellness Trends"
        />
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
