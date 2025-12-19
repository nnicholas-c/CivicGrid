// Government Official Dashboard - Admin control panel for managing all cases

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Case, Contractor, CaseStatus } from '../types';
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

interface ManageModalState {
  case: Case;
  action: 'assign' | 'payment' | 'close' | 'deny' | null;
}

const OfficialDashboard: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState<ManageModalState | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for modal
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [denyReason, setDenyReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [casesData, contractorsData] = await Promise.all([
        apiService.getAllCases(),
        apiService.getContractors(),
      ]);
      setCases(casesData);
      setContractors(contractorsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (caseId: string) => {
    try {
      setActionLoading(true);
      const updatedCase = await apiService.approveCase(caseId);
      setCases(cases.map(c => c.id === caseId ? updatedCase : c));
    } catch (err) {
      setError('Failed to approve case.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!modalState || !selectedContractorId) return;

    try {
      setActionLoading(true);
      const updatedCase = await apiService.assignCase(modalState.case.id, {
        contractorId: selectedContractorId,
      });
      setCases(cases.map(c => c.id === modalState.case.id ? updatedCase : c));
      closeModal();
    } catch (err) {
      setError('Failed to assign case.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!modalState || !paymentAmount) return;

    try {
      setActionLoading(true);
      const updatedCase = await apiService.updatePayment(modalState.case.id, {
        paymentAmount: parseFloat(paymentAmount),
      });
      setCases(cases.map(c => c.id === modalState.case.id ? updatedCase : c));
      closeModal();
    } catch (err) {
      setError('Failed to update payment.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (caseId: string) => {
    try {
      setActionLoading(true);
      const updatedCase = await apiService.escalateCase(caseId);
      setCases(cases.map(c => c.id === caseId ? updatedCase : c));
    } catch (err) {
      setError('Failed to escalate case.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!modalState || !closingNotes) {
      setError('Please provide closing notes.');
      return;
    }

    try {
      setActionLoading(true);
      const updatedCase = await apiService.closeCase(modalState.case.id, {
        closingNotes,
      });
      setCases(cases.map(c => c.id === modalState.case.id ? updatedCase : c));
      closeModal();
    } catch (err) {
      setError('Failed to close case.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!modalState || !denyReason) {
      setError('Please provide a reason for denial.');
      return;
    }

    try {
      setActionLoading(true);
      const updatedCase = await apiService.denyCase(modalState.case.id, denyReason);
      setCases(cases.map(c => c.id === modalState.case.id ? updatedCase : c));
      closeModal();
    } catch (err) {
      setError('Failed to deny case.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (caseItem: Case, action: ManageModalState['action']) => {
    setModalState({ case: caseItem, action });
    setSelectedContractorId(caseItem.assigneeId || '');
    setPaymentAmount(caseItem.paymentAmount?.toString() || '');
    setClosingNotes('');
    setDenyReason('');
  };

  const closeModal = () => {
    setModalState(null);
    setSelectedContractorId('');
    setPaymentAmount('');
    setClosingNotes('');
    setDenyReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Official Dashboard</h1>
          <p className="subtitle">Welcome, {user?.name}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="btn-link">Dismiss</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{cases.length}</div>
          <div className="stat-label">Total Cases</div>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-value">
            {cases.filter(c => c.status === 'pending').length}
          </div>
          <div className="stat-label">Awaiting Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {cases.filter(c => c.status === 'in_progress').length}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-value">
            {cases.filter(c => c.status === 'closed').length}
          </div>
          <div className="stat-label">Closed</div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Filter:</label>
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
            <option value="closed">Closed</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      <div className="section-header">
        <h2>All Cases ({filteredCases.length})</h2>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Location</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Payment</th>
              <th>Priority</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((caseItem) => (
              <tr key={caseItem.id} className={caseItem.priority === 'high' ? 'priority-row' : ''}>
                <td className="case-id-cell">#{caseItem.id}</td>
                <td className="description-cell">
                  <Link to={`/cases/${caseItem.id}`}>{caseItem.description}</Link>
                </td>
                <td>{caseItem.location}</td>
                <td>
                  <span className={`status-badge status-${caseItem.status}`}>
                    {statusLabels[caseItem.status]}
                  </span>
                </td>
                <td>{caseItem.assigneeName || '-'}</td>
                <td>${caseItem.paymentAmount?.toFixed(2) || '0.00'}</td>
                <td>
                  {caseItem.priority === 'high' ? (
                    <span className="priority-badge priority-high">High</span>
                  ) : (
                    'Normal'
                  )}
                </td>
                <td>{formatDate(caseItem.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    {caseItem.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(caseItem.id)}
                          disabled={actionLoading}
                          className="btn-action btn-approve"
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => openModal(caseItem, 'deny')}
                          className="btn-action btn-deny"
                          title="Deny"
                        >
                          ✕
                        </button>
                      </>
                    )}

                    {(caseItem.status === 'approved' || caseItem.status === 'assigned') && (
                      <button
                        onClick={() => openModal(caseItem, 'assign')}
                        className="btn-action btn-assign"
                        title="Assign/Reassign"
                      >
                        👤
                      </button>
                    )}

                    {caseItem.assigneeId && caseItem.status !== 'closed' && (
                      <button
                        onClick={() => openModal(caseItem, 'payment')}
                        className="btn-action btn-payment"
                        title="Update Payment"
                      >
                        💰
                      </button>
                    )}

                    {caseItem.priority === 'normal' && caseItem.status !== 'closed' && (
                      <button
                        onClick={() => handleEscalate(caseItem.id)}
                        disabled={actionLoading}
                        className="btn-action btn-escalate"
                        title="Escalate"
                      >
                        ⬆
                      </button>
                    )}

                    {(caseItem.status === 'completed' || caseItem.status === 'in_progress') && (
                      <button
                        onClick={() => openModal(caseItem, 'close')}
                        className="btn-action btn-close"
                        title="Close Case"
                      >
                        🔒
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Management Modals */}
      {modalState && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalState.action === 'assign' && (
              <>
                <h2>Assign Contractor</h2>
                <p>Case #{modalState.case.id}</p>
                <div className="form-group">
                  <label>Select Contractor:</label>
                  <select
                    value={selectedContractorId}
                    onChange={(e) => setSelectedContractorId(e.target.value)}
                    className="form-control"
                  >
                    <option value="">-- Select a contractor --</option>
                    {contractors.filter(c => c.isActive).map(contractor => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.name} {contractor.skills ? `(${contractor.skills.join(', ')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button
                    onClick={handleAssign}
                    disabled={actionLoading || !selectedContractorId}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Assigning...' : 'Assign'}
                  </button>
                  <button onClick={closeModal} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalState.action === 'payment' && (
              <>
                <h2>Update Payment Amount</h2>
                <p>Case #{modalState.case.id}</p>
                <div className="form-group">
                  <label>Payment Amount ($):</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="form-control"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    onClick={handleUpdatePayment}
                    disabled={actionLoading || !paymentAmount}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Updating...' : 'Update Payment'}
                  </button>
                  <button onClick={closeModal} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalState.action === 'close' && (
              <>
                <h2>Close Case</h2>
                <p>Case #{modalState.case.id}</p>
                <div className="form-group">
                  <label>Closing Notes:</label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Provide resolution summary..."
                    rows={4}
                    className="form-control"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    onClick={handleClose}
                    disabled={actionLoading || !closingNotes}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Closing...' : 'Close Case'}
                  </button>
                  <button onClick={closeModal} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalState.action === 'deny' && (
              <>
                <h2>Deny Case</h2>
                <p>Case #{modalState.case.id}</p>
                <div className="form-group">
                  <label>Reason for Denial:</label>
                  <textarea
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    placeholder="Provide reason for denying this case..."
                    rows={4}
                    className="form-control"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    onClick={handleDeny}
                    disabled={actionLoading || !denyReason}
                    className="btn btn-danger"
                  >
                    {actionLoading ? 'Denying...' : 'Deny Case'}
                  </button>
                  <button onClick={closeModal} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficialDashboard;
