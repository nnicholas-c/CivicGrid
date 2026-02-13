/**
 * Government Dashboard - Manage work items and contractor assignments
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  MapPin,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import workItemsApi from '../services/workItemsApi';
import type { WorkItem } from '../services/workItemsApi';
import { assetUrl } from '../lib/assetUrl';

type TabType = 'pending_approval' | 'completed_review' | 'all_items';

export default function GovernmentDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('pending_approval');
  const [pendingItems, setPendingItems] = useState<WorkItem[]>([]);
  const [completedItems, setCompletedItems] = useState<WorkItem[]>([]);
  const [allItems, setAllItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [contractorId, setContractorId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pending, completed, all] = await Promise.all([
        workItemsApi.getPendingGovApprovalItems(),
        workItemsApi.getSelfReportedCompletedItems(),
        workItemsApi.getAllWorkItems()
      ]);
      setPendingItems(pending);
      setCompletedItems(completed);
      setAllItems(all);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAssignment = async (caseId: string) => {
    try {
      setError('');
      await workItemsApi.updateGovApprovalStatus(caseId, 'gov_approved');
      setSuccess('Assignment approved successfully');
      loadData(); // Refresh data
    } catch {
      setError('Failed to approve assignment');
    }
  };

  const handleDenyAssignment = async (caseId: string) => {
    try {
      setError('');
      await workItemsApi.updateGovApprovalStatus(caseId, 'gov_denied');
      setSuccess('Assignment denied');
      loadData(); // Refresh data
    } catch {
      setError('Failed to deny assignment');
    }
  };

  const handleApproveCompletion = async (caseId: string) => {
    try {
      setError('');
      await workItemsApi.updateGovApprovalStatus(caseId, 'completed');
      setSuccess('Work completion verified');
      loadData(); // Refresh data
    } catch {
      setError('Failed to verify completion');
    }
  };

  const handleAssignContractor = async (caseId: string) => {
    if (!contractorId.trim()) {
      setError('Please enter a contractor ID');
      return;
    }
    
    try {
      setError('');
      await workItemsApi.assignWorkItemToContractor(caseId, contractorId);
      setSuccess('Work item assigned to contractor');
      setContractorId('');
      loadData(); // Refresh data
    } catch {
      setError('Failed to assign contractor');
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
      'pending_gov_approval': { color: 'bg-yellow-500', text: 'Pending Approval' },
      'gov_approved': { color: 'bg-green-500', text: 'Approved' },
      'gov_denied': { color: 'bg-red-500', text: 'Denied' },
      'fixing': { color: 'bg-blue-500', text: 'In Progress' },
      'self_report_completed': { color: 'bg-purple-500', text: 'Awaiting Verification' },
      'completed': { color: 'bg-green-600', text: 'Completed' },
      'identified': { color: 'bg-gray-500', text: 'New' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.identified;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderItemCard = (item: WorkItem, showActions: boolean = false) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass rounded-xl p-6 border border-white/20 hover:glass-strong transition-all cursor-pointer"
      onClick={() => setSelectedItem(item)}
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

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
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
      </div>

      {/* Safety Flags */}
      {item.safety_flags && (item.safety_flags.immediate_danger || item.safety_flags.road_blocked) && (
        <div className="flex gap-2 mb-4">
          {item.safety_flags.immediate_danger && (
            <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
              <AlertTriangle size={12} />
              Immediate Danger
            </span>
          )}
          {item.safety_flags.road_blocked && (
            <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
              <AlertCircle size={12} />
              Road Blocked
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          {item.status === 'pending_gov_approval' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApproveAssignment(item.case_id || item.id);
                }}
                className="flex-1 gradient-success text-white py-2 rounded-lg font-semibold text-sm"
              >
                Approve Assignment
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDenyAssignment(item.case_id || item.id);
                }}
                className="flex-1 gradient-danger text-white py-2 rounded-lg font-semibold text-sm"
              >
                Deny
              </button>
            </>
          )}
          {item.status === 'self_report_completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApproveCompletion(item.case_id || item.id);
              }}
              className="flex-1 gradient-success text-white py-2 rounded-lg font-semibold text-sm"
            >
              Verify Completion
            </button>
          )}
          {item.status === 'identified' && (
            <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                placeholder="Contractor ID"
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="flex-1 glass px-3 py-2 rounded-lg text-white placeholder:text-white/50 text-sm"
              />
              <button
                onClick={() => handleAssignContractor(item.id)}
                className="gradient-primary text-white px-4 py-2 rounded-lg font-semibold text-sm"
              >
                Assign
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

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

      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Government Dashboard</h1>
          <p className="text-white/90">Manage work items and contractor assignments</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="glass-strong rounded-xl p-6 border border-white/20"
          >
            <AlertCircle className="text-yellow-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-white">{pendingItems.length}</div>
            <div className="text-sm text-white/70">Pending Approval</div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="glass-strong rounded-xl p-6 border border-white/20"
          >
            <Clock className="text-blue-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-white">{completedItems.length}</div>
            <div className="text-sm text-white/70">Awaiting Verification</div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="glass-strong rounded-xl p-6 border border-white/20"
          >
            <TrendingUp className="text-green-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-white">{allItems.length}</div>
            <div className="text-sm text-white/70">Total Work Items</div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="glass-strong rounded-xl p-6 border border-white/20"
          >
            <CheckCircle className="text-purple-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-white">
              {allItems.filter(i => i.status === 'completed').length}
            </div>
            <div className="text-sm text-white/70">Completed</div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending_approval')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'pending_approval' 
                ? 'gradient-primary text-white' 
                : 'glass text-white/70 hover:text-white'
            }`}
          >
            Pending Approval ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('completed_review')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'completed_review' 
                ? 'gradient-primary text-white' 
                : 'glass text-white/70 hover:text-white'
            }`}
          >
            Verify Completion ({completedItems.length})
          </button>
          <button
            onClick={() => setActiveTab('all_items')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'all_items' 
                ? 'gradient-primary text-white' 
                : 'glass text-white/70 hover:text-white'
            }`}
          >
            All Items ({allItems.length})
          </button>
          <button
            onClick={loadData}
            className="ml-auto glass px-4 py-3 rounded-xl text-white/70 hover:text-white"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="glass-strong rounded-xl p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto"></div>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {activeTab === 'pending_approval' && (
                pendingItems.length > 0 ? (
                  pendingItems.map(item => renderItemCard(item, true))
                ) : (
                  <div className="glass-strong rounded-xl p-12 text-center">
                    <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
                    <p className="text-white/70">No items pending approval</p>
                  </div>
                )
              )}
              
              {activeTab === 'completed_review' && (
                completedItems.length > 0 ? (
                  completedItems.map(item => renderItemCard(item, true))
                ) : (
                  <div className="glass-strong rounded-xl p-12 text-center">
                    <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
                    <p className="text-white/70">No completed items to verify</p>
                  </div>
                )
              )}
              
              {activeTab === 'all_items' && (
                allItems.length > 0 ? (
                  allItems.map(item => renderItemCard(item, item.status === 'identified'))
                ) : (
                  <div className="glass-strong rounded-xl p-12 text-center">
                    <AlertCircle className="mx-auto mb-4 text-yellow-400" size={48} />
                    <p className="text-white/70">No work items found</p>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            className="fixed bottom-4 right-4 glass-strong border border-green-500/20 rounded-xl p-4 flex items-center gap-3 max-w-md"
          >
            <CheckCircle className="text-green-500" size={20} />
            <p className="text-sm text-green-400">{success}</p>
          </motion.div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="glass-strong rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Work Item Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-white/50 mb-1">Summary</p>
                    <p className="text-white">{selectedItem.issue_summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/50 mb-1">Category</p>
                      <p className="text-white capitalize">{selectedItem.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/50 mb-1">Status</p>
                      {getStatusBadge(selectedItem.status)}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-white/50 mb-1">Location</p>
                    <p className="text-white">{selectedItem.location.free_text}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/50 mb-1">Priority Score</p>
                      <p className="text-white font-bold">{selectedItem.scores.priority_score}/100</p>
                    </div>
                    {selectedItem.scores.severity_label && (
                      <div>
                        <p className="text-sm text-white/50 mb-1">Severity</p>
                        <p className={`font-bold capitalize ${getSeverityColor(selectedItem.scores.severity_label)}`}>
                          {selectedItem.scores.severity_label}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {selectedItem.contractor_id && (
                    <div>
                      <p className="text-sm text-white/50 mb-1">Assigned Contractor</p>
                      <p className="text-white">{selectedItem.contractor_id}</p>
                    </div>
                  )}
                  
                  {selectedItem.fixed_picture && (
                    <div>
                      <p className="text-sm text-white/50 mb-1">Completion Evidence</p>
                      <img 
                        src={selectedItem.fixed_picture} 
                        alt="Fixed" 
                        className="w-full rounded-lg mt-2"
                      />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setSelectedItem(null)}
                  className="mt-6 w-full glass py-3 rounded-xl text-white font-semibold"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
