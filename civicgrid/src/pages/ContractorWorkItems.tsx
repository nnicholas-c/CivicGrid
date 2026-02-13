/**
 * Contractor Work Items - View and manage assigned work
 * Uses Firebase workItemsApi for real-time data
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  Camera, 
  CheckCircle, 
  XCircle, 
  MapPin,
  Clock,
  AlertTriangle,
  Upload,
  Loader2
} from 'lucide-react';
import workItemsApi from '../services/workItemsApi';
import type { WorkItem } from '../services/workItemsApi';
import { assetUrl } from '../lib/assetUrl';

export default function ContractorWorkItems() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [fixedPhoto, setFixedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadWorkItems();
  }, []);

  const loadWorkItems = async () => {
    setLoading(true);
    setError('');
    try {
      // Get all work items - contractor should see gov_approved items assigned to them
      const items = await workItemsApi.getAllWorkItems();
      // Filter for items that are assigned or in fixing status
      const contractorItems = items.filter(
        item => item.status === 'gov_approved' || item.status === 'fixing' || item.status === 'self_report_completed'
      );
      setWorkItems(contractorItems);
    } catch (err) {
      setError('Failed to load work items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFixing = async (caseId: string) => {
    try {
      setError('');
      await workItemsApi.updateStatusToFixing(caseId);
      setSuccess('Work started! Status updated to "Fixing"');
      loadWorkItems(); // Refresh
    } catch (err) {
      setError('Failed to start work');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFixedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFixed = async (caseId: string) => {
    if (!fixedPhoto) {
      setError('Please upload a photo of the completed work');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await workItemsApi.submitFixedWork(caseId, base64);
        setSuccess('Work submitted for verification!');
        setSelectedItem(null);
        setFixedPhoto(null);
        setPhotoPreview('');
        loadWorkItems(); // Refresh
      };
      reader.readAsDataURL(fixedPhoto);
    } catch (err) {
      setError('Failed to submit work');
    } finally {
      setUploading(false);
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'gov_approved': { color: 'bg-green-500', text: 'Ready to Start', icon: CheckCircle },
      'fixing': { color: 'bg-blue-500', text: 'In Progress', icon: Wrench },
      'self_report_completed': { color: 'bg-purple-500', text: 'Awaiting Verification', icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      color: 'bg-gray-500', 
      text: status, 
      icon: AlertTriangle 
    };
    const Icon = config.icon;

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${config.color}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
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

      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Contractor Work Items</h1>
          <p className="text-white/90">Manage your assigned work and submit completion evidence</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="glass-strong rounded-xl p-6 border border-white/20"
          >
            <CheckCircle className="text-green-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-white">
              {workItems.filter(i => i.status === 'gov_approved').length}
            </div>
            <div className="text-sm text-white/70">Ready to Start</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="glass-strong rounded-xl p-6 border border-white/20"
          >
            <Wrench className="text-blue-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-white">
              {workItems.filter(i => i.status === 'fixing').length}
            </div>
            <div className="text-sm text-white/70">In Progress</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="glass-strong rounded-xl p-6 border border-white/20"
          >
            <Clock className="text-purple-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-white">
              {workItems.filter(i => i.status === 'self_report_completed').length}
            </div>
            <div className="text-sm text-white/70">Pending Verification</div>
          </motion.div>
        </div>

        {/* Work Items List */}
        {loading ? (
          <div className="glass-strong rounded-xl p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto"></div>
          </div>
        ) : workItems.length > 0 ? (
          <div className="space-y-4">
            {workItems.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-6 border border-white/20 hover:glass-strong transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{item.issue_summary}</h3>
                    <div className="flex items-center gap-4 text-sm text-white/70">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {item.location.free_text}
                      </span>
                      <span className="capitalize">{item.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="text-sm">
                    <span className="text-white/50">Priority:</span>
                    <span className="ml-2 font-bold text-white">{item.scores.priority_score}/100</span>
                  </div>
                  {item.scores.severity_label && (
                    <div className="text-sm">
                      <span className="text-white/50">Severity:</span>
                      <span className={`ml-2 font-bold capitalize ${getSeverityColor(item.scores.severity_label)}`}>
                        {item.scores.severity_label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Evidence Photo */}
                {item.evidence?.photos && item.evidence.photos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-2">Issue Photo:</p>
                    <img 
                      src={item.evidence.photos[0]} 
                      alt="Issue" 
                      className="w-48 h-32 object-cover rounded-lg border border-white/20"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {item.status === 'gov_approved' && (
                    <button
                      onClick={() => handleStartFixing(item.case_id || item.id)}
                      className="gradient-primary text-white px-4 py-2 rounded-lg font-semibold text-sm"
                    >
                      Start Fixing
                    </button>
                  )}
                  {item.status === 'fixing' && (
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="gradient-success text-white px-4 py-2 rounded-lg font-semibold text-sm"
                    >
                      Submit Completion
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-strong rounded-xl p-12 text-center">
            <Wrench className="mx-auto mb-4 text-white/50" size={48} />
            <p className="text-white/70">No work items assigned</p>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-4 right-4 glass-strong border border-red-500/20 rounded-xl p-4 flex items-center gap-3 max-w-md"
            >
              <XCircle className="text-red-500" size={20} />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-4 right-4 glass-strong border border-green-500/20 rounded-xl p-4 flex items-center gap-3 max-w-md"
            >
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-sm text-green-400">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Completion Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => !uploading && setSelectedItem(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="glass-strong rounded-2xl p-8 max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Submit Completed Work</h2>
                
                <div className="mb-4">
                  <p className="text-sm text-white/70 mb-2">{selectedItem.issue_summary}</p>
                  <p className="text-xs text-white/50">{selectedItem.location.free_text}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-white/90 mb-2">
                    Upload photo of completed work *
                  </label>
                  <div className="glass rounded-xl p-4 border border-white/20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="fixed-photo"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="fixed-photo"
                      className="flex items-center justify-center gap-2 cursor-pointer text-white/70 hover:text-white transition-colors"
                    >
                      <Camera size={20} />
                      <span>Choose photo</span>
                    </label>
                    
                    {photoPreview && (
                      <div className="mt-4">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSubmitFixed(selectedItem.case_id || selectedItem.id)}
                    disabled={!fixedPhoto || uploading}
                    className="flex-1 gradient-success text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Submit Work
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => !uploading && setSelectedItem(null)}
                    disabled={uploading}
                    className="glass px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
