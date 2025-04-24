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
const GroupSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    name: { type: String, required: true, unique: false },
    type: { type: String, enum: ['metin', 'ses', 'metin+ses'], default: 'metin+ses' },
    difficulty: { type: String, enum: ['kolay', 'orta', 'zor'], default: 'orta' },
    roles: [{ roleId: String, level: Number }],  // Seviye eşlemeleri
});

module.exports = mongoose.model('YGroup', GroupSchema);