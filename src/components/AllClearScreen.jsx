/**
 * AllClearScreen — Full Dashboard Recovery View
 * ===============================================
 * Semi-transparent overlay showing the live HMI in the background.
 * Displays incident summary stats, then fades to reveal the nominal HMI.
 * "Return to HMI" button dismisses instantly.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Shield, Clock, AlertTriangle,
  Wind, Activity, ArrowRight, BarChart2
} from 'lucide-react';

const AllClearScreen = ({ visible, onDismiss, incidentStats }) => {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (!visible) { setCountdown(6); return; }
    setCountdown(6);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); onDismiss(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, onDismiss]);

  const stats = incidentStats || {};

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(3,22,12,0.82)' }}
        >
          {/* Expanding green rings */}
          {[1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ border: '1px solid rgba(74,222,128,0.2)' }}
              initial={{ width: 100, height: 100, opacity: 0.6 }}
              animate={{ width: 100 + i * 200, height: 100 + i * 200, opacity: 0 }}
              transition={{ duration: 2.5, delay: i * 0.35, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}

          {/* ── Main card ── */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
            className="relative z-10 w-full max-w-2xl mx-4 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(5,46,22,0.95) 0%, rgba(3,30,18,0.98) 100%)',
              border: '1px solid rgba(74,222,128,0.3)',
              boxShadow: '0 0 80px rgba(34,197,94,0.15), 0 0 20px rgba(34,197,94,0.1)',
            }}
          >
            {/* Top header */}
            <div className="px-8 pt-8 pb-5 text-center border-b border-green-900/40">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 18, delay: 0.3 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{
                  background: 'rgba(34,197,94,0.1)',
                  border: '2px solid rgba(74,222,128,0.5)',
                  boxShadow: '0 0 40px rgba(74,222,128,0.3)',
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-4xl font-black tracking-widest font-mono text-green-300"
              >
                ALL CLEAR
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-green-600 text-xs font-mono tracking-widest mt-1 uppercase"
              >
                ✓ Incident Resolved · System Nominal · All Zones Safe
              </motion.p>
            </div>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="px-8 py-5 grid grid-cols-2 gap-3"
            >
              {[
                {
                  icon: Clock,
                  label: 'Time to Resolve',
                  value: stats.elapsedStr || '—',
                  sub: 'From alarm to all-clear',
                  color: 'amber',
                },
                {
                  icon: AlertTriangle,
                  label: 'Peak CO Level',
                  value: stats.peakCo ? `${stats.peakCo.toFixed(0)} ppm` : '—',
                  sub: 'Safe limit: 50 ppm',
                  color: 'red',
                },
                {
                  icon: Wind,
                  label: 'Actions Completed',
                  value: `${stats.completedActions ?? '—'}/${stats.totalActions ?? 7}`,
                  sub: 'Full protocol executed',
                  color: 'green',
                },
                {
                  icon: BarChart2,
                  label: 'Min O₂ Recorded',
                  value: stats.minO2 ? `${stats.minO2.toFixed(1)}%` : '—',
                  sub: 'Safe minimum: 19.5%',
                  color: 'cyan',
                },
              ].map((stat, i) => {
                const Icon = stat.icon;
                const colorMap = {
                  red:   'border-red-800/40   bg-red-950/30   text-red-300',
                  amber: 'border-amber-700/40 bg-amber-950/30 text-amber-300',
                  green: 'border-green-700/40 bg-green-950/30 text-green-300',
                  cyan:  'border-cyan-700/40  bg-cyan-950/30  text-cyan-300',
                };
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className={`rounded-xl border p-3.5 ${colorMap[stat.color]}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 opacity-80" />
                      <span className="text-[9px] font-mono uppercase tracking-widest opacity-60">{stat.label}</span>
                    </div>
                    <div className="text-xl font-black font-mono">{stat.value}</div>
                    <div className="text-[10px] opacity-50 mt-0.5">{stat.sub}</div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Footer actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="px-8 pb-8 flex items-center gap-3"
            >
              {/* Return to HMI button */}
              <motion.button
                onClick={onDismiss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm tracking-wider uppercase cursor-pointer transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15))',
                  border: '1px solid rgba(74,222,128,0.4)',
                  color: '#4ade80',
                  boxShadow: '0 0 20px rgba(74,222,128,0.1)',
                }}
              >
                <Activity className="w-4 h-4" />
                Return to Live HMI Dashboard
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              {/* Countdown pill */}
              <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-green-800/40 bg-green-950/30">
                <motion.span
                  key={countdown}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-green-400 font-mono font-bold text-lg"
                >
                  {countdown}
                </motion.span>
              </div>
            </motion.div>

            {/* Branding strip */}
            <div className="px-8 pb-4 flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5 text-green-800" />
              <span className="text-green-800 text-[10px] font-mono">
                Venti-Guard Safety HMI · Incident log saved · All zones nominal
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AllClearScreen;
