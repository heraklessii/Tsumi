const mongoose = require('mongoose');

const statsSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  sistemDurumu: { type: Boolean, default: false },
  gunlukRaporDurumu: { type: Boolean, default: false },
  haftalıkRaporDurumu: { type: Boolean, default: false },
  logChannelId: { type: String }
});

module.exports = mongoose.model('StatsSettings', statsSettingsSchema);
