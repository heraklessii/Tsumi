const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel) {

        if (!channel.guild) return;

        const logData = await LogsSettings.findOne({ guildId: channel.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.kanalDurumu || !logData.kanalLogChannelId) return;

        const logChannel = channel.guild.channels.cache.get(logData.kanalLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        // Audit log’dan silen kişiyi al
        const audit = await channel.guild.fetchAuditLogs({ type: 12, limit: 1, });
        const executor = audit.entries.first()?.executor;
        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
            .setColor(client.red)
            .setTitle(`⛔ KANAL SİLİNDİ`)
            .setDescription(`
\`📋\`  Ad:  **${channel.name}**
\`🆔\`  ID:  **${channel.id}**
        
\`🔞\`  NSFW:  ${channel.nsfw ? "✅" : "❌"}
\`🏷️\`  Kategori:  **${channel.parent?.name || "❌"}**
        
\`✍️\`  Silen Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  Silinme Zamanı:  ${`<t:${timestamp}:R>`}
                        `)
            .setFooter({ text: `Tsumi, HERA tarafından geliştirilmektedir.` })

        await logChannel.send({ embeds: [embed] });
    },
};
