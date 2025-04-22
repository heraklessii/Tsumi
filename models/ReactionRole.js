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

const mongoose = require("mongoose");

const messageConfigSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ["normal", "unique", "verify", "drop", "reversed", "limit", "binding"],
    default: "normal"
  },
  maxRoles: {
    type: Number,
    default: null  // yalnızca "limit" modunda kullanılır
  },
  roles: [
    {
      emoji: {
        type: String,
        required: true
      },
      roleId: {
        type: String,
        required: true
      }
    }
  ],
  whitelistRoles: {
    type: [String],   // rol ID’lerinden oluşan dizi
    default: []
  },
  blacklistRoles: {
    type: [String],   // rol ID’lerinden oluşan dizi
    default: []
  }
}, { _id: false });

const reactionRoleSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  messages: {
    type: [messageConfigSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("ReactionRole", reactionRoleSchema);
