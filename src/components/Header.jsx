import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useGitHub } from '../context/GitHubContext.jsx';
import './Header.css';

const NAV_ITEMS = [
  { label: 'Overview', path: '/' },
  { label: 'Active Users', path: '/active-users' },
  { label: 'Copilot Insights', path: '/copilot-insights' },
  { label: 'Reports', path: '/reports' },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isConfigured, data } = useGitHub();

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header" role="banner">
      <div className="header__inner">
        {/* Logo */}
        <Link to="/" className="header__logo" aria-label="Virgin Money — Copilot Insights Tracker home" onClick={closeMenu}>
          <span className="header__logo-mark" aria-hidden="true">VM</span>
          <span className="header__logo-text">Copilot Insights</span>
        </Link>

        {/* Desktop nav */}
        <nav className="header__nav" aria-label="Main navigation">
          <ul className="header__nav-list" role="list">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `header__nav-link${isActive ? ' header__nav-link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Status indicator + settings */}
        <div className="header__actions">
          <span
            className={`header__status ${isConfigured ? 'header__status--connected' : 'header__status--disconnected'}`}
            aria-label={isConfigured ? 'Connected to GitHub' : 'Not connected'}
          >
            <span className="header__status-dot" aria-hidden="true" />
            {isConfigured ? 'Connected' : 'Not connected'}
          </span>
          {data.lastFetched && (
            <span className="header__last-updated" aria-live="polite">
              Updated {data.lastFetched.toLocaleTimeString()}
            </span>
          )}
          <Link to="/setup" className="btn btn--outline header__setup-btn">
            ⚙ Settings
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className={`header__hamburger${menuOpen ? ' header__hamburger--open' : ''}`}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={toggleMenu}
          type="button"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      {/* Mobile nav */}
      <nav
        id="mobile-nav"
        className={`header__mobile-nav${menuOpen ? ' header__mobile-nav--open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        <ul role="list">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `header__mobile-link${isActive ? ' header__mobile-link--active' : ''}`
                }
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <Link to="/setup" className="header__mobile-link" onClick={closeMenu}>
              ⚙ Settings
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
