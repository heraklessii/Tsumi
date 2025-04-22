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
    name: Events.GuildEmojiCreate,
    async execute(emoji) {

        if (!emoji.guild) return;

        const logData = await LogsSettings.findOne({ guildId: emoji.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.emojiDurumu || !logData.emojiLogChannelId) return;

        const logChannel = emoji.guild.channels.cache.get(logData.emojiLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        // Audit log’dan işlemi yapanı al
        const audit = await emoji.guild.fetchAuditLogs({ type: 60, limit: 1 });
        const executor = audit.entries.first()?.executor;
        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
            .setColor(client.green)
            .setTitle(`✅ EMOJİ OLUŞTURULDU`)
            .setThumbnail(emoji.imageURL({ extension: emoji.animated ? 'gif' : 'png', size: 4096 }))
            .setDescription(`
\`📋\`  Emoji Adı:  **${emoji.name}**
\`🆔\`  Emoji ID:  **${emoji.id}**
        
\`✍️\`  Oluşturan Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  Oluşturma Zamanı:  ${`<t:${timestamp}:R>`}
                `)
                .setFooter({ text: `Tsumi, HERA tarafından geliştirilmektedir.` });

        await logChannel.send({ embeds: [embed] });
    }
};
