const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {

        if (!member.guild) return;

        var date = Date.now();

        const logData = await LogsSettings.findOne({ guildId: member.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.girmeCikmaDurumu || !logData.girmeCikmaLogChannelId) return;

        const logChannel = member.guild.channels.cache.get(logData.girmeCikmaLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle(`⛔ ÜYE SUNUCUDAN AYRILDI`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setDescription(`
\`📋\`  Üye:  **${member.user.username}**
\`🆔\`  ID:  **${member.user.id}**

\`🗓️\`  Ayrılma Tarihi:  <t:${parseInt(date / 1000)}:R>
                `)

        await logChannel.send({ embeds: [embed] });
    }
};
