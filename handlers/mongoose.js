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

require('dotenv').config();
const mongoose = require('mongoose');
module.exports = (client) => {

    mongoose.connect(process.env.MONGO || "mongodb://localhost:27017/")
        .then(() => {
            console.log('MongoDB’ye başarıyla bağlanıldı!');
        })
        .catch(err => console.error('MongoDB bağlantı hatası:', err));

};