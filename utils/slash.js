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
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const token = process.env.TOKEN;

const slash = {
    register: async (clientId, commands) => {
        const rest = new REST({ version: "10" }).setToken(token);

        try {
            await rest.put(Routes.applicationCommands(clientId), { body: commands });
            console.log("Slash komutları yüklendi.");
        } catch (error) {
            console.error(`Slash komutları yüklenemedi.\n${error}`);
        }
    },
};

module.exports = slash;
