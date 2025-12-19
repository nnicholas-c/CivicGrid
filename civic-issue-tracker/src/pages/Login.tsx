// Login Page - Unified login for all user roles

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'civilian' as UserRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await login(formData.email, formData.password, formData.role);

      // Redirect based on role or to intended page
      const from = (location.state as any)?.from?.pathname || getDashboardPath(formData.role);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'civilian':
        return '/dashboard';
      case 'contractor':
        return '/contractor/dashboard';
      case 'official':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className="container">
      <div className="login-page">
        <div className="login-card">
          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to access your dashboard</p>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="role">I am a:</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="civilian">Civilian (Reporter)</option>
                <option value="contractor">Verified Contractor</option>
                <option value="official">Government Official</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="form-control"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-large btn-block"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="btn-link">
                Register here
              </button>
            </p>
            <p>
              <button onClick={() => navigate('/cases')} className="btn-link">
                Continue as guest
              </button>
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="dev-credentials">
              <h4>Demo Credentials:</h4>
              <ul>
                <li>Civilian: any email + password</li>
                <li>Contractor: any email + password</li>
                <li>Official: any email + password</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
