// Public Case Listing Page - Shows all open cases to anyone (no login required)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Case, CaseStatus } from '../types';
import apiService from '../services/api';

const statusStyles: Record<CaseStatus, string> = {
  pending: 'status-pending',
  approved: 'status-approved',
  assigned: 'status-assigned',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  closed: 'status-closed',
  denied: 'status-denied',
};

const statusLabels: Record<CaseStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
  denied: 'Denied',
};

const PublicCaseList: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOpenCases();
      setCases(data);
      setError(null);
    } catch (err) {
      setError('Failed to load cases. Please try again later.');
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Open Community Cases</h1>
        <p className="subtitle">View all reported issues and their current status</p>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by description, location, or case ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaseStatus | 'all')}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={loadCases} className="btn-link">Retry</button>
        </div>
      )}

      <div className="cases-summary">
        <p>Showing {filteredCases.length} of {cases.length} cases</p>
      </div>

      <div className="cases-grid">
        {filteredCases.length === 0 ? (
          <div className="empty-state">
            <p>No cases found matching your criteria.</p>
          </div>
        ) : (
          filteredCases.map((caseItem) => (
            <Link to={`/cases/${caseItem.id}`} key={caseItem.id} className="case-card">
              <div className="case-card-header">
                <span className="case-id">#{caseItem.id}</span>
                <span className={`status-badge ${statusStyles[caseItem.status]}`}>
                  {statusLabels[caseItem.status]}
                </span>
              </div>

              {caseItem.priority === 'high' && (
                <div className="priority-badge">High Priority</div>
              )}

              <div className="case-card-image">
                <img src={caseItem.photoURL} alt="Issue" />
              </div>

              <div className="case-card-body">
                <h3>{caseItem.description}</h3>
                <p className="case-location">
                  <span className="icon">📍</span>
                  {caseItem.location}
                </p>
                <div className="case-meta">
                  <span className="case-date">Reported: {formatDate(caseItem.createdAt)}</span>
                  {caseItem.assigneeName && (
                    <span className="case-assignee">
                      Assigned to: {caseItem.assigneeName}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default PublicCaseList;
