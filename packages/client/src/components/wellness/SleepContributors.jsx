import React from 'react';
import { Card } from '../ui';

const SleepContributors = ({ contributors }) => {
  if (!contributors) return null;

  const getContributorColor = (score) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getContributorLabel = (key) => {
    const labels = {
      deep_sleep: 'Deep Sleep',
      efficiency: 'Efficiency',
      latency: 'Latency',
      rem_sleep: 'REM Sleep',
      restfulness: 'Restfulness',
      timing: 'Timing',
      total_sleep: 'Total Sleep'
    };
    return labels[key] || key;
  };

  const contributorEntries = Object.entries(contributors).sort((a, b) => b[1] - a[1]);

  return (
    <Card variant="canvas">
      <h3 className="text-2xl font-poster text-vintage-text mb-4">Sleep Contributors</h3>
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

export default SleepContributors;
