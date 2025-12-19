/**
 * Official Dashboard - Manage All Cases and Contractors
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, TrendingUp, AlertCircle, Users, MapPin, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import apiService from '../services/api';
import type { Case } from '../types';

export default function OfficialDashboard() {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllCases();
  }, []);

  const loadAllCases = async () => {
    try {
      const data = await apiService.getAllCases();
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: cases.length,
    pending: cases.filter(c => c.status === 'created').length,
    inProgress: cases.filter(c => c.status === 'in_progress' || c.status === 'accepted').length,
    resolved: cases.filter(c => c.status === 'resolved' || c.status === 'paid').length,
  };

  return (
    <div className="min-h-screen p-4 py-12">
      {/* Golden Gate Bridge Background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url('/golden-gate-bridge.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/15" />
      </div>

      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-white text-high-contrast-strong">
            Official Dashboard
          </h1>
          <p className="text-white/90">
            Oversee all civic operations and manage resources
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="glass-strong rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <Shield className="mb-3 text-white" size={32} />
            <p className="text-sm text-white/90 mb-1">Total Cases</p>
            <p className="text-3xl font-bold text-white text-high-contrast-strong">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="glass-strong rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <AlertCircle className="mb-3 text-yellow-400" size={32} />
            <p className="text-sm text-white/90 mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="glass-strong rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <TrendingUp className="mb-3 text-blue-400" size={32} />
            <p className="text-sm text-white/90 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-blue-400">{stats.inProgress}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="glass-strong rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <Users className="mb-3 text-green-400" size={32} />
            <p className="text-sm text-white/90 mb-1">Resolved</p>
            <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
          </motion.div>
        </div>

        {/* Cases Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-strong rounded-3xl p-6 md:p-8 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white text-high-contrast-strong">All Cases</h2>
            <Link to="/cases">
              <button className="glass px-4 py-2 rounded-xl hover-lift text-white/90 border border-white/20">View Grid</button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.slice(0, 10).map((caseItem) => (
                <Link key={caseItem.id} to={`/cases/${caseItem.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -5 }}
                    className="glass rounded-xl p-5 hover-lift cursor-pointer border border-white/20 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-3 py-1 rounded-full font-medium glass-strong capitalize text-white/90">
                            {caseItem.status.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            caseItem.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                            caseItem.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {caseItem.severity}
                          </span>
                        </div>
                        <h3 className="font-semibold mb-2 text-white text-high-contrast-strong">{caseItem.description}</h3>
                        <div className="flex items-center gap-4 text-sm text-white/90">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span className="line-clamp-1">{caseItem.location.address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                          </div>
                          {caseItem.assigneeName && (
                            <div className="flex items-center gap-1">
                              <Users size={14} />
                              <span>{caseItem.assigneeName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {caseItem.paymentAmount && (
                        <div className="text-right">
                          <p className="text-sm text-white/90">Bounty</p>
                          <p className="text-lg font-bold text-green-400">
                            ${caseItem.paymentAmount}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}

              {cases.length > 10 && (
                <Link to="/cases">
                  <button className="w-full glass py-3 rounded-xl hover-lift font-medium text-white/90 border border-white/20">
                    View All {cases.length} Cases
                  </button>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
