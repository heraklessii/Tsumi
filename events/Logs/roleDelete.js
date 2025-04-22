// events/roleCreate.js
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
