import React from 'react';
import SimpleTerminal from '../components/terminal/SimpleTerminal';
import GitStatus from '../components/git/GitStatus';

const Outpost = () => {
  return (
    <div className="space-y-8">
      {/* Hero Header with Image */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage">
        <img
          src="/images/pages/outpost-header.png"
          alt="Outpost"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress drop-shadow-lg mb-2">
            Outpost
          </h1>
          <p className="text-lg text-vintage-text opacity-90 drop-shadow">
            Developer Tools - Terminal & Git Operations
          </p>
        </div>
      </div>

      {/* Git Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GitStatus />
        </div>

        {/* System Stats Placeholder */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <div className="bg-canvas-texture border-3 border-jungle rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">💾</div>
            <h3 className="text-2xl font-poster text-vintage-text mb-1">Server</h3>
            <p className="text-sm font-mono text-vintage-text opacity-70">
              Running
            </p>
          </div>

          <div className="bg-canvas-texture border-3 border-sunset rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🔧</div>
            <h3 className="text-2xl font-poster text-vintage-text mb-1">PM2</h3>
            <p className="text-sm font-mono text-vintage-text opacity-70">Managed</p>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <SimpleTerminal />
    </div>
  );
};

export default Outpost;
