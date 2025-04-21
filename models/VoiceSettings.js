const mongoose = require('mongoose');

const voiceSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  sistemDurumu: { type: Boolean, default: false },
  categoryId: { type: String },
  joinChannelId: { type: String }
});

module.exports = mongoose.model('VoiceSettings', voiceSettingsSchema);
