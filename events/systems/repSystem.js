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

const { Events, EmbedBuilder } = require('discord.js');
const ReputationUser = require("../../models/ReputationUser");
const ReputationSettings = require("../../models/ReputationSettings");
module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const setting = await ReputationSettings.findOne({ guildId: message.guild.id });
    if (!setting?.sistemDurumu) return;

    const topChannel = setting.topChannelId;
    if (!message.reference) return;

    const validTriggers = /^(?:\+|(?:\+1)|(?:rep)|(?:\+rep))$/i;
    if (!validTriggers.test(message.content.trim())) return;

    try {
      const referenced = await message.fetchReference();
      const giverId = message.author.id;
      const receiverId = referenced.author.id;

      if (giverId === receiverId) {
        return message.reply({ content: ":x: | Kendinize rep veremezsiniz!" }).then(msg => {
          setTimeout(() => {
            msg.delete().catch(() => {});
          }, 3000);
        })
      }

      const now = new Date();
      // Veren kullanıcıyı al veya oluştur
      let giver = await ReputationUser.findOne({ userId: giverId, guildId: message.guild.id });
      if (!giver) {
        giver = new ReputationUser({ userId: giverId, guildId: message.guild.id });
      } else if (giver.lastRepGivenAt && now - giver.lastRepGivenAt < 1000 * 60 * 60) {
        return message.reply({ content: ":x: | Bir saatte sadece bir kere rep verebilirsiniz!" }).then(msg => {
          setTimeout(() => {
            msg.delete().catch(() => {});
          }, 3000);
        })
      }

      // Alan kullanıcıyı al veya oluştur
      let receiver = await ReputationUser.findOne({ userId: receiverId, guildId: message.guild.id });
      if (!receiver) {
        receiver = new ReputationUser({ userId: receiverId, guildId: message.guild.id });
      }

      // Puan ekle ve kaydet
      receiver.points += 1;
      giver.lastRepGivenAt = now;
      await Promise.all([receiver.save(), giver.save()]);

      // Ödül rollerini kontrol et
      if (setting.rewards?.length) {
        const member = await message.guild.members.fetch(receiverId);
        for (const { points, roles } of setting.rewards) {
          if (receiver.points >= points) {
            for (const roleId of roles) {
              if (!member.roles.cache.has(roleId)) {
                await member.roles.add(roleId);
              }
            }
          } else {
            for (const roleId of roles) {
              if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
              }
            }
          }
        }
      }

      await message.react("⭐");
      await updateLeaderboard(message.guild, topChannel);
    } catch (error) { }

  }
};

async function updateLeaderboard(guild, channelId) {
  const repUsers = await ReputationUser.find({ guildId: guild.id })
    .sort({ points: -1 })
    .limit(10);

  const embed = new EmbedBuilder()
    .setTitle("🏆 Sunucu Rep Sıralaması")
    .setColor("Gold")
    .setDescription(
      repUsers.map((u, i) => `**${i + 1}.** <@${u.userId}> - \`${u.points}\` rep`).join("\n")
    )
    .setTimestamp();

  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;
  const messages = await channel.messages.fetch({ limit: 10 });
  const botMessage = messages.find(m => m.author.id === guild.client.user.id && m.embeds.length > 0);

  if (botMessage) await botMessage.edit({ embeds: [embed] });
  else await channel.send({ embeds: [embed] });
}