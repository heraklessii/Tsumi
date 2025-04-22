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
const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const fs = require('node:fs');

// Client yapılandırması
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.ThreadMember, Partials.Channel,
    Partials.Message, Partials.User,
    Partials.GuildMember, Partials.Reaction
  ]
});

client.setMaxListeners(0);

// Global ayarlar ve koleksiyonlar
global.client = client;
client.commands = new Collection();
client.cooldowns = new Collection();
client.aliases = new Collection();
client.color = "#2b2d32";
client.red = "#FC6161";
client.green = "#73D673";
client.white = "#FFFFFF";
client.black = "#000001";
client.blue = "#449afe"
client.yellow = "#FFD700";

// Command
client.on(Events.ClientReady, () => {
  require('./utils/command.js')(client);
});

// Error Handler
fs.readdirSync('./handlers').forEach(handler => {
  require(`./handlers/${handler}`)(client);
});

// Botu başlatma
client.login(process.env.TOKEN);

module.exports = client;
