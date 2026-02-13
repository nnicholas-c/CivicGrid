/**
 * Case Detail Page with Glassmorphism
 */

import { useEffect, useState } from 'react';
import { assetUrl } from '../lib/assetUrl';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, User, DollarSign, ArrowLeft, ExternalLink } from 'lucide-react';
import apiService from '../services/api';
import type { Case } from '../types';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCase(id);
    }
  }, [id]);

  const loadCase = async (caseId: string) => {
    try {
      const data = await apiService.getCaseById(caseId);
      setCaseData(data);
    } catch (error) {
      console.error('Failed to load case:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong rounded-2xl p-8">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Case Not Found</h2>
          <Link to="/cases">
            <button className="gradient-primary text-white px-6 py-3 rounded-xl">
              Back to Cases
            </button>
          </Link>
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

      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Link to="/cases">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass px-4 py-2 rounded-xl mb-6 flex items-center gap-2 hover-lift"
          >
            <ArrowLeft size={18} />
            Back to Cases
          </motion.button>
        </Link>

        {/* Case Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl overflow-hidden"
        >
          {/* Image */}
          {caseData.photoURL && (
            <div className="h-96 overflow-hidden">
              <img
                src={caseData.photoURL}
                alt="Case"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-10">
            {/* Status & Priority */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm px-4 py-2 rounded-full font-medium glass-strong capitalize">
                {caseData.status.replace('_', ' ')}
              </span>
              <span className="text-sm px-4 py-2 rounded-full font-medium bg-red-500/20 text-red-600 dark:text-red-400">
                {caseData.severity} severity
              </span>
            </div>

            {/* Title/Description */}
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              {caseData.description}
            </h1>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Location</p>
                    <p className="font-medium">{caseData.location.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reported</p>
                    <p className="font-medium">{new Date(caseData.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {caseData.reporterName && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <User className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reporter</p>
                      <p className="font-medium">{caseData.reporterName}</p>
                    </div>
                  </div>
                </div>
              )}

              {caseData.paymentAmount && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bounty</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        ${caseData.paymentAmount}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            {caseData.history && caseData.history.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-4">Case History</h3>
                <div className="space-y-3">
                  {caseData.history.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.performedBy} • {new Date(item.timestamp).toLocaleString()}
                        </p>
                        {item.details && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blockchain Links */}
            {caseData.txLinks && (caseData.txLinks.escrow || caseData.txLinks.payout) && (
              <div className="glass rounded-xl p-6 mt-4">
                <h3 className="font-semibold mb-4">Blockchain Transactions</h3>
                <div className="space-y-2">
                  {caseData.txLinks.escrow && (
                    <a href={caseData.txLinks.escrow} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                      <ExternalLink size={14} />
                      View Escrow Transaction
                    </a>
                  )}
                  {caseData.txLinks.payout && (
                    <a href={caseData.txLinks.payout} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                      <ExternalLink size={14} />
                      View Payout Transaction
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
