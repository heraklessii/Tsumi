// Tsumi Bot - Discord Bot Project
// Copyright (C) 2025  Tsumi Bot Contributors
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
