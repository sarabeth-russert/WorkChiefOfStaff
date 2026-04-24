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
    px-4 py-2 font-ui uppercase tracking-normal text-sm
    transition-all duration-150 rounded-sm whitespace-nowrap border-2
    ${isActive
      ? 'bg-cream text-jungle-dark border-cream shadow-vintage-pressed border-b-mustard'
      : 'text-cream/80 border-cream/10 hover:text-cream hover:border-cream/20 hover:bg-cream/5'
    }
  `;

  const mobileNavLinkClass = (isActive) => `
    block px-4 py-3 font-ui uppercase tracking-normal text-sm border-b border-cream/10
    transition-colors
    ${isActive ? 'bg-cream/90 text-jungle-dark border-l-2 border-l-mustard' : 'text-cream/80 hover:bg-cream/8'}
  `;

  return (
    <nav className="bg-jungle shadow-vintage relative" style={{ backgroundImage: 'linear-gradient(to bottom, transparent 0%, rgba(58,95,71,0.15) 100%)' }}>
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
          <div className="hidden lg:flex items-center">
            {/* Primary destinations */}
            <div className="flex gap-1 items-center">
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={navLinkClass(location.pathname === item.path)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Divider between primary and utility */}
            <div className="w-px h-6 bg-cream/15 mx-3" />

            {/* Utility destinations */}
            <div className="flex gap-1 items-center">
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
                        px-4 py-2 font-ui uppercase tracking-normal text-sm
                        transition-all duration-150 rounded-sm whitespace-nowrap border-2
                        flex items-center gap-1.5
                        ${hasActiveItem
                          ? 'bg-cream text-jungle-dark border-cream shadow-vintage-pressed border-b-mustard'
                          : 'text-cream/80 border-cream/10 hover:text-cream hover:border-cream/20 hover:bg-cream/5'
                        }
                      `}
                    >
                      <span>{group.label}</span>
                      <span className={`transition-transform text-[10px] opacity-60 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                    </button>

                    {isOpen && (
                      <div
                        className="absolute top-full right-0 pt-1 z-50 min-w-[220px]"
                        role="menu"
                      >
                      <div className="bg-cream border-2 border-sand-dark/40 shadow-vintage rounded-sm overflow-hidden">
                        <div className="h-0.5 bg-mustard/40" />
                        {group.items.map((item) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`
                                block px-4 py-2.5 border-b border-sand/60
                                transition-all duration-150
                                ${isActive
                                  ? 'bg-jungle text-cream'
                                  : 'bg-cream text-vintage-text hover:bg-sand/40'
                                }
                              `}
                            >
                              <div className="font-ui uppercase tracking-normal text-sm">
                                {item.label}
                              </div>
                              <div className="font-serif text-[11px] opacity-50 mt-0.5">
                                {item.description}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
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
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2 rounded-sm hover:bg-cream/8 transition-colors"
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
        <div ref={mobileMenuRef} className="lg:hidden border-t border-jungle-dark bg-jungle">
          {/* Primary */}
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={mobileNavLinkClass(location.pathname === item.path)}
            >
              {item.label}
            </Link>
          ))}

          {/* Divider */}
          <div className="flex items-center gap-2 px-4 py-1.5">
            <div className="h-px flex-1 bg-cream/10" />
            <span className="text-cream/15 text-[8px]">✦</span>
            <div className="h-px flex-1 bg-cream/10" />
          </div>

          {/* Utility */}
          {Object.entries(dropdownGroups).map(([key, group]) => (
            <div key={key}>
              <button
                onClick={() => toggleDropdown(openDropdown === key ? null : key)}
                className="w-full flex items-center justify-between px-4 py-3 font-ui uppercase tracking-normal text-sm text-cream/80 border-b border-cream/10 hover:bg-cream/8 transition-colors"
              >
                <span>{group.label}</span>
                <span className={`transition-transform text-[10px] opacity-50 ${openDropdown === key ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openDropdown === key && (
                <div className="bg-jungle-dark/50">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        block pl-8 pr-4 py-2.5 border-b border-cream/5 transition-colors
                        ${location.pathname === item.path
                          ? 'bg-cream/90 text-jungle-dark'
                          : 'text-cream/70 hover:bg-cream/8'
                        }
                      `}
                    >
                      <div className="font-ui uppercase tracking-normal text-sm">{item.label}</div>
                      <div className="font-serif text-[11px] opacity-50">{item.description}</div>
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
      {/* Bottom edge */}
      <div className="h-1 bg-jungle-dark" />
    </nav>
  );
};

export default Navigation;
