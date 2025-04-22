const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel) {

        if (!channel.guild) return;

        const logData = await LogsSettings.findOne({ guildId: channel.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.kanalDurumu || !logData.kanalLogChannelId) return;

        const logChannel = channel.guild.channels.cache.get(logData.kanalLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        // Audit logdan kim oluşturdu bilgisini al
        const audit = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 });
        const executor = audit.entries.first()?.executor;
        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
            .setColor(client.green)
            .setTitle(`✅ KANAL OLUŞTURULDU`)
            .setDescription(`
\`📋\`  Ad:  **${channel.name}**
\`🆔\`  ID:  **${channel.id}**
\`#️⃣\`  Etiket:  ${channel}

\`🔞\`  NSFW:  ${channel.nsfw ? "✅" : "❌"}
\`🏷️\`  Kategori:  **${channel.parent?.name || "❌"}**

\`✍️\`  Oluşturan Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  Oluşturulma Zamanı:  ${`<t:${timestamp}:R>`}
                `)
            .setFooter({ text: `Tsumi, HERA tarafından geliştirilmektedir.` })

        await logChannel.send({ embeds: [embed] });
    }
};
