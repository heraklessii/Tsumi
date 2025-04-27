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
    name: Events.GuildRoleUpdate,
    async execute(oldRole, newRole) {

        try {

            if (!oldRole.guild) return;

            const logData = await LogsSettings.findOne({ guildId: oldRole.guild.id });
            if (!logData?.sistemDurumu || !logData?.rolDurumu || !logData?.rolLogChannelId) return;
            const logChannel = oldRole.guild.channels.cache.get(logData.rolLogChannelId);
            if (!logChannel?.isTextBased()) return;

            const changes = [];

            if (oldRole.name !== newRole.name) {
                changes.push({ name: "İsim", old: oldRole.name, new: newRole.name });
            }

            if (oldRole.hexColor !== newRole.hexColor) {
                changes.push({ name: "Renk", old: oldRole.hexColor, new: newRole.hexColor });
            }

            if (oldRole.mentionable !== newRole.mentionable) {
                changes.push({
                    name: "Etiketlenme",
                    old: oldRole.mentionable ? "✅" : "❌",
                    new: newRole.mentionable ? "✅" : "❌"
                });
            }

            const formatPerms = perms =>
                perms.length ? `\`\`\`${perms.join("\n ")}\`\`\`` : "❌";

            const oldPerms = oldRole.permissions.toArray();
            const newPerms = newRole.permissions.toArray();
            if (oldPerms.join() !== newPerms.join()) {
                changes.push({
                    name: "İzinler",
                    old: formatPerms(oldPerms),
                    new: formatPerms(newPerms)
                });
            }

            if (!changes.length) return; // Değişiklik yoksa log atma

            let executor;
            try {
                const fetchedLogs = await newRole.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate });
                const auditEntry = fetchedLogs.entries.find(entry => entry.target.id === newRole.id);
                executor = auditEntry?.executor;
            } catch {
                executor = null;
            }

            const embed = new EmbedBuilder()
                .setTitle("⚙️ ROL GÜNCELLENDİ")
                .setColor(client.blue)
                .setFooter({ text: "Tsumi, HERA tarafından geliştirilmektedir." })
                .setTimestamp();

            let description = `
\`📋\`  Rol:  **${newRole}**
\`🆔\`  ID:  **${newRole.id}**
\`✍️\`  Güncelleyen Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
            `;

            changes.forEach(change => {
                description += `
**${change.name}:**
Eski: **${change.old}**
Yeni: **${change.new}**\n`;
            });
            embed.setDescription(description);

            await logChannel.send({ embeds: [embed] });
        } catch (error) { }

    },
};
