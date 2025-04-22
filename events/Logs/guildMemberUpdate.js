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
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    try {
      // ——— Sadece partial ise fetch et ———
      if (oldMember.partial) oldMember = await oldMember.fetch();
      if (newMember.partial) newMember = await newMember.fetch();
      if (!oldMember.guild) return;

      // ——— Ayarlar ve kanal kontrolü ———
      const logData = await LogsSettings.findOne({ guildId: oldMember.guild.id });
      if (!logData?.sistemDurumu || !logData?.memberDurumu || !logData?.memberLogChannelId) return;
      const logChannel = oldMember.guild.channels.cache.get(logData.memberLogChannelId);
      if (!logChannel?.isTextBased()) return;

      // ——— Eski ve yeni roller snapshot’ları ———
      const everyoneRoleId = oldMember.guild.id;
      const oldRoleIds = oldMember.roles.cache
        .filter(r => r.id !== everyoneRoleId)
        .map(r => r.id);
      const newRoleIds = newMember.roles.cache
        .filter(r => r.id !== everyoneRoleId)
        .map(r => r.id);

      // ——— Nickname değişikliği kontrolü ———
      const oldNick = oldMember.nickname || oldMember.user.username;
      const newNick = newMember.nickname || newMember.user.username;
      const nickChanged = oldNick !== newNick;

      // ——— Rol değişiklikleri ———
      const addedRoleIds = newRoleIds.filter(id => !oldRoleIds.includes(id));
      const removedRoleIds = oldRoleIds.filter(id => !newRoleIds.includes(id));
      const rolesChanged = addedRoleIds.length > 0 || removedRoleIds.length > 0;

      // ——— Eğer ne nick ne rol değiştiyse çık ———
      if (!nickChanged && !rolesChanged) return;

      // ——— Değişiklikleri hazırla ———
      const changes = [];
      if (nickChanged && !rolesChanged) {
        changes.push({ name: "Takma Ad Değişikliği", old: oldNick, new: newNick });
      } else if (rolesChanged) {
        if (addedRoleIds.length) {
          const added = addedRoleIds.map(id => newMember.guild.roles.cache.get(id)).join(", ");
          changes.push({ name: "Rol Eklendi", new: added });
        }
        if (removedRoleIds.length) {
          const removed = removedRoleIds.map(id => oldMember.guild.roles.cache.get(id)).join(", ");
          changes.push({ name: "Rol Alındı", old: removed });
        }
        if (nickChanged) {
          changes.push({ name: "Takma Ad Değişikliği", old: oldNick, new: newNick });
        }
      }

      // ——— Executor bilgisi (audit log) ———
      let executorInfo = "Bilinmiyor.";
      const now = Date.now();
      if (nickChanged) {
        const logs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 24 }).catch(() => null);
        const entry = logs?.entries.first();
        if (entry && entry.target.id === newMember.id && now - entry.createdTimestamp < 5000) {
          executorInfo = `<@${entry.executor.id}>`;
        }
      }
      if (rolesChanged && executorInfo === "Bilinmiyor.") {
        const logs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 25 }).catch(() => null);
        const entry = logs?.entries.first();
        if (entry && entry.target.id === newMember.id && now - entry.createdTimestamp < 5000) {
          executorInfo = `<@${entry.executor.id}>`;
        }
      }

      // ——— Embed oluşturup gönder ———
      const embed = new EmbedBuilder()
        .setTitle("⚙️ ÜYE GÜNCELLENDİ")
        .setColor(client.blue)
        .setFooter({ text: "Tsumi, HERA tarafından geliştirilmektedir." })
        .setTimestamp()
        .setDescription([
          `\`📋\`  Üye:  **${newMember}**`,
          `\`🆔\`  ID:  **${newMember.user.id}**`,
          `\`✍️\`  Sorumlu Kişi: ${executorInfo}`,
          ...changes.flatMap(c => {
            const lines = [`\n**${c.name}:**`];
            if (c.old) lines.push(`Eski: **${c.old}**`);
            if (c.new) lines.push(`Yeni: **${c.new}**`);
            return lines;
          })
        ].join("\n"));

      await logChannel.send({ embeds: [embed] });
    } catch (error) {}
    
  },
};
