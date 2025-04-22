const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.GuildEmojiDelete,
    async execute(emoji) {

        if (!emoji.guild) return;

        const logData = await LogsSettings.findOne({ guildId: emoji.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.emojiDurumu || !logData.emojiLogChannelId) return;

        const logChannel = emoji.guild.channels.cache.get(logData.emojiLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        // Audit log’dan işlemi yapanı al
        const audit = await emoji.guild.fetchAuditLogs({ type: 62, limit: 1 });
        const executor = audit.entries.first()?.executor;
        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
            .setColor(client.red)
            .setTitle(`⛔ EMOJİ SİLİNDİ`)
            .setThumbnail(emoji.imageURL({ extension: emoji.animated ? 'gif' : 'png', size: 4096 }))
            .setDescription(`
\`📋\`  Emoji Adı:  **${emoji.name}**
\`🆔\`  Emoji ID:  **${emoji.id}**
        
\`✍️\`  Silen Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  Silme Zamanı:  ${`<t:${timestamp}:R>`}
                `)
                .setFooter({ text: `Tsumi, HERA tarafından geliştirilmektedir.` });

        await logChannel.send({ embeds: [embed] });
    }
};
