/**
 * Unauthorized Page
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-3xl p-8 md:p-12 text-center max-w-md"
      >
        <div className="w-20 h-20 gradient-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="text-white" size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have permission to access this page.
        </p>
        <Link to="/">
          <button className="gradient-primary text-white px-8 py-3 rounded-xl font-semibold">
            Go Home
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
