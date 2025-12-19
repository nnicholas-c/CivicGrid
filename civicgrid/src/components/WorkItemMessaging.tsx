/**
 * Work Item Messaging Component
 * Allows communication between government officials, contractors, and citizens
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MessageSquare, X } from 'lucide-react';
import workItemsApi from '../services/workItemsApi';

interface Message {
  sender: string;
  message: string;
  timestamp: Date;
}

interface WorkItemMessagingProps {
  caseId: string;
  currentUser: string;
  onClose?: () => void;
}

export default function WorkItemMessaging({ caseId, currentUser, onClose }: WorkItemMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    setError('');

    try {
      await workItemsApi.addMessage(caseId, newMessage.trim(), currentUser);
      
      // Add message to local state
      setMessages([...messages, {
        sender: currentUser,
        message: newMessage.trim(),
        timestamp: new Date()
      }]);
      
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-strong rounded-2xl border border-white/20 flex flex-col h-[600px] max-h-[80vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-white" size={24} />
          <div>
            <h3 className="text-lg font-bold text-white">Work Item Messages</h3>
            <p className="text-xs text-white/50">Case ID: {caseId}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="glass p-2 rounded-lg hover:glass-strong transition-colors"
          >
            <X className="text-white/70 hover:text-white" size={20} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto mb-3 text-white/30" size={48} />
              <p className="text-white/50 text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.sender === currentUser ? 'flex-row-reverse' : ''}`}
              >
                <div className={`glass p-2 rounded-full h-10 w-10 flex items-center justify-center ${
                  msg.sender === currentUser ? 'bg-blue-500/20' : 'bg-gray-500/20'
                }`}>
                  <User size={20} className="text-white" />
                </div>
                <div className={`flex-1 max-w-[70%] ${msg.sender === currentUser ? 'text-right' : ''}`}>
                  <div className={`glass-strong rounded-2xl p-3 inline-block ${
                    msg.sender === currentUser 
                      ? 'bg-blue-500/20 border-blue-500/30' 
                      : 'border-white/20'
                  }`}>
                    <p className="text-xs text-white/50 mb-1">{msg.sender}</p>
                    <p className="text-white text-sm">{msg.message}</p>
                  </div>
                  <p className="text-xs text-white/30 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2">
          <div className="glass-strong border border-red-500/20 rounded-lg p-2 text-xs text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 glass px-4 py-3 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:glass-strong transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-white/30 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
}
