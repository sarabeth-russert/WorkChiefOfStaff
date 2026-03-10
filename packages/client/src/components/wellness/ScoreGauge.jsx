import React from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Card } from '../ui';

const ScoreGauge = ({ score, title, subtitle, icon }) => {
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981'; // green
    if (score >= 70) return '#3b82f6'; // blue
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const data = [
    {
      name: title,
      value: score,
      fill: getScoreColor(score)
    }
  ];

  const getStatus = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Pay Attention';
  };

  return (
    <Card variant="canvas" className="flex flex-col items-center">
      <h3 className="text-2xl font-poster text-vintage-text mb-2">{title}</h3>
      {subtitle && (
        <p className="text-sm text-vintage-text opacity-70 mb-4">{subtitle}</p>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={20}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
            label={{
              position: 'center',
              fill: '#3d2817',
              fontSize: '32px',
              fontWeight: 'bold',
              fontFamily: 'serif'
            }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center mt-2">
        <span className="text-lg font-poster" style={{ color: getScoreColor(score) }}>
          {getStatus(score)}
        </span>
      </div>
      {icon && (
        <div className="text-4xl mt-2">{icon}</div>
      )}
    </Card>
  );
};

export default ScoreGauge;
