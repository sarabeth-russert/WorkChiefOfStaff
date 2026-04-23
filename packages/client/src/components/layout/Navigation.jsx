import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  const mainNavItems = [
    { path: '/expedition', label: 'Expedition' },
    { path: '/base-camp', label: 'Base Camp' },
    { path: '/jira', label: 'Field Assignments' }
  ];

  const dropdownGroups = {
    planning: {
      label: 'Planning',
      items: [
        { path: '/outbound-passage', label: 'Outbound Passage', description: 'Calendar' },
        { path: '/map-room', label: 'Map Room', description: 'Documentation' },
        { path: '/outpost', label: 'Outpost', description: 'Developer Tools' }
      ]
    },
    operations: {
      label: 'Operations',
      items: [
        { path: '/trading-post', label: 'Trading Post', description: 'Apps & Services' },
        { path: '/medic', label: 'Medic', description: 'Wellness' },
        { path: '/field-training', label: 'Field Training', description: 'Training' }
      ]
    }
  };

  const toggleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const navLinkClass = (isActive) => `
    px-4 py-2 font-ui uppercase tracking-wide text-sm
    transition-all duration-150 border-2 rounded whitespace-nowrap
    ${isActive
      ? 'bg-cream text-jungle-dark border-cream shadow-vintage-pressed translate-y-0.5'
      : 'bg-transparent text-cream border-jungle-light hover:bg-jungle-light hover:-translate-y-0.5 hover:shadow-vintage'
    }
  `;

  const mobileNavLinkClass = (isActive) => `
    block px-4 py-3 font-ui uppercase tracking-wide text-sm border-b-2 border-jungle-light
    transition-colors
    ${isActive ? 'bg-cream text-jungle-dark' : 'text-cream hover:bg-jungle-light'}
  `;

  return (
    <nav className="bg-jungle border-b-4 border-jungle-dark shadow-vintage">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            {!logoError ? (
              <img
                src="/images/logo.png"
                alt="Adventureland Logo"
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-4xl sm:text-6xl">🌴</span>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-3xl font-poster text-cream text-letterpress leading-none">
                Adventureland
              </h1>
              <span className="text-xs sm:text-sm font-ui text-sand uppercase tracking-wider">
                Chief of Staff
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-2 items-center">
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={navLinkClass(location.pathname === item.path)}
              >
                {item.label}
              </Link>
            ))}

            {Object.entries(dropdownGroups).map(([key, group]) => {
              const isOpen = openDropdown === key;
              const hasActiveItem = group.items.some(item => location.pathname === item.path);

              return (
                <div
                  key={key}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(key)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => toggleDropdown(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setOpenDropdown(null);
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setOpenDropdown(key);
                      }
                    }}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
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
                    <span className={`transition-transform text-xs ${isOpen ? 'rotate-180' : ''}`}>&#9660;</span>
                  </button>

                  {isOpen && (
                    <div
                      className="absolute top-full right-0 bg-cream border-4 border-jungle-dark shadow-vintage-strong rounded-lg overflow-hidden z-50 min-w-[240px]"
                      role="menu"
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

            <Link
              to="/settings"
              className={navLinkClass(location.pathname === '/settings')}
            >
              Settings
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2 border-2 border-jungle-light rounded hover:bg-jungle-light transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <span className={`block w-6 h-0.5 bg-cream transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-cream transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-cream transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div ref={mobileMenuRef} className="lg:hidden border-t-2 border-jungle-light bg-jungle">
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={mobileNavLinkClass(location.pathname === item.path)}
            >
              {item.label}
            </Link>
          ))}

          {Object.entries(dropdownGroups).map(([key, group]) => (
            <div key={key}>
              <button
                onClick={() => toggleDropdown(openDropdown === key ? null : key)}
                className="w-full flex items-center justify-between px-4 py-3 font-ui uppercase tracking-wide text-sm text-cream border-b-2 border-jungle-light hover:bg-jungle-light transition-colors"
              >
                <span>{group.label}</span>
                <span className={`transition-transform text-xs ${openDropdown === key ? 'rotate-180' : ''}`}>&#9660;</span>
              </button>
              {openDropdown === key && (
                <div className="bg-jungle-dark">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        block pl-8 pr-4 py-3 border-b border-jungle transition-colors
                        ${location.pathname === item.path
                          ? 'bg-cream text-jungle-dark'
                          : 'text-cream hover:bg-jungle'
                        }
                      `}
                    >
                      <div className="font-ui uppercase tracking-wide text-sm">{item.label}</div>
                      <div className="font-serif text-xs opacity-70">{item.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link
            to="/settings"
            className={mobileNavLinkClass(location.pathname === '/settings')}
          >
            Settings
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
