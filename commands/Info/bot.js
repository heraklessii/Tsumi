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

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
module.exports = {
    category: "Info",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Bot hakkında detaylı bilgi alırsınız.'),

    run: async (client, interaction) => {

        const ping = client.ws.ping;
        const uptime = formatDuration(process.uptime() * 1000);
        const totalCommands = client.commands.size;
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2);
        const cpuInfo = os.cpus()[0].model;
        const osInfo = `${os.platform()} ${os.arch()}`;
        const nodeVersion = process.version;

        const description = [
            `🏓 Ping: \`${ping}ms\``,
            `⏱️ Uptime: \`${uptime}\``,
            `📋 Komut Sayısı: \`${totalCommands}\``,
            `🧠 Hafıza Kullanımı: \`${memoryUsage}MB / ${totalMemory}MB\``,
            `🛠️ Platform: \`${osInfo}\``,
            `🔧 Node.js: \`${nodeVersion}\``,
            `💻 CPU: \`${cpuInfo}\``
        ].join('\n');

        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle('🤖 Tsumi Bot Bilgi')
            .setDescription(description)
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: false });
    },
};

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return [
        days ? `${days} gün` : null,
        hours ? `${hours} saat` : null,
        minutes ? `${minutes} dakika` : null,
        seconds ? `${seconds} saniye` : null,
    ].filter(Boolean).join(', ');
}