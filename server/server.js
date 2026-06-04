/**
 * Venti-Guard Backend Server — Incident-Type Edition
 */
require('dotenv').config();
const express = require('express');
const http    = require('http');
const path    = require('path');
const { Server } = require('socket.io');
const cors    = require('cors');
const mongoose = require('mongoose');
const {
  generateTelemetry, triggerLeak, triggerRandomLeak, resetLeak,
  isLeakActive, applyFanOverride, getIncidentLog, getSectors, getIncidentTypes,
  startRecovery, resolveIncident
} = require('./telemetry');

const PORT   = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';
const app    = express();

// CORS — open to all in prod (Render manages domain), restrict in dev
app.use(cors({ origin: isProd ? '*' : ['http://localhost:5173','http://localhost:3000'] }));
app.use(express.json());

// ── Serve built frontend in production ────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  // All non-API routes serve the React SPA
  app.get(/^(?!\/api|\/socket\.io).*/, (_, res) =>
    res.sendFile(path.join(distPath, 'index.html'))
  );
}

// ── MongoDB Connection ────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/venti-guard')
  .then(() => console.log('[DATABASE] MongoDB Connected Successfully'))
  .catch((err) => console.error('[DATABASE] MongoDB Connection Error:', err));

const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] },
});

// ── REST ───────────────────────────────────────────────────────────────────
app.get('/api/health',        (_, res) => res.json({ status:'online', uptime: process.uptime(), leak_active: isLeakActive() }));
app.get('/api/incidents',     (_, res) => res.json({ incidents: getIncidentLog() }));
app.get('/api/incident-types',(_, res) => res.json({ types: getIncidentTypes() }));

app.post('/api/trigger_leak', (req, res) => {
  const { level='level_2', incident_type='CO_LEAK' } = req.body || {};
  const result = triggerLeak(level, incident_type);
  io.emit('system_event', { type:'LEAK_TRIGGERED', level, incidentType: incident_type, ...result, timestamp: new Date().toISOString() });
  res.json({ success: true, ...result });
});

app.post('/api/trigger_random', (_, res) => {
  const result = triggerRandomLeak();
  io.emit('system_event', { type:'LEAK_TRIGGERED', ...result, timestamp: new Date().toISOString() });
  res.json({ success: true, ...result });
});

app.post('/api/reset', (_, res) => {
  resetLeak();
  io.emit('system_event', { type:'SYSTEM_RESET', timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// ── Socket ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);
  socket.emit('mine_telemetry', generateTelemetry());

  socket.on('trigger_leak', (data) => {
    const levelKey     = data?.level || 'level_2';
    const incidentType = data?.incident_type || 'CO_LEAK';
    const result       = triggerLeak(levelKey, incidentType);
    io.emit('system_event', { type:'LEAK_TRIGGERED', level: levelKey, incidentType, ...result, timestamp: new Date().toISOString() });
  });

  socket.on('trigger_random', () => {
    const result = triggerRandomLeak();
    io.emit('system_event', { type:'LEAK_TRIGGERED', ...result, timestamp: new Date().toISOString() });
    console.log(`[SOCKET] 🎲 Random incident triggered: ${result.incidentType} @ ${result.levelKey}`);
  });

  socket.on('reset_system', () => {
    resetLeak();
    io.emit('system_event', { type:'SYSTEM_RESET', timestamp: new Date().toISOString() });
  });

  socket.on('start_recovery', () => {
    startRecovery();
    console.log(`[SOCKET] 📉 Recovery triggered by client action`);
  });

  socket.on('fan_override', (data) => {
    applyFanOverride(data.fan_id, data.action);
    io.emit('system_event', { type:'FAN_OVERRIDE', fan_id: data.fan_id, action: data.action, timestamp: new Date().toISOString() });
  });

  socket.on('get_incidents', () => socket.emit('incident_log', { incidents: getIncidentLog() }));

  socket.on('incident_resolved', (data) => {
    resolveIncident(data?.timeToResolve);
    io.emit('system_event', { type:'INCIDENT_RESOLVED', timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => console.log(`[SOCKET] Disconnected: ${socket.id}`));
});

// ── Telemetry Loop ─────────────────────────────────────────────────────────
setInterval(() => io.emit('mine_telemetry', generateTelemetry()), 1500);

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║        VENTI-GUARD TELEMETRY SERVER          ║
  ║        INCIDENT-TYPE EDITION — 5 TYPES       ║
  ╠══════════════════════════════════════════════╣
  ║  Status:  ONLINE   Port: ${PORT}               ║
  ║  Types:   CO Leak · O2 Dep · Fan Fail ·      ║
  ║           Methane · Heat Emergency           ║
  ╚══════════════════════════════════════════════╝
  `);
});
