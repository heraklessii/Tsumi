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


const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const VoiceSettings = require('../../models/VoiceSettings');
const StatsSettings = require('../../models/StatsSettings');
const LogsSettings = require('../../models/LogsSettings');

module.exports = {
  category: "Admin",
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('kurulum')
    .setDescription('Sunucunuzdaki sistemleri ayarlarsınız.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  run: async (client, interaction) => {
    // --- 1️⃣ Ana Menü ---
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ayarlar')
      .setPlaceholder('Listeden bir sistem seçiniz.')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('🛡️ Özel Sesli Oda')
          .setDescription('Sistemi ayarlamak için tıklayın.')
          .setValue('s_ozelseslioda'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📊 Stats Sistemi')
          .setDescription('Sistemi ayarlamak için tıklayın.')
          .setValue('s_stats'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📊 Logs Sistemi')
          .setDescription('Sistemi ayarlamak için tıklayın.')
          .setValue('s_logs')
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const mainEmbed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle("`⚙️` SUNUCU AYARLARI")
      .setDescription(`
Ayarlamak istediğiniz sistemi aşağıdaki listeden seçin.
Her menüye girdikten sonra butonlarla konfigürasyon yapabilirsiniz.`)
      .setFooter({ text: `Bu menü 5 dakika sonra devre dışı olacaktır.` });

    // Ephemeral olarak bildir, gerçek menüyü kanala gönder
    await interaction.reply({
      content: '✅ | Ayar menüsü gönderildi.',
      ephemeral: true
    });
    const ayar = await interaction.channel.send({
      embeds: [mainEmbed],
      components: [row]
    });

    // Collector’lar
    const menuCollector = ayar.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000
    });
    const buttonCollector = ayar.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000
    });

    // --- 2️⃣ Menü Seçimi ---
    menuCollector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return;
      await i.deferUpdate();

      // ---- Özel Sesli Oda ----
      if (i.values[0] === 's_ozelseslioda') {
        let cfg = await VoiceSettings.findOne({ guildId: interaction.guild.id });
        if (!cfg) cfg = await VoiceSettings.create({ guildId: interaction.guild.id });

        const sDurum = cfg.sistemDurumu ? '✅' : '❌';
        const btnDurum = cfg.sistemDurumu ? ButtonStyle.Success : ButtonStyle.Danger;
        const catCh = cfg.categoryId ? `<#${cfg.categoryId}>` : '❌';
        const joinCh = cfg.joinChannelId ? `<#${cfg.joinChannelId}>` : '❌';

        const sesRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('vo_sistemdurumu')
            .setLabel('Sistemi Aç/Kapat')
            .setStyle(btnDurum),
          new ButtonBuilder()
            .setCustomId('vo_kategori')
            .setLabel('Kategori Kanalı')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('vo_join')
            .setLabel('Join Kanalı')
            .setStyle(ButtonStyle.Secondary)
        );

        const sesEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle('`🛡️` ÖZEL SESLİ ODA AYARLARI')
          .addFields(
            { name: 'Sistem Durumu', value: sDurum, inline: true },
            { name: 'Kategori Kanalı', value: catCh, inline: true },
            { name: 'Join Kanalı', value: joinCh, inline: true }
          )
          .setFooter({ text: `Bu menü 5 dakika sonra devre dışı olacaktır.` });

        return ayar.edit({ embeds: [sesEmbed], components: [sesRow] });
      }

      // ---- Stats Sistemi ----
      else if (i.values[0] === 's_stats') {
        let cfg = await StatsSettings.findOne({ guildId: interaction.guild.id });
        if (!cfg) cfg = await StatsSettings.create({ guildId: interaction.guild.id });

        const sDurum = cfg.sistemDurumu ? '✅' : '❌';
        const gRapor = cfg.gunlukRaporDurumu ? '✅' : '❌';
        const hRapor = cfg.haftalıkRaporDurumu ? '✅' : '❌';
        const logCh = cfg.logChannelId ? `<#${cfg.logChannelId}>` : '❌';

        const statsRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('st_sistemdurumu')
            .setLabel('Sistemi Aç/Kapat')
            .setStyle(sDurum === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('st_gunlukrapor')
            .setLabel('Günlük Rapor')
            .setStyle(gRapor === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('st_haftalikrapor')
            .setLabel('Haftalık Rapor')
            .setStyle(hRapor === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('st_logkanali')
            .setLabel('Log Kanalı Ayarla')
            .setStyle(ButtonStyle.Secondary)
        );

        const statsEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle('`📊` STATS SİSTEMİ AYARLARI')
          .addFields(
            { name: 'Sistem Durumu', value: sDurum, inline: true },
            { name: 'Günlük Rapor', value: gRapor, inline: true },
            { name: 'Haftalık Rapor', value: hRapor, inline: true },
            { name: 'Log Kanalı', value: logCh, inline: true }
          )
          .setFooter({ text: `Bu menü 5 dakika sonra devre dışı olacaktır.` });

        return ayar.edit({ embeds: [statsEmbed], components: [statsRow] });
      }

      else if (i.values[0] === 's_logs') {
        // DB’den ayarları çek / yoksa yarat
        let cfg = await LogsSettings.findOne({ guildId: interaction.guild.id });
        if (!cfg) cfg = await LogsSettings.create({ guildId: interaction.guild.id });

        // Genel durum
        const sDurum = cfg.sistemDurumu ? '✅' : '❌';
        const btnDurum = cfg.sistemDurumu ? ButtonStyle.Success : ButtonStyle.Danger;

        // 3 Butonlu Row
        const logsRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('lg_sistemdurumu')
            .setLabel('Sistemi Aç/Kapat')
            .setStyle(btnDurum),
          new ButtonBuilder()
            .setCustomId('lg_sistemler')
            .setLabel('Sistemler')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('lg_kanallar')
            .setLabel('Kanallar')
            .setStyle(ButtonStyle.Secondary)
        );

        const logsEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle('`📊` LOGS SİSTEMİ AYARLARI')
          .addFields(
            { name: 'Sistem Durumu', value: sDurum, inline: true }
          )
          .setFooter({ text: `Bu menü 5 dakika sonra devre dışı olacaktır.` });

        return ayar.edit({ embeds: [logsEmbed], components: [logsRow] });
      }

    });

    // --- 3️⃣ Buton İşleyicileri ---
    buttonCollector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return;
      await i.deferReply({ ephemeral: true });

      // — Özel Sesli Oda —
      if (i.customId === 'vo_sistemdurumu') {
        const cfg = await VoiceSettings.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { $set: { sistemDurumu: !(await VoiceSettings.findOne({ guildId: interaction.guild.id })).sistemDurumu } },
          { upsert: true, new: true }
        );
        return i.editReply({
          content: `\`⚙️\` | Özel Sesli Oda Sistemi ${cfg.sistemDurumu ? 'aktif' : 'pasif'}.`,
          ephemeral: true
        });
      }
      if (['vo_kategori', 'vo_join'].includes(i.customId)) {
        await i.followUp({ content: 'Ayarlamak istediğiniz kanalı 30 saniye içinde etiketleyin veya ID girin.', ephemeral: true });
        const filter = m => m.author.id === interaction.user.id;
        try {
          const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          const input = collected.first().content.trim();
          const mention = input.match(/^<#(\d+)>$/);
          const channelId = mention ? mention[1] : /^\d+$/.test(input) ? input : null;
          if (!channelId) throw new Error();
          const chan = await client.channels.fetch(channelId);
          const update = i.customId === 'vo_kategori'
            ? { categoryId: channelId }
            : { joinChannelId: channelId };
          await VoiceSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { $set: update },
            { upsert: true }
          );
          return i.followUp({ content: `✅ | Kanal başarıyla ayarlandı: <#${channelId}>`, ephemeral: true });
        } catch {
          return i.followUp({ content: '❌ | Geçerli bir kanal girilmedi veya süre doldu.', ephemeral: true });
        }
      }

      // — Stats Sistemi —
      if (i.customId === 'st_sistemdurumu') {
        const cfg = await StatsSettings.findOne({ guildId: interaction.guild.id })
          || await StatsSettings.create({ guildId: interaction.guild.id });
        cfg.sistemDurumu = !cfg.sistemDurumu;
        await cfg.save();
        return i.editReply({ content: `\`⚙️\` | Stats Sistemi ${cfg.sistemDurumu ? 'aktif' : 'pasif'}.`, ephemeral: true });
      }
      if (i.customId === 'st_gunlukrapor' || i.customId === 'st_haftalikrapor') {
        const cfg = await StatsSettings.findOne({ guildId: interaction.guild.id })
          || await StatsSettings.create({ guildId: interaction.guild.id });
        if (i.customId === 'st_gunlukrapor') cfg.gunlukRaporDurumu = !cfg.gunlukRaporDurumu;
        else cfg.haftalıkRaporDurumu = !cfg.haftalıkRaporDurumu;
        await cfg.save();
        const which = i.customId === 'st_gunlukrapor' ? 'Günlük Rapor' : 'Haftalık Rapor';
        const state = i.customId === 'st_gunlukrapor' ? cfg.gunlukRaporDurumu : cfg.haftalıkRaporDurumu;
        return i.editReply({ content: `\`📅\` | ${which} ${state ? 'aktif' : 'pasif'}.`, ephemeral: true });
      }
      if (i.customId === 'st_logkanali') {
        await i.followUp({ content: 'Log kanalını 30 saniye içinde etiketleyin veya ID girin.', ephemeral: true });
        const filter = m => m.author.id === interaction.user.id;
        try {
          const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          const input = collected.first().content.trim();
          const mention = input.match(/^<#(\d+)>$/);
          const channelId = mention ? mention[1] : /^\d+$/.test(input) ? input : null;
          if (!channelId) throw new Error();
          await StatsSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { $set: { logChannelId: channelId } },
            { upsert: true }
          );
          return i.followUp({ content: `✅ | Log kanalı ayarlandı: <#${channelId}>`, ephemeral: true });
        } catch {
          return i.followUp({ content: '❌ | Geçerli bir kanal girilmedi veya süre doldu.', ephemeral: true });
        }
      }

      // — Logs Sistemi -
      if (i.customId === 'lg_sistemdurumu') {
        const cfg = await LogsSettings.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { $set: { sistemDurumu: !(await LogsSettings.findOne({ guildId: interaction.guild.id })).sistemDurumu } },
          { upsert: true, new: true }
        );
        return i.editReply({
          content: `\`⚙️\` | Logs Sistemi ${cfg.sistemDurumu ? 'aktif' : 'pasif'}.`,
          ephemeral: true
        });
      }
      if (i.customId === 'lg_sistemler') {
        let cfg = await LogsSettings.findOne({ guildId: interaction.guild.id });
        const states = {
          kanalDurumu: cfg.kanalDurumu ? '✅' : '❌',
          emojiDurumu: cfg.emojiDurumu ? '✅' : '❌',
          banDurumu: cfg.banDurumu ? '✅' : '❌',
          girmeCikmaDurumu: cfg.girmeCikmaDurumu ? '✅' : '❌',
          mesajDurumu: cfg.mesajDurumu ? '✅' : '❌',
          sesDurumu: cfg.sesDurumu ? '✅' : '❌',
          rolDurumu: cfg.rolDurumu ? '✅' : '❌',
          memberDurumu: cfg.memberDurumu ? '✅' : '❌'
        };

        // 2 satırda 3 buton her satır
        const sysRow1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('lg_kanalDurumu').setLabel(`Kanal: ${states.kanalDurumu}`).setStyle(states.kanalDurumu === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('lg_rolDurumu').setLabel(`Kanal: ${states.rolDurumu}`).setStyle(states.rolDurumu === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('lg_emojiDurumu').setLabel(`Emoji: ${states.emojiDurumu}`).setStyle(states.emojiDurumu === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('lg_banDurumu').setLabel(`Ban: ${states.banDurumu}`).setStyle(states.banDurumu === '✅' ? ButtonStyle.Success : ButtonStyle.Danger)
        );
        const sysRow2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('lg_girmeCikmaDurumu').setLabel(`Giriş/Çıkış: ${states.girmeCikmaDurumu}`).setStyle(states.girmeCikmaDurumu === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('lg_mesajDurumu').setLabel(`Mesaj: ${states.mesajDurumu}`).setStyle(states.mesajDurumu === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('lg_sesDurumu').setLabel(`Ses: ${states.sesDurumu}`).setStyle(states.sesDurumu === '✅' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('lg_memberDurumu').setLabel(`Üye: ${states.memberDurumu}`).setStyle(states.memberDurumu === '✅' ? ButtonStyle.Success : ButtonStyle.Danger)
        );

        const sysEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle('`🔧` LOGS — Sistemler')
          .setDescription('Her bir log türünü açıp kapatabilirsiniz.')
          .setFooter({ text: `Bu menü 5 dakika sonra devre dışı olacaktır.` });

        await ayar.edit({ embeds: [sysEmbed], components: [sysRow1, sysRow2] });
        return i.editReply({ content: 'Sistemler menüsü açıldı.', ephemeral: true });
      }
      if (/^lg_(kanalDurumu|emojiDurumu|banDurumu|girmeCikmaDurumu|mesajDurumu|sesDurumu|rolDurumu|memberDurumu)$/.test(i.customId)) {
        const field = i.customId.replace('lg_', '');
        const cfg = await LogsSettings.findOne({ guildId: interaction.guild.id });
        cfg[field] = !cfg[field];
        await cfg.save();
        return i.editReply({ content: `\`${field}\` artık **${cfg[field] ? 'aktif' : 'pasif'}**.`, ephemeral: true });
      }
      if (i.customId === 'lg_kanallar') {
        let cfg = await LogsSettings.findOne({ guildId: interaction.guild.id });
        const chanStates = {
          kanalLogChannelId: cfg.kanalLogChannelId ? `${cfg.kanalLogChannelId}` : '❌',
          emojiLogChannelId: cfg.emojiLogChannelId ? `${cfg.emojiLogChannelId}` : '❌',
          banLogChannelId: cfg.banLogChannelId ? `${cfg.banLogChannelId}` : '❌',
          girmeCikmaLogChannelId: cfg.girmeCikmaLogChannelId ? `${cfg.girmeCikmaLogChannelId}` : '❌',
          mesajLogChannelId: cfg.mesajLogChannelId ? `${cfg.mesajLogChannelId}` : '❌',
          sesLogChannelId: cfg.sesLogChannelId ? `${cfg.sesLogChannelId}` : '❌',
          rolLogChannelId: cfg.rolLogChannelId ? `${cfg.rolLogChannelId}` : '❌',
          memberLogChannelId: cfg.memberLogChannelId ? `${cfg.memberLogChannelId}` : '❌'
        };

        // 2 satır, 3 buton her satır
        const chRow1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('lg_kanalLogChannelId').setLabel(`Kanal: ${chanStates.kanalLogChannelId}`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('lg_rolLogChannelId').setLabel(`Rol: ${chanStates.rolLogChannelId}`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('lg_emojiLogChannelId').setLabel(`Emoji: ${chanStates.emojiLogChannelId}`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('lg_banLogChannelId').setLabel(`Ban: ${chanStates.banLogChannelId}`).setStyle(ButtonStyle.Secondary)
        );
        const chRow2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('lg_girmeCikmaLogChannelId').setLabel(`Giriş/Çıkış: ${chanStates.girmeCikmaLogChannelId}`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('lg_mesajLogChannelId').setLabel(`Mesaj: ${chanStates.mesajLogChannelId}`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('lg_sesLogChannelId').setLabel(`Ses: ${chanStates.sesLogChannelId}`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('lg_memberLogChannelId').setLabel(`Üye: ${chanStates.memberLogChannelId}`).setStyle(ButtonStyle.Secondary)
        );

        const chEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle('`🔗` LOGS — Kanallar')
          .setDescription('Atılacak kanalları ayarlamak için butona tıklayın.')
          .setFooter({ text: `Bu menü 5 dakika sonra devre dışı olacaktır.` });

        await ayar.edit({ embeds: [chEmbed], components: [chRow1, chRow2] });
        return i.editReply({ content: 'Kanallar menüsü açıldı.', ephemeral: true });
      }
      if (/^lg_.+LogChannelId$/.test(i.customId)) {
        await i.followUp({ content: 'Lütfen kanalı 30 saniye içinde etiketleyin veya ID girin.', ephemeral: true });
        const filter = m => m.author.id === interaction.user.id;
        try {
          const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          const input = collected.first().content.trim();
          const mention = input.match(/^<#(\d+)>$/);
          const channelId = mention ? mention[1] : /^\d+$/.test(input) ? input : null;
          if (!channelId) throw new Error();
          // customId: "lg_kanalLogChannelId" → fieldName: "kanalLogChannelId"
          const fieldName = i.customId.replace(/^lg_/, '');
          await LogsSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { $set: { [fieldName]: channelId } },
            { upsert: true }
          );
          return i.followUp({ content: `✅ | Ayarlandı: <#${channelId}>`, ephemeral: true });
        } catch {
          return i.followUp({ content: '❌ | Geçerli bir kanal girilmedi veya süre doldu.', ephemeral: true });
        }
      }

    });

    // Süre dolunca menüyü pasifleştir
    const expiredEmbed = new EmbedBuilder()
      .setColor(client.red)
      .setDescription('`⚙️` | Ayar menüsü süresi doldu.')
      .setFooter({ text: `${interaction.user.username} tarafından başlatılmıştı.` });

    menuCollector.on('end', () => ayar.edit({ embeds: [expiredEmbed], components: [] }));
    buttonCollector.on('end', () => ayar.edit({ embeds: [expiredEmbed], components: [] }));
  },
};
