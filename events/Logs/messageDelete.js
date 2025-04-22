const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {

    if (message.partial) {
      try {
        await message.fetch();
      } catch (error) { return; }
    }

    if (!message.guild || message.author?.bot) return;

    try {

      const logData = await LogsSettings.findOne({ guildId: message.guild.id });
      if (!logData?.sistemDurumu || !logData?.mesajDurumu || !logData.mesajLogChannelId) return;

      const logChannel = message.guild.channels.cache.get(logData.mesajLogChannelId);
      if (!logChannel || !logChannel.isTextBased()) return;
      
      const audit = await message.guild.fetchAuditLogs({ type: 72, limit: 1 });
      const executor = audit.entries.first()?.executor;

      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL({ dynamic: true }) || null
        })
        .setTitle("⛔ MESAJ SİLİNDİ")
        .setDescription(`
\`\`\`${message.content || "[Mesaj Boş]"}\`\`\`

\`#️⃣\`  Kanal:  ${message.channel}
          `)
        .setFooter({
          text: `Silen kişi: ${executor?.username || "❔"}`,
          iconURL: executor?.displayAvatarURL({ dynamic: true }) || null
        });

      if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        if (attachment?.contentType?.startsWith("image/")) {
          embed.setImage(attachment.proxyURL);
        }
      }

      await logChannel.send({ embeds: [embed] });

    } catch (error) { }

  }
};
