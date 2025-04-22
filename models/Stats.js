// Tsumi Bot - Discord Bot Project
// Copyright (C) 2025  Tsumi Bot Contributors
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
