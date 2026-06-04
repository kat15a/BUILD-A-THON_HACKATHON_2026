/**
 * MineMap — Multi-Sector Interactive SVG Map
 * =============================================
 * Renders 3 levels per sector with sector-tab navigation.
 * Shows North Shaft (L1-L3) or South Shaft (L4-L6) on demand.
 * Auto-switches to the critical sector when an alarm fires.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Level from './Level';
import ElevatorShaft from './ElevatorShaft';
import SafePath from './SafePath';
import AirFlowPath from './AirFlowPath';

// ── Static layout config reused for both sectors (same SVG geometry) ──────
const LEVEL_LAYOUT = [
  {
    y: 60,
    tunnelPaths: [
      { d: 'M 130 120 L 360 120', label: 'Tunnel A1' },
      { d: 'M 130 155 L 360 155', label: 'Tunnel A2' },
      { d: 'M 540 120 L 770 120', label: 'Tunnel B1' },
      { d: 'M 540 155 L 770 155', label: 'Tunnel B2' },
    ],
    fanPosition: { x: 790, y: 137 },
  },
  {
    y: 240,
    tunnelPaths: [
      { d: 'M 130 300 L 360 300', label: 'Tunnel C1' },
      { d: 'M 130 335 L 360 335', label: 'Tunnel C2' },
      { d: 'M 540 300 L 770 300', label: 'Tunnel D1' },
      { d: 'M 540 335 L 770 335', label: 'Tunnel D2' },
    ],
    fanPosition: { x: 790, y: 317 },
  },
  {
    y: 420,
    tunnelPaths: [
      { d: 'M 130 480 L 360 480', label: 'Tunnel E1' },
      { d: 'M 130 515 L 360 515', label: 'Tunnel E2' },
      { d: 'M 540 480 L 770 480', label: 'Tunnel F1' },
      { d: 'M 540 515 L 770 515', label: 'Tunnel F2' },
    ],
    fanPosition: { x: 790, y: 497 },
  },
];

// ── Per-sector configuration ───────────────────────────────────────────────
const SECTORS = {
  north_shaft: {
    name: 'NORTH SHAFT',
    depthMarkers: ['-100m', '-250m', '-400m'],
    levels: [
      { id: 'level_1', label: 'LEVEL 1', sublabel: 'Primary Intake',    fanId: 'FAN-01' },
      { id: 'level_2', label: 'LEVEL 2', sublabel: 'Main Extraction',   fanId: 'FAN-02' },
      { id: 'level_3', label: 'LEVEL 3', sublabel: 'Deep Ventilation',  fanId: 'FAN-03' },
    ],
  },
  south_shaft: {
    name: 'SOUTH SHAFT',
    depthMarkers: ['-500m', '-650m', '-800m'],
    levels: [
      { id: 'level_4', label: 'LEVEL 4', sublabel: 'Upper South Zone',  fanId: 'FAN-04' },
      { id: 'level_5', label: 'LEVEL 5', sublabel: 'Mid South Zone',    fanId: 'FAN-05' },
      { id: 'level_6', label: 'LEVEL 6', sublabel: 'Deep South Zone',   fanId: 'FAN-06' },
    ],
  },
};

// ── Recovery progress bar overlay ─────────────────────────────────────────
const RecoveryOverlay = ({ levelData, layout }) => {
  if (!levelData?.recovering || levelData.recovery_pct === undefined) return null;
  const pct = levelData.recovery_pct;
  return (
    <g>
      {/* Recovery progress bar on the bottom of the level box */}
      <rect x="70" y={layout.y + 158} width="760" height="6" rx="3"
        fill="rgba(15,23,42,0.8)" />
      <rect x="70" y={layout.y + 158} width={760 * (pct / 100)} height="6" rx="3"
        fill={pct > 80 ? '#22c55e' : pct > 50 ? '#f59e0b' : '#22d3ee'}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite" />
      </rect>
      <text x="450" y={layout.y + 164} textAnchor="middle"
        fill={pct > 80 ? '#4ade80' : '#f59e0b'}
        fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
        ↑ RECOVERING — {pct}% — CO DROPPING
      </text>
    </g>
  );
};

const MineMap = ({ telemetry, systemCritical, criticalLevel, activeSector, onSectorChange }) => {
  const levels      = telemetry?.levels || {};
  const sector      = activeSector || 'north_shaft';
  const sectorCfg   = SECTORS[sector];

  // Which level in this sector is the critical one?
  const localCriticalLevel = criticalLevel && sectorCfg.levels.some(l => l.id === criticalLevel)
    ? criticalLevel
    : null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-0">

      {/* ── Sector Tab Switcher ── */}
      <div className="flex items-center gap-0 mb-3 rounded-xl overflow-hidden border border-slate-700/40"
        style={{ background: 'rgba(15,23,42,0.8)' }}
      >
        {Object.entries(SECTORS).map(([key, cfg]) => {
          const sectorLevels   = cfg.levels.map(l => l.id);
          const hasCritical    = sectorLevels.some(id => levels[id]?.state === 'CRITICAL');
          const hasWarning     = sectorLevels.some(id => levels[id]?.state === 'WARNING');
          const isActive       = sector === key;
          return (
            <button
              key={key}
              onClick={() => onSectorChange?.(key)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
                isActive
                  ? hasCritical
                    ? 'bg-red-900/40 text-red-300 border-r border-red-700/30'
                    : 'bg-cyan-900/20 text-cyan-300 border-r border-cyan-700/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              {hasCritical && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              {!hasCritical && hasWarning && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
              {!hasCritical && !hasWarning && (
                <span className="w-2 h-2 rounded-full bg-green-500/60" />
              )}
              {cfg.name}
            </button>
          );
        })}
      </div>

      {/* ── SVG Mine Schematic ── */}
      <AnimatePresence mode="wait">
        <motion.svg
          key={sector}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          viewBox="0 0 900 620"
          className="w-full h-full max-w-[900px] max-h-[560px]"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={`Underground mine ventilation map — ${sectorCfg.name}`}
        >
          <defs>
            <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowPurple" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="safePathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#4ade80" stopOpacity="1" />
              <stop offset="50%"  stopColor="#22c55e" stopOpacity="1" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="1" />
            </linearGradient>
            <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width="900" height="620" fill="#0f172a" />
          <rect width="900" height="620" fill="url(#gridPattern)" />

          {/* Sector label + surface */}
          <text x="450" y="22" textAnchor="middle" fill="#64748b" fontSize="10"
            fontFamily="'JetBrains Mono', monospace" letterSpacing="0.2em">
            ▲ SURFACE — {sectorCfg.name}
          </text>
          <line x1="180" y1="32" x2="720" y2="32" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

          {/* Central elevator shaft */}
          <ElevatorShaft systemCritical={systemCritical} />

          {/* Depth markers */}
          {sectorCfg.depthMarkers.map((marker, i) => (
            <text key={i} x="20" y={LEVEL_LAYOUT[i].y + 80}
              fill="#475569" fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              transform={`rotate(-90, 20, ${LEVEL_LAYOUT[i].y + 80})`}>
              {marker}
            </text>
          ))}

          {/* Levels */}
          {sectorCfg.levels.map((levelCfg, i) => {
            const layout      = LEVEL_LAYOUT[i];
            const levelData   = levels[levelCfg.id] || {};
            const isCritical  = localCriticalLevel === levelCfg.id;
            return (
              <g key={levelCfg.id}>
                <Level
                  id={levelCfg.id}
                  label={levelCfg.label}
                  sublabel={levelCfg.sublabel}
                  y={layout.y}
                  data={levelData}
                  systemCritical={systemCritical}
                  isCriticalLevel={isCritical}
                  tunnelPaths={layout.tunnelPaths}
                  fanPosition={layout.fanPosition}
                  fanId={levelCfg.fanId}
                />
                {/* Recovery progress bar */}
                <RecoveryOverlay levelData={levelData} layout={layout} />
              </g>
            );
          })}

          {/* Safe evacuation path */}
          {systemCritical && localCriticalLevel && (
            <SafePath />
          )}

          {/* Bottom label */}
          <line x1="180" y1="580" x2="720" y2="580" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <text x="450" y="600" textAnchor="middle" fill="#64748b" fontSize="11"
            fontFamily="'JetBrains Mono', monospace" letterSpacing="0.2em">
            ▼ BEDROCK ({sectorCfg.depthMarkers[2].replace('-', '')} depth)
          </text>
        </motion.svg>
      </AnimatePresence>
    </div>
  );
};

export { MineMap };
export default MineMap;
