const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.GuildBanAdd,
    async execute(member, reason) {

        if(!member.guild) return;

        const logData = await LogsSettings.findOne({ guildId: member.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.banDurumu || !logData.banLogChannelId) return;

        const logChannel = member.guild.channels.cache.get(logData.banLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        // Audit log’dan işlemi yapanı al
        const audit = await member.guild.fetchAuditLogs({ type: 22, limit: 1 });
        const executor = audit.entries.first()?.executor;
        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
            .setColor(client.red)
            .setTitle(`⛔ ÜYE YASAKLANDI`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setDescription(`
\`📋\`  Üye:  **${member.user.username}**
\`🆔\`  ID:  **${member.user.id}**
\`#️⃣\`  Etiket:  ${member.user}

\`❓\`  Sebep:  **${reason || "Sebep yok."}**
\`✍️\`  Yasaklayan Yetkili:  ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\`  Yasaklama Zamanı:  ${`<t:${timestamp}:R>`}
                `)
            .setFooter({ text: `Tsumi, HERA tarafından geliştirilmektedir.` });

        await logChannel.send({ embeds: [embed] });
    }
};
