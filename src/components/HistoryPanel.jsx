/**
 * HistoryPanel — Incident Log Slide-out
 * ======================================
 * Slide-in panel from the left showing past incidents with
 * resolution time, affected zone, and severity stats.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, CheckCircle2, AlertCircle, X, Clock, Flame, Wind } from 'lucide-react';

const HistoryPanel = ({ visible, onClose, incidents = [] }) => {
  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const calcDuration = (start, end) => {
    if (!start || !end) return '—';
    const ms   = new Date(end) - new Date(start);
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black cursor-pointer"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="fixed left-0 top-0 bottom-0 w-80 z-[80] flex flex-col border-r border-slate-700/60 shadow-2xl"
            style={{ background: 'linear-gradient(180deg,#0d1526 0%,#0a1020 100%)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/40">
              <div className="p-1.5 rounded-lg bg-slate-800/60">
                <History className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-slate-200 font-bold text-sm">Incident History</h3>
                <p className="text-slate-500 text-[9px] font-mono">{incidents.length} recorded events</p>
              </div>
              <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Incidents list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {incidents.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-10 h-10 text-green-500/30 mx-auto mb-3" />
                  <p className="text-slate-600 text-xs font-mono">No incidents recorded</p>
                  <p className="text-slate-700 text-[10px] font-mono mt-1">System operating nominally</p>
                </div>
              ) : (
                incidents.map((inc, idx) => {
                  const isResolved = inc.status === 'RESOLVED';
                  const levelNum = inc.levelKey?.split('_')[1] || '?';
                  return (
                    <motion.div
                      key={inc.id || idx}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`rounded-xl border p-3 ${
                        isResolved
                          ? 'border-slate-700/30 bg-slate-900/30'
                          : 'border-red-700/40 bg-red-950/20'
                      }`}
                    >
                      {/* Incident header */}
                      <div className="flex items-center gap-2 mb-2">
                        {isResolved
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          : <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 animate-pulse" />
                        }
                        <span className="text-[10px] font-mono font-bold text-slate-300">
                          {inc.id || `INC-${idx + 1}`}
                        </span>
                        <span className={`ml-auto text-[8px] font-bold font-mono px-2 py-0.5 rounded ${
                          isResolved ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-300'
                        }`}>
                          {isResolved ? 'RESOLVED' : 'ACTIVE'}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          Level {levelNum}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-600" />
                          {formatTime(inc.startTime)}
                        </div>
                        {isResolved && (
                          <>
                            <div className="flex items-center gap-1 text-green-600">
                              <Wind className="w-3 h-3" />
                              {calcDuration(inc.startTime, inc.resolvedAt)}
                            </div>
                            <div className="text-slate-600">
                              Resolved {formatTime(inc.resolvedAt)}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-800/60">
              <p className="text-slate-700 text-[9px] font-mono text-center">
                Data stored in-memory · resets on server restart
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoryPanel;
