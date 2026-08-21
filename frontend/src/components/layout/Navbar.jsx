import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getPositionLabel } from '../../utils/helpers';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const memberLinks = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/activities', label: 'Activities', icon: '📅' },
    { to: '/members', label: 'Members', icon: '👥' },
    { to: '/discussion', label: 'Discussion', icon: '💬' },
    { to: '/my-activities', label: 'My Activities', icon: '📊' },
    { to: '/my-engagement', label: 'My Engagement', icon: '⭐' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: '📊' },
    { to: '/admin/members', label: 'Manage Members', icon: '👤' },
    { to: '/admin/activities', label: 'Manage Activities', icon: '📝' },
    { to: '/admin/attendance', label: 'Manage Attendance', icon: '✅' },
    { to: '/admin/engagement', label: 'Engagement', icon: '⭐' },
    { to: '/admin/discussion', label: 'Manage Discussion', icon: '🛡️' },
  ];

  const positionLabel = getPositionLabel(user?.position, user?.role);

  return (
    <>
      <nav className="navbar">
        <div className="navbar__inner">
          <NavLink to="/" className="navbar__brand">
            <span className="navbar__logo">◆</span>
            <span className="navbar__title">The Policy Circle</span>
          </NavLink>

          <div className="navbar__links hide-mobile">
            {memberLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <div className="navbar__divider" />
            )}
            {isAdmin && adminLinks.slice(0, 1).map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) => `navbar__link navbar__link--admin ${isActive ? 'navbar__link--active' : ''}`}
              >
                Admin
              </NavLink>
            ))}
          </div>

          <div className="navbar__right">
            <div className="navbar__profile" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="navbar__avatar">
                {getInitials(user?.name)}
              </div>
              <span className="navbar__user-name hide-mobile">{user?.name?.split(' ')[0]}</span>
            </div>

            {profileOpen && (
              <div className="navbar__dropdown" onClick={() => setProfileOpen(false)}>
                <div className="navbar__dropdown-header">
                  <strong>{user?.name}</strong>
                  <span className="navbar__dropdown-role">{positionLabel}</span>
                </div>
                <div className="navbar__dropdown-divider" />
                <NavLink to="/profile" className="navbar__dropdown-item">
                  👤 Profile
                </NavLink>
                <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}

            <button
              className="navbar__hamburger hide-desktop"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span className={`hamburger-line ${mobileOpen ? 'open' : ''}`} />
              <span className={`hamburger-line ${mobileOpen ? 'open' : ''}`} />
              <span className={`hamburger-line ${mobileOpen ? 'open' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-menu animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu__header">
              <span className="navbar__logo">◆</span>
              <span className="navbar__title">The Policy Circle</span>
              <button className="mobile-menu__close" onClick={() => setMobileOpen(false)}>✕</button>
            </div>

            <div className="mobile-menu__section">
              <span className="mobile-menu__label">Menu</span>
              {memberLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </div>

            {isAdmin && (
              <div className="mobile-menu__section">
                <span className="mobile-menu__label">Admin</span>
                {adminLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/admin'}
                    className={({ isActive }) => `mobile-menu__link mobile-menu__link--admin ${isActive ? 'mobile-menu__link--active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}

            <div className="mobile-menu__footer">
              <NavLink to="/profile" className="mobile-menu__link" onClick={() => setMobileOpen(false)}>
                <span>👤</span> Profile
              </NavLink>
              <button className="mobile-menu__link mobile-menu__link--danger" onClick={handleLogout}>
                <span>🚪</span> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
