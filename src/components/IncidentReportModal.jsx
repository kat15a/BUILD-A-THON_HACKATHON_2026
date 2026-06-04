/**
 * IncidentReportModal — Auto-Generated Incident Report
 * =====================================================
 * Appears when all P1+P2+P3 playbook steps are completed.
 * Summarises the incident with analytics and a supervised
 * "Confirm Reset" gate before returning to nominal.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Clock, AlertTriangle, Wind, Activity,
  CheckCircle2, XCircle, Shield, Download, Lock
} from 'lucide-react';

// ── Sparkline mini-chart for CO trend ─────────────────────────────────────
const Sparkline = ({ data, color = '#ef4444', height = 40 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 200;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="200" height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${pts} 200,${height}`} fill={`${color}18`} stroke="none" />
    </svg>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'cyan' }) => {
  const colors = {
    red:   'border-red-700/40 bg-red-950/20 text-red-300',
    amber: 'border-amber-600/40 bg-amber-950/20 text-amber-300',
    green: 'border-green-700/40 bg-green-950/20 text-green-300',
    cyan:  'border-cyan-700/40 bg-cyan-950/20 text-cyan-300',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 opacity-80" />
        <span className="text-[9px] font-mono uppercase tracking-widest opacity-70">{label}</span>
      </div>
      <div className="text-xl font-black font-mono">{value}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
};

const IncidentReportModal = ({
  visible,
  incidentId,
  alarmStartTime,
  criticalLevel,
  completedActions,
  totalActions,
  coHistory,        // array of recent co_ppm readings
  minO2,
  peakCo,
  onConfirmReset,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [confirmMode, setConfirmMode] = useState(false);
  const inputRef = useRef(null);

  const CORRECT_PIN = 'CONFIRM';

  // Elapsed alarm time
  const elapsedMs   = alarmStartTime ? Date.now() - alarmStartTime : 0;
  const elapsedMins = Math.floor(elapsedMs / 60000);
  const elapsedSecs = Math.floor((elapsedMs % 60000) / 1000);
  const elapsedStr  = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;

  const levelLabel = criticalLevel
    ? `Level ${criticalLevel.split('_')[1]}`
    : 'Unknown';

  const now       = new Date();
  const reportId  = incidentId || `VG-${now.getFullYear()}-001`;
  const timestamp = now.toLocaleString('en-IN', { hour12: false });

  useEffect(() => {
    if (visible && confirmMode) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, confirmMode]);

  const handlePinSubmit = () => {
    if (pin.trim().toUpperCase() === CORRECT_PIN) {
      setPin('');
      setPinError(false);
      setConfirmMode(false);
      onConfirmReset();
    } else {
      setPinError(true);
      setPin('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/60 shadow-2xl"
              style={{ background: 'linear-gradient(160deg,#0d1526 0%,#0a1020 100%)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-700/40 flex items-start justify-between"
                style={{ background: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(15,23,42,0.8))' }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-900/30 border border-cyan-700/30">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-slate-100 font-bold text-base tracking-wide">
                      Incident Report — <span className="text-cyan-400 font-mono">{reportId}</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-mono mt-0.5">
                      Generated: {timestamp} · {levelLabel}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer mt-0.5"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Stats grid */}
              <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Clock}         label="Time to Resolve" value={elapsedStr}               sub="mm:ss"             color="amber" />
                <StatCard icon={AlertTriangle} label="Peak CO"          value={`${peakCo?.toFixed(0) ?? '—'} ppm`} sub={`Safe limit: 50ppm`} color="red" />
                <StatCard icon={Wind}          label="Min O₂"           value={`${minO2?.toFixed(1) ?? '—'}%`}     sub="Safe min: 19.5%"    color="red" />
                <StatCard icon={CheckCircle2}  label="Actions Done"     value={`${completedActions}/${totalActions}`} sub="All steps completed" color="green" />
              </div>

              {/* CO Trend chart */}
              <div className="px-6 pb-4">
                <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">CO Concentration Trend</span>
                    <span className="ml-auto text-[9px] text-slate-600 font-mono">Last {coHistory?.length || 0} readings</span>
                  </div>
                  <Sparkline data={coHistory || [0, 0]} />
                  <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                    <span>INCIDENT START</span>
                    <span>NOW</span>
                  </div>
                </div>
              </div>

              {/* Actions summary */}
              <div className="px-6 pb-4">
                <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Response Protocol Status</span>
                  </div>
                  {[
                    { priority: 'P1', label: 'Evacuation + Comms',         done: true, color: 'red' },
                    { priority: 'P2', label: 'Fan Override + Containment',  done: true, color: 'amber' },
                    { priority: 'P3', label: 'Surface Notify + Incident Log', done: completedActions >= totalActions, color: 'cyan' },
                  ].map(item => (
                    <div key={item.priority} className="flex items-center gap-3 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold font-mono ${
                        item.color === 'red'   ? 'bg-red-600 text-white' :
                        item.color === 'amber' ? 'bg-amber-500 text-black' :
                        'bg-cyan-600 text-white'
                      }`}>
                        {item.priority}
                      </span>
                      <span className={item.done ? 'text-green-300 line-through opacity-70' : 'text-slate-300'}>
                        {item.label}
                      </span>
                      <div className="ml-auto">
                        {item.done
                          ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                          : <XCircle className="w-4 h-4 text-red-400" />
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervised Reset Gate */}
              <div className="px-6 pb-6">
                {!confirmMode ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmMode(true)}
                    className="w-full py-3 rounded-xl border border-green-700/50 bg-green-950/30 text-green-300 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-green-950/50 hover:border-green-600/60 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    Authorize System Reset
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-center text-amber-300 text-xs font-mono">
                      Type <span className="font-bold text-white bg-slate-700 px-2 py-0.5 rounded">CONFIRM</span> to authorize system reset
                    </p>
                    <div className={`flex gap-2 rounded-xl border p-1 transition-all ${
                      pinError ? 'border-red-500/70 bg-red-950/20' : 'border-slate-700/50 bg-slate-900/40'
                    }`}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={pin}
                        onChange={e => setPin(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
                        placeholder="Type CONFIRM..."
                        className="flex-1 bg-transparent text-slate-200 text-sm font-mono px-3 py-2 outline-none placeholder-slate-600"
                        maxLength={10}
                      />
                      <button
                        onClick={handlePinSubmit}
                        className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Confirm
                      </button>
                    </div>
                    {pinError && (
                      <p className="text-center text-red-400 text-[10px] font-mono">
                        ✗ Incorrect — type CONFIRM exactly
                      </p>
                    )}
                    <button
                      onClick={() => { setConfirmMode(false); setPin(''); }}
                      className="w-full text-slate-500 text-[10px] hover:text-slate-400 transition-colors cursor-pointer font-mono"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IncidentReportModal;
