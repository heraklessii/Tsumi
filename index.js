require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

// Client yapılandırması
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildEmojisAndStickers,
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
client.embed = "#2b2d32";
client.yellow = "#FFD700";

// Events
const eventsPath = path.join(__dirname, 'events');
const eventFolders = fs.readdirSync(eventsPath).filter(folder => {
  return fs.lstatSync(path.join(eventsPath, folder)).isDirectory();
});

for (const folder of eventFolders) {
  const folderPath = path.join(eventsPath, folder);
  const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(folderPath, file);
    const event = require(filePath);

    if (event.eventType === 'manager') {
      client.giveawaysManager.on(event.name, (...args) => event.execute(...args));
    } else {

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    }
  }
}

// Command handler'ı yükleme
client.on(Events.ClientReady, () => {
  require('./utils/command.js')(client);
});

// Handler dosyalarını yükleme
fs.readdirSync('./handlers').forEach(handler => {
  require(`./handlers/${handler}`)(client);
});

// MongoDB bağlantısı
mongoose.connect("mongodb://localhost:27017/")
.then(() => {
  console.log('MongoDB’ye başarıyla bağlanıldı!');
})
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Botu başlatma
client.login(process.env.TOKEN);

module.exports = client;
