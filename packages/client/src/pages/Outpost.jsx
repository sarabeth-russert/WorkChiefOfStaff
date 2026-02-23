import React from 'react';
import SimpleTerminal from '../components/terminal/SimpleTerminal';
import GitStatus from '../components/git/GitStatus';

const Outpost = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-6xl font-poster text-vintage-text text-letterpress mb-4">
          ⛺ Outpost
        </h1>
        <p className="text-lg text-vintage-text opacity-80">
          Developer Tools - Terminal & Git Operations
        </p>
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
