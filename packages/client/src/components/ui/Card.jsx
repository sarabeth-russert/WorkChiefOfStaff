import React from 'react';

const Card = ({
  children,
  title,
  icon,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-cream border-vintage-text',
    canvas: 'canvas-texture border-vintage-text',
    agent: 'canvas-texture border-current'
  };

  return (
    <div
      className={`rounded-lg border-3 shadow-vintage p-6 ${variants[variant]} ${className}`}
      {...props}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4">
          {icon && <span className="text-3xl">{icon}</span>}
          {title && (
            <h3 className="text-2xl font-poster text-letterpress text-vintage-text">
              {title}
            </h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
