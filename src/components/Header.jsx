/**
 * Header — Random Alert + Incident Type Selector
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, RotateCcw, Activity, Wifi, WifiOff, History, ChevronDown, Shuffle, RefreshCw } from 'lucide-react';

const LEVEL_OPTIONS = [
  { value:'level_1', label:'Level 1',  sector:'North Shaft', depth:'0–133m' },
  { value:'level_2', label:'Level 2',  sector:'North Shaft', depth:'133–266m' },
  { value:'level_3', label:'Level 3',  sector:'North Shaft', depth:'266–400m' },
  { value:'level_4', label:'Level 4',  sector:'South Shaft', depth:'400–533m' },
  { value:'level_5', label:'Level 5',  sector:'South Shaft', depth:'533–666m' },
  { value:'level_6', label:'Level 6',  sector:'South Shaft', depth:'666–800m' },
];

const INCIDENT_OPTIONS = [
  { value:'CO_LEAK',        label:'☠️ CO Leak',          color:'text-red-300' },
  { value:'O2_DEPLETION',   label:'🫁 O₂ Depletion',    color:'text-purple-300' },
  { value:'FAN_FAILURE',    label:'🌀 Fan Failure',      color:'text-amber-300' },
  { value:'METHANE_GAS',    label:'💥 Methane Gas',      color:'text-orange-300' },
  { value:'HEAT_EMERGENCY', label:'🔥 Heat Emergency',   color:'text-rose-300' },
];

const Header = ({ systemCritical, connected, onTriggerLeak, onTriggerRandom, onReset, onToggleHistory, incidentCount=0 }) => {
  const [selectedLevel,   setSelectedLevel]   = useState('level_2');
  const [selectedType,    setSelectedType]    = useState('CO_LEAK');
  const [levelOpen,       setLevelOpen]       = useState(false);
  const [typeOpen,        setTypeOpen]        = useState(false);
  const [leakPending,     setLeakPending]     = useState(false);
  const [randomPending,   setRandomPending]   = useState(false);
  const [resetPending,    setResetPending]    = useState(false);

  const handleTrigger = () => {
    if (leakPending) return;
    setLeakPending(true); setLevelOpen(false); setTypeOpen(false);
    onTriggerLeak?.(selectedLevel, selectedType);
    setTimeout(() => setLeakPending(false), 2000);
  };

  const handleRandom = () => {
    if (randomPending) return;
    setRandomPending(true);
    onTriggerRandom?.();
    setTimeout(() => setRandomPending(false), 2000);
  };

  const handleReset = () => {
    if (resetPending) return;
    setResetPending(true); onReset?.();
    setTimeout(() => setResetPending(false), 2000);
  };

  const selLevel = LEVEL_OPTIONS.find(l => l.value === selectedLevel);
  const selType  = INCIDENT_OPTIONS.find(t => t.value === selectedType);

  return (
    <header className="relative z-40 flex items-center justify-between px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <motion.div animate={systemCritical ? { rotate:[0,-5,5,-5,0] } : {}} transition={{ duration:0.4, repeat: systemCritical ? Infinity:0, repeatDelay:2 }}
          className={`p-1.5 rounded-xl ${systemCritical ? 'bg-red-900/50 ring-1 ring-red-600/40' : 'bg-cyan-900/30'}`}>
          <Shield className={`w-6 h-6 ${systemCritical ? 'text-red-400' : 'text-cyan-400'}`} />
        </motion.div>
        <div>
          <h1 className="text-base font-extrabold tracking-wider text-slate-100">
            VENTI<span className={systemCritical ? 'text-red-400' : 'text-cyan-400'}>-GUARD</span>
          </h1>
          <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Mining Safety HMI · 6 Zones · 5 Incident Types</p>
        </div>
      </div>

      {/* State badge */}
      <motion.div animate={systemCritical ? { scale:[1,1.05,1] } : {}} transition={{ duration:0.8, repeat:Infinity }}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold font-mono tracking-wider ${
          systemCritical ? 'bg-red-950/60 border-red-600/60 text-red-300 shadow-lg shadow-red-900/30' : 'bg-green-950/30 border-green-700/30 text-green-400'}`}>
        <span className={`status-dot ${systemCritical ? 'status-dot-critical' : 'status-dot-nominal'}`} />
        {systemCritical ? '⚠ CRITICAL ALERT ACTIVE' : '✓ SYSTEMS NOMINAL'}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono ${
          connected ? 'bg-green-950/20 border-green-800/30 text-green-400' : 'bg-red-950/20 border-red-800/30 text-red-400'}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>

        <button onClick={onToggleHistory}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/40 bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer text-[10px] font-mono">
          <History className="w-3.5 h-3.5" /> History
          {incidentCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-600 text-white text-[8px] font-bold flex items-center justify-center">{incidentCount}</span>
          )}
        </button>

        <div className="w-px h-6 bg-slate-700/50" />

        <AnimatePresence mode="wait">
          {!systemCritical ? (
            <motion.div key="sim" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="flex items-center gap-1.5">

              {/* Level dropdown */}
              <div className="relative">
                <button onClick={() => { setLevelOpen(v => !v); setTypeOpen(false); }}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-700/40 bg-slate-800/40 text-slate-300 hover:border-slate-600 text-[10px] font-mono cursor-pointer">
                  {selLevel?.label} <ChevronDown className={`w-3 h-3 transition-transform ${levelOpen?'rotate-180':''}`} />
                </button>
                <AnimatePresence>
                  {levelOpen && (
                    <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }} transition={{ duration:0.12 }}
                      className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-slate-700/60 shadow-2xl z-50 overflow-hidden" style={{ background:'#0d1526' }}>
                      {['North Shaft','South Shaft'].map(s => (
                        <div key={s}>
                          <div className="px-3 py-1 bg-slate-900/60 text-[8px] text-slate-500 font-mono uppercase tracking-widest">● {s}</div>
                          {LEVEL_OPTIONS.filter(l => l.sector === s).map(opt => (
                            <button key={opt.value} onClick={() => { setSelectedLevel(opt.value); setLevelOpen(false); }}
                              className={`w-full text-left px-4 py-1.5 text-[11px] font-mono cursor-pointer transition-colors ${selectedLevel===opt.value ? 'bg-red-900/20 text-red-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
                              {opt.label} <span className="text-slate-600">· {opt.depth}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Incident type dropdown */}
              <div className="relative">
                <button onClick={() => { setTypeOpen(v => !v); setLevelOpen(false); }}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-700/40 bg-slate-800/40 text-slate-300 hover:border-slate-600 text-[10px] font-mono cursor-pointer max-w-[130px]">
                  <span className="truncate">{selType?.label}</span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${typeOpen?'rotate-180':''}`} />
                </button>
                <AnimatePresence>
                  {typeOpen && (
                    <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }} transition={{ duration:0.12 }}
                      className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-slate-700/60 shadow-2xl z-50 overflow-hidden" style={{ background:'#0d1526' }}>
                      <div className="px-3 py-1.5 border-b border-slate-800 text-[8px] text-slate-500 font-mono uppercase tracking-widest">Select incident type</div>
                      {INCIDENT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSelectedType(opt.value); setTypeOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-[11px] font-mono cursor-pointer transition-colors ${selectedType===opt.value ? `${opt.color} bg-slate-800/60` : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Simulate specific */}
              <motion.button onClick={handleTrigger} disabled={leakPending} whileTap={{ scale:0.97 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider font-mono uppercase cursor-pointer transition-all ${
                  leakPending ? 'bg-red-900/20 border border-red-700/20 text-red-400/50 cursor-wait' :
                  'bg-red-900/30 border border-red-700/40 text-red-300 hover:bg-red-900/50 hover:border-red-600/60'}`}>
                {leakPending ? <Activity className="w-3.5 h-3.5 animate-pulse" /> : <Zap className="w-3.5 h-3.5" />}
                {leakPending ? 'Triggering…' : 'Simulate'}
              </motion.button>

              {/* Random alert button */}
              <motion.button onClick={handleRandom} disabled={randomPending} whileTap={{ scale:0.97 }}
                animate={randomPending ? {} : { boxShadow:['0 0 0px rgba(168,85,247,0)', '0 0 12px rgba(168,85,247,0.3)', '0 0 0px rgba(168,85,247,0)'] }}
                transition={{ duration:2, repeat:Infinity }}
                title="Random level + random incident type"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider font-mono uppercase cursor-pointer transition-all border ${
                  randomPending ? 'bg-purple-900/20 border-purple-700/20 text-purple-400/50 cursor-wait' :
                  'bg-purple-900/30 border-purple-600/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-500/60'}`}>
                {randomPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
                {randomPending ? 'Triggering…' : 'Random'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.button key="reset" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={handleReset} disabled={resetPending} whileTap={{ scale:0.97 }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider font-mono uppercase cursor-pointer transition-all ${
                resetPending ? 'bg-green-900/20 border border-green-700/20 text-green-400/50' :
                'bg-green-900/30 border border-green-700/40 text-green-300 hover:bg-green-900/50'}`}>
              <RotateCcw className={`w-3.5 h-3.5 ${resetPending?'animate-spin':''}`} />
              {resetPending ? 'Resetting…' : 'Quick Reset'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
