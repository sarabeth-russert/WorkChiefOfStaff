import React, { useState } from 'react';

const Card = ({
  children,
  title,
  icon,
  iconImage,
  variant = 'default',
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

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
      {(title || icon || iconImage) && (
        <div className="flex items-center gap-3 mb-4">
          {(icon || iconImage) && (
            <div className="flex-shrink-0">
              {!imageError && iconImage ? (
                <img
                  src={iconImage}
                  alt={title || 'Icon'}
                  className="w-12 h-12 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : icon ? (
                <span className="text-3xl">{icon}</span>
              ) : null}
            </div>
          )}
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
