import React from 'react';
import { Card } from '../ui';

const ReadinessContributors = ({ contributors }) => {
  if (!contributors) return null;

  const getContributorColor = (score) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getContributorLabel = (key) => {
    const labels = {
      activity_balance: 'Activity Balance',
      body_temperature: 'Body Temperature',
      hrv_balance: 'HRV Balance',
      previous_day_activity: 'Previous Day Activity',
      previous_night: 'Previous Night',
      recovery_index: 'Recovery Index',
      resting_heart_rate: 'Resting Heart Rate',
      sleep_balance: 'Sleep Balance',
      sleep_regularity: 'Sleep Regularity'
    };
    return labels[key] || key;
  };

  const contributorEntries = Object.entries(contributors).sort((a, b) => b[1] - a[1]);

  return (
    <Card variant="canvas">
      <h3 className="text-2xl font-poster text-vintage-text mb-4">Readiness Contributors</h3>
      <div className="space-y-3">
        {contributorEntries.map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-ui uppercase text-vintage-text opacity-80">
                {getContributorLabel(key)}
              </span>
              <span className="font-poster text-vintage-text">{value}</span>
            </div>
            <div className="w-full bg-vintage-text bg-opacity-20 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getContributorColor(value)} transition-all duration-300`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ReadinessContributors;
