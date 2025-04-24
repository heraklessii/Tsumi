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

const mongoose = require('mongoose');
const { Schema } = mongoose;
const SettingsSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  sistemDurumu: {
    type: Boolean,
    default: false
  },
  creatorRole: {
    type: String,
    default: null
  },
  logChannel: {
    type: String,
    default: null
  },
  management: [{
    roleId: {
      type: String,
      required: true
    },
    position: {
      type: Number,
      required: true
    }
  }]
});

module.exports = mongoose.model('YSettings', SettingsSchema);