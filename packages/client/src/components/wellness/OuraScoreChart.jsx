import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui';

const OuraScoreChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-cream border-2 border-vintage-text p-3 rounded shadow-vintage">
          <p className="font-poster text-vintage-text mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="canvas">
      <h3 className="text-2xl font-poster text-vintage-text mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#8B7355" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#3d2817"
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <YAxis
            stroke="#3d2817"
            domain={[0, 100]}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontFamily: 'monospace',
              fontSize: '12px',
              paddingTop: '10px'
            }}
          />
          <Line
            type="monotone"
            dataKey="readiness"
            stroke="#D2691E"
            strokeWidth={2}
            dot={{ fill: '#D2691E', r: 4 }}
            name="Readiness"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="sleep"
            stroke="#8B7355"
            strokeWidth={2}
            dot={{ fill: '#8B7355', r: 4 }}
            name="Sleep"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default React.memo(OuraScoreChart);
