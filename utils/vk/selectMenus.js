const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } = require('discord.js');
  
  /**
   * Seçilen oyuncu için yönetim alt paneli oluşturur.
   * @param {Object} game - Mongoose dokümanı
   * @param {string} selectedId
   * @param {string} guildId
   */
  function createPlayerPanel(game, selectedId, guildId) {
    const playerRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`vk_kill_${guildId}_${selectedId}`)
        .setLabel('Öldür')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`vk_revive_${guildId}_${selectedId}`)
        .setLabel('Dirilt')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`vk_viewRole_${guildId}_${selectedId}`)
        .setLabel('Rolünü Gör')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`vk_changeRole_${guildId}_${selectedId}`)
        .setLabel('Rolünü Değiştir')
        .setStyle(ButtonStyle.Primary)
    );
  
    const playerRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`vk_muteVoice_${guildId}_${selectedId}`)
        .setLabel('Seste Sustur')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`vk_disableText_${guildId}_${selectedId}`)
        .setLabel('Metni Kapat')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`vk_unmuteVoice_${guildId}_${selectedId}`)
        .setLabel('Susturmayı Aç')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`vk_enableText_${guildId}_${selectedId}`)
        .setLabel('Yazmayı Aç')
        .setStyle(ButtonStyle.Success)
    );
  
    const playerRow3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`vk_voteResult_${guildId}_${selectedId}`)
        .setLabel('Oylama İle Seçildi')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`vk_back_${guildId}`)
        .setLabel('Geri Dön')
        .setStyle(ButtonStyle.Secondary)
    );
  
    return [playerRow1, playerRow2, playerRow3];
  }
  
  module.exports = { createPlayerPanel };
  