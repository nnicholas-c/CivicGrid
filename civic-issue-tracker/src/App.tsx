// Main App Component - Routing and layout

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import PublicCaseList from './pages/PublicCaseList';
import CaseDetail from './pages/CaseDetail';
import ReportIssue from './pages/ReportIssue';
import CivilianDashboard from './pages/CivilianDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import OfficialDashboard from './pages/OfficialDashboard';
import Unauthorized from './pages/Unauthorized';

import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cases" element={<PublicCaseList />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/report" element={<ReportIssue />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Civilian Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['civilian']}>
                    <CivilianDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Contractor Routes */}
              <Route
                path="/contractor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['contractor']}>
                    <ContractorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Official/Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['official']}>
                    <OfficialDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <div className="container">
              <p>&copy; 2025 Civic Issue Tracker. Built for transparent community governance.</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
