import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Main navigation items (always visible)
  const mainNavItems = [
    { path: '/expedition', label: 'Expedition' },
    { path: '/base-camp', label: 'Base Camp' },
    { path: '/jira', label: 'Field Assignments' }
  ];

  // Grouped dropdown items
  const dropdownGroups = {
    planning: {
      label: 'Planning',
      items: [
        { path: '/outbound-passage', label: 'Outbound Passage', description: 'Calendar' },
        { path: '/map-room', label: 'Map Room', description: 'Documentation' },
        { path: '/outpost', label: 'Outpost', description: 'Knowledge Base' }
      ]
    },
    operations: {
      label: 'Operations',
      items: [
        { path: '/trading-post', label: 'Trading Post', description: 'Apps & Services' },
        { path: '/medic', label: 'Medic', description: 'Wellness' }
      ]
    }
  };

  const toggleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  return (
    <nav className="bg-jungle border-b-4 border-jungle-dark shadow-vintage">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            {!logoError ? (
              <img
                src="/images/logo.png"
                alt="Adventureland Logo"
                className="w-20 h-20 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-6xl">🌴</span>
            )}
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
          <div className="flex gap-2 items-center">
            {/* Main navigation items */}
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-4 py-2 font-ui uppercase tracking-wide text-sm
                    transition-all duration-150 border-2 rounded whitespace-nowrap
                    ${isActive
                      ? 'bg-cream text-jungle-dark border-cream shadow-vintage-pressed translate-y-0.5'
                      : 'bg-transparent text-cream border-jungle-light hover:bg-jungle-light hover:-translate-y-0.5 hover:shadow-vintage'
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Dropdown groups */}
            {Object.entries(dropdownGroups).map(([key, group]) => {
              const isOpen = openDropdown === key;
              const hasActiveItem = group.items.some(item => location.pathname === item.path);

              return (
                <div key={key} className="relative">
                  <button
                    onClick={() => toggleDropdown(key)}
                    onMouseEnter={() => setOpenDropdown(key)}
                    onMouseLeave={() => setOpenDropdown(null)}
                    className={`
                      px-4 py-2 font-ui uppercase tracking-wide text-sm
                      transition-all duration-150 border-2 rounded whitespace-nowrap
                      flex items-center gap-2
                      ${hasActiveItem
                        ? 'bg-cream text-jungle-dark border-cream shadow-vintage-pressed translate-y-0.5'
                        : 'bg-transparent text-cream border-jungle-light hover:bg-jungle-light hover:-translate-y-0.5 hover:shadow-vintage'
                      }
                    `}
                  >
                    <span>{group.label}</span>
                    <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {/* Dropdown menu */}
                  {isOpen && (
                    <div
                      className="absolute top-full mt-2 right-0 bg-cream border-4 border-jungle-dark shadow-vintage-strong rounded-lg overflow-hidden z-50 min-w-[240px]"
                      onMouseEnter={() => setOpenDropdown(key)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`
                              block px-4 py-3 border-b-2 border-sand
                              transition-all duration-150
                              ${isActive
                                ? 'bg-jungle text-cream'
                                : 'bg-cream text-vintage-text hover:bg-sand'
                              }
                            `}
                          >
                            <div className="font-ui uppercase tracking-wide text-sm font-bold">
                              {item.label}
                            </div>
                            <div className="font-serif text-xs opacity-70 mt-1">
                              {item.description}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Settings link */}
            <Link
              to="/settings"
              className={`
                px-4 py-2 font-ui uppercase tracking-wide text-sm
                transition-all duration-150 border-2 rounded whitespace-nowrap
                ${location.pathname === '/settings'
                  ? 'bg-cream text-jungle-dark border-cream shadow-vintage-pressed translate-y-0.5'
                  : 'bg-transparent text-cream border-jungle-light hover:bg-jungle-light hover:-translate-y-0.5 hover:shadow-vintage'
                }
              `}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
