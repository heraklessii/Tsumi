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
    name: Events.GuildRoleDelete,
    async execute(role) {
        try {

            if (!role.guild) return;

            const logData = await LogsSettings.findOne({ guildId: role.guild.id });
            if (!logData?.sistemDurumu || !logData?.rolDurumu || !logData?.rolLogChannelId) return;

            const logChannel = role.guild.channels.cache.get(logData.rolLogChannelId);
            if (!logChannel?.isTextBased()) return;

            const audit = await role.guild.fetchAuditLogs({ type: 32, limit: 1 });
            const executor = audit.entries.first()?.executor;
            const timestamp = Math.floor(Date.now() / 1000);

            const embed = new EmbedBuilder()
                .setTitle("⛔ ROL SİLİNDİ")
                .setColor(client.red)
                .setDescription(`
\`📋\`  Ad:  **${role.name}**
\`🆔\`  ID:  **${role.id}**

\`✍️\`  Silen Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  Silme Zamanı:  ${`<t:${timestamp}:R>`}
                    `)
                .setFooter({ text: "Tsumi, HERA tarafından geliştirilmektedir." })

            await logChannel.send({ embeds: [embed] });
        } catch (error) { }

    },
};
