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
