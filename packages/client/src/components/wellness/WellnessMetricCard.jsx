import React from 'react';
import { Card } from '../ui';

const WellnessMetricCard = ({
  title,
  score,
  icon,
  iconImage,
  description,
  status = 'good',
  lastUpdated
}) => {
  const statusColors = {
    excellent: 'text-jungle',
    good: 'text-mustard',
    fair: 'text-terracotta',
    poor: 'text-terracotta-dark'
  };

  const statusBorders = {
    excellent: 'border-jungle',
    good: 'border-mustard',
    fair: 'border-terracotta',
    poor: 'border-terracotta-dark'
  };

  return (
    <Card variant="canvas" className={`${statusBorders[status]} relative`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {iconImage ? (
            <img
              src={iconImage}
              alt={title}
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          {icon && (
            <span className="text-4xl" style={{ display: iconImage ? 'none' : 'block' }}>
              {icon}
            </span>
          )}
          <div>
            <h3 className="text-xl font-poster text-vintage-text">{title}</h3>
            {lastUpdated && (
              <p className="text-xs text-vintage-text opacity-60 font-ui uppercase">
                {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        {score !== undefined && score !== null && (
          <div className={`text-4xl font-poster ${statusColors[status]}`}>
            {score}
          </div>
        )}
      </div>

      {description && (
        <p className="text-vintage-text text-sm mb-2">{description}</p>
      )}

      <div className="absolute top-2 right-2">
        <span className={`inline-block w-3 h-3 rounded-full ${
          status === 'excellent' ? 'bg-jungle' :
          status === 'good' ? 'bg-mustard' :
          status === 'fair' ? 'bg-terracotta' :
          'bg-terracotta-dark'
        }`} />
      </div>
    </Card>
  );
};

export default WellnessMetricCard;
