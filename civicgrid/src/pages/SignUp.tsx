/**
 * Sign Up Page - Hackathon Demo
 * Glassmorphism design matching Login page
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, UserCircle, Briefcase, Shield, Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';
import { assetUrl } from '../lib/assetUrl';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('civilian');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuthStore();
  const navigate = useNavigate();

  const roles: { value: UserRole; label: string; icon: typeof UserCircle; description: string }[] = [
    { value: 'civilian', label: 'Civilian', icon: UserCircle, description: 'Report and track issues' },
    { value: 'contractor', label: 'Contractor', icon: Briefcase, description: 'Accept and complete tasks' },
    { value: 'official', label: 'Official', icon: Shield, description: 'Manage and oversee operations' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(name, email, password, selectedRole);

      // Navigate based on role
      switch (selectedRole) {
        case 'contractor':
          navigate('/contractor/dashboard');
          break;
        case 'official':
          navigate('/official/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch {
      setError('Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Sign Up Card */}
        <div className="glass-strong rounded-3xl p-8 md:p-10 border border-white/20 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <UserPlus className="text-white" size={32} />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 text-white text-high-contrast-strong">
              Join CivicGrid
            </h1>
            <p className="text-white/90">
              Create an account to get started
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm mb-3 text-white text-high-contrast font-bold">
              I am a...
            </label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((role) => (
                <motion.button
                  key={role.value}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 rounded-xl transition-all ${
                    selectedRole === role.value
                      ? 'glass-strong gradient-primary text-white'
                      : 'glass hover:glass-strong text-white/70 hover:text-white'
                  }`}
                >
                  <role.icon className="mx-auto mb-2" size={24} />
                  <div className="text-xs font-medium">{role.label}</div>
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-white/90 mt-2 text-center">
              {roles.find(r => r.value === selectedRole)?.description}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-white text-high-contrast font-bold">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full glass pl-12 pr-4 py-3 rounded-xl focus-ring focus:glass-strong transition-all outline-none text-white placeholder:text-white/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-white text-high-contrast font-bold">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full glass pl-12 pr-4 py-3 rounded-xl focus-ring focus:glass-strong transition-all outline-none text-white placeholder:text-white/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-white text-high-contrast font-bold">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full glass pl-12 pr-4 py-3 rounded-xl focus-ring focus:glass-strong transition-all outline-none text-white placeholder:text-white/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-white text-high-contrast font-bold">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full glass pl-12 pr-4 py-3 rounded-xl focus-ring focus:glass-strong transition-all outline-none text-white placeholder:text-white/50"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-strong border border-red-500/20 rounded-xl p-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full gradient-primary text-white py-4 rounded-xl font-semibold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </form>

          {/* Demo Notice */}
          <div className="mt-6 glass rounded-xl p-4 border border-white/20 shadow-xl">
            <p className="text-sm text-white/90 text-center">
              <span className="font-semibold">🎉 Hackathon Demo:</span> All accounts are instantly created!
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-white/90">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-white text-high-contrast hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
