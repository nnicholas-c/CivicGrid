// Case Detail Page - Shows full details of a specific case

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCase(id);
    }
  }, [id]);

  const loadCase = async (caseId: string) => {
    try {
      setLoading(true);
      const data = await apiService.getCaseById(caseId);
      setCaseData(data);
      setError(null);
    } catch (err) {
      setError('Case not found or failed to load.');
      console.error('Error loading case:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="container">
        <div className="alert alert-error">
          {error || 'Case not found'}
        </div>
        <Link to="/cases" className="btn btn-secondary">
          Back to All Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link to="/cases">All Cases</Link>
        <span>/</span>
        <span>Case #{caseData.id}</span>
      </div>

      <div className="case-detail">
        <div className="case-detail-header">
          <div>
            <h1>Case #{caseData.id}</h1>
            <span className={`status-badge status-${caseData.status}`}>
              {statusLabels[caseData.status]}
            </span>
            {caseData.priority === 'high' && (
              <span className="priority-badge priority-high">High Priority</span>
            )}
          </div>
        </div>

        <div className="case-detail-grid">
          <div className="case-detail-main">
            <div className="detail-section">
              <h2>Issue Description</h2>
              <p className="description-text">{caseData.description}</p>
            </div>

            <div className="detail-section">
              <h2>Photo Evidence</h2>
              <div className="case-photo-large">
                <img src={caseData.photoURL} alt="Issue" />
              </div>
            </div>

            {caseData.completionPhotoURL && (
              <div className="detail-section">
                <h2>Completion Photo</h2>
                <div className="case-photo-large">
                  <img src={caseData.completionPhotoURL} alt="Completed work" />
                </div>
                {caseData.completionNotes && (
                  <p className="completion-notes">{caseData.completionNotes}</p>
                )}
              </div>
            )}

            <div className="detail-section">
              <h2>Case History</h2>
              <div className="timeline">
                {caseData.history.map((entry, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{entry.action}</strong>
                        <span className="timeline-date">{formatDate(entry.timestamp)}</span>
                      </div>
                      <p className="timeline-performer">by {entry.performedBy}</p>
                      {entry.details && <p className="timeline-details">{entry.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="case-detail-sidebar">
            <div className="info-card">
              <h3>Case Information</h3>
              <div className="info-item">
                <span className="info-label">Location:</span>
                <span className="info-value">
                  <span className="icon">📍</span>
                  {caseData.location}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Reported:</span>
                <span className="info-value">{formatDate(caseData.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">{formatDate(caseData.updatedAt)}</span>
              </div>
              {caseData.reporterName && (
                <div className="info-item">
                  <span className="info-label">Reported By:</span>
                  <span className="info-value">{caseData.reporterName}</span>
                </div>
              )}
            </div>

            {caseData.assigneeName && (
              <div className="info-card">
                <h3>Assignment</h3>
                <div className="info-item">
                  <span className="info-label">Contractor:</span>
                  <span className="info-value">{caseData.assigneeName}</span>
                </div>
                {caseData.paymentAmount && (
                  <div className="info-item">
                    <span className="info-label">Payment:</span>
                    <span className="info-value payment-amount">
                      ${caseData.paymentAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {caseData.closingNotes && (
              <div className="info-card">
                <h3>Closing Notes</h3>
                <p>{caseData.closingNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
