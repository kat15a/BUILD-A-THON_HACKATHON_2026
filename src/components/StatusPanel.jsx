/**
 * StatusPanel — Scalable 6-Level Telemetry Strip
 * ================================================
 * Grouped by sector. Each level shows live sensor readings,
 * danger score bar (0–100), and status indicators.
 * Uses a virtual-list-ready layout for 300+ zone scalability.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Wifi, WifiOff, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Flame
} from 'lucide-react';

// ── Danger Score Bar (0–100) ───────────────────────────────────────────────
const DangerScoreBar = ({ score }) => {
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22d3ee';
  const label = score >= 70 ? 'DANGER' : score >= 40 ? 'WARN' : 'OK';
  return (
    <div className="flex flex-col items-center min-w-[56px]">
      <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider mb-0.5">Risk</span>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-0.5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, width: `${score}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-[8px] font-mono font-bold" style={{ color }}>
        {score} · {label}
      </span>
    </div>
  );
};

const MetricCell = ({ label, value, unit, danger, warning }) => (
  <div className="flex flex-col items-center min-w-[48px]">
    <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider mb-0.5">{label}</span>
    <span className={`text-sm font-bold font-mono ${danger ? 'text-red-400' : warning ? 'text-amber-400' : 'text-cyan-300'}`}>
      {value}
      <span className="text-[9px] text-slate-500 ml-0.5 font-normal">{unit}</span>
    </span>
  </div>
);

// ── Single Level Row ───────────────────────────────────────────────────────
const LevelRow = ({ levelKey, data }) => {
  const levelNum     = levelKey.split('_')[1];
  const state        = data?.state || 'NOMINAL';
  const dangerScore  = data?.danger_score ?? 0;
  const dotClass     = state === 'NOMINAL' ? 'status-dot-nominal' : state === 'WARNING' ? 'status-dot-warning' : 'status-dot-critical';
  const rowHighlight = state === 'CRITICAL' ? 'border-l-2 border-red-600/40 bg-red-950/10' : state === 'WARNING' ? 'border-l-2 border-amber-500/30' : '';

  return (
    <div className={`flex items-center gap-4 px-3 py-2 ${rowHighlight}`}>
      {/* Level ID */}
      <div className="flex items-center gap-2 min-w-[72px]">
        <span className={`status-dot ${dotClass}`} />
        <div>
          <span className="text-xs font-bold text-slate-200 font-mono">LVL-{levelNum}</span>
          <div className={`text-[8px] font-bold font-mono tracking-widest ${
            state === 'CRITICAL' ? 'text-red-400' : state === 'WARNING' ? 'text-amber-400' : 'text-green-500'
          }`}>{state}</div>
        </div>
      </div>

      {/* Sensor metrics */}
      <div className="flex items-center gap-4">
        <MetricCell label="O₂" value={(data?.oxygen_pct ?? 20.9).toFixed(1)} unit="%" danger={data?.oxygen_pct < 19.5} />
        <MetricCell label="CO" value={(data?.co_ppm ?? 0).toFixed(0)} unit="ppm" danger={data?.co_ppm > 50} warning={data?.co_ppm > 25 && data?.co_ppm <= 50} />
        <MetricCell label="Temp" value={(data?.temp_c ?? 22).toFixed(1)} unit="°C" danger={data?.temp_c > 35} />
        <div className="flex flex-col items-center min-w-[36px]">
          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider mb-0.5">Fan</span>
          <span className={`text-xs font-bold font-mono ${data?.fan_status ? 'text-cyan-400' : 'text-red-400'}`}>
            {data?.fan_status ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Danger score */}
      <div className="ml-auto min-w-[70px]">
        <DangerScoreBar score={dangerScore} />
      </div>
    </div>
  );
};

// ── Sector Group (collapsible) ─────────────────────────────────────────────
const SectorGroup = ({ sectorKey, sectorMeta, levels, allLevelData }) => {
  const [collapsed, setCollapsed] = useState(false);

  const sectorLevels  = sectorMeta?.levels || [];
  const criticalCount = sectorLevels.filter(k => allLevelData[k]?.state === 'CRITICAL').length;
  const warningCount  = sectorLevels.filter(k => allLevelData[k]?.state === 'WARNING').length;
  const maxScore      = Math.max(...sectorLevels.map(k => allLevelData[k]?.danger_score ?? 0));

  return (
    <div className={`border-r last:border-r-0 border-slate-700/20 ${criticalCount > 0 ? 'bg-red-950/5' : ''}`}>
      {/* Sector header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-700/20"
      >
        <Flame className={`w-3 h-3 ${criticalCount > 0 ? 'text-red-400' : warningCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
        <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest flex-1 text-left">
          {sectorMeta?.name || sectorKey}
        </span>
        <span className="text-[8px] text-slate-600 font-mono">{sectorMeta?.depth}</span>
        {criticalCount > 0 && (
          <span className="text-[8px] font-bold text-red-400 font-mono">{criticalCount} CRIT</span>
        )}
        <span className="text-[8px] font-mono text-slate-600">⚡{maxScore}</span>
        {collapsed
          ? <ChevronDown className="w-3 h-3 text-slate-600" />
          : <ChevronUp className="w-3 h-3 text-slate-600" />
        }
      </button>

      {/* Level rows */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-slate-800/30">
              {sectorLevels.map(levelKey => (
                <LevelRow key={levelKey} levelKey={levelKey} data={allLevelData[levelKey]} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Top Danger Triage Bar ──────────────────────────────────────────────────
const TriageBar = ({ topDangerZones }) => {
  if (!topDangerZones?.length) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-slate-700/30 bg-slate-900/60">
      <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest flex-shrink-0">Top Risk:</span>
      {topDangerZones.map(z => {
        const lvlNum = z.zone.split('_')[1];
        return (
          <div key={z.zone} className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-mono ${
            z.state === 'CRITICAL' ? 'border-red-700/40 bg-red-950/30 text-red-300' :
            z.state === 'WARNING'  ? 'border-amber-600/30 bg-amber-950/20 text-amber-300' :
            'border-slate-700/30 bg-slate-900/30 text-slate-400'
          }`}>
            <span className="font-bold">L{lvlNum}</span>
            <span className="opacity-70">·{z.score}</span>
          </div>
        );
      })}
      <span className="ml-auto text-[8px] text-slate-600 font-mono">Danger Score 0–100</span>
    </div>
  );
};

// ── Main StatusPanel ───────────────────────────────────────────────────────
const StatusPanel = ({ telemetry, connected }) => {
  const levels         = telemetry?.levels  || {};
  const sectors        = telemetry?.sectors || {};
  const topDangerZones = telemetry?.top_danger_zones || [];
  const sectorKeys     = Object.keys(sectors);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="glass-card mx-4 mb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
            Live Telemetry · {Object.keys(levels).length} Zones
          </span>
          <span className="text-[8px] text-slate-600 font-mono hidden md:block">
            | O₂ safe &gt;19.5% · CO warn &gt;25ppm · CO danger &gt;50ppm · Risk 0–100
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connected ? <Wifi className="w-3.5 h-3.5 text-green-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
          <span className={`text-[10px] font-mono font-bold ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Triage bar */}
      <TriageBar topDangerZones={topDangerZones} />

      {/* Sector groups */}
      <div className={`grid grid-cols-1 ${sectorKeys.length > 1 ? 'md:grid-cols-2' : ''} divide-x divide-slate-700/20`}>
        {sectorKeys.map(sectorKey => (
          <SectorGroup
            key={sectorKey}
            sectorKey={sectorKey}
            sectorMeta={sectors[sectorKey]}
            allLevelData={levels}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default StatusPanel;
