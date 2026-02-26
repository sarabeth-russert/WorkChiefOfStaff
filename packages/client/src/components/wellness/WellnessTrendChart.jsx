import React from 'react';
import { Card } from '../ui';

const WellnessTrendChart = ({ title, data = [], metricKey, scoreKey = 'score' }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-xl font-poster text-vintage-text mb-4">{title}</h3>
        <p className="text-vintage-text opacity-70 text-center py-8">
          No trend data available yet. Check back after a few days of data collection.
        </p>
      </Card>
    );
  }

  // Calculate min/max for scaling
  const values = data.map(d => d[scoreKey] || 0);
  const maxValue = Math.max(...values, 100);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 100;

  // Simple bar chart visualization
  return (
    <Card>
      <h3 className="text-xl font-poster text-vintage-text mb-4">{title}</h3>

      <div className="space-y-2">
        {data.map((item, index) => {
          const value = item[scoreKey] || 0;
          const percentage = ((value - minValue) / range) * 100;
          const date = new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          // Color based on score
          let barColor = 'bg-mustard';
          if (value >= 85) barColor = 'bg-jungle';
          else if (value >= 70) barColor = 'bg-mustard';
          else if (value >= 50) barColor = 'bg-terracotta';
          else barColor = 'bg-terracotta-dark';

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-16 text-sm font-ui text-vintage-text">
                {date}
              </div>
              <div className="flex-1 bg-sand rounded-full h-6 relative border-2 border-vintage-text">
                <div
                  className={`${barColor} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                >
                  <span className="text-xs font-poster text-cream drop-shadow">
                    {value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t-2 border-vintage-text flex flex-wrap gap-4 text-sm font-ui">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-jungle rounded-full border-2 border-vintage-text" />
          <span className="text-vintage-text">Excellent (85+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-mustard rounded-full border-2 border-vintage-text" />
          <span className="text-vintage-text">Good (70-84)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-terracotta rounded-full border-2 border-vintage-text" />
          <span className="text-vintage-text">Fair (50-69)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-terracotta-dark rounded-full border-2 border-vintage-text" />
          <span className="text-vintage-text">Poor (&lt;50)</span>
        </div>
      </div>
    </Card>
  );
};

export default WellnessTrendChart;
