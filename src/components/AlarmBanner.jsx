/**
 * AlarmBanner — Narrative Alarm System
 * =====================================
 * Renders a prominent alarm banner during CRITICAL state with
 * clear, prioritized recommendations for the operator.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Radio, Wind, Route, Clock } from 'lucide-react';

function generateNarrative(telemetry) {
  if (!telemetry?.levels) return null;

  const criticalLevels = Object.entries(telemetry.levels)
    .filter(([, data]) => data.state === 'CRITICAL');

  if (criticalLevels.length === 0) return null;

  const narratives = criticalLevels.map(([levelKey, data]) => {
    const levelNum = levelKey.split('_')[1];
    const levelName = `Level ${levelNum}`;
    const parts = [];

    if (data.co_ppm > 50) {
      parts.push(`Toxic CO detected in ${levelName} (${data.co_ppm.toFixed(0)} ppm — ${(data.co_ppm / 50).toFixed(1)}× safe limit)`);
    }
    if (data.oxygen_pct < 19.5) {
      parts.push(`O₂ critically low at ${data.oxygen_pct.toFixed(1)}% (safe min: 19.5%)`);
    }
    if (!data.fan_status) {
      parts.push(`FAN-0${levelNum} is OFFLINE — fresh air flow compromised`);
    }

    return {
      level: levelName,
      levelNum,
      message: parts.join(' · '),
      recommendations: [
        { icon: Route, text: `Evacuate personnel from ${levelName} via Route A`, priority: 'P1' },
        !data.fan_status
          ? { icon: Wind, text: `Force-restart FAN-0${levelNum} via sidebar playbook`, priority: 'P2' }
          : null,
        { icon: Radio, text: 'Activate booster fans on adjacent levels', priority: 'P2' },
      ].filter(Boolean),
    };
  });

  return narratives[0];
}

// Live elapsed time since alarm
function useElapsedTime(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) { setSeconds(0); return; }
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

const AlarmBanner = ({ telemetry, systemCritical }) => {
  const narrative = generateNarrative(telemetry);
  const elapsed = useElapsedTime(systemCritical);

  return (
    <AnimatePresence>
      {systemCritical && narrative && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          className="relative overflow-hidden"
        >
          <div className="relative alarm-scanline border-b-2 border-red-600/50 px-5 py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(127,29,29,0.75) 0%, rgba(60,10,10,0.85) 50%, rgba(127,29,29,0.75) 100%)',
            }}
          >
            {/* Animated pulse bg */}
            <motion.div
              className="absolute inset-0 bg-red-500/5"
              animate={{ opacity: [0, 0.12, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />

            <div className="relative z-10 max-w-7xl mx-auto">
              <div className="flex items-start gap-4 flex-wrap">
                {/* Icon + Headline */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </motion.div>
                  <div>
                    <span className="text-red-300 font-extrabold text-sm tracking-widest font-mono uppercase">
                      🚨 CRITICAL — {narrative.level.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-red-500/70" />
                      <span className="text-red-500/80 text-[10px] font-mono">
                        Alarm active: {elapsed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Narrative text */}
                <p className="text-red-100/90 text-xs leading-relaxed flex-1 min-w-[200px]">
                  {narrative.message}
                </p>

                {/* Priority-tagged recommendations */}
                <div className="flex flex-wrap gap-2">
                  {narrative.recommendations.map((rec, i) => {
                    const Icon = rec.icon;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${
                          rec.priority === 'P1'
                            ? 'bg-red-900/40 border-red-600/40 text-red-200'
                            : 'bg-amber-900/30 border-amber-700/30 text-amber-300'
                        }`}
                      >
                        <span className={`text-[8px] font-extrabold font-mono px-1 py-0.5 rounded ${
                          rec.priority === 'P1' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                        }`}>
                          {rec.priority}
                        </span>
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span>{rec.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom hint */}
              <p className="text-red-400/50 text-[9px] font-mono mt-2">
                ▶ Open the <strong className="text-red-300/70">Emergency Playbook</strong> on the right panel and follow P1 → P2 → P3 action order
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlarmBanner;
