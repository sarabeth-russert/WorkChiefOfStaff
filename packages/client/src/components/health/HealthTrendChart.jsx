import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui';

const HealthTrendChart = ({ data, title, unit, color = '#D2691E' }) => {
  if (!data || data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const formatted = typeof val === 'number'
        ? (val >= 1000 ? val.toLocaleString() : (Number.isInteger(val) ? val : val.toFixed(1)))
        : val;
      return (
        <div className="bg-cream border-2 border-vintage-text p-3 rounded shadow-vintage">
          <p className="font-poster text-vintage-text mb-1">{label}</p>
          <p className="text-sm" style={{ color }}>
            {formatted} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format date labels to short form (MM-DD)
  const chartData = data.map(d => ({
    ...d,
    label: d.date.slice(5), // "03-23"
  }));

  return (
    <Card variant="canvas">
      <h4 className="text-lg font-poster text-vintage-text mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#8B7355" opacity={0.3} />
          <XAxis
            dataKey="label"
            stroke="#3d2817"
            style={{ fontFamily: 'monospace', fontSize: '11px' }}
          />
          <YAxis
            stroke="#3d2817"
            style={{ fontFamily: 'monospace', fontSize: '11px' }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default React.memo(HealthTrendChart);
