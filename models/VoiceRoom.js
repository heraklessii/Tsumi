const mongoose = require('mongoose');

const voiceRoomSchema = new mongoose.Schema({
  ownerId: { type: String, required: true},
  channelId: { type: String },
  channelName: { type: String, default: '' },
  userLimit: { type: Number, default: 10 }
});

module.exports = mongoose.model('VoiceRoom', voiceRoomSchema);
