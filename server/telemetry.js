/**
 * Venti-Guard Telemetry Simulator — Incident-Type Edition
 * =========================================================
 * 5 real-world incident types, each with different sensor escalation
 * patterns and recovery behavior. Random level + incident type selection.
 */

// ── Thresholds ─────────────────────────────────────────────────────────────
const THRESHOLDS = {
  co_warning:  25,
  co_critical: 50,
  o2_warning:  19.5,
  o2_critical: 19.0,
  temp_warning: 35,
};

// ── Mine Layout ────────────────────────────────────────────────────────────
const SECTORS = {
  north_shaft: { name: 'North Shaft', depth: '0–400m',   levels: ['level_1','level_2','level_3'] },
  south_shaft: { name: 'South Shaft', depth: '400–800m', levels: ['level_4','level_5','level_6'] },
};

const BASELINES = {
  level_1: { oxygen_pct: 20.9, co_ppm: 3,  temp_c: 22, fan_rpm: 1450 },
  level_2: { oxygen_pct: 20.8, co_ppm: 5,  temp_c: 24, fan_rpm: 1480 },
  level_3: { oxygen_pct: 20.7, co_ppm: 4,  temp_c: 26, fan_rpm: 1460 },
  level_4: { oxygen_pct: 20.6, co_ppm: 6,  temp_c: 28, fan_rpm: 1440 },
  level_5: { oxygen_pct: 20.5, co_ppm: 7,  temp_c: 30, fan_rpm: 1420 },
  level_6: { oxygen_pct: 20.4, co_ppm: 8,  temp_c: 32, fan_rpm: 1400 },
};

// ── Incident Types — each defines a different sensor escalation profile ────
//   targetCo:  ppm at peak   | targetO2: % at worst
//   deltaTemp: °C above base  | rampTime: seconds to full escalation
//   fanFails:  does the fan automatically fail?
//   immediateFanFail: fan fails from second 0
//   noFanRestart: fan override is NOT the fix (methane — spark risk)
const INCIDENT_TYPES = {
  CO_LEAK: {
    id: 'CO_LEAK', name: 'Carbon Monoxide Leak', emoji: '☠️',
    color: 'red',
    description: 'Toxic CO accumulation from equipment exhaust or spontaneous combustion',
    targetCo: 150, targetO2: 17.5, deltaTemp: 4,
    fanFails: true, immediateFanFail: false, noFanRestart: false, rampTime: 5,
  },
  O2_DEPLETION: {
    id: 'O2_DEPLETION', name: 'Oxygen Depletion', emoji: '🫁',
    color: 'purple',
    description: 'Inert gas displacement or exhaustion of breathable air supply',
    targetCo: 8, targetO2: 16.0, deltaTemp: 1,
    fanFails: false, immediateFanFail: false, noFanRestart: false, rampTime: 8,
  },
  FAN_FAILURE: {
    id: 'FAN_FAILURE', name: 'Primary Fan Failure', emoji: '🌀',
    color: 'amber',
    description: 'Critical ventilation fan has tripped offline — airflow compromised',
    targetCo: 45, targetO2: 18.5, deltaTemp: 2,
    fanFails: true, immediateFanFail: true, noFanRestart: false, rampTime: 3,
  },
  METHANE_GAS: {
    id: 'METHANE_GAS', name: 'Methane Gas Detected', emoji: '💥',
    color: 'orange',
    description: 'Explosive CH₄ concentration rising — ignition risk is EXTREME',
    targetCo: 110, targetO2: 18.0, deltaTemp: 2,
    fanFails: true, immediateFanFail: true,  // auto-shutoff on detection (spark safety)
    noFanRestart: true, rampTime: 4,
  },
  HEAT_EMERGENCY: {
    id: 'HEAT_EMERGENCY', name: 'High Temperature Alert', emoji: '🔥',
    color: 'rose',
    description: 'Thermal runaway or geothermal anomaly — heat stroke risk imminent',
    targetCo: 18, targetO2: 19.1, deltaTemp: 18,
    fanFails: false, immediateFanFail: false, noFanRestart: false, rampTime: 6,
  },
};

const INCIDENT_TYPE_KEYS = Object.keys(INCIDENT_TYPES);

const Incident = require('./models/Incident');

// ── Runtime State ──────────────────────────────────────────────────────────
let leakState    = { active: false, levelKey: null, startTime: null, incidentType: null };
let fanOverrides = {};
let recoveryData = {};
let incidentLog  = [];

// Load history from MongoDB on startup
async function loadHistory() {
  try {
    const history = await Incident.find().sort({ startTime: 1 });
    incidentLog = history.map(h => ({
      id: h.id,
      levelKey: h.levelKey,
      incidentType: h.incidentType,
      incidentName: h.incidentName,
      sector: h.sector,
      startTime: h.startTime.toISOString(),
      resolvedAt: h.resolvedAt ? h.resolvedAt.toISOString() : null,
      status: h.status,
      timeToResolve: h.timeToResolve
    }));
    
    // Resume active leak if there's one
    const active = incidentLog.find(i => i.status === 'ACTIVE');
    if (active) {
      leakState = {
        active: true,
        levelKey: active.levelKey,
        startTime: new Date(active.startTime).getTime(),
        incidentType: active.incidentType
      };
      console.log(`[TELEMETRY] Resumed active leak from DB: ${active.id}`);
    }
    console.log(`[TELEMETRY] Loaded ${incidentLog.length} historical incidents from MongoDB`);
  } catch (err) {
    console.error('[TELEMETRY] Error loading history from MongoDB:', err);
  }
}
loadHistory();

Object.keys(BASELINES).forEach(k => { fanOverrides[k] = false; });

// ── Utilities ──────────────────────────────────────────────────────────────
function jitter(base, range) {
  return +(base + (Math.random() - 0.5) * 2 * range).toFixed(2);
}

function calcDangerScore({ co_ppm, oxygen_pct, fan_status, temp_c }, baseline) {
  const coPts   = Math.min(40, (co_ppm / 50) * 40);
  const o2Drop  = Math.max(0, 19.5 - oxygen_pct);
  const o2Pts   = Math.min(35, o2Drop * 14);
  const fanPts  = fan_status ? 0 : 25;
  const tempPts = Math.min(10, Math.max(0, (temp_c - (baseline?.temp_c || 25)) - 5) * 1.5);
  return Math.round(Math.min(100, coPts + o2Pts + fanPts + tempPts));
}

function determineState(level) {
  if (level.co_ppm >= THRESHOLDS.co_critical || level.oxygen_pct <= THRESHOLDS.o2_critical
      || !level.fan_status || level.temp_c >= THRESHOLDS.temp_warning + 10) return 'CRITICAL';
  if (level.co_ppm >= THRESHOLDS.co_warning  || level.oxygen_pct <= THRESHOLDS.o2_warning
      || level.temp_c >= THRESHOLDS.temp_warning) return 'WARNING';
  return 'NOMINAL';
}

// ── Telemetry Generation ───────────────────────────────────────────────────
function generateTelemetry() {
  const levels = {};

  for (const levelKey of Object.keys(BASELINES)) {
    const base    = BASELINES[levelKey];
    const itype   = leakState.incidentType ? INCIDENT_TYPES[leakState.incidentType] : null;
    let reading;

    if (leakState.active && leakState.levelKey === levelKey && itype) {
      const elapsed   = (Date.now() - leakState.startTime) / 1000;
      const rampTime  = itype.rampTime || 5;
      const ramp      = Math.min(1, elapsed / rampTime);
      const isFanFixed = fanOverrides[levelKey];
      const recovery   = recoveryData[levelKey];

      // Fan failure logic
      const fanShouldFail = itype.immediateFanFail
        ? true
        : (itype.fanFails && !isFanFixed && ramp > 0.3);

      // ── Determine recovery mode ────────────────────────────────────────────────
      // Normal types: need fan restarted (isFanFixed) + recoveryData
      // Methane:      fan stays OFF (passive vents only) — recovery via recoveryData alone
      const inRecovery = recovery && (isFanFixed || itype.noFanRestart);

      if (inRecovery) {
        // ── RECOVERY MODE ─────────────────────────────────────────────────────
        const recElapsed  = (Date.now() - recovery.startTime) / 1000;
        const recProgress = Math.min(1, recElapsed / 20);

        // For methane: fan stays OFF while gas is present (spark risk).
        // At 85%+ recovery the gas has cleared — fan can safely restart.
        const methaneClear = itype.noFanRestart && recProgress >= 0.85;
        reading = {
          oxygen_pct:   Math.max(base.oxygen_pct - 0.3, jitter(
            recovery.startO2 * (1 - recProgress) + base.oxygen_pct * recProgress, 0.06)),
          co_ppm:       Math.max(0, jitter(
            recovery.startCo * (1 - recProgress) + base.co_ppm * recProgress, 1.5)),
          temp_c:       jitter(
            (base.temp_c + itype.deltaTemp) * (1 - recProgress) + base.temp_c * recProgress, 0.2),
          fan_status:   (!itype.noFanRestart) || methaneClear,
          fan_rpm:      (!itype.noFanRestart || methaneClear) ? jitter(base.fan_rpm * (0.5 + recProgress * 0.5), 20) : 0,
          recovering:   recProgress < 1,
          recovery_pct: Math.round(recProgress * 100),
        };
        reading.state = determineState(reading);
        // KEY FIX: Keep at least WARNING while recovery is still in progress.
        // Prevents premature NOMINAL badge when sensors partially recover.
        if (reading.recovering && reading.state === 'NOMINAL') {
          reading.state = 'WARNING';
        }
      } else {
        // ── ESCALATION MODE ───────────────────────────────────────────────
        reading = {
          oxygen_pct: jitter(base.oxygen_pct - (base.oxygen_pct - itype.targetO2) * ramp, 0.1),
          co_ppm:     Math.max(0, jitter(base.co_ppm + (itype.targetCo - base.co_ppm) * ramp, 3)),
          temp_c:     jitter(base.temp_c + itype.deltaTemp * ramp, 0.3),
          fan_status: !fanShouldFail,
          fan_rpm:    fanShouldFail ? 0 : jitter(base.fan_rpm, 20),
          recovering: false,
          recovery_pct: 0,
        };
      }
      reading.state = determineState(reading);

    } else {
      // ── NOMINAL ───────────────────────────────────────────────────────
      reading = {
        oxygen_pct:   jitter(base.oxygen_pct, 0.15),
        co_ppm:       Math.max(0, jitter(base.co_ppm, 2)),
        temp_c:       jitter(base.temp_c, 0.5),
        fan_status:   true,
        fan_rpm:      jitter(base.fan_rpm, 20),
        recovering:   false,
        recovery_pct: 0,
      };
      reading.state = determineState(reading);
    }

    reading.danger_score = calcDangerScore(reading, base);
    levels[levelKey] = reading;
  }

  const topDangerZones = Object.entries(levels)
    .sort((a, b) => b[1].danger_score - a[1].danger_score)
    .slice(0, 3)
    .map(([k, v]) => ({ zone: k, score: v.danger_score, state: v.state }));

  return {
    timestamp:          new Date().toISOString(),
    system_status:      leakState.active ? 'CRITICAL' : 'NOMINAL',
    active_leak_level:  leakState.levelKey,
    incident_type:      leakState.incidentType,
    incident_meta:      leakState.incidentType ? INCIDENT_TYPES[leakState.incidentType] : null,
    sectors:            SECTORS,
    levels,
    top_danger_zones:   topDangerZones,
  };
}

// ── Trigger Leak ───────────────────────────────────────────────────────────
function triggerLeak(levelKey = 'level_2', incidentTypeId = 'CO_LEAK') {
  if (!BASELINES[levelKey]) return false;
  if (!INCIDENT_TYPES[incidentTypeId]) incidentTypeId = 'CO_LEAK';

  leakState = {
    active: true, levelKey, startTime: Date.now(),
    incidentType: incidentTypeId,
  };
  delete recoveryData[levelKey];
  fanOverrides[levelKey] = false;

  const incidentId = `VG-${new Date().getFullYear()}-${String(incidentLog.length + 1).padStart(3, '0')}`;
  const newIncident = {
    id: incidentId, levelKey, incidentType: incidentTypeId,
    incidentName: INCIDENT_TYPES[incidentTypeId].name,
    sector: Object.entries(SECTORS).find(([, s]) => s.levels.includes(levelKey))?.[0] || 'unknown',
    startTime: new Date().toISOString(), resolvedAt: null, status: 'ACTIVE',
  };
  
  incidentLog.push(newIncident);
  
  // Save to MongoDB asynchronously
  new Incident(newIncident).save().catch(err => console.error('[TELEMETRY] MongoDB save error:', err));

  console.log(`[TELEMETRY] ⚠️  ${INCIDENT_TYPES[incidentTypeId].emoji} ${INCIDENT_TYPES[incidentTypeId].name} — ${levelKey} | ${incidentId}`);
  return { incidentId, incidentType: incidentTypeId, levelKey };
}

// ── Trigger RANDOM level + incident type ──────────────────────────────────
function triggerRandomLeak() {
  const levelKeys  = Object.keys(BASELINES);
  const randomLevel = levelKeys[Math.floor(Math.random() * levelKeys.length)];
  const randomType  = INCIDENT_TYPE_KEYS[Math.floor(Math.random() * INCIDENT_TYPE_KEYS.length)];
  return triggerLeak(randomLevel, randomType);
}

// ── Reset ──────────────────────────────────────────────────────────────────
function resetLeak() {
  const inc = incidentLog.find(i => i.status === 'ACTIVE');
  if (inc) { 
    inc.resolvedAt = new Date().toISOString(); 
    inc.status = 'RESOLVED'; 
    Incident.updateOne({ id: inc.id }, { $set: { resolvedAt: inc.resolvedAt, status: 'RESOLVED' } }).catch(console.error);
  }
  leakState = { active: false, levelKey: null, startTime: null, incidentType: null };
  Object.keys(fanOverrides).forEach(k => { fanOverrides[k] = false; });
  Object.keys(recoveryData).forEach(k => { delete recoveryData[k]; });
  console.log('[TELEMETRY] ✅ System reset — all levels nominal');
}

function resolveIncident(timeToResolve) {
  const inc = incidentLog.find(i => i.status === 'ACTIVE');
  if (inc) {
    inc.resolvedAt = new Date().toISOString();
    inc.status = 'RESOLVED';
    inc.timeToResolve = timeToResolve;
    Incident.updateOne({ id: inc.id }, { $set: { resolvedAt: inc.resolvedAt, status: 'RESOLVED', timeToResolve } }).catch(console.error);
  }
}

// ── Fan Override ───────────────────────────────────────────────────────────
function applyFanOverride(fanId, action) {
  const match = fanId.match(/FAN-0?(\d+)/i);
  if (!match) return;
  const levelKey = `level_${match[1]}`;
  if (!Object.prototype.hasOwnProperty.call(fanOverrides, levelKey)) return;

  // Block fan restart for methane (explosion risk)
  if (action === 'FORCE_RESTART') {
    const itype = leakState.incidentType ? INCIDENT_TYPES[leakState.incidentType] : null;
    if (itype?.noFanRestart) {
      console.warn(`[TELEMETRY] ⛔ Fan restart BLOCKED — ${itype.name} (spark/explosion risk)`);
      return;
    }
    fanOverrides[levelKey] = true;
    const elapsed   = leakState.startTime ? (Date.now() - leakState.startTime) / 1000 : 5;
    const rampTime  = itype?.rampTime || 5;
    const ramp      = Math.min(1, elapsed / rampTime);
    const base      = BASELINES[levelKey];
    const iT        = itype || INCIDENT_TYPES.CO_LEAK;
    recoveryData[levelKey] = {
      startTime: Date.now(),
      startCo:   base.co_ppm + (iT.targetCo - base.co_ppm) * ramp,
      startO2:   base.oxygen_pct - (base.oxygen_pct - iT.targetO2) * ramp,
    };
    console.log(`[TELEMETRY] 🔧 FAN ${fanId} restarted — recovery started`);
  } else {
    fanOverrides[levelKey] = false;
    delete recoveryData[levelKey];
  }
}

function isLeakActive()   { return leakState.active; }
function getIncidentLog() { return [...incidentLog].reverse(); }
function getSectors()     { return SECTORS; }
function getIncidentTypes() { return INCIDENT_TYPES; }

// ── Start Recovery — called when any significant P2 action is taken ────────
// Works for ALL incident types (not just fan-related ones)
function startRecovery() {
  if (!leakState.active || !leakState.levelKey) return;
  const levelKey = leakState.levelKey;
  if (recoveryData[levelKey]) return; // already recovering

  const itype   = leakState.incidentType ? INCIDENT_TYPES[leakState.incidentType] : INCIDENT_TYPES.CO_LEAK;
  const base    = BASELINES[levelKey];
  const elapsed = leakState.startTime ? (Date.now() - leakState.startTime) / 1000 : 5;
  const ramp    = Math.min(1, elapsed / (itype.rampTime || 5));

  recoveryData[levelKey] = {
    startTime: Date.now(),
    startCo:   base.co_ppm   + (itype.targetCo  - base.co_ppm)       * ramp,
    startO2:   base.oxygen_pct - (base.oxygen_pct - itype.targetO2)   * ramp,
  };

  // For non-methane incidents, also mark fan as restored
  if (!itype.noFanRestart) {
    fanOverrides[levelKey] = true;
  }
  console.log(`[TELEMETRY] 📉 Recovery started for ${levelKey} (${itype.name}) from CO=${recoveryData[levelKey].startCo.toFixed(0)}ppm`);
}

module.exports = {
  generateTelemetry, triggerLeak, triggerRandomLeak, resetLeak, resolveIncident,
  isLeakActive, applyFanOverride, getIncidentLog, getSectors,
  getIncidentTypes, startRecovery,
  SECTORS, BASELINES, INCIDENT_TYPES,
};
