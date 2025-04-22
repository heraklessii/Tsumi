const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.MessageBulkDelete,
    async execute(messages) {

        const first = messages.first();
        if (!first?.guild) return;

        const logData = await LogsSettings.findOne({ guildId: first.guild.id });
        if (!logData?.sistemDurumu || !logData?.mesajDurumu || !logData.mesajLogChannelId) return;

        const logChannel = first.guild.channels.cache.get(logData.mesajLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        const adet = messages.size;
        const audit = await first.guild.fetchAuditLogs({ type: 73, limit: 1 });
        const executor = audit.entries.first()?.executor;

        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle(`🗑️ ${adet} MESAJ TOPLU OLARAK SİLİNDİ`)
            .setDescription(`Silinen mesaj sayısı: **${adet}**`)
            .setFooter({
                text: `İşlemi yapan: ${executor?.username || "❔"}`,
                iconURL: executor?.displayAvatarURL({ dynamic: true }) || null
            });

        await logChannel.send({ embeds: [embed] });
    }
};
