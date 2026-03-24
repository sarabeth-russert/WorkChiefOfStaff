import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui';
import HealthMetricCard from './HealthMetricCard';
import HealthTrendChart from './HealthTrendChart';
import HealthImportPanel from './HealthImportPanel';

// Priority metrics to show trends for (ordered)
const TREND_METRICS = [
  { key: 'step_count', label: 'Steps', unit: 'steps', color: '#DAA520', icon: '\u{1F6B6}' },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', color: '#D2691E', icon: '\u{2764}\u{FE0F}' },
  { key: 'heart_rate_variability_sdnn', label: 'HRV (SDNN)', unit: 'ms', color: '#8B7355', icon: '\u{1F4C8}' },
  { key: 'resting_heart_rate', label: 'Resting HR', unit: 'bpm', color: '#A0522D', icon: '\u{1F49A}' },
  { key: 'body_mass', label: 'Weight', unit: 'lb', color: '#6B8E23', icon: '\u{2696}\u{FE0F}' },
  { key: 'vo2_max', label: 'VO2 Max', unit: 'mL/kg/min', color: '#2E8B57', icon: '\u{1F3CB}\u{FE0F}' },
];

// Card configs for quick-glance metrics
const VITALS_CARDS = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', color: '#D2691E', icon: '\u{2764}\u{FE0F}', field: 'avg', secondaryField: 'max', secondaryLabel: 'Peak' },
  { key: 'heart_rate_variability_sdnn', label: 'HRV', unit: 'ms', color: '#8B7355', icon: '\u{1F4C8}', field: 'avg' },
  { key: 'resting_heart_rate', label: 'Resting HR', unit: 'bpm', color: '#A0522D', icon: '\u{1F49A}', field: 'avg' },
  { key: 'vo2_max', label: 'VO2 Max', unit: 'mL/kg/min', color: '#2E8B57', icon: '\u{1F3CB}\u{FE0F}', field: 'latest' },
  { key: 'blood_oxygen_saturation', label: 'Blood O2', unit: '%', color: '#4682B4', icon: '\u{1FAC1}', field: 'avg' },
];

const ACTIVITY_CARDS = [
  { key: 'step_count', label: 'Steps', unit: 'steps', color: '#DAA520', icon: '\u{1F6B6}', field: 'total' },
  { key: 'active_energy', label: 'Active Cal', unit: 'kcal', color: '#CD853F', icon: '\u{1F525}', field: 'total' },
  { key: 'apple_exercise_time', label: 'Exercise', unit: 'min', color: '#BC8F8F', icon: '\u{23F1}\u{FE0F}', field: 'total' },
  { key: 'walking_running_distance', label: 'Distance', unit: 'mi', color: '#8B4513', icon: '\u{1F4CF}', field: 'total' },
];

const BODY_CARDS = [
  { key: 'body_mass', label: 'Weight', unit: 'lb', color: '#6B8E23', icon: '\u{2696}\u{FE0F}', field: 'latest' },
  { key: 'body_fat_percentage', label: 'Body Fat', unit: '%', color: '#808000', icon: '\u{1F4CA}', field: 'latest' },
  { key: 'lean_body_mass', label: 'Lean Mass', unit: 'lb', color: '#556B2F', icon: '\u{1F4AA}', field: 'latest' },
];

const HealthDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch summary (latest values)
      const summaryRes = await fetch(`${apiUrl}/api/health/summary`);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.latest);
        setHasData(data.dateRange != null);

        // Only fetch trends if we have data
        if (data.dateRange) {
          const trendPromises = TREND_METRICS.map(async (m) => {
            try {
              const res = await fetch(`${apiUrl}/api/health/trends?metric=${m.key}&days=14`);
              if (res.ok) {
                const td = await res.json();
                return { key: m.key, trend: td.trend || [] };
              }
            } catch { /* skip */ }
            return { key: m.key, trend: [] };
          });

          const trendResults = await Promise.all(trendPromises);
          const trendMap = {};
          trendResults.forEach(r => { trendMap[r.key] = r.trend; });
          setTrends(trendMap);
        }
      }
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getMetricValue = (key, field) => {
    const entry = summary?.[key];
    if (!entry) return null;
    return entry[field] ?? entry.value ?? null;
  };

  const renderCardRow = (cards, title) => {
    const available = cards.filter(c => getMetricValue(c.key, c.field) != null);
    if (available.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xl font-poster text-vintage-text mb-3">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {available.map(c => (
            <HealthMetricCard
              key={c.key}
              label={c.label}
              value={getMetricValue(c.key, c.field)}
              unit={c.unit}
              color={c.color}
              icon={c.icon}
              secondaryValue={c.secondaryField ? getMetricValue(c.key, c.secondaryField) : null}
              secondaryLabel={c.secondaryLabel}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderTrends = () => {
    const available = TREND_METRICS.filter(m => trends[m.key]?.length > 1);
    if (available.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xl font-poster text-vintage-text mb-3">14-Day Trends</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {available.map(m => (
            <HealthTrendChart
              key={m.key}
              data={trends[m.key]}
              title={m.label}
              unit={m.unit}
              color={m.color}
            />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card variant="canvas">
        <div className="text-center py-8">
          <div className="text-4xl mb-3">&#x1F34E;</div>
          <p className="text-vintage-text font-ui uppercase text-sm">Loading Apple Health data...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-3xl">&#x1F34E;</span>
        <h2 className="text-3xl font-poster text-vintage-text">Apple Health</h2>
      </div>

      {hasData ? (
        <>
          {renderCardRow(VITALS_CARDS, 'Vitals')}
          {renderCardRow(ACTIVITY_CARDS, 'Activity')}
          {renderCardRow(BODY_CARDS, 'Body')}
          {renderTrends()}
        </>
      ) : (
        <Card variant="canvas">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">&#x1F34E;</div>
            <h3 className="text-2xl font-poster text-vintage-text mb-2">No Apple Health Data Yet</h3>
            <p className="text-vintage-text max-w-md mx-auto mb-4">
              Import your Apple Health data to see heart rate, HRV, steps, sleep, body composition, and more alongside your Oura metrics.
            </p>
          </div>
        </Card>
      )}

      {/* Import Panel (always shown) */}
      <HealthImportPanel onImportComplete={fetchData} />
    </div>
  );
};

export default HealthDashboard;
