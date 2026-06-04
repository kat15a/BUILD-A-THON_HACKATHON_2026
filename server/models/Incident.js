const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  levelKey: { type: String, required: true },
  incidentType: { type: String, required: true },
  incidentName: { type: String, required: true },
  sector: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  status: { type: String, enum: ['ACTIVE', 'RESOLVED'], default: 'ACTIVE' },
  timeToResolve: { type: Number }
});

module.exports = mongoose.model('Incident', incidentSchema);
