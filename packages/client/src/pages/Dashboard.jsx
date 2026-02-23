import React from 'react';
import { Card } from '../components/ui';

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-7xl font-poster text-vintage-text text-letterpress mb-4">
          Welcome to Adventureland
        </h1>
        <p className="text-xl text-vintage-text opacity-80 max-w-2xl mx-auto">
          Your personal Chief of Staff system for managing development workflows,
          AI agents, and knowledge with vintage charm.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="canvas" className="text-center">
          <div className="text-5xl mb-3">🗺️</div>
          <h3 className="text-3xl font-poster text-vintage-text mb-2">6</h3>
          <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
            Active Agents
          </p>
        </Card>

        <Card variant="canvas" className="text-center">
          <div className="text-5xl mb-3">💰</div>
          <h3 className="text-3xl font-poster text-vintage-text mb-2">0</h3>
          <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
            Managed Apps
          </p>
        </Card>

        <Card variant="canvas" className="text-center">
          <div className="text-5xl mb-3">📍</div>
          <h3 className="text-3xl font-poster text-vintage-text mb-2">0</h3>
          <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
            Knowledge Items
          </p>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Expedition" icon="🗺️">
          <p className="mb-4 text-vintage-text">
            Deploy your team of AI agents to tackle coding tasks, from reviews
            to refactoring. Each agent brings unique skills and personality.
          </p>
          <a
            href="/expedition"
            className="text-terracotta hover:text-terracotta-dark font-ui uppercase text-sm"
          >
            Launch Expedition →
          </a>
        </Card>

        <Card title="Trading Post" icon="💰">
          <p className="mb-4 text-vintage-text">
            Manage your local development applications with PM2 integration.
            Start, stop, and monitor all your projects from one place.
          </p>
          <a
            href="/trading-post"
            className="text-terracotta hover:text-terracotta-dark font-ui uppercase text-sm"
          >
            Visit Trading Post →
          </a>
        </Card>

        <Card title="Map Room" icon="📍">
          <p className="mb-4 text-vintage-text">
            Your Second Brain for capturing and retrieving knowledge with
            semantic search. Never lose track of important information again.
          </p>
          <a
            href="/map-room"
            className="text-terracotta hover:text-terracotta-dark font-ui uppercase text-sm"
          >
            Enter Map Room →
          </a>
        </Card>

        <Card title="Outpost" icon="⛺">
          <p className="mb-4 text-vintage-text">
            Access integrated terminal, Git tools, and system monitoring.
            Your command center for developer operations.
          </p>
          <a
            href="/outpost"
            className="text-terracotta hover:text-terracotta-dark font-ui uppercase text-sm"
          >
            Open Outpost →
          </a>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
