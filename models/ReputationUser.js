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

const { Schema, model } = require("mongoose");
const repUserSchema = new Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  points: { type: Number, default: 0 },
  lastRepGivenAt: { type: Date, default: null },
  lastGiven: { type: Map, of: Date, default: {} },
});

module.exports = model("ReputationUser", repUserSchema);
