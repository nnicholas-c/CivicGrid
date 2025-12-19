// Home Page - Landing page with overview

import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">Civic Issue Tracker</h1>
          <p className="hero-subtitle">
            Making our community better, one report at a time
          </p>
          <div className="hero-actions">
            <Link to="/report" className="btn btn-primary btn-large">
              Report an Issue
            </Link>
            <Link to="/cases" className="btn btn-secondary btn-large">
              View Open Cases
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="features-section">
          <h2>How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>1. Report Issue</h3>
              <p>
                Take a photo and describe the problem in your community. Your report helps us
                identify and prioritize repairs.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👁️</div>
              <h3>2. Transparent Review</h3>
              <p>
                Government officials review and approve valid reports. All cases are publicly
                visible for full transparency.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>3. Expert Assignment</h3>
              <p>
                Approved cases are assigned to verified contractors who have the skills to resolve
                the issue quickly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✓</div>
              <h3>4. Track Progress</h3>
              <p>
                Monitor the status of your report from submission to completion. Get notified when
                work is finished.
              </p>
            </div>
          </div>
        </div>

        <div className="transparency-section">
          <h2>Built on Transparency</h2>
          <p>
            Our system ensures accountability by making all open cases publicly visible. Anyone can
            see what issues have been reported, who is working on them, and their current status.
            This promotes trust between citizens and government.
          </p>
          <ul className="transparency-list">
            <li>All cases are public and searchable</li>
            <li>Photo validation prevents spam</li>
            <li>Complete case history tracking</li>
            <li>Real-time status updates</li>
            <li>Verified contractor system</li>
          </ul>
        </div>

        <div className="cta-section">
          <h2>Ready to Make a Difference?</h2>
          <p>Help improve your community by reporting issues or tracking progress.</p>
          <div className="cta-actions">
            <Link to="/report" className="btn btn-primary btn-large">
              Report an Issue
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
