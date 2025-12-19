// Unauthorized Page - Shown when user tries to access restricted content

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="container">
      <div className="error-page">
        <div className="error-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>
          {isAuthenticated
            ? `You don't have permission to access this page as a ${user?.role}.`
            : 'You need to be logged in to access this page.'}
        </p>
        <div className="error-actions">
          {isAuthenticated ? (
            <Link to="/" className="btn btn-primary">
              Go to Home
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
