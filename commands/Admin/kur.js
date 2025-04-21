const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const VoiceSettings = require('../../models/VoiceSettings');
const StatsSettings = require('../../models/StatsSettings');

module.exports = {
  category: "Admin",
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('kurulum')
    .setDescription('Sunucunuzdaki sistemleri ayarlarsınız.'),

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
          .setValue('s_stats')
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

        const sDurum     = cfg.sistemDurumu     ? '✅' : '❌';
        const btnDurum   = cfg.sistemDurumu     ? ButtonStyle.Success : ButtonStyle.Danger;
        const catCh      = cfg.categoryId       ? `<#${cfg.categoryId}>`       : '❌';
        const joinCh     = cfg.joinChannelId    ? `<#${cfg.joinChannelId}>`    : '❌';

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
            { name: 'Sistem Durumu',      value: sDurum, inline: true },
            { name: 'Kategori Kanalı',    value: catCh, inline: true },
            { name: 'Join Kanalı',        value: joinCh, inline: true }
          )
          .setFooter({ text: `Bu menü 5 dakika sonra devre dışı olacaktır.` });

        return ayar.edit({ embeds: [sesEmbed], components: [sesRow] });
      }

      // ---- Stats Sistemi ----
      else if (i.values[0] === 's_stats') {
        let cfg = await StatsSettings.findOne({ guildId: interaction.guild.id });
        if (!cfg) cfg = await StatsSettings.create({ guildId: interaction.guild.id });

        const sDurum     = cfg.sistemDurumu        ? '✅' : '❌';
        const gRapor     = cfg.gunlukRaporDurumu   ? '✅' : '❌';
        const hRapor     = cfg.haftalıkRaporDurumu ? '✅' : '❌';
        const logCh      = cfg.logChannelId        ? `<#${cfg.logChannelId}>` : '❌';

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
            { name: 'Sistem Durumu',      value: sDurum, inline: true },
            { name: 'Günlük Rapor',       value: gRapor, inline: true },
            { name: 'Haftalık Rapor',     value: hRapor, inline: true },
            { name: 'Log Kanalı',         value: logCh, inline: true }
          )
          .setFooter({ text: `Bu menü 5 dakika sonra devre dışı olacaktır.` });

        return ayar.edit({ embeds: [statsEmbed], components: [statsRow] });
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
        else                                cfg.haftalıkRaporDurumu = !cfg.haftalıkRaporDurumu;
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
    });

    // Süre dolunca menüyü pasifleştir
    const expiredEmbed = new EmbedBuilder()
      .setColor('Red')
      .setDescription('`⚙️` | Ayar menüsü süresi doldu.')
      .setFooter({ text: `${interaction.user.username} tarafından başlatılmıştı.` });

    menuCollector.on('end', () => ayar.edit({ embeds: [expiredEmbed], components: [] }));
    buttonCollector.on('end', () => ayar.edit({ embeds: [expiredEmbed], components: [] }));
  },
};
