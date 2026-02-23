import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles = 'font-ui uppercase tracking-wide transition-all duration-150 relative disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-terracotta text-cream border-3 border-terracotta-dark shadow-vintage hover:shadow-vintage-hover active:shadow-vintage-pressed',
    secondary: 'bg-jungle text-cream border-3 border-jungle-dark shadow-vintage hover:shadow-vintage-hover active:shadow-vintage-pressed',
    outline: 'bg-transparent text-vintage-text border-3 border-vintage-text shadow-vintage hover:bg-sand active:shadow-vintage-pressed',
    ghost: 'bg-transparent text-vintage-accent hover:bg-sand-light border-0 shadow-none'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const hoverEffect = disabled ? '' : 'hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${hoverEffect} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
