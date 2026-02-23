import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const baseStyles = 'w-full px-4 py-3 font-serif text-vintage-text bg-cream-light border-3 border-vintage-text rounded-md shadow-vintage focus:outline-none focus:shadow-vintage-hover transition-shadow';
  const errorStyles = error ? 'border-terracotta-dark' : '';

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <label className="font-ui text-lg uppercase tracking-wide text-vintage-text">
          {label}
        </label>
      )}
      <input
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-terracotta-dark font-serif">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-sm text-vintage-text opacity-70 font-serif">
          {helperText}
        </span>
      )}
    </div>
  );
};

export const TextArea = ({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}) => {
  const baseStyles = 'w-full px-4 py-3 font-serif text-vintage-text bg-cream-light border-3 border-vintage-text rounded-md shadow-vintage focus:outline-none focus:shadow-vintage-hover transition-shadow resize-y';
  const errorStyles = error ? 'border-terracotta-dark' : '';

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <label className="font-ui text-lg uppercase tracking-wide text-vintage-text">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-terracotta-dark font-serif">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-sm text-vintage-text opacity-70 font-serif">
          {helperText}
        </span>
      )}
    </div>
  );
};

export default Input;
