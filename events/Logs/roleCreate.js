// events/roleCreate.js
const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.GuildRoleCreate,
    async execute(role) {
        try {

            if (!role.guild) return;

            const logData = await LogsSettings.findOne({ guildId: role.guild.id });
            if (!logData?.sistemDurumu || !logData?.rolDurumu || !logData?.rolLogChannelId) return;

            const logChannel = role.guild.channels.cache.get(logData.rolLogChannelId);
            if (!logChannel?.isTextBased()) return;

            const audit = await role.guild.fetchAuditLogs({ type: 30, limit: 1 });
            const executor = audit.entries.first()?.executor;
            const timestamp = Math.floor(Date.now() / 1000);

            const embed = new EmbedBuilder()
                .setTitle("✅ ROL OLUŞTURULDU")
                .setColor(client.green)
                .setDescription(`
\`📋\`  Ad:  **${role.name}**
\`🆔\`  ID:  **${role.id}**
\`#️⃣\`  Etiket:  ${role}

\`🎨\`  Renk:  **${role.hexColor}**
\`📌\`  Pozisyon:  **${role.position.toString()}**
\`🏷️\`  Etiketlenme:  **${role.mentionable ? "✅" : "❌"}**

\`📝\`  İzinler:  **${role.permissions.toArray().join("\n ") || "Yok"}**

\`✍️\`  Oluşturan Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  Oluşturulma Zamanı:  ${`<t:${timestamp}:R>`}
                    `)
                .setFooter({ text: "Tsumi, HERA tarafından geliştirilmektedir." })

            await logChannel.send({ embeds: [embed] });
        } catch (error) { }

    },
};
