/**
 * Glassmorphism Navigation Component
 */

import { motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Network, Home, MapPin, Plus, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/ui';
import { useState } from 'react';

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const headerOpacity = useUIStore((state) => state.headerOpacity);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'contractor':
        return '/contractor/dashboard';
      case 'official':
        return '/official/dashboard';
      default:
        return '/dashboard';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header
      className="glass-strong border-b border-white/10 sticky top-0 z-50 transition-opacity duration-300"
      style={{
        opacity: headerOpacity,
        pointerEvents: headerOpacity < 0.05 ? 'none' : 'auto',
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Golden Gate Bridge Theme */}
          <Link to="/">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <motion.div
                className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-orange"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Network className="text-white" size={26} strokeWidth={2.5} />
              </motion.div>
              <span className="text-2xl font-bold gradient-text">CivicGrid</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-4"
          >
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold ${
                  isActive('/')
                    ? 'glass-strong text-white text-high-contrast border-2 border-orange-500/90 shadow-lg bg-gradient-to-r from-orange-600/50 to-amber-600/50'
                    : 'text-white text-high-contrast hover:glass-strong hover:border-2 hover:border-orange-500/60 hover:shadow-lg hover:bg-gradient-to-r hover:from-orange-600/25 hover:to-amber-600/25'
                }`}
              >
                <Home size={20} strokeWidth={2.5} />
                <span className="text-base">Home</span>
              </motion.button>
            </Link>

            <Link to="/cases">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold ${
                  isActive('/cases')
                    ? 'glass-strong text-white text-high-contrast border-2 border-orange-400/70 shadow-lg bg-gradient-to-r from-orange-500/30 to-amber-500/30'
                    : 'text-white text-high-contrast hover:glass-strong hover:border-2 hover:border-orange-400/50 hover:shadow-lg hover:bg-gradient-to-r hover:from-orange-500/15 hover:to-amber-500/15'
                }`}
              >
                <MapPin size={20} strokeWidth={2.5} />
                <span className="text-base">Cases</span>
              </motion.button>
            </Link>

            <Link to="/report">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold ${
                  isActive('/report')
                    ? 'glass-strong text-white text-high-contrast border-2 border-orange-400/70 shadow-lg bg-gradient-to-r from-orange-500/30 to-amber-500/30'
                    : 'text-white text-high-contrast hover:glass-strong hover:border-2 hover:border-orange-400/50 hover:shadow-lg hover:bg-gradient-to-r hover:from-orange-500/15 hover:to-amber-500/15'
                }`}
              >
                <Plus size={20} strokeWidth={2.5} />
                <span className="text-base">Report</span>
              </motion.button>
            </Link>

            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <button className="flex items-center gap-2 glass-strong px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-bold text-white text-high-contrast border-2 border-white/40">
                    <LayoutDashboard size={20} strokeWidth={2.5} />
                    <span className="text-base">Dashboard</span>
                  </button>
                </Link>

                <div className="flex items-center gap-3">
                  <div className="glass-strong px-5 py-2.5 rounded-xl border-2 border-white/40">
                    <span className="text-sm font-bold text-white">{user?.name}</span>
                    <span className="ml-2 text-xs text-white/90 font-semibold">
                      ({user?.role})
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 glass-strong px-4 py-2.5 rounded-xl hover:shadow-lg transition-all text-red-300 font-bold border-2 border-red-400/40"
                  >
                    <LogOut size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-strong px-8 py-2.5 rounded-xl font-bold text-white text-high-contrast text-base border-2 border-orange-500/90 shadow-lg bg-gradient-to-r from-orange-600/50 to-amber-600/50 hover:border-orange-500/100 transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            )}
          </motion.nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden glass p-2 rounded-xl"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-4 glass-strong rounded-2xl p-4 space-y-2"
          >
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl hover:glass-strong transition-all text-left">
                <Home size={18} />
                <span>Home</span>
              </button>
            </Link>

            <Link to="/cases" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl hover:glass-strong transition-all text-left">
                <MapPin size={18} />
                <span>Cases</span>
              </button>
            </Link>

            <Link to="/report" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl hover:glass-strong transition-all text-left">
                <Plus size={18} />
                <span>Report Issue</span>
              </button>
            </Link>

            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl hover:glass-strong transition-all text-left">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </button>
                </Link>

                <div className="px-4 py-3 border-t border-white/10">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl hover:glass-strong transition-all text-left text-red-600 dark:text-red-400"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full glass px-4 py-3 rounded-xl font-medium">
                  Sign In
                </button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
