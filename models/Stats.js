const { Schema, model } = require('mongoose');

const messageStatsSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  totalMessages: { type: Number, default: 0 },
  dailyMessages: { type: Map, of: Number, default: {} },
  weeklyMessages: { type: Map, of: Number, default: {} },
  channelMessages: {
    type: Map,
    of: new Schema({
      total: { type: Number, default: 0 },
      daily: { type: Map, of: Number, default: {} },
      weekly: { type: Map, of: Number, default: {} },
    }),
    default: {}
  },
  totalVoice: { type: Number, default: 0 },
  dailyVoice: { type: Map, of: Number, default: {} },
  weeklyVoice: { type: Map, of: Number, default: {} },
  channelVoice: {
    type: Map,
    of: new Schema({
      total: { type: Number, default: 0 },
      daily: { type: Map, of: Number, default: {} },
      weekly: { type: Map, of: Number, default: {} },
    }),
    default: {}
  },
  lastJoin: { type: Date },
},
  {
    timestamps: true
  });

module.exports = model('Stats', messageStatsSchema);
