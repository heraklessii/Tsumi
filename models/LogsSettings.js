const mongoose = require("mongoose");

const LogsSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    sistemDurumu: { type: Boolean, default: false },
    kanalDurumu: { type: Boolean, default: false },
    emojiDurumu: { type: Boolean, default: false },
    banDurumu: { type: Boolean, default: false },
    girmeCikmaDurumu: { type: Boolean, default: false },
    mesajDurumu: { type: Boolean, default: false },
    sesDurumu: { type: Boolean, default: false },
    rolDurumu: { type: Boolean, default: false },
    memberDurumu: { type: Boolean, default: false },
    kanalLogChannelId: { type: String },
    emojiLogChannelId: { type: String },
    banLogChannelId: { type: String },
    girmeCikmaLogChannelId: { type: String },
    mesajLogChannelId: { type: String },
    sesLogChannelId: { type: String },
    rolLogChannelId: { type: String },
    memberLogChannelId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("LogsSettings", LogsSettingsSchema);