import React from 'react';

const Loading = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-sand rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-terracotta border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
        {text}
      </p>
    </div>
  );
};

export default Loading;
