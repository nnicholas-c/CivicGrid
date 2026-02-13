/**
 * Contractor Dashboard - View and Manage Assigned Tasks
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Briefcase, DollarSign, MapPin, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import apiService from '../services/api';
import type { Case } from '../types';
import { assetUrl } from '../lib/assetUrl';

export default function ContractorDashboard() {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignedCases();
  }, []);

  const loadAssignedCases = async () => {
    try {
      const data = await apiService.getAssignedCases();
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = cases
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.paymentAmount || 0), 0);

  const pendingEarnings = cases
    .filter(c => c.status !== 'paid' && c.paymentAmount)
    .reduce((sum, c) => sum + (c.paymentAmount || 0), 0);

  return (
    <div className="min-h-screen p-4 py-12">
      {/* Golden Gate Bridge Background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url('${assetUrl('/golden-gate-bridge.jpg')}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/15" />
      </div>

      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-white text-high-contrast-strong">
            Welcome, {user?.name}
          </h1>
          <p className="text-white/90">
            Manage your assigned tasks and track earnings
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="glass-strong rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <Briefcase className="mb-3 text-white" size={32} />
            <p className="text-sm text-white/90 mb-1">Active Tasks</p>
            <p className="text-3xl font-bold text-white text-high-contrast-strong">{cases.filter(c => c.status === 'in_progress' || c.status === 'accepted').length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="glass-strong rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <DollarSign className="mb-3 text-green-400" size={32} />
            <p className="text-sm text-white/90 mb-1">Total Earned</p>
            <p className="text-3xl font-bold text-green-400">${totalEarnings}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="glass-strong rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <DollarSign className="mb-3 text-yellow-400" size={32} />
            <p className="text-sm text-white/90 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-400">${pendingEarnings}</p>
          </motion.div>
        </div>

        {/* Assigned Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-strong rounded-3xl p-6 md:p-8 border border-white/20 shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-6 text-white text-high-contrast-strong">Assigned Tasks</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : cases.length > 0 ? (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <Link key={caseItem.id} to={`/cases/${caseItem.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -5 }}
                    className="glass rounded-xl p-5 hover-lift cursor-pointer border border-white/20 shadow-xl"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 text-white text-high-contrast-strong">{caseItem.description}</h3>
                        <div className="flex items-center gap-4 text-sm text-white/90">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{caseItem.location.address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-3 py-1 rounded-full font-medium glass-strong capitalize block mb-2 text-white/90">
                          {caseItem.status.replace('_', ' ')}
                        </span>
                        {caseItem.paymentAmount && (
                          <span className="text-lg font-bold text-green-400">
                            ${caseItem.paymentAmount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="mx-auto mb-4 text-white/90" size={48} />
              <h3 className="text-xl font-semibold mb-2 text-white text-high-contrast-strong">No Tasks Assigned</h3>
              <p className="text-white/90">
                Check back later for new opportunities
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
