import React, { useState } from 'react';
import { Card } from '../ui';

const AgentCard = ({ agent, selected, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const agentColors = {
    explorer: 'border-jungle',
    trader: 'border-mustard',
    navigator: 'border-teal',
    archaeologist: 'border-sand-dark',
    scout: 'border-sunset',
    guide: 'border-burgundy'
  };

  const borderColor = agentColors[agent.type] || 'border-vintage-text';
  const selectedClass = selected ? 'ring-4 ring-terracotta scale-105' : '';

  return (
    <Card
      variant="agent"
      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${borderColor} ${selectedClass}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
          {!imageError && agent.imagePath ? (
            <img
              src={agent.imagePath}
              alt={agent.name}
              className="w-full h-full object-contain rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-5xl">{agent.icon}</div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-poster text-vintage-text mb-1">
            {agent.name}
          </h3>
          <p className="text-sm text-vintage-text opacity-70 mb-2 italic">
            {agent.personality}
          </p>
          <p className="text-sm text-vintage-text mb-3">
            {agent.role}
          </p>
          <div className="flex flex-wrap gap-2">
            {agent.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-sand text-vintage-text text-xs font-ui uppercase rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AgentCard;
