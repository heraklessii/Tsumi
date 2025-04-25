const mongoose = require('mongoose');

const TruthOrDareSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    hostId: { type: String, required: true },
    participants: [{ type: String, required: true }],
    playedCounts: { type: Map, of: Number, default: {} },
    lastSelected: { type: String, default: null },
    currentQuestioner: { type: String, default: null },
    rounds: { type: Number, default: 0 },
    maxRounds: { type: Number, default: 24 },
    startedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('TruthOrDare', TruthOrDareSchema);
