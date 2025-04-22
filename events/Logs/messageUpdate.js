const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        try {
  
            if (oldMessage.partial) await oldMessage.fetch().catch(console.error);
            if (newMessage.partial) await newMessage.fetch().catch(console.error);

            if (!oldMessage.guild || oldMessage.author?.bot) return;
            if (oldMessage.content === newMessage.content) return;

            const logData = await LogsSettings.findOne({ guildId: oldMessage.guild.id });
            if (!logData?.sistemDurumu || !logData?.mesajDurumu || !logData?.mesajLogChannelId) return;

            const logChannel = oldMessage.guild.channels.cache.get(logData.mesajLogChannelId);
            if (!logChannel || !logChannel.isTextBased()) return;

            const jumpUrl = newMessage.url
                || `https://discord.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id}`;
            const jumpButton = new ButtonBuilder()
                .setLabel("Mesaja Git")
                .setStyle(ButtonStyle.Link)
                .setURL(jumpUrl);
            const actionRow = new ActionRowBuilder().addComponents(jumpButton);

            const embedOld = new EmbedBuilder()
                .setAuthor({
                    name: oldMessage.author.username,
                    iconURL: oldMessage.author.displayAvatarURL({ dynamic: true })
                })
                .setTitle("⚙️ ESKİ MESAJ")
                .setColor(client.red)
                .setDescription(`\`\`\`${oldMessage.content || "[Eski Mesaj Boş]"}\`\`\``)
                .setFooter({ text: "Tsumi, HERA tarafından geliştirilmektedir." });

            if (oldMessage.attachments.size > 0) {
                const attachment = oldMessage.attachments.first();
                if (attachment.contentType?.startsWith("image/")) {
                    embedOld.setImage(attachment.proxyURL);
                }
            }

            const embedNew = new EmbedBuilder()
                .setAuthor({
                    name: newMessage.author.username,
                    iconURL: newMessage.author.displayAvatarURL({ dynamic: true })
                })
                .setTitle("⚙️ YENİ MESAJ")
                .setColor(client.green)
                .setDescription([
                    `\`\`\`${newMessage.content || "[Yeni Mesaj Boş]"}\`\`\``,
                    `\`#️⃣\` Kanal: ${newMessage.channel}`
                ].join("\n"))
                .setFooter({ text: "Tsumi, HERA tarafından geliştirilmektedir." });

            if (newMessage.attachments.size > 0) {
                const attachment = newMessage.attachments.first();
                if (attachment.contentType?.startsWith("image/")) {
                    embedNew.setImage(attachment.proxyURL);
                }
            }

            await logChannel.send({
                embeds: [embedOld, embedNew],
                components: [actionRow]
            });

        } catch (error) { }

    },
};
