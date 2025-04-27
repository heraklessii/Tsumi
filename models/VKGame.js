const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    role: { type: String, required: true },
    originalNick: { type: String },
    status: { type: String, enum: ['alive', 'dead'], default: 'alive' }
});

const VKGameSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    adminId: { type: String, required: true },
    mode: { type: String, enum: ['normal', 'advanced'], required: true },
    channels: {
        adminChannel: { type: String, required: true },
        textChannel: { type: String, required: true },
        voiceChannel: { type: String, required: true }
    },
    renameOnStart: { type: Boolean, default: false },
    players: [PlayerSchema],
    dayCount: { type: Number, default: 0 },
    nightCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("VKGame", VKGameSchema);