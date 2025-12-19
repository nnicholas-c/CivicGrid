/**
 * Footer Component with Glassmorphism
 */

import { Network } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="glass-strong border-t border-white/10 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-orange">
              <Network className="text-white" size={26} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold gradient-text">CivicGrid</span>
          </div>

          <div className="text-sm font-semibold text-orange-500 text-center md:text-left">
            @2025 CivicGrid. Integrated with AI for a better tomorrow.
          </div>

          <div className="flex gap-6">
            <Link to="/" className="text-orange-500 hover:text-orange-400 transition-colors text-sm font-bold">
              Home
            </Link>
            <Link to="/cases" className="text-orange-500 hover:text-orange-400 transition-colors text-sm font-bold">
              Cases
            </Link>
            <Link to="/report" className="text-orange-500 hover:text-orange-400 transition-colors text-sm font-bold">
              Report
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
