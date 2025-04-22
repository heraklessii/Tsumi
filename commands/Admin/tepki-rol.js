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
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tepki-rol')
    .setDescription('Reaction Role sistemi yönetimi')
    .addSubcommand(sub => sub
      .setName('ekle')
      .setDescription('Yeni mesaj için tepki‑rol sistemi ekle')
      .addChannelOption(opt => opt
        .setName('kanal')
        .setDescription('Mesajın bulunduğu kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
      .addStringOption(opt => opt
        .setName('mesajid')
        .setDescription('Mesaj ID\'si')
        .setRequired(true)))
    .addSubcommand(sub => sub
      .setName('sil')
      .setDescription('Bir mesajın tepki‑rol sistemini sil')
      .addStringOption(opt => opt
        .setName('mesajid')
        .setDescription('Mesaj ID\'si')
        .setRequired(true)))
    .addSubcommand(sub => sub
      .setName('listele')
      .setDescription('Tüm tepki‑rol sistemlerini menü ile listeler'))
    .addSubcommand(sub => sub
      .setName('emoji-ekle')
      .setDescription('Mesaja emoji‑rol eşlemesi ekle')
      .addStringOption(opt => opt
        .setName('mesajid')
        .setDescription('Mesaj ID\'si')
        .setRequired(true))
      .addStringOption(opt => opt
        .setName('emoji')
        .setDescription('Emoji (ör: 😄 veya `<:isim:id>`)')
        .setRequired(true))
      .addRoleOption(opt => opt
        .setName('rol')
        .setDescription('Verilecek rol')
        .setRequired(true)))
    .addSubcommand(sub => sub
      .setName('emoji-sil')
      .setDescription('Emoji‑rol eşlemesini sil')
      .addStringOption(opt => opt
        .setName('mesajid')
        .setDescription('Mesaj ID\'si')
        .setRequired(true))
      .addStringOption(opt => opt
        .setName('emoji')
        .setDescription('Emoji')
        .setRequired(true)))
    .addSubcommand(sub => sub
      .setName('ayarla')
      .setDescription('Mod, limit, beyaz/karaliste ayarları')
      .addStringOption(opt => opt
        .setName('mesajid')
        .setDescription('Mesaj ID\'si')
        .setRequired(true))
      .addStringOption(opt => opt
        .setName('mod')
        .setDescription('Mod seç')
        .setRequired(true)
        .addChoices(
          { name: 'Normal', value: 'normal' },
          { name: 'Tekil Seçim', value: 'unique' },
          { name: 'Doğrulama', value: 'verify' },
          { name: 'Bırakmalı', value: 'drop' },
          { name: 'Ters Tepki', value: 'reversed' },
          { name: 'Sınırlı Seçim', value: 'limit' },
          { name: 'Sabit Seçim', value: 'binding' }
        ))
      .addIntegerOption(opt => opt
        .setName('limit')
        .setDescription('Sınırlı Seçim için maksimum rol sayısı'))
      .addStringOption(opt => opt
        .setName('beyazliste')
        .setDescription('Beyaz liste roller (@rol veya ID, virgülle ayrılmış)'))
      .addStringOption(opt => opt
        .setName('karaliste')
        .setDescription('Kara liste roller (@rol veya ID, virgülle ayrılmış)')))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  run: async (client, interaction) => {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    // DB’den çeker veya yeni yaratır (sub=ekle değilse varolanı kullanmaya devam eder)
    let guildConfig = await ReactionRole.findOne({ guildId });
    if (!guildConfig && sub !== 'ekle') {
      return interaction.reply({
        content: 'Henüz hiçbir tepki‑rol sistemi kurulmamış.',
        ephemeral: true
      });
    }

    // Yardımcı: virgülle/boşlukla ayrılan rol ID listelerini parse eder
    const parseList = str => str
      .split(/[\s,]+/)
      .map(x => x.replace(/[<@&>]/g, ''))
      .filter(x => x);

    try {
      switch (sub) {
        // —————— EKLE ——————
        case 'ekle': {
          const channel = interaction.options.getChannel('kanal');
          const messageId = interaction.options.getString('mesajid');

          if (!guildConfig) {
            guildConfig = await ReactionRole.create({ guildId, messages: [] });
          }
          if (guildConfig.messages.some(m => m.messageId === messageId)) {
            return interaction.reply({ content: 'Bu mesaj zaten kayıtlı.', ephemeral: true });
          }

          guildConfig.messages.push({
            messageId,
            channelId: channel.id,
            mode: 'normal',
            maxRoles: null,
            roles: [],
            whitelistRoles: [],
            blacklistRoles: []
          });
          await guildConfig.save();

          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(client.color)
              .setTitle('Tepki‑Rol Sistemi Oluşturuldu')
              .setDescription(`• Kanal: ${channel}\n• Mesaj ID: \`${messageId}\`\n• Mod: \`normal\``)
              .setFooter({ text: 'Tsumi, HERA tarafından geliştirilmektedir.' })
            ],
            ephemeral: true
          });
        }

        // —————— SİL ——————
        case 'sil': {
          const messageId = interaction.options.getString('mesajid');
          const before = guildConfig.messages.length;
          guildConfig.messages = guildConfig.messages.filter(m => m.messageId !== messageId);

          if (guildConfig.messages.length === before) {
            return interaction.reply({ content: 'Kayıtlı bir mesaj bulunamadı.', ephemeral: true });
          }
          await guildConfig.save();

          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(client.color)
              .setTitle('Tepki‑Rol Sistemi Silindi')
              .setDescription(`Mesaj ID \`${messageId}\` için sistem kaldırıldı.`)
              .setFooter({ text: 'Tsumi, HERA tarafından geliştirilmektedir.' })
            ],
            ephemeral: true
          });
        }

        // —————— LİSTELE (embed + select menu) ——————
        case 'listele': {
          const list = guildConfig.messages;
          if (list.length === 0) {
            return interaction.reply({ content: 'Hiç tepki‑rol sistemi bulunmuyor.', ephemeral: true });
          }

          // Embed özet
          const summary = list
            .map(m => `• \`${m.messageId}\` (${m.mode})`)
            .join('\n');
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle('Aktif Tepki‑Rol Mesajları')
            .setDescription(summary)
            .setFooter({ text: 'Detay için menüden seçiniz.' });

          // Select menu seçenekleri (max 25)
          const options = list.slice(0, 25).map(m => ({
            label: m.messageId,
            description: `Mod: ${m.mode}`,
            value: m.messageId
          }));
          const row = new ActionRowBuilder()
            .addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('rr_list_select')
                .setPlaceholder('Detayını görmek için bir mesaj seç…')
                .addOptions(options)
            );

          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

          // Collector: kullanıcı seçtiğinde detay göster
          const filter = i => i.user.id === interaction.user.id && i.customId === 'rr_list_select';
          const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000, max: 1 });

          collector.on('collect', async i => {
            const selectedId = i.values[0];
            const cfg = guildConfig.messages.find(m => m.messageId === selectedId);

            const detailEmbed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle(`Detay: Mesaj ${selectedId}`)
              .addFields(
                { name: 'Kanal', value: `<#${cfg.channelId}>`, inline: true },
                { name: 'Mod', value: `\`${cfg.mode}\``, inline: true },
                { name: 'Maks Rol', value: cfg.maxRoles?.toString() ?? '—', inline: true },
                {
                  name: 'Roller', value:
                    cfg.roles.length
                      ? cfg.roles.map(r => `${r.emoji} → <@&${r.roleId}>`).join('\n')
                      : '—'
                },
                {
                  name: 'Beyaz Liste', value:
                    cfg.whitelistRoles.length
                      ? cfg.whitelistRoles.map(r => `<@&${r}>`).join(', ')
                      : '—'
                },
                {
                  name: 'Kara Liste', value:
                    cfg.blacklistRoles.length
                      ? cfg.blacklistRoles.map(r => `<@&${r}>`).join(', ')
                      : '—'
                }
              )
              .setFooter({ text: 'Tsumi, HERA tarafından geliştirilmektedir.' });

            await i.update({ embeds: [detailEmbed], components: [] });
          });

          return;
        }

        // —————— EMOJI EKLE ——————
        case 'emoji-ekle': {
          const messageId = interaction.options.getString('mesajid');
          const emoji = interaction.options.getString('emoji');
          const role = interaction.options.getRole('rol');
          const msgCfg = guildConfig.messages.find(m => m.messageId === messageId);

          if (!msgCfg) {
            return interaction.reply({ content: 'Bu mesaj için sistem yok.', ephemeral: true });
          }
          if (msgCfg.roles.some(r => r.emoji === emoji)) {
            return interaction.reply({ content: 'Bu emoji zaten ekli.', ephemeral: true });
          }

          msgCfg.roles.push({ emoji, roleId: role.id });
          await guildConfig.save();

          const chan = await interaction.guild.channels.fetch(msgCfg.channelId);
          const msg = await chan.messages.fetch(messageId);
          await msg.react(emoji).catch(() => null);

          return interaction.reply({
            content: `✅ ${emoji} → ${role} eşleştirildi.`,
            ephemeral: true
          });
        }

        // —————— EMOJI SİL ——————
        case 'emoji-sil': {
          const messageId = interaction.options.getString('mesajid');
          const emoji = interaction.options.getString('emoji');
          const msgCfg = guildConfig.messages.find(m => m.messageId === messageId);

          if (!msgCfg) {
            return interaction.reply({ content: 'Bu mesaj için sistem yok.', ephemeral: true });
          }
          const before = msgCfg.roles.length;
          msgCfg.roles = msgCfg.roles.filter(r => r.emoji !== emoji);

          if (msgCfg.roles.length === before) {
            return interaction.reply({ content: 'Eşleşme bulunamadı.', ephemeral: true });
          }
          await guildConfig.save();

          const chan = await interaction.guild.channels.fetch(msgCfg.channelId);
          const msg = await chan.messages.fetch(messageId);
          const reaction = msg.reactions.resolve(emoji);
          if (reaction) await reaction.remove().catch(() => null);

          return interaction.reply({
            content: `❌ ${emoji} eşleştirmesi silindi.`,
            ephemeral: true
          });
        }

        // —————— AYARLA ——————
        case 'ayarla': {
          const messageId = interaction.options.getString('mesajid');
          const mode = interaction.options.getString('mod');
          const limit = interaction.options.getInteger('limit');
          const wl = interaction.options.getString('beyazliste');
          const bl = interaction.options.getString('karaliste');
          const msgCfg = guildConfig.messages.find(m => m.messageId === messageId);

          if (!msgCfg) {
            return interaction.reply({ content: 'Bu mesaj için sistem yok.', ephemeral: true });
          }

          msgCfg.mode = mode;
          msgCfg.maxRoles = mode === 'limit' ? (limit ?? msgCfg.maxRoles) : null;
          if (wl) msgCfg.whitelistRoles = parseList(wl);
          if (bl) msgCfg.blacklistRoles = parseList(bl);
          await guildConfig.save();

          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(client.color)
              .setTitle('Sistem Güncellendi')
              .setDescription(`• MesajID: \`${messageId}\`\n• Mod: \`${mode}\`\n` +
                (mode === 'limit' ? `• Limit: ${msgCfg.maxRoles}\n` : '') +
                (wl ? `• Beyaz Liste: ${msgCfg.whitelistRoles.map(r => `<@&${r}>`).join(', ')}\n` : '') +
                (bl ? `• Kara Liste: ${msgCfg.blacklistRoles.map(r => `<@&${r}>`).join(', ')}\n` : '')
              )
              .setFooter({ text: 'Tsumi, HERA tarafından geliştirilmektedir.' })
            ],
            ephemeral: true
          });
        }

      }
    } catch (err) { }

  }
};
