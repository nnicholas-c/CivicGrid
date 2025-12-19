// Contractor Dashboard - Shows assigned tasks and allows status updates

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Case, CaseStatus } from '../types';
import apiService from '../services/api';

const ContractorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Case | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAssignedCases();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load your tasks. Please try again.');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: CaseStatus) => {
    try {
      setUpdatingStatus(true);
      const updatedCase = await apiService.updateCaseStatus(taskId, {
        status: newStatus,
        notes: completionNotes || undefined,
        completionPhoto: completionPhoto || undefined,
      });

      // Update local state
      setTasks(tasks.map(t => t.id === taskId ? updatedCase : t));
      setSelectedTask(null);
      setCompletionPhoto(null);
      setCompletionNotes('');
      setError(null);
    } catch (err) {
      setError('Failed to update status. Please try again.');
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openTaskModal = (task: Case) => {
    setSelectedTask(task);
    setCompletionPhoto(null);
    setCompletionNotes('');
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setCompletionPhoto(null);
    setCompletionNotes('');
  };

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
          <p>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Contractor Dashboard</h1>
          <p className="subtitle">Welcome back, {user?.name}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={loadTasks} className="btn-link">Retry</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">Total Assigned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {tasks.filter(t => t.status === 'assigned').length}
          </div>
          <div className="stat-label">Not Started</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card stat-card-highlight">
          <div className="stat-value">
            ${tasks.reduce((sum, t) => sum + (t.paymentAmount || 0), 0).toFixed(2)}
          </div>
          <div className="stat-label">Total Payment</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Your Assigned Tasks</h2>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any assigned tasks at the moment.</p>
          <p>New tasks will appear here when officials assign them to you.</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-card-header">
                <span className="task-id">#{task.id}</span>
                <span className={`status-badge status-${task.status}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {task.priority === 'high' && (
                <div className="priority-badge priority-high">High Priority</div>
              )}

              <div className="task-image">
                <img src={task.photoURL} alt="Issue" />
              </div>

              <div className="task-body">
                <h3>{task.description}</h3>
                <p className="task-location">
                  <span className="icon">📍</span>
                  {task.location}
                </p>

                <div className="task-payment">
                  <span className="payment-label">Payment:</span>
                  <span className="payment-amount">${task.paymentAmount?.toFixed(2) || '0.00'}</span>
                </div>

                <div className="task-meta">
                  <span>Assigned: {formatDate(task.createdAt)}</span>
                </div>

                <div className="task-actions">
                  {task.status === 'assigned' && (
                    <button
                      onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                      disabled={updatingStatus}
                      className="btn btn-primary btn-block"
                    >
                      Start Working
                    </button>
                  )}

                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => openTaskModal(task)}
                      className="btn btn-success btn-block"
                    >
                      Mark as Completed
                    </button>
                  )}

                  {task.status === 'completed' && (
                    <div className="completed-indicator">
                      Work Completed - Awaiting Approval
                    </div>
                  )}

                  <Link to={`/cases/${task.id}`} className="btn btn-secondary btn-block">
                    View Full Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completion Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Mark Task as Completed</h2>
            <p>Case #{selectedTask.id}</p>

            <div className="form-group">
              <label>Completion Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCompletionPhoto(e.target.files?.[0] || null)}
                className="form-control"
              />
              <p className="help-text">Upload a photo of the completed work</p>
            </div>

            <div className="form-group">
              <label>Completion Notes (Optional)</label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about the completed work..."
                rows={4}
                className="form-control"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => handleStatusUpdate(selectedTask.id, 'completed')}
                disabled={updatingStatus}
                className="btn btn-success"
              >
                {updatingStatus ? 'Updating...' : 'Confirm Completion'}
              </button>
              <button
                onClick={closeTaskModal}
                disabled={updatingStatus}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
