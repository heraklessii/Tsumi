const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.GuildEmojiUpdate,
    async execute(oldEmoji, newEmoji) {

        if (!oldEmoji.guild) return;

        const logData = await LogsSettings.findOne({ guildId: oldEmoji.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.emojiDurumu || !logData.emojiLogChannelId) return;

        const logChannel = oldEmoji.guild.channels.cache.get(logData.emojiLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        // Audit log’dan işlemi yapanı al
        const audit = await oldEmoji.guild.fetchAuditLogs({ type: 61, limit: 1 });
        const executor = audit.entries.first()?.executor;
        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
            .setColor(client.blue)
            .setTitle(`⚙️ EMOJİ GÜNCELLENDİ`)
            .setThumbnail(newEmoji.imageURL({ extension: newEmoji.animated ? 'gif' : 'png', size: 4096 }))
            .setDescription(`
\`📋\`  Eski Emoji Adı:  **${oldEmoji.name}**
\`📋\`  Yeni Emoji Adı:  **${newEmoji.name}**
\`🆔\`  Emoji ID:  **${newEmoji.id}**
                    
\`✍️\`  Güncelleyen Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  Güncelleme Zamanı:  ${`<t:${timestamp}:R>`}
                            `)
            .setFooter({ text: `Tsumi, HERA tarafından geliştirilmektedir.` });

        await logChannel.send({ embeds: [embed] });
    }
};
