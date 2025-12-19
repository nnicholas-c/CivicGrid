/**
 * Civilian Dashboard - Track Your Reports
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import apiService from '../services/api';
import type { Case } from '../types';

export default function CivilianDashboard() {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyCases();
  }, []);

  const loadMyCases = async () => {
    try {
      const data = await apiService.getMyCases();
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
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

      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-white text-high-contrast-strong">
            Welcome back, {user?.name}
          </h1>
          <p className="text-white/90">
            Track your reported issues and see their progress
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/report">
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="glass-strong rounded-2xl p-6 cursor-pointer hover-lift gradient-primary text-white border border-white/20 shadow-xl"
            >
              <Plus className="mb-3" size={32} />
              <h3 className="text-xl font-bold mb-2 text-white text-high-contrast-strong">Report New Issue</h3>
              <p className="text-white/90">Help improve your community</p>
            </motion.div>
          </Link>

          <Link to="/cases">
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="glass-strong rounded-2xl p-6 cursor-pointer hover-lift border border-white/20 shadow-xl"
            >
              <MapPin className="mb-3 text-white" size={32} />
              <h3 className="text-xl font-bold mb-2 text-white text-high-contrast-strong">Browse All Cases</h3>
              <p className="text-white/90">See what's happening nearby</p>
            </motion.div>
          </Link>
        </div>

        {/* My Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-3xl p-6 md:p-8 border border-white/20 shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-6 text-white text-high-contrast-strong">My Reports</h2>

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
                      <h3 className="font-semibold text-lg text-white text-high-contrast-strong">{caseItem.description}</h3>
                      <span className="text-xs px-3 py-1 rounded-full font-medium glass-strong capitalize text-white/90">
                        {caseItem.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/90">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{caseItem.location.address || 'Unknown location'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="mx-auto mb-4 text-white/90" size={48} />
              <h3 className="text-xl font-semibold mb-2 text-white text-high-contrast-strong">No Reports Yet</h3>
              <p className="text-white/90 mb-6">
                Start making a difference by reporting your first issue
              </p>
              <Link to="/report">
                <button className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
                  Report Issue
                </button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
