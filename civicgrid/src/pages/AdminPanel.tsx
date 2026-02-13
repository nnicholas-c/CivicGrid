/**
 * Admin Panel - Administrative functions
 * Uses Firebase backend for admin operations
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import workItemsApi from '../services/workItemsApi';
import { assetUrl } from '../lib/assetUrl';

export default function AdminPanel() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeleteAllUploads = async () => {
    if (!confirmDelete) {
      setError('Please confirm the deletion by checking the box');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await workItemsApi.deleteAllUserUploads();
      setSuccess('All user uploads have been deleted successfully');
      setConfirmDelete(false);
    } catch (err) {
      setError('Failed to delete user uploads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 py-12">
      {/* Background */}
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-red-500" size={32} />
            <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-white/90">Administrative functions and system management</p>
        </motion.div>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-xl p-6 border border-red-500/30 bg-red-500/10 mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-red-400" size={24} />
            <h2 className="text-xl font-bold text-white">Danger Zone</h2>
          </div>
          <p className="text-white/70 text-sm">
            These operations are irreversible. Please proceed with extreme caution.
          </p>
        </motion.div>

        {/* Delete All Uploads Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-2xl p-8 border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-4">Delete All User Uploads</h3>
          <p className="text-white/70 mb-6">
            This will permanently delete all user uploads from the system. This action cannot be undone.
            Only use this for testing or emergency cleanup.
          </p>

          <div className="glass rounded-xl p-6 border border-white/20 mb-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="confirm-delete"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="mt-1"
                disabled={loading}
              />
              <label htmlFor="confirm-delete" className="text-white/90 cursor-pointer">
                <div className="font-semibold mb-1">I understand this is permanent</div>
                <div className="text-sm text-white/70">
                  I confirm that I want to delete all user uploads. This will remove all voice transcripts
                  and images that have not yet been processed by the Grok Analyzer.
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleDeleteAllUploads}
            disabled={!confirmDelete || loading}
            className="gradient-danger text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={20} />
                Delete All User Uploads
              </>
            )}
          </button>
        </motion.div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass-strong border border-red-500/20 rounded-xl p-4 flex items-center gap-3"
          >
            <XCircle className="text-red-500" size={20} />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass-strong border border-green-500/20 rounded-xl p-4 flex items-center gap-3"
          >
            <CheckCircle className="text-green-500" size={20} />
            <p className="text-sm text-green-400">{success}</p>
          </motion.div>
        )}

        {/* System Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 glass-strong rounded-2xl p-8 border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-white/70">
              <span>Environment:</span>
              <span className="font-mono text-white">Production</span>
            </div>
            <div className="flex justify-between items-center text-white/70">
              <span>Backend:</span>
              <span className="font-mono text-white">Firebase Cloud Functions</span>
            </div>
            <div className="flex justify-between items-center text-white/70">
              <span>Region:</span>
              <span className="font-mono text-white">us-central1</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
