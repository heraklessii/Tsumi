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

const { Events, EmbedBuilder, AuditLogEvent } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.ChannelPinsUpdate,
    async execute(channel) {

        if (!channel.guild) return;

        const logData = await LogsSettings.findOne({ guildId: channel.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.kanalDurumu || !logData.kanalLogChannelId) return;

        const logChannel = channel.guild.channels.cache.get(logData.kanalLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        // Audit log’dan son işlemi al (pin veya unpin)
        const audit = await channel.guild.fetchAuditLogs({ limit: 1 });
        const entry = audit.entries.first();
        const executor = entry?.executor;
        const action = entry?.action;

        const isPin = action === AuditLogEvent.MessagePin;
        const timestamp = Math.floor(Date.now() / 1000);
        const title = isPin ? "📌 MESAJ SABİTLENDİ" : "❌ SABİT MESAJ KALDIRILDI";

        const embed = new EmbedBuilder()
            .setColor(isPin ? client.green : client.red)
            .setTitle(title)
            .setDescription(`
\`📋\`  Kanal:  **${channel.name}**
\`🆔\`  ID:  **${channel.id}**
\`#️⃣\`  Etiket:  ${channel}
        
\`✍️\`  İşlem Yetkilisi:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  İşlem Zamanı:  ${`<t:${timestamp}:R>`}
                `)
            .setFooter({ text: `Tsumi, HERA tarafından geliştirilmektedir.` });

        await logChannel.send({ embeds: [embed] });
    },
};
