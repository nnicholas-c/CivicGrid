// Civilian Dashboard - Shows cases reported by the logged-in user

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Case, CaseStatus } from '../types';
import apiService from '../services/api';

const statusLabels: Record<CaseStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
  denied: 'Denied',
};

const CivilianDashboard: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyCases();
  }, []);

  const loadMyCases = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyCases();
      setCases(data);
      setError(null);
    } catch (err) {
      setError('Failed to load your cases. Please try again.');
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCaseStatusColor = (status: CaseStatus): string => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
      case 'assigned':
        return '#3b82f6';
      case 'in_progress':
        return '#8b5cf6';
      case 'completed':
        return '#10b981';
      case 'closed':
        return '#6b7280';
      case 'denied':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>My Dashboard</h1>
          <p className="subtitle">Welcome back, {user?.name}</p>
        </div>
        <Link to="/report" className="btn btn-primary">
          Report New Issue
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={loadMyCases} className="btn-link">Retry</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{cases.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {cases.filter(c => c.status === 'pending' || c.status === 'approved').length}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {cases.filter(c => c.status === 'in_progress' || c.status === 'assigned').length}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {cases.filter(c => c.status === 'completed' || c.status === 'closed').length}
          </div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Your Reported Cases</h2>
      </div>

      {cases.length === 0 ? (
        <div className="empty-state">
          <p>You haven't reported any issues yet.</p>
          <Link to="/report" className="btn btn-primary">
            Report Your First Issue
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="cases-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Description</th>
                <th>Location</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr key={caseItem.id}>
                  <td className="case-id-cell">#{caseItem.id}</td>
                  <td className="description-cell">{caseItem.description}</td>
                  <td className="location-cell">{caseItem.location}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getCaseStatusColor(caseItem.status) }}
                    >
                      {statusLabels[caseItem.status]}
                    </span>
                  </td>
                  <td>{formatDate(caseItem.createdAt)}</td>
                  <td>{formatDate(caseItem.updatedAt)}</td>
                  <td>
                    <Link to={`/cases/${caseItem.id}`} className="btn btn-small btn-secondary">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dashboard-info">
        <h3>What happens next?</h3>
        <ol className="process-steps">
          <li>
            <strong>Pending Review:</strong> Your report is waiting for a government official to review it.
          </li>
          <li>
            <strong>Approved & Assigned:</strong> Once approved, it will be assigned to a verified contractor.
          </li>
          <li>
            <strong>In Progress:</strong> The contractor is working on resolving the issue.
          </li>
          <li>
            <strong>Completed:</strong> Work is finished and awaiting final verification.
          </li>
          <li>
            <strong>Closed:</strong> The issue has been fully resolved.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default CivilianDashboard;
