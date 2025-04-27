const {
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ButtonStyle
} = require('discord.js');

/**
 * Yönetici paneli için ActionRow'lar oluşturur.
 * @param {Object} game - Mongoose dokümanı
 */
function createAdminPanel(game) {
  const controlRow1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`vk_day_${game.guildId}`)
      .setLabel('Gündüz')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`vk_talkline_${game.guildId}`)
      .setLabel('Konuşma Çizgisi')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`vk_endGame_${game.guildId}`)
      .setLabel('Oyunu Bitir')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`vk_night_${game.guildId}`)
      .setLabel('Gece')
      .setStyle(ButtonStyle.Primary),
  );

  const controlRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`vk_disableText_${game.guildId}`)
      .setLabel('Metni Kapat')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`vk_enableText_${game.guildId}`)
      .setLabel('Metni Aç')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`vk_unmuteVoiceAll_${game.guildId}`)
      .setLabel('Ses Aç')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`vk_muteVoiceAll_${game.guildId}`)
      .setLabel('Ses Sustur')
      .setStyle(ButtonStyle.Danger),
  );

  const options = game.players.map(p => ({
    label: p.originalNick || 'Oyuncu',
    value: p.userId,
    description: p.status === 'dead' ? 'Ölü' : 'Canlı'
  }));
  
  const playerSelect = new StringSelectMenuBuilder()
    .setCustomId(`vk_select_player_${game.guildId}`)
    .setPlaceholder('Bir oyuncu seçin')
    .addOptions(options);
  const selectRow = new ActionRowBuilder().addComponents(playerSelect);

  return [controlRow1, controlRow2, selectRow];
}

module.exports = { createAdminPanel };
