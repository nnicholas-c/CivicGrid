/**
 * CivicGrid Main App with Routing
 * Glassmorphism design with vibrant gradients
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ReportIssue from './pages/ReportIssue';
import PublicCaseList from './pages/PublicCaseList';
import CaseDetail from './pages/CaseDetail';
import CivilianDashboard from './pages/CivilianDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import OfficialDashboard from './pages/OfficialDashboard';
import GovernmentDashboard from './pages/GovernmentDashboard';
import ContractorWorkItems from './pages/ContractorWorkItems';
import AdminPanel from './pages/AdminPanel';
import Unauthorized from './pages/Unauthorized';
import MapTest from './pages/MapTest';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/cases" element={<PublicCaseList />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/maptest" element={<MapTest />} />

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
            <Route
              path="/contractor/work-items"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <ContractorWorkItems />
                </ProtectedRoute>
              }
            />

            {/* Official Routes */}
            <Route
              path="/official/dashboard"
              element={
                <ProtectedRoute allowedRoles={['official']}>
                  <OfficialDashboard />
                </ProtectedRoute>
              }
            />

            {/* Government Routes */}
            <Route
              path="/government/dashboard"
              element={
                <ProtectedRoute allowedRoles={['official']}>
                  <GovernmentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/panel"
              element={
                <ProtectedRoute allowedRoles={['official']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
