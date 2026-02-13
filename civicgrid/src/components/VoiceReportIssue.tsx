/**
 * Voice Report Issue Component
 * AI-powered voice agent for reporting civic issues
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  PhoneOff, 
  Camera, 
  Mic, 
  MicOff, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  MessageSquare
} from 'lucide-react';
import voiceAgentApi from '../services/voiceAgentApi';
import type { RateLimitStatus } from '../services/voiceAgentApi';
import workItemsApi from '../services/workItemsApi';
import { assetUrl } from '../lib/assetUrl';

export default function VoiceReportIssue() {
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [connectingMessage, setConnectingMessage] = useState('Connecting to server...');
  const [error, setError] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitStatus | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const transcriptRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-scroll transcript to bottom
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Fetch rate limit status on mount
  useEffect(() => {
    voiceAgentApi.checkRateLimit().then((status) => {
      if (status) setRateLimitInfo(status);
    });
  }, []);

  const checkProcessingStatus = async (uploadId: string) => {
    try {
      console.log('🔍 [Grok Status] Checking processing status for:', uploadId);
      const result = await workItemsApi.getUserUpload(uploadId);
      console.log('📊 [Grok Status] Full response:', JSON.stringify(result, null, 2));
      
      // API returns { count, documents: [{id, status, ...}] }
      const upload = result.documents?.[0];
      
      // If no upload found or count is 0, it was processed and removed!
      if (!upload || result.count === 0) {
        console.log('✅ [Grok Status] Upload not found - It was processed and removed from queue!');
        setProcessingStatus('completed');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          console.log('⏹️ [Grok Status] Stopped polling');
        }
        setTimeout(() => {
          console.log('🔀 [Grok Status] Redirecting to dashboard...');
          navigate('/government/dashboard');
        }, 2000);
        return;
      }
      
      console.log('📊 [Grok Status] Upload status:', upload.status);
      console.log('📊 [Grok Status] Upload ID:', upload.id);
      console.log('📊 [Grok Status] Has workItemId:', !!upload.workItemId);
      
      // Check multiple conditions for processed status:
      // 1. Has a workItemId (means it was processed and work item created)
      // 2. Status is not "raw" (processed status)
      // 3. Has "processed" field set to true
      const isProcessed = upload.workItemId || 
                         (upload.status && upload.status !== 'raw') ||
                         upload.processed === true;
      
      if (isProcessed) {
        console.log('✅ [Grok Status] Processing COMPLETED!');
        setProcessingStatus('completed');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          console.log('⏹️ [Grok Status] Stopped polling');
        }
        setTimeout(() => {
          console.log('🔀 [Grok Status] Redirecting to dashboard...');
          navigate('/government/dashboard');
        }, 2000);
      } else {
        console.log('⏳ [Grok Status] Still processing... (status:', upload.status, ')');
      }
    } catch (err) {
      console.error('❌ [Grok Status] Error checking processing status:', err);
      // Don't set error immediately - keep polling
    }
  };

  const startPollingStatus = (uploadId: string) => {
    console.log('🚀 [Grok Status] Starting to poll for upload ID:', uploadId);
    setProcessingStatus('processing');
    
    // Check immediately
    console.log('🔄 [Grok Status] Initial check...');
    checkProcessingStatus(uploadId);
    
    // Then poll every 3 seconds
    console.log('⏰ [Grok Status] Setting up polling interval (every 3 seconds)');
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 [Grok Status] Polling...');
      checkProcessingStatus(uploadId);
    }, 3000);
    
    // Auto-redirect after 45 seconds (Grok usually takes 10-30 seconds)
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        console.log('⏰ [Grok Status] 45 seconds elapsed - assuming processing complete');
        clearInterval(pollingIntervalRef.current);
        setProcessingStatus('completed');
        setTimeout(() => {
          console.log('🔀 [Grok Status] Auto-redirecting to dashboard...');
          navigate('/government/dashboard');
        }, 2000);
      }
    }, 45000);
    
    // Stop polling after 2 minutes (safety)
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        console.warn('⚠️ [Grok Status] Timeout reached (2 minutes). Stopping polling.');
        clearInterval(pollingIntervalRef.current);
        if (processingStatus === 'processing') {
          console.warn('⚠️ [Grok Status] Processing took too long - setting error state');
          setProcessingStatus('error');
        }
      }
    }, 120000);
  };

  const startCall = async () => {
    try {
      setError('');
      setTranscript('');
      
      // Check rate limit before connecting
      const rateStatus = await voiceAgentApi.checkRateLimit();
      if (rateStatus) {
        setRateLimitInfo(rateStatus);
        if (rateStatus.remaining <= 0) {
          setError(`Daily demo limit reached (${rateStatus.limit} calls/day). Resets tomorrow. This is a portfolio demo — voice calls are rate-limited to manage API costs.`);
          return;
        }
      }
      
      setCallState('connecting');
      setConnectingMessage('Connecting to server...');
      
      // Progress messages while waiting
      const progressTimer1 = setTimeout(() => setConnectingMessage('Initializing AI models...'), 5000);
      const progressTimer2 = setTimeout(() => setConnectingMessage('Loading voice recognition...'), 10000);
      const progressTimer3 = setTimeout(() => setConnectingMessage('Almost ready — hang tight...'), 15000);
      
      // Connection timeout (30 seconds)
      const timeoutTimer = setTimeout(() => {
        if (callState === 'connecting') {
          voiceAgentApi.disconnect();
          setError('Connection timed out. The server may be starting up — please try again in a moment.');
          setCallState('idle');
        }
      }, 30000);
      
      await voiceAgentApi.connect({
        onConnect: () => {
          // Connected to our server, but Deepgram agent isn't ready yet
          setConnectingMessage('Setting up voice agent...');
        },
        onReady: () => {
          // Deepgram agent is fully initialized — go active
          clearTimeout(progressTimer1);
          clearTimeout(progressTimer2);
          clearTimeout(progressTimer3);
          clearTimeout(timeoutTimer);
          setCallState('active');
        },
        onRateLimited: (data) => {
          clearTimeout(progressTimer1);
          clearTimeout(progressTimer2);
          clearTimeout(progressTimer3);
          clearTimeout(timeoutTimer);
          setRateLimitInfo(data);
          setError(data.message || `Daily demo limit reached (${data.limit} calls/day). Resets tomorrow.`);
          setCallState('idle');
          voiceAgentApi.disconnect();
        },
        onDisconnect: () => {
          setCallState('ended');
        },
        onSessionStarted: (data) => {
          setSessionId(data.session_id);
        },
        onConversation: (data) => {
          setTranscript(data.transcript);
        },
        onThinking: (data) => {
          setTranscript(data.transcript);
        },
        onAgentSpeaking: () => {
          setIsAgentSpeaking(true);
        },
        onAgentStoppedSpeaking: () => {
          setIsAgentSpeaking(false);
        },
        onUserStartedSpeaking: () => {
          setIsUserSpeaking(true);
        },
        onUserStoppedSpeaking: () => {
          setIsUserSpeaking(false);
        },
        onError: (data) => {
          setError(data.data.message);
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start call';
      setError(message);
      setCallState('idle');
    }
  };

  const endCall = async () => {
    console.log('📞 [Voice Call] Ending call...');
    // Tell backend to save transcript before disconnecting
    console.log('💾 [Voice Call] Sending end_call signal to backend');
    voiceAgentApi.endCall();
    
    // Wait a moment for save to complete, then disconnect
    setTimeout(() => {
      console.log('🔌 [Voice Call] Disconnecting from voice agent');
      voiceAgentApi.disconnect();
      setCallState('ended');
      setSuccess(true);
      
      // Start polling for processing status
      if (sessionId) {
        console.log('🎯 [Voice Call] Session ID:', sessionId);
        console.log('🤖 [Grok Status] Will now check if Claude Analyzer has processed this...');
        startPollingStatus(sessionId);
      } else {
        console.warn('⚠️ [Voice Call] No session ID available - cannot poll for Claude processing!');
      }
    }, 1000);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile || callState !== 'active') return;
    
    setUploadingPhoto(true);
    setError('');
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/... prefix
        
        await voiceAgentApi.uploadPicture(base64Data);
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(photoFile);
    } catch {
      setError('Failed to upload photo');
      setUploadingPhoto(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-3xl p-8 md:p-12 text-center max-w-md border border-white/30 shadow-2xl"
        >
          {processingStatus === 'processing' && (
            <>
              <motion.div
                className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="text-white" size={40} />
              </motion.div>
              <h2 className="text-4xl font-bold mb-4 text-black">Processing Report...</h2>
              <p className="text-black/90 mb-6 text-lg font-medium">
                Claude AI is analyzing your report and images
              </p>
              <div className="glass-strong rounded-xl p-5 mb-6 border border-gray-300 bg-white/80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                    <span className="text-sm text-black font-semibold">Transcript saved</span>
                    <CheckCircle className="text-green-600" size={16} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                    <span className="text-sm text-black font-semibold">AI Analysis</span>
                    <Loader2 className="text-blue-600 animate-spin" size={16} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                    <span className="text-sm text-black font-semibold">Creating work item</span>
                    <div className="w-4 h-4 rounded-full bg-gray-300 border border-gray-400" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-black/60 font-medium">
                This usually takes 10-30 seconds. Auto-redirecting in ~45 seconds...
              </p>
              <button
                onClick={() => {
                  if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                  }
                  navigate('/government/dashboard');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Skip to Dashboard
              </button>
            </>
          )}
          
          {processingStatus === 'completed' && (
            <>
              <motion.div
                className="w-20 h-20 gradient-success rounded-full flex items-center justify-center mx-auto mb-6 glow-green"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="text-white" size={40} />
              </motion.div>
              <h2 className="text-4xl font-bold mb-4 text-white">Report Complete!</h2>
              <p className="text-white/90 mb-6 text-lg">
                Your issue has been analyzed and added to the work queue
              </p>
              <div className="glass-strong rounded-xl p-5 mb-6 border border-white/30 bg-black/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/10">
                    <span className="text-sm text-white font-semibold">Transcript saved</span>
                    <CheckCircle className="text-green-400" size={16} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/10">
                    <span className="text-sm text-white font-semibold">AI Analysis</span>
                    <CheckCircle className="text-green-400" size={16} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/10">
                    <span className="text-sm text-white font-semibold">Work item created</span>
                    <CheckCircle className="text-green-400" size={16} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/70 font-medium">
                Redirecting to dashboard...
              </p>
            </>
          )}
          
          {processingStatus === 'error' && (
            <>
              <motion.div
                className="w-20 h-20 glass-strong rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <AlertCircle className="text-yellow-400" size={40} />
              </motion.div>
              <h2 className="text-4xl font-bold mb-4 text-white">Processing Taking Longer</h2>
              <p className="text-white/90 mb-6 text-lg">
                Your report was saved but analysis is taking longer than expected
              </p>
              <button
                onClick={() => navigate('/government/dashboard')}
                className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold"
              >
                Go to Dashboard
              </button>
            </>
          )}
          
          {processingStatus === 'idle' && (
            <>
              <motion.div
                className="w-20 h-20 gradient-success rounded-full flex items-center justify-center mx-auto mb-6 glow-green"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="text-white" size={40} />
              </motion.div>
              <h2 className="text-4xl font-bold mb-4 text-white">Report Submitted!</h2>
              <p className="text-white/90 mb-6 text-lg">
                Your issue has been reported and will be reviewed shortly.
              </p>
              <div className="glass rounded-xl p-5 mb-6 border border-white/30">
                <p className="text-sm text-white/70 mb-2 font-medium">Session ID</p>
                <p className="text-2xl font-bold gradient-text">{sessionId}</p>
              </div>
              <p className="text-sm text-white/70 font-medium">
                Processing report...
              </p>
            </>
          )}
        </motion.div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-6 md:p-10 border border-white/30 shadow-2xl"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4 glow-orange"
            >
              <Phone className="text-white" size={32} />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">
              AI Voice Agent
            </h1>
            <p className="text-white/90 text-lg font-medium">
              Report issues using our intelligent voice assistant
            </p>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Call Controls & Photo */}
            <div className="space-y-6">
              {/* Call Controls */}
              <div className="glass rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">Voice Call</h3>
                
                <div className="flex justify-center gap-4 mb-6">
                  <AnimatePresence mode="wait">
                    {callState === 'idle' && (
                      <motion.button
                        key="start"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={startCall}
                        className="gradient-primary text-white p-6 rounded-full shadow-xl hover:scale-110 transition-transform"
                      >
                        <Phone size={32} />
                      </motion.button>
                    )}
                    
                    {callState === 'connecting' && (
                      <motion.div
                        key="connecting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-strong p-6 rounded-full"
                      >
                        <Loader2 className="text-white animate-spin" size={32} />
                      </motion.div>
                    )}
                    
                    {callState === 'active' && (
                      <motion.button
                        key="end"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={endCall}
                        className="gradient-danger text-white p-6 rounded-full shadow-xl hover:scale-110 transition-transform"
                      >
                        <PhoneOff size={32} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Status Indicators */}
                {callState === 'active' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Agent</span>
                      <div className="flex items-center gap-2">
                        {isAgentSpeaking ? (
                          <>
                            <Mic className="text-green-400" size={16} />
                            <span className="text-green-400 text-sm">Speaking</span>
                          </>
                        ) : (
                          <>
                            <MicOff className="text-gray-400" size={16} />
                            <span className="text-gray-400 text-sm">Listening</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">You</span>
                      <div className="flex items-center gap-2">
                        {isUserSpeaking ? (
                          <>
                            <Mic className="text-blue-400" size={16} />
                            <span className="text-blue-400 text-sm">Speaking</span>
                          </>
                        ) : (
                          <>
                            <MicOff className="text-gray-400" size={16} />
                            <span className="text-gray-400 text-sm">Silent</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {callState === 'idle' && (
                  <p className="text-center text-white/70 text-sm">
                    Click the phone button to start your report
                  </p>
                )}
                
                {callState === 'connecting' && (
                  <p className="text-center text-white/70 text-sm">
                    {connectingMessage}
                  </p>
                )}
                
                {callState === 'active' && (
                  <p className="text-center text-green-400 text-sm font-medium">
                    Call active - Speak clearly
                  </p>
                )}
              </div>

              {/* Photo Upload */}
              <div className="glass rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">
                  Photo Evidence
                </h3>
                
                {!photoPreview ? (
                  <label className="block glass hover:glass-strong rounded-xl p-8 text-center cursor-pointer transition-all">
                    <Camera className="mx-auto mb-3 text-gray-400" size={40} />
                    <p className="text-white/70 font-medium mb-1">
                      Click to select a photo
                    </p>
                    <p className="text-sm text-white/50">
                      Max 5MB, JPG, PNG, or HEIC
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="relative glass rounded-xl p-2">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview('');
                        }}
                        className="absolute top-4 right-4 glass-strong w-10 h-10 rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition-transform"
                      >
                        ×
                      </button>
                    </div>
                    
                    {callState === 'active' && (
                      <button
                        onClick={uploadPhoto}
                        disabled={uploadingPhoto}
                        className="w-full gradient-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={20} />
                            Upload to Agent
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Transcript */}
            <div className="glass rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="text-white" size={20} />
                <h3 className="text-lg font-bold text-white">Transcript</h3>
              </div>
              
              <div 
                ref={transcriptRef}
                className="glass rounded-lg p-4 h-[400px] overflow-y-auto text-white/80 whitespace-pre-wrap font-mono text-sm"
              >
                {transcript || (
                  <span className="text-white/40 italic">
                    Transcript will appear here once the call starts...
                  </span>
                )}
              </div>
              
              {sessionId && (
                <div className="mt-4 p-3 glass rounded-lg">
                  <p className="text-xs text-white/70">Session ID</p>
                  <p className="text-sm font-mono text-white">{sessionId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass-strong border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Rate limit indicator */}
          {rateLimitInfo && callState === 'idle' && !error && (
            <div className="mt-4 text-center">
              <span className="text-xs text-white/50">
                Demo calls remaining today: {rateLimitInfo.remaining}/{rateLimitInfo.limit}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
