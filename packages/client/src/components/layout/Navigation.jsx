import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/expedition', label: 'Expedition', icon: '🗺️' },
    { path: '/trading-post', label: 'Trading Post', icon: '💰' },
    { path: '/map-room', label: 'Map Room', icon: '📍' },
    { path: '/outpost', label: 'Outpost', icon: '⛺' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <nav className="bg-jungle border-b-4 border-jungle-dark shadow-vintage">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-4xl">🌴</span>
            <div className="flex flex-col">
              <h1 className="text-3xl font-poster text-cream text-letterpress leading-none">
                Adventureland
              </h1>
              <span className="text-sm font-ui text-sand uppercase tracking-wider">
                Chief of Staff
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 font-ui uppercase tracking-wide text-sm
                    transition-all duration-150 border-2 rounded
                    ${isActive
                      ? 'bg-cream text-jungle-dark border-cream shadow-vintage-pressed translate-y-0.5'
                      : 'bg-transparent text-cream border-jungle-light hover:bg-jungle-light hover:-translate-y-0.5 hover:shadow-vintage'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
