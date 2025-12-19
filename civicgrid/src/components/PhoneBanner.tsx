/**
 * Phone Banner Component
 * Displays a prominent call-to-action phone number for reporting issues
 * Opacity controlled by UI store for one-shot reveal behavior
 */

import { Phone } from 'lucide-react';
import { useUIStore } from '../store/ui';

interface PhoneBannerProps {
  className?: string;
}

export default function PhoneBanner({ className = '' }: PhoneBannerProps) {
  const phoneNumber = '1-800-FIX-CITY'; // (1-800-349-2489)
  const telLink = 'tel:+18003492489';
  const phoneOpacity = useUIStore((state) => state.phoneOpacity);

  return (
    <div
      className={`glass-strong border border-white/20 transition-opacity duration-300 ${className}`}
      style={{
        opacity: phoneOpacity,
        pointerEvents: phoneOpacity < 0.05 ? 'none' : 'auto',
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <a
          href={telLink}
          className="flex items-center justify-center gap-4 group"
        >
          {/* Phone Icon with Pulse Animation */}
          <div
            className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-lg glow-orange animate-pulse"
          >
            <Phone className="text-white" size={24} strokeWidth={2.5} />
          </div>

          {/* Text Content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <span className="text-white font-bold text-sm sm:text-base">
              Report by Phone:
            </span>
            <span
              className="text-2xl sm:text-3xl font-bold gradient-text group-hover:scale-105 transition-transform"
            >
              {phoneNumber}
            </span>
          </div>

          {/* Hover Indicator */}
          <div
            className="hidden sm:block text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Click to call →
          </div>
        </a>
      </div>
    </div>
  );
}
