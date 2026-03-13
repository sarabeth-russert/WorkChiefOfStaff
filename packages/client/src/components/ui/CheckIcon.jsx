import React from 'react';

const CheckIcon = ({ size = 'w-6 h-6', className = '' }) => (
  <span className={`${size} inline-flex items-center justify-center flex-shrink-0 ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" aria-hidden="true">
      <path
        d="M4 12.5L9.5 18L20 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export default CheckIcon;
