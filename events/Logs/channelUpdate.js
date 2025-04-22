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

const { Events, EmbedBuilder, AuditLogEvent, ChannelType } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
  name: Events.ChannelUpdate,
  async execute(oldChannel, newChannel) {

    if (!oldChannel.guild) return;

    const logData = await LogsSettings.findOne({ guildId: oldChannel.guild.id });
    if (!logData || !logData.sistemDurumu || !logData.kanalDurumu || !logData.kanalLogChannelId) return;
    const logChannel = oldChannel.guild.channels.cache.get(logData.kanalLogChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;

    // Audit log’dan işlemi yapanı al
    const audit = await oldChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 1 });
    const executor = audit.entries.first()?.executor;
    const timestamp = Math.floor(Date.now() / 1000);

    const sendEmbed = async (title, desc) => {
      const embed = new EmbedBuilder()
        .setColor(client.blue)
        .setTitle(title)
        .setDescription(desc)
        .setFooter({ text: `Tsumi, HERA tarafından geliştirilmektedir.` });
      await logChannel.send({ embeds: [embed] });
    };

    // 1) Kanal Adı Değişikliği
    if (oldChannel.name !== newChannel.name) {
      await sendEmbed(
        `⚙️ KANAL ADI GÜNCELLENDİ`,
        `
\`📋\` Eski Ad: **${oldChannel.name}**
\`📋\` Yeni Ad: **${newChannel.name}**
\`#️⃣\` Etiket: ${newChannel}

\`✍️\` İşlem Yetkilisi: ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\` İşlem Zamanı: <t:${timestamp}:R>
        `
      );
    }

    // 2) NSFW Durumu Değişikliği
    if (oldChannel.nsfw !== newChannel.nsfw) {
      await sendEmbed(
        `⚙️ NSFW AYARI GÜNCELLENDİ`,
        `
\`📋\` Kanal: **${newChannel.name}** (ID: ${newChannel.id})
\`#️⃣\` Etiket: ${newChannel}

\`🔞\` NSFW Durumu: ${newChannel.nsfw ? "✅" : "❌"}
\`✍️\` İşlem Yetkilisi: ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\` İşlem Zamanı: <t:${timestamp}:R>
        `
      );
    }

    // 3) Kategori Değişikliği
    if (oldChannel.parentId !== newChannel.parentId) {
      await sendEmbed(
        `⚙️ KANAL KATEGORİSİ GÜNCELLENDİ`,
        `
\`📋\` Eski Kategori: **${oldChannel.parent?.name || "Yok ❌"}**
\`📋\` Yeni Kategori: **${newChannel.parent?.name || "Yok ❌"}**
\`#️⃣\` Kanal: ${newChannel}

\`✍️\` İşlem Yetkilisi: ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\` İşlem Zamanı: <t:${timestamp}:R>
        `
      );
    }

    // 4) Konu (Topic) Değişikliği
    if (oldChannel.topic !== newChannel.topic) {
      if (!oldChannel.topic && !newChannel.topic) return;
      await sendEmbed(
        `⚙️ KANAL AÇIKLAMASI GÜNCELLENDİ`,
        `
\`📋\` Eski Açıklama: ${oldChannel.topic || "Yok ❌"}
\`📋\` Yeni Açıklama: ${newChannel.topic || "Yok ❌"}
\`#️⃣\` Kanal: ${newChannel}

\`✍️\` İşlem Yetkilisi: ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\` İşlem Zamanı: <t:${timestamp}:R>
        `
      );
    }

    // 5) Yavaş Mod (Slowmode) Değişikliği
    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      await sendEmbed(
        `⚙️ YAVAŞ MOD GÜNCELLENDİ`,
        `
\`📋\` Eski Yavaş Mod: **${oldChannel.rateLimitPerUser || 0} saniye**
\`📋\` Yeni Yavaş Mod: **${newChannel.rateLimitPerUser || 0} saniye**
\`#️⃣\` Kanal: ${newChannel}

\`✍️\` İşlem Yetkilisi: ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\` İşlem Zamanı: <t:${timestamp}:R>
        `
      );
    }

    // 6) Kanal Türü Değişikliği
    if (oldChannel.type !== newChannel.type) {
      const oldTypeName = ChannelType[oldChannel.type];
      const newTypeName = ChannelType[newChannel.type];
      await sendEmbed(
        `⚙️ KANAL TÜRÜ GÜNCELLENDİ`,
        `
\`📋\` Eski Tür: **${oldTypeName}**
\`📋\` Yeni Tür: **${newTypeName}**
\`#️⃣\` Kanal: ${newChannel}

\`✍️\` İşlem Yetkilisi: ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\` İşlem Zamanı: <t:${timestamp}:R>
        `
      );
    }

    // 7) Kanal Rol İzinleri Güncellemesi
    const oldPerms = oldChannel.permissionOverwrites.cache;
    const newPerms = newChannel.permissionOverwrites.cache;
    const changes = [];

    // Yeni veya güncellenen overwrite’lar
    for (const [id, newOverwrite] of newPerms) {
      const oldOverwrite = oldPerms.get(id);
      if (!oldOverwrite) {
        changes.push({
          type: "Ekleme",
          target: newOverwrite.type === 0 ? `<@&${newOverwrite.id}>` : `<@${newOverwrite.id}>`,
          allow: newOverwrite.allow.toArray().join(", ") || "Yok",
          deny: newOverwrite.deny.toArray().join(", ") || "Yok",
        });
      } else {
        const oldAllow = oldOverwrite.allow.toArray();
        const newAllow = newOverwrite.allow.toArray();
        const oldDeny = oldOverwrite.deny.toArray();
        const newDeny = newOverwrite.deny.toArray();

        if (
          oldAllow.toString() !== newAllow.toString() ||
          oldDeny.toString() !== newDeny.toString()
        ) {
          changes.push({
            type: "Güncelleme",
            target: newOverwrite.type === 0 ? `<@&${newOverwrite.id}>` : `<@${newOverwrite.id}>`,
            oldAllow: oldAllow.join(", ") || "Yok",
            oldDeny: oldDeny.join(", ") || "Yok",
            newAllow: newAllow.join(", ") || "Yok",
            newDeny: newDeny.join(", ") || "Yok",
          });
        }
      }
    }

    // Kaldırılan overwrite’lar
    for (const [id, oldOverwrite] of oldPerms) {
      if (!newPerms.has(id)) {
        changes.push({
          type: "Kaldırma",
          target: oldOverwrite.type === 0 ? `<@&${oldOverwrite.id}>` : `<@${oldOverwrite.id}>`,
          allow: oldOverwrite.allow.toArray().join(", ") || "Yok",
          deny: oldOverwrite.deny.toArray().join(", ") || "Yok",
        });
      }
    }

    if (changes.length > 0) {
      for (const change of changes) {
        const descLines = change.type === "Güncelleme" ? [
          `**Hedef:** ${change.target}`,
          `**Eski İzinler:**`,
          `✅: ${change.oldAllow}`,
          `❌: ${change.oldDeny}`,
          `**Yeni İzinler:**`,
          `✅: ${change.newAllow}`,
          `❌: ${change.newDeny}`
        ] : [
          `**Hedef:** ${change.target}`,
          `✅: ${change.allow}`,
          `❌: ${change.deny}`
        ];

        await sendEmbed(
          `⚙️ KANAL İZİNLERİ ${change.type.toUpperCase()}`,
          `
${descLines.join("\n")}
\`#️⃣\` Kanal: ${newChannel}

\`✍️\` İşlem Yetkilisi: ${executor ? `<@${executor.id}>` : "❔"}
\`🗓️\` İşlem Zamanı: <t:${timestamp}:R>
          `
        );
      }
    }
    
  },
};
