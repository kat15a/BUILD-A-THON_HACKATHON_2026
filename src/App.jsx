/**
 * App.jsx — Venti-Guard Main Application (Full Hackathon Edition)
 * ================================================================
 * Complete flow:
 * Normal → Select Zone → Simulate Leak → P1/P2/P3 Playbook
 * → Fan Override triggers CO recovery animation
 * → All tasks complete → Incident Report modal
 * → Type CONFIRM → AllClear overlay (blurred HMI behind)
 * → Return to HMI → Live nominal dashboard
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from './hooks/useTelemetry';
import { MineMap }         from './components/MineMap';
import Header              from './components/Header';
import AlarmBanner         from './components/AlarmBanner';
import PlaybookSidebar     from './components/PlaybookSidebar';
import StatusPanel         from './components/StatusPanel';
import AllClearScreen      from './components/AllClearScreen';
import IncidentReportModal from './components/IncidentReportModal';
import HistoryPanel        from './components/HistoryPanel';

// ── Pure helper (outside component — no hook violation) ──────────────────
function getSectorForLevel(levelKey) {
  if (!levelKey) return 'north_shaft';
  return parseInt(levelKey.split('_')[1]) <= 3 ? 'north_shaft' : 'south_shaft';
}

function App() {
  const {
    telemetry, connected, systemCritical, criticalLevel,
    incidentType, incidentMeta,
    alarmStartTime, currentIncidentId, incidentHistory,
    triggerLeak, triggerRandomLeak, startRecovery, resetSystem, fanOverride, reportIncidentResolved,
  } = useTelemetry();

  // ── ALL useState/useRef/useEffect hooks declared first, no interleaving ──
  const [showAllClear,  setShowAllClear]  = useState(false);
  const [showReport,    setShowReport]    = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);
  const [reportStats,   setReportStats]   = useState(null);
  const [allClearStats, setAllClearStats] = useState(null);
  const [coHistory,     setCoHistory]     = useState([]);
  const [peakCo,        setPeakCo]        = useState(0);
  const [minO2,         setMinO2]         = useState(21);
  const [activeSector,  setActiveSector]  = useState('north_shaft');
  const prevCriticalRef = useRef(false);

  // Auto-switch map to the critical sector
  useEffect(() => {
    if (criticalLevel) setActiveSector(getSectorForLevel(criticalLevel));
  }, [criticalLevel]);

  // ── Audio alert on CRITICAL transition ─────────────────────────────────
  useEffect(() => {
    if (systemCritical && !prevCriticalRef.current) {
      setCoHistory([]);
      setPeakCo(0);
      setMinO2(21);
      try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
      } catch {}
    }
    prevCriticalRef.current = systemCritical;
  }, [systemCritical]);

  // ── Track CO/O₂ history for incident analytics ─────────────────────────
  useEffect(() => {
    if (!systemCritical || !criticalLevel) return;
    const d = telemetry?.levels?.[criticalLevel];
    if (!d) return;
    setCoHistory(prev => [...prev.slice(-60), d.co_ppm]);
    setPeakCo(prev => Math.max(prev, d.co_ppm));
    setMinO2(prev  => Math.min(prev, d.oxygen_pct));
  }, [telemetry, systemCritical, criticalLevel]);

  // ── Playbook all-tasks-complete callback ─────────────────────────────────
  const handleAllTasksComplete = useCallback((stats) => {
    setReportStats(stats);
    setShowReport(true);
  }, []);

  // ── IncidentReport CONFIRM → supervised reset ────────────────────────────
  const handleConfirmReset = useCallback(() => {
    setShowReport(false);

    const elapsedMs  = alarmStartTime ? Date.now() - alarmStartTime : 0;
    const elapsedMins = Math.floor(elapsedMs / 60000);
    const elapsedSecs = Math.floor((elapsedMs % 60000) / 1000);

    const stats = {
      elapsedStr:       `${String(elapsedMins).padStart(2,'0')}:${String(elapsedSecs).padStart(2,'0')}`,
      peakCo,
      minO2,
      completedActions: reportStats?.completedActions || 0,
      totalActions:     reportStats?.totalActions || 7,
    };
    setAllClearStats(stats);

    reportIncidentResolved({
      timeToResolve:    Math.round(elapsedMs / 1000),
      actionsCompleted: reportStats?.completedActions || 0,
    });
    resetSystem();
    setTimeout(() => setShowAllClear(true), 500);
  }, [resetSystem, reportIncidentResolved, alarmStartTime, peakCo, minO2, reportStats]);

  // ── AllClear dismissed → back to live HMI ────────────────────────────────
  const handleAllClearDismiss = useCallback(() => {
    setShowAllClear(false);
    setAllClearStats(null);
    setActiveSector('north_shaft');
  }, []);

  const sidebarOpen = systemCritical;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 overflow-hidden">

      {/* ── Incident Report Modal ── */}
      <IncidentReportModal
        visible={showReport}
        incidentId={currentIncidentId}
        alarmStartTime={alarmStartTime}
        criticalLevel={criticalLevel}
        completedActions={reportStats?.completedActions || 0}
        totalActions={reportStats?.totalActions || 7}
        coHistory={coHistory}
        peakCo={peakCo}
        minO2={minO2}
        onConfirmReset={handleConfirmReset}
        onClose={() => setShowReport(false)}
      />

      {/* ── All Clear Overlay (blurs HMI behind) ── */}
      <AllClearScreen
        visible={showAllClear}
        onDismiss={handleAllClearDismiss}
        incidentStats={allClearStats}
      />

      {/* ── History Slide-in ── */}
      <HistoryPanel
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        incidents={incidentHistory}
      />

      {/* ── Header ── */}
      <Header
        systemCritical={systemCritical}
        connected={connected}
        onTriggerLeak={triggerLeak}
        onTriggerRandom={triggerRandomLeak}
        onReset={resetSystem}
        onToggleHistory={() => setShowHistory(v => !v)}
        incidentCount={incidentHistory.length}
      />

      {/* ── Alarm Banner ── */}
      <AlarmBanner telemetry={telemetry} systemCritical={systemCritical} />

      {/* ── Main Content ── */}
      <main className="flex-1 relative flex flex-col">
        {/* Critical vignette */}
        <AnimatePresence>
          {systemCritical && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(127,29,29,0.15) 100%)' }}
            />
          )}
        </AnimatePresence>

        {/* Mine Map with sector navigation */}
        <motion.div
          className="flex-1 flex items-center justify-center p-4"
          animate={{ scale: systemCritical ? 1.01 : 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            marginRight: sidebarOpen ? '400px' : '0px',
            transition: 'margin-right 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <MineMap
            telemetry={telemetry}
            systemCritical={systemCritical}
            criticalLevel={criticalLevel}
            activeSector={activeSector}
            onSectorChange={setActiveSector}
          />
        </motion.div>

        {/* Status Panel */}
        <div style={{
          marginRight: sidebarOpen ? '400px' : '0px',
          transition: 'margin-right 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <StatusPanel telemetry={telemetry} connected={connected} />
        </div>
      </main>

      {/* ── Playbook Sidebar ── */}
      <PlaybookSidebar
        systemCritical={systemCritical}
        telemetry={telemetry}
        criticalLevel={criticalLevel}
        incidentType={incidentType}
        incidentMeta={incidentMeta}
        onFanOverride={fanOverride}
        onStartRecovery={startRecovery}
        onAllTasksComplete={handleAllTasksComplete}
      />

      {/* ── Ambient particles ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top:  `${20 + (i % 3) * 25}%`,
              backgroundColor: systemCritical ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.1)',
            }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
