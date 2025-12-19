// Navigation Component - Role-based menu system

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link-active' : '';
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
          Civic Issue Tracker
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-menu ${mobileMenuOpen ? 'nav-menu-open' : ''}`}>
          {/* Public Links */}
          <Link to="/cases" className={`nav-link ${isActive('/cases')}`} onClick={closeMobileMenu}>
            View Cases
          </Link>
          <Link to="/report" className={`nav-link ${isActive('/report')}`} onClick={closeMobileMenu}>
            Report Issue
          </Link>

          {/* Role-specific links */}
          {isAuthenticated && user?.role === 'civilian' && (
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`} onClick={closeMobileMenu}>
              My Dashboard
            </Link>
          )}

          {isAuthenticated && user?.role === 'contractor' && (
            <Link to="/contractor/dashboard" className={`nav-link ${isActive('/contractor/dashboard')}`} onClick={closeMobileMenu}>
              My Tasks
            </Link>
          )}

          {isAuthenticated && user?.role === 'official' && (
            <>
              <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard')}`} onClick={closeMobileMenu}>
                Admin Dashboard
              </Link>
              <Link to="/admin/contractors" className={`nav-link ${isActive('/admin/contractors')}`} onClick={closeMobileMenu}>
                Contractors
              </Link>
            </>
          )}

          {/* Auth buttons */}
          <div className="nav-auth">
            {isAuthenticated ? (
              <div className="nav-user-menu">
                <span className="nav-user-name">{user?.name}</span>
                <span className="nav-user-role">({user?.role})</span>
                <button onClick={handleLogout} className="btn btn-outline">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" onClick={closeMobileMenu}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
