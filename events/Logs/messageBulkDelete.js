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

const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.MessageBulkDelete,
    async execute(messages) {

        const first = messages.first();
        if (!first?.guild) return;

        const logData = await LogsSettings.findOne({ guildId: first.guild.id });
        if (!logData?.sistemDurumu || !logData?.mesajDurumu || !logData.mesajLogChannelId) return;

        const logChannel = first.guild.channels.cache.get(logData.mesajLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        const adet = messages.size;
        const audit = await first.guild.fetchAuditLogs({ type: 73, limit: 1 });
        const executor = audit.entries.first()?.executor;

        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle(`🗑️ ${adet} MESAJ TOPLU OLARAK SİLİNDİ`)
            .setDescription(`Silinen mesaj sayısı: **${adet}**`)
            .setFooter({
                text: `İşlemi yapan: ${executor?.username || "❔"}`,
                iconURL: executor?.displayAvatarURL({ dynamic: true }) || null
            });

        await logChannel.send({ embeds: [embed] });
    }
};
