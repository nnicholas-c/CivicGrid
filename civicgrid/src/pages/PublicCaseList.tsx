/**
 * Public Case List - Grid View with Glassmorphism
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import type { Case } from '../types';
import { assetUrl } from '../lib/assetUrl';

export default function PublicCaseList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await apiService.getOpenCases();
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-600 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-green-500/20 text-green-600 dark:text-green-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong rounded-2xl p-8">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 py-12 relative">
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

      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-extrabold mb-3 text-white tracking-tight">
            Civic Grid
          </h1>
          <p className="text-xl text-white/90 font-medium">
            Browse open civic issues in your community
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Cases', value: cases.length, icon: MapPin },
            { label: 'In Progress', value: cases.filter(c => c.status === 'in_progress').length, icon: TrendingUp },
            { label: 'Urgent', value: cases.filter(c => c.severity === 'high').length, icon: AlertCircle }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="glass rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-white text-high-contrast-strong">{stat.value}</p>
                </div>
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-orange">
                  <stat.icon className="text-white" size={28} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem, i) => (
            <Link key={caseItem.id} to={`/cases/${caseItem.id}`} className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03, y: -8 }}
                className="glass rounded-2xl overflow-hidden cursor-pointer border border-white/20 shadow-xl h-full flex flex-col"
              >
                {/* Image */}
                {caseItem.photoURL && (
                  <div className="h-48 overflow-hidden">
                    <motion.img
                      src={caseItem.photoURL}
                      alt="Case"
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${getSeverityColor(caseItem.severity)}`}>
                      {caseItem.severity}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full font-semibold glass-strong capitalize text-white">
                      {caseItem.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Description */}
                  <h3 className="font-bold text-lg mb-2 text-white text-high-contrast line-clamp-2">
                    {caseItem.description}
                  </h3>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-sm text-white/90 mb-3">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1 font-medium">{caseItem.location.address || 'Location not specified'}</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-white/80 pt-3 border-t border-white/20 mt-auto">
                    <div className="flex items-center gap-1 font-medium">
                      <Clock size={14} />
                      <span>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                    </div>
                    {caseItem.sla && (
                      <span className="font-bold text-orange-300">
                        SLA: {caseItem.sla.targetHours}hrs
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {cases.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-strong rounded-3xl p-12 text-center"
          >
            <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-2xl font-bold mb-2">No Cases Found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              There are no open cases at the moment. Check back later!
            </p>
            <Link to="/report">
              <button className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
                Report an Issue
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
