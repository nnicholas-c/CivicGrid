/**
 * CivicGrid Landing Page
 * San Francisco themed with dynamic background rotation
 */

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Phone, MapPin, Clock, Users, CheckCircle, TrendingUp, AlertCircle, Building2, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import PhoneBanner from '../components/PhoneBanner';
import CaseMap from '../components/CaseMap';
import FinalReveal from '../components/FinalReveal';
import BackgroundRotator from '../components/BackgroundRotator';
import SectionSentinel from '../components/SectionSentinel';
import { useBackgroundCycle } from '../hooks/useBackgroundCycle';
import apiService from '../services/api';

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [cases, setCases] = useState<any[]>([]);
  const { scrollYProgress } = useScroll();

  // Background rotation hook - deterministic, always starts with GGB
  const { currentSrc, nextSrc, advance } = useBackgroundCycle();

  // Parallax effects - reduced for better visibility
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 0.9, 0.7]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch cases for map
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const allCases = await apiService.getAllCases();
        setCases(allCases);
      } catch (error) {
        console.error('Error fetching cases:', error);
      }
    };
    fetchCases();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Dynamic Background with Rotation */}
      <motion.div
        className="fixed inset-0 -z-10"
        style={{ scale, opacity }}
      >
        {/* BackgroundRotator with crossfade */}
        <BackgroundRotator src={currentSrc} className="w-full h-full" />

        {/* Minimal overlay only at top and bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none" />
      </motion.div>

      {/* Phone Banner - Report by Phone */}
      <PhoneBanner className="sticky top-16 z-40" />

      {/* Hero Section with Sentinels */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center"
        style={{ y: heroY }}
      >
        {/* Top Sentinel - Detects scroll up re-entry */}
        <SectionSentinel position="top" onEnter={advance} />

        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* System Status Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 glass-strong px-6 py-3 rounded-full mb-8 border border-white/30 shadow-2xl"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-white">System Online • Real-Time Monitoring</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl sm:text-6xl md:text-8xl font-bold mb-8 leading-tight"
            >
              <span className="gradient-text">
                Fix Your City
              </span>
              <br />
              <span className="text-white drop-shadow-2xl">
                In Real Time
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg"
            >
              Report civic issues instantly. Watch verified contractors fix them.
              Payments secured on-chain. <span className="text-blue-300 font-semibold">Your city, reimagined.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link to="/report" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto gradient-primary px-10 py-5 rounded-2xl font-bold text-xl text-white shadow-2xl border-2 border-white/40 backdrop-blur-xl glow-orange"
                >
                  <Phone className="inline mr-3" size={26} strokeWidth={2.5} />
                  Report Issue Now
                </motion.button>
              </Link>

              <Link to="/cases" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto glass-strong px-10 py-5 rounded-2xl font-bold text-xl text-white shadow-2xl border-2 border-white/50 backdrop-blur-xl"
                >
                  <MapPin className="inline mr-3" size={26} strokeWidth={2.5} />
                  View Live Grid
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-16 text-sm md:text-base"
            >
              {[
                { icon: CheckCircle, text: 'Fully Transparent', color: 'text-green-400' },
                { icon: Building2, text: 'Government Partnership', color: 'text-orange-400' },
                { icon: Clock, text: '<2hr Response', color: 'text-sky-400' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 glass px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                  <item.icon size={20} className={item.color} strokeWidth={2.5} />
                  <span className="text-white font-bold text-high-contrast">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: scrollY < 100 ? 1 : 0 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/60 text-sm flex flex-col items-center gap-2"
            >
              <span>Scroll to explore</span>
              <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-white/60 rounded-full mt-2"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Sentinel - Detects scroll down exit */}
        <SectionSentinel position="bottom" onEnter={advance} />
      </motion.section>

      {/* Live Stats Section with Zoom Effect */}
      <motion.section
        className="relative py-20 bg-gray-900/10 backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Real-Time Impact
            </h2>
            <p className="text-xl text-gray-300">
              Making San Francisco better, one fix at a time
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { label: 'Issues Fixed', value: '1,234', icon: CheckCircle, gradient: 'gradient-success', detail: 'This month' },
              { label: 'Avg Response', value: '<2hrs', icon: Clock, gradient: 'gradient-primary', detail: 'City-wide' },
              { label: 'Active Vendors', value: '156', icon: Users, gradient: 'gradient-warning', detail: 'Verified' },
              { label: 'In Progress', value: '43', icon: Wrench, gradient: 'gradient-danger', detail: 'Right now' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-strong rounded-3xl p-8 text-center border border-white/10 backdrop-blur-xl"
              >
                <div className={`w-16 h-16 ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
                  <stat.icon className="text-white" size={32} />
                </div>
                <div className="text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-sm text-gray-400">{stat.detail}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section with Parallax Cards */}
      <motion.section
        className="relative py-20 bg-gradient-to-b from-gray-900/80 to-gray-900"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Powered by AI</span>
              <span className="text-white"> & Real-Time Data</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From voice report to verified repair, fully autonomous civic infrastructure
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: Phone,
                title: 'Voice-First Reporting',
                description: 'Call our AI agent. Describe the issue naturally. We handle location, photos, routing automatically.',
                gradient: 'gradient-primary'
              },
              {
                icon: MapPin,
                title: 'Live Civic Grid',
                description: 'Real-time map of every issue, clustered by severity. Full transparency for all citizens.',
                gradient: 'gradient-success'
              },
              {
                icon: Users,
                title: 'Verified Contractors',
                description: 'KYB-verified vendors compete for jobs. Track work with GPS and timestamped photo proofs.',
                gradient: 'gradient-warning'
              },
              {
                icon: TrendingUp,
                title: 'Smart Routing',
                description: 'AI determines urgency, assigns SLAs, routes to qualified contractors automatically.',
                gradient: 'gradient-danger'
              },
              {
                icon: CheckCircle,
                title: 'On-Chain Escrow',
                description: 'Payments locked in smart contracts. Released only after city official verification.',
                gradient: 'gradient-success'
              },
              {
                icon: AlertCircle,
                title: '24/7 Monitoring',
                description: 'Continuous AI surveillance of city infrastructure. Proactive issue detection.',
                gradient: 'gradient-primary'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="glass-strong rounded-3xl p-8 border border-white/10 backdrop-blur-xl group h-full flex flex-col"
              >
                <div className={`w-20 h-20 ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform`}>
                  <feature.icon className="text-white" size={36} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Live Civic Issues Map Section */}
      <motion.section
        className="relative py-20 bg-transparent"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Live Civic Issues Map
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Track every civic issue in real-time with our color-coded status system
            </p>
          </motion.div>

          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full h-[600px] md:h-[700px]"
          >
            <CaseMap cases={cases} />
          </motion.div>
        </div>
      </motion.section>

      {/* Final Reveal Section - Uses nextSrc for dynamic rotation */}
      <FinalReveal
        bgSrc={nextSrc}
        title="Ready to Fix Your City?"
        showCTAs={true}
      />
    </div>
  );
}
