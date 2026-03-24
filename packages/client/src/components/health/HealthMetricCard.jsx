import React from 'react';
import { Card } from '../ui';

const HealthMetricCard = ({ label, value, unit, secondaryValue, secondaryLabel, color, icon }) => {
  if (value == null) return null;

  const formatValue = (val) => {
    if (val == null) return '--';
    if (typeof val === 'number') {
      return val >= 1000 ? val.toLocaleString() : (Number.isInteger(val) ? val : val.toFixed(1));
    }
    return val;
  };

  return (
    <Card variant="canvas" className="flex flex-col items-center py-5">
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <div className="text-4xl font-poster text-vintage-text" style={{ color }}>
        {formatValue(value)}
      </div>
      <div className="text-xs font-ui uppercase text-vintage-text opacity-60 mt-1">
        {unit}
      </div>
      <div className="text-sm font-poster text-vintage-text mt-2">{label}</div>
      {secondaryValue != null && (
        <div className="text-xs font-ui text-vintage-text opacity-50 mt-1">
          {secondaryLabel}: {formatValue(secondaryValue)}
        </div>
      )}
    </Card>
  );
};

export default HealthMetricCard;
