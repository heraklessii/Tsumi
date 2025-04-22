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
