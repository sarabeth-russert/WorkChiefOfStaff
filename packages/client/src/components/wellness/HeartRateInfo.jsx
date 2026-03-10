import React from 'react';
import { Card } from '../ui';

const HeartRateInfo = ({ heartRateData }) => {
  if (!heartRateData || !heartRateData.data || heartRateData.data.length === 0) {
    return null;
  }

  // Calculate statistics
  const bpmValues = heartRateData.data.map(d => d.bpm);
  const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
  const minBpm = Math.min(...bpmValues);
  const maxBpm = Math.max(...bpmValues);

  // Group by source
  const bySource = heartRateData.data.reduce((acc, reading) => {
    acc[reading.source] = (acc[reading.source] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card variant="canvas">
      <h3 className="text-2xl font-poster text-vintage-text mb-4">Heart Rate Data</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-poster text-vintage-text">{avgBpm}</div>
          <div className="text-sm font-ui uppercase text-vintage-text opacity-70">Avg BPM</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-poster text-vintage-text">{minBpm}</div>
          <div className="text-sm font-ui uppercase text-vintage-text opacity-70">Min BPM</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-poster text-vintage-text">{maxBpm}</div>
          <div className="text-sm font-ui uppercase text-vintage-text opacity-70">Max BPM</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-poster text-vintage-text">{heartRateData.data.length}</div>
          <div className="text-sm font-ui uppercase text-vintage-text opacity-70">Readings</div>
        </div>
      </div>
      <div className="border-t-2 border-vintage-text border-opacity-20 pt-4">
        <h4 className="text-sm font-ui uppercase text-vintage-text opacity-70 mb-2">Readings by Activity</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(bySource).map(([source, count]) => (
            <div
              key={source}
              className="px-3 py-1 bg-vintage-text bg-opacity-10 rounded-full"
            >
              <span className="text-sm font-ui uppercase text-vintage-text">
                {source}: {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default HeartRateInfo;
