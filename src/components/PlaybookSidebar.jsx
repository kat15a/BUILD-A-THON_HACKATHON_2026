/**
 * PlaybookSidebar — Dynamic per-incident-type playbook
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Square, Shield, Clock, CheckCircle2,
  ChevronDown, ChevronUp, Zap, RefreshCw, Info,
  AlertTriangle, PartyPopper, TriangleAlert
} from 'lucide-react';
import { INCIDENT_PLAYBOOKS, INCIDENT_COLORS } from '../data/incidentPlaybooks';

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div className="absolute top-16 left-3 right-3 z-[60] space-y-1.5 pointer-events-none">
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div key={t.id}
          initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium shadow-lg ${
            t.type==='success' ? 'bg-green-950/90 border-green-600/50 text-green-300' :
            t.type==='warning' ? 'bg-amber-950/90 border-amber-500/50 text-amber-300' :
            'bg-blue-950/90 border-blue-600/50 text-blue-300'}`}
        >
          {t.type==='warning' ? <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0" /> :
           t.type==='success' ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> :
                                <Info className="w-3.5 h-3.5 flex-shrink-0" />}
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ── Priority Group ─────────────────────────────────────────────────────────
const PriorityGroup = ({ group, priority, colors, checkedItems, buttonStates, onCheck, onAction, idx }) => {
  const [collapsed, setCollapsed] = useState(false);
  const doneCount = group.items.filter(item =>
    item.isCheckbox ? checkedItems[item.id] : buttonStates[item.id]?.done
  ).length;
  const allDone = doneCount === group.items.length;

  const priorityColors = {
    P1: { badge: 'bg-red-600 text-white',   bar: 'bg-red-500',   border: 'border-red-700/50',   bg: 'bg-red-950/20',   text: 'text-red-300' },
    P2: { badge: 'bg-amber-500 text-black', bar: 'bg-amber-500', border: 'border-amber-600/40', bg: 'bg-amber-950/15', text: 'text-amber-300' },
    P3: { badge: 'bg-cyan-600 text-white',  bar: 'bg-cyan-500',  border: 'border-cyan-700/40',  bg: 'bg-cyan-950/10',  text: 'text-cyan-300' },
  }[priority];

  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx*0.1 }}
      className={`rounded-xl border overflow-hidden ${priorityColors.border} ${priorityColors.bg}`}>
      <button onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/5 transition-colors cursor-pointer">
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest font-mono ${priorityColors.badge}`}>{priority}</span>
        <div className="flex-1 text-left">
          <span className={`text-xs font-bold ${priorityColors.text}`}>{group.label}</span>
          <span className="text-slate-500 text-[10px] ml-1.5">— {group.description}</span>
        </div>
        <span className={`text-[10px] font-mono font-bold ${allDone ? 'text-green-400' : priorityColors.text}`}>{doneCount}/{group.items.length}</span>
        {collapsed ? <ChevronDown className={`w-3.5 h-3.5 ${priorityColors.text}`} /> : <ChevronUp className={`w-3.5 h-3.5 ${priorityColors.text}`} />}
      </button>
      <div className="h-0.5 bg-slate-800/60 mx-3.5">
        <motion.div className={`h-full rounded-full ${priorityColors.bar}`}
          animate={{ width: `${(doneCount / group.items.length)*100}%` }} transition={{ duration:0.4 }} />
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="overflow-hidden">
            <div className="px-3 py-2 space-y-2">
              {group.items.map((item, i) => {
                const Icon    = item.icon;
                const isDone  = item.isCheckbox ? checkedItems[item.id] : buttonStates[item.id]?.done;
                const btn     = buttonStates[item.id] || {};
                const isWarn  = item.id === 'no_fan'; // safety note item
                return (
                  <motion.div key={item.id} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                    className={`rounded-lg p-3 border transition-all ${
                      isWarn ? 'bg-orange-950/30 border-orange-600/40' :
                      isDone ? 'bg-green-950/20 border-green-700/30' : 'bg-slate-900/50 border-slate-700/20'}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        isWarn ? 'text-orange-400' : isDone ? 'text-green-400' : priorityColors.text}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-snug ${isDone ? 'text-green-300 line-through opacity-60' : isWarn ? 'text-orange-300' : 'text-slate-200'}`}>{item.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>
                        {item.isCheckbox && (
                          <button onClick={() => onCheck(item.id)}
                            className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isDone ? 'text-green-400' : 'text-slate-400 hover:text-slate-200'}`}>
                            {isDone ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            {isDone ? 'Completed ✓' : 'Mark as Done'}
                          </button>
                        )}
                        {item.isButton && !item.isCheckbox && (
                          <button onClick={() => onAction(item, priority)}
                            disabled={btn.loading || btn.done}
                            className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                              btn.done    ? 'bg-green-950/40 border-green-600/30 text-green-300 cursor-default' :
                              btn.loading ? 'bg-slate-800/60 border-slate-700/30 text-slate-400 cursor-wait' :
                              isWarn      ? 'bg-orange-900/30 border-orange-700/40 text-orange-300 hover:bg-orange-900/50' :
                              priority==='P1' ? 'bg-red-900/30 border-red-700/40 text-red-300 hover:bg-red-900/50 hover:border-red-500/60' :
                              priority==='P2' ? 'bg-amber-900/30 border-amber-700/40 text-amber-300 hover:bg-amber-900/50' :
                              'bg-cyan-900/30 border-cyan-700/40 text-cyan-300 hover:bg-cyan-900/50'}`}>
                            {btn.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> :
                             btn.done    ? <CheckCircle2 className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            {btn.loading ? item.actionDoneLabel : btn.done ? 'Done ✓' : item.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Sidebar ───────────────────────────────────────────────────────────
const PlaybookSidebar = ({ systemCritical, incidentType, incidentMeta, criticalLevel, onFanOverride, onStartRecovery, onAllTasksComplete }) => {
  const [checkedItems,    setCheckedItems]    = useState({});
  const [buttonStates,    setButtonStates]    = useState({});
  const [toasts,          setToasts]          = useState([]);
  const [completionFired, setCompletionFired] = useState(false);
  const [recovering,      setRecovering]      = useState(false);

  useEffect(() => {
    if (!systemCritical) {
      setCheckedItems({}); setButtonStates({});
      setToasts([]); setCompletionFired(false); setRecovering(false);
    }
  }, [systemCritical, incidentType]);

  // ── addToast declared FIRST so it can be used in useEffect below ─────────
  const addToast = useCallback((message, type = 'success', duration = 2000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const playbook = incidentType && INCIDENT_PLAYBOOKS[incidentType]
    ? INCIDENT_PLAYBOOKS[incidentType]
    : INCIDENT_PLAYBOOKS.CO_LEAK;

  const colors = incidentType && INCIDENT_COLORS[incidentType]
    ? INCIDENT_COLORS[incidentType]
    : INCIDENT_COLORS.CO_LEAK;

  const allItems = [
    ...playbook.P1.items,
    ...playbook.P2.items,
    ...playbook.P3.items,
  ];

  const completedCount = allItems.filter(item =>
    item.isCheckbox ? checkedItems[item.id] : buttonStates[item.id]?.done
  ).length;
  const totalItems = allItems.length;
  const allDone    = completedCount === totalItems;

  useEffect(() => {
    if (allDone && !completionFired && systemCritical) {
      setCompletionFired(true);
      addToast('🎉 All steps complete — generating incident report…', 'success', 4000);
      setTimeout(() => onAllTasksComplete?.({ completedActions: completedCount, totalActions: totalItems }), 1200);
    }
  }, [allDone, completionFired, systemCritical, addToast]);

  const handleCheck = useCallback((id) => {
    setCheckedItems(prev => {
      const n = { ...prev, [id]: !prev[id] };
      if (!prev[id]) addToast('✓ Step completed', 'success', 1800);
      return n;
    });
  }, [addToast]);

  const handleAction = useCallback((item, priority) => {
    // Block fan restart for methane
    if (item.isFanOverride && incidentType === 'METHANE_GAS') {
      addToast('⛔ Fan restart BLOCKED — methane explosion risk!', 'warning', 3000);
      return;
    }
    setButtonStates(prev => ({ ...prev, [item.id]: { loading: true, done: false } }));

    if (item.isManualFanOff) {
      // Methane: fan already auto-shut off on detection — this is formal operator confirmation
      addToast('⛔ Confirming fan shutdown…', 'warning', 1500);
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [item.id]: { loading: false, done: true } }));
        addToast('✓ Fan OFF confirmed — passive vents only active', 'success', 2000);
      }, 1200);

    } else if (item.isFanOverride) {
      // Fan restart (always P2) — triggers server-side recovery
      const fanNum = criticalLevel ? criticalLevel.split('_')[1] : '2';
      onFanOverride?.(`FAN-0${fanNum}`, 'FORCE_RESTART');
      addToast(`🔧 FAN-0${fanNum} restarting…`, 'warning', 2000);
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [item.id]: { loading: false, done: true } }));
        addToast('📉 Recovery started — watch sensors improve', 'success', 2500);
        if (!recovering) { setRecovering(true); onStartRecovery?.(); }
      }, 2500);

    } else if (priority === 'P2' && !recovering) {
      // P2 non-fan button — triggers sensor recovery (e.g. air purge, AC deploy, circuit isolation)
      addToast(`⚡ ${item.actionLabel}…`, 'info', 1500);
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [item.id]: { loading: false, done: true } }));
        setRecovering(true);
        onStartRecovery?.();
        addToast('📉 Systems responding — sensors recovering', 'success', 2500);
      }, 1600);

    } else {
      // P1 or P3 buttons — notification/logging only, NO sensor recovery
      addToast(`⚡ ${item.actionLabel}…`, 'info', 1500);
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [item.id]: { loading: false, done: true } }));
        addToast(`✓ ${item.label.substring(0, 38)}`, 'success', 1800);
      }, 1600);
    }
  }, [criticalLevel, onFanOverride, onStartRecovery, addToast, incidentType, recovering]);

  const overallPct = (completedCount / totalItems) * 100;

  return (
    <AnimatePresence>
      {systemCritical && (
        <motion.aside
          initial={{ x:'100%', opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:'100%', opacity:0 }}
          transition={{ type:'spring', stiffness:200, damping:26 }}
          className="fixed right-0 top-0 bottom-0 w-[400px] z-50 flex flex-col"
          style={{ background:'linear-gradient(180deg,rgba(15,10,25,0.98) 0%,rgba(10,15,30,0.98) 100%)', borderLeft:`2px solid ${incidentType==='METHANE_GAS' ? 'rgba(249,115,22,0.4)' : 'rgba(239,68,68,0.35)'}`, boxShadow:'-8px 0 40px rgba(127,29,29,0.2)' }}>
          <Toast toasts={toasts} />

          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/50" style={{ background:'linear-gradient(135deg,rgba(127,29,29,0.25),rgba(20,10,30,0.5))' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-4 h-4 ${colors.text}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded ${colors.badge}`}>
                    {incidentMeta?.emoji} {incidentType?.replace('_',' ')}
                  </span>
                </div>
                <h2 className={`text-xs font-bold tracking-wider font-mono uppercase mt-1 ${colors.text}`}>
                  {incidentMeta?.name || 'Emergency Response'}
                </h2>
                <p className="text-slate-500 text-[9px] font-mono">
                  {criticalLevel?.replace('_',' ').toUpperCase()} · Follow P1 → P2 → P3
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: allDone ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#f59e0b,#22d3ee)' }}
                  animate={{ width:`${overallPct}%` }} transition={{ duration:0.5 }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-16 text-right">{completedCount}/{totalItems}</span>
            </div>
            {allDone && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-center justify-center gap-2 mt-2 text-green-400 text-[10px] font-bold">
                <PartyPopper className="w-3.5 h-3.5" /> ALL STEPS COMPLETE — Generating report…
              </motion.div>
            )}
          </div>

          {/* Incident description */}
          <div className={`px-4 py-2 border-b border-slate-800/40 ${incidentType==='METHANE_GAS' ? 'bg-orange-950/20' : ''}`}>
            <p className={`text-[10px] font-mono ${colors.text} opacity-80`}>
              ⚠ {incidentMeta?.description || playbook.description}
            </p>
          </div>

          {/* Groups */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {(['P1','P2','P3']).map((p, idx) => (
              <PriorityGroup key={p} group={playbook[p]} priority={p} colors={colors}
                idx={idx} checkedItems={checkedItems} buttonStates={buttonStates}
                onCheck={handleCheck} onAction={handleAction} />
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-800/70">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-amber-300 font-bold">P1 actions</span> within 60s.
                Complete all steps to generate incident report + authorize reset.
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default PlaybookSidebar;
