import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getPositionLabel } from '../../utils/helpers';
import Icon from '../common/Icon';
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
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/activities', label: 'Activities', icon: 'calendar' },
    { to: '/members', label: 'Members', icon: 'users' },
    { to: '/discussion', label: 'Discussion', icon: 'message' },
    { to: '/my-activities', label: 'My Activities', icon: 'chart' },
    { to: '/my-engagement', label: 'My Engagement', icon: 'star' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: 'chart' },
    { to: '/admin/members', label: 'Manage Members', icon: 'users' },
    { to: '/admin/activities', label: 'Manage Activities', icon: 'calendar' },
    { to: '/admin/attendance', label: 'Manage Attendance', icon: 'check-circle' },
    { to: '/admin/engagement', label: 'Engagement', icon: 'star' },
    { to: '/admin/discussion', label: 'Manage Discussion', icon: 'shield' },
  ];

  const positionLabel = getPositionLabel(user?.position, user?.role);

  return (
    <>
      <nav className="navbar">
        <div className="navbar__inner">
          <NavLink to="/" className="navbar__brand">
            <div className="navbar__logo-wrap">
              <img src="/logo.png" alt="Logo" className="navbar__logo-img" />
            </div>
            <span className="navbar__title">Public Policy Club</span>
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
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `navbar__link navbar__link--admin ${isActive ? 'navbar__link--active' : ''}`}
              >
                Admin
              </NavLink>
            )}
          </div>

          <div className="navbar__right">
            <div className="navbar__profile" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="navbar__avatar">
                {getInitials(user?.name)}
              </div>
              <span className="navbar__user-name hide-mobile">{user?.name?.split(' ')[0]}</span>
              <span className="navbar__chevron hide-mobile">
                <Icon name="chevron-down" size={13} />
              </span>
            </div>

            {profileOpen && (
              <div className="navbar__dropdown card-surface" onClick={() => setProfileOpen(false)}>
                <div className="navbar__dropdown-header">
                  <strong>{user?.name}</strong>
                  <span className="navbar__dropdown-role">{positionLabel}</span>
                </div>
                <div className="navbar__dropdown-divider" />
                <NavLink to="/profile" className="navbar__dropdown-item">
                  <Icon name="user" size={15} />
                  <span>Profile</span>
                </NavLink>
                <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                  <Icon name="logout" size={15} />
                  <span>Logout</span>
                </button>
              </div>
            )}

            <button
              className="navbar__hamburger hide-desktop"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <Icon name={mobileOpen ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-menu animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu__header">
              <div className="navbar__logo-wrap">
                <img src="/logo.png" alt="Logo" className="navbar__logo-img" />
              </div>
              <span className="navbar__title">Public Policy Club</span>
              <button className="mobile-menu__close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="mobile-menu__section">
              <span className="mobile-menu__label">Main Menu</span>
              {memberLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon name={link.icon} size={17} />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>

            {isAdmin && (
              <div className="mobile-menu__section">
                <span className="mobile-menu__label">Administration</span>
                {adminLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/admin'}
                    className={({ isActive }) => `mobile-menu__link mobile-menu__link--admin ${isActive ? 'mobile-menu__link--active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon name={link.icon} size={17} />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            )}

            <div className="mobile-menu__footer">
              <NavLink to="/profile" className="mobile-menu__link" onClick={() => setMobileOpen(false)}>
                <Icon name="user" size={17} />
                <span>Profile</span>
              </NavLink>
              <button className="mobile-menu__link mobile-menu__link--danger" onClick={handleLogout}>
                <Icon name="logout" size={17} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
