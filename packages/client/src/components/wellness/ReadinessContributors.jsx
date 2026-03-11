import React from 'react';
import { Card } from '../ui';
import { getContributorColor, READINESS_LABELS } from '../../utils/wellness';

const ReadinessContributors = ({ contributors }) => {
  if (!contributors) return null;

  const getContributorLabel = (key) => READINESS_LABELS[key] || key;

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
