// events/roleUpdate.js
const { Events, EmbedBuilder } = require("discord.js");
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

            const embed = new EmbedBuilder()
                .setTitle("⚙️ ROL GÜNCELLENDİ")
                .setColor(client.blue)
                .setFooter({ text: "Tsumi, HERA tarafından geliştirilmektedir." })
                .setTimestamp();

            let description = `
\`📋\`  Rol:  **${newRole}**
\`🆔\`  ID:  **${newRole.id}**
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
