/**
 * useTelemetry — Incident-Type Edition
 * ======================================
 * Exposes incidentType, triggerRandomLeak, and triggerLeakWithType.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// In production (Render), frontend & backend are on the same origin.
// In dev, the Vite proxy forwards /socket.io → localhost:4000, so we connect to '/'.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin);

const DEFAULT_TELEMETRY = {
  timestamp: null, system_status: 'NOMINAL', active_leak_level: null,
  incident_type: null, incident_meta: null,
  sectors: {
    north_shaft: { name:'North Shaft', depth:'0–400m',   levels:['level_1','level_2','level_3'] },
    south_shaft: { name:'South Shaft', depth:'400–800m', levels:['level_4','level_5','level_6'] },
  },
  levels: {
    level_1: { oxygen_pct:20.9, co_ppm:3,  temp_c:22, fan_status:true, fan_rpm:1450, state:'NOMINAL', danger_score:2 },
    level_2: { oxygen_pct:20.8, co_ppm:5,  temp_c:24, fan_status:true, fan_rpm:1480, state:'NOMINAL', danger_score:4 },
    level_3: { oxygen_pct:20.7, co_ppm:4,  temp_c:26, fan_status:true, fan_rpm:1460, state:'NOMINAL', danger_score:3 },
    level_4: { oxygen_pct:20.6, co_ppm:6,  temp_c:28, fan_status:true, fan_rpm:1440, state:'NOMINAL', danger_score:5 },
    level_5: { oxygen_pct:20.5, co_ppm:7,  temp_c:30, fan_status:true, fan_rpm:1420, state:'NOMINAL', danger_score:6 },
    level_6: { oxygen_pct:20.4, co_ppm:8,  temp_c:32, fan_status:true, fan_rpm:1400, state:'NOMINAL', danger_score:7 },
  },
  top_danger_zones: [],
};

export function useTelemetry() {
  const [telemetry,        setTelemetry]        = useState(DEFAULT_TELEMETRY);
  const [connected,        setConnected]        = useState(false);
  const [events,           setEvents]           = useState([]);
  const [incidentHistory,  setIncidentHistory]  = useState([]);
  const [alarmStartTime,   setAlarmStartTime]   = useState(null);
  const [currentIncidentId, setCurrentIncidentId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports:['websocket','polling'], reconnectionAttempts:10 });
    socketRef.current = socket;

    socket.on('connect',    () => { setConnected(true); socket.emit('get_incidents'); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('mine_telemetry', setTelemetry);

    socket.on('system_event', (event) => {
      setEvents(prev => [event, ...prev].slice(0, 100));
      if (event.type === 'LEAK_TRIGGERED') {
        setAlarmStartTime(Date.now());
        setCurrentIncidentId(event.incidentId || null);
      }
      if (event.type === 'SYSTEM_RESET' || event.type === 'INCIDENT_RESOLVED') {
        setAlarmStartTime(null);
        setCurrentIncidentId(null);
        socket.emit('get_incidents');
      }
    });

    socket.on('incident_log', ({ incidents }) => setIncidentHistory(incidents || []));
    return () => socket.disconnect();
  }, []);

  const triggerLeak         = useCallback((levelKey='level_2', incidentType='CO_LEAK') => {
    socketRef.current?.emit('trigger_leak', { level: levelKey, incident_type: incidentType });
  }, []);

  const triggerRandomLeak   = useCallback(() => {
    socketRef.current?.emit('trigger_random');
  }, []);

  const startRecovery       = useCallback(() => {
    socketRef.current?.emit('start_recovery');
  }, []);

  const resetSystem         = useCallback(() => socketRef.current?.emit('reset_system'), []);
  const fanOverride         = useCallback((fanId, action) => socketRef.current?.emit('fan_override', { fan_id: fanId, action }), []);
  const reportIncidentResolved = useCallback((stats) => {
    socketRef.current?.emit('incident_resolved', stats);
    socketRef.current?.emit('get_incidents');
  }, []);

  const systemCritical  = telemetry.system_status === 'CRITICAL';
  const criticalLevel   = telemetry.active_leak_level || null;
  const incidentType    = telemetry.incident_type || null;
  const incidentMeta    = telemetry.incident_meta || null;

  return {
    telemetry, connected, events, systemCritical, criticalLevel,
    incidentType, incidentMeta,
    alarmStartTime, currentIncidentId, incidentHistory,
    triggerLeak, triggerRandomLeak, startRecovery, resetSystem, fanOverride, reportIncidentResolved,
  };
}
