const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require('discord.js');
const TruthOrDare = require('../../models/TruthOrDare');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dc')
    .setDescription('Doğruluk mu Cesaret mi oyunu başlatır')
    .addStringOption(opt =>
      opt
        .setName('kişiler')
        .setDescription('Virgülle ayrılmış @mention kullanıcılar (max 8)')
        .setRequired(true)
    ),

  async run(client, interaction) {
    
    const raw = interaction.options.getString('kişiler');
    const mentions = raw.split(',').map(m => m.trim()).filter(Boolean);
    if (mentions.length > 8) {
      return interaction.reply({ content: 'En fazla 8 kişi davet edebilirsin!', ephemeral: true });
    }

    const game = await TruthOrDare.create({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      hostId: interaction.user.id,
      participants: [],
      playedCounts: {},
      lastSelected: null,
      currentQuestioner: interaction.user.id,
      rounds: 0,
      maxRounds: 24,
      startedAt: Date.now()
    });
    const gameId = game._id.toString();

    const acceptButton = new ButtonBuilder()
      .setCustomId(`tod_accept_${gameId}`)
      .setLabel('Kabul ediyorum')
      .setStyle(ButtonStyle.Success);

    const waitingEmbed = (count = 0) =>
      new EmbedBuilder()
        .setTitle('Daveti Kabul Edenler Bekleniyor')
        .setDescription(`${count} kişi kabul etti. 30 saniye içinde kabul edin.`)
        .setColor('Yellow');

    const channelMessage = await interaction.reply({ embeds: [waitingEmbed()], fetchReply: true });
    const accepted = new Set();

    await Promise.all(
      mentions.map(async mention => {
        const userId = mention.replace(/[<@!>]/g, '');
        try {
          const user = await client.users.fetch(userId);
          const dmMsg = await user.send({
            embeds: [
              new EmbedBuilder()
                .setTitle('Oyun Daveti')
                .setDescription(`${interaction.user} seni bir oyununa davet etti!`)
                .setColor('Blue')
            ],
            components: [new ActionRowBuilder().addComponents(acceptButton)]
          });

          const collector = dmMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30_000 });
          collector.on('collect', async btn => {
            if (btn.customId !== `tod_accept_${gameId}` || accepted.has(btn.user.id)) {
              return btn.reply({ content: 'Zaten kabul etmiştin veya hatalı buton.', ephemeral: true });
            }
            accepted.add(btn.user.id);
            await btn.reply({ content: 'Oyuna kabul edildin!', ephemeral: true });
            await channelMessage.edit({ embeds: [waitingEmbed(accepted.size)] });
          });
        } catch {}
      })
    );

    setTimeout(async () => {
      game.participants = [interaction.user.id, ...accepted];
      game.participants.forEach(id => { game.playedCounts[id] = 0; });
      await game.save();

      if (game.participants.length < 2) {
        return interaction.followUp({ content: 'Yeterli katılımcı yok, oyun iptal edildi.' });
      }

      return startRound(client, gameId);
    }, 30_000);
  }
};

async function startRound(client, gameId) {
  const game = await TruthOrDare.findById(gameId).lean();
  const { channelId, participants, lastSelected, currentQuestioner, rounds, maxRounds } = game;
  const pool = participants.filter(id => id !== lastSelected && id !== currentQuestioner);
  const neverPlayed = pool.filter(id => game.playedCounts[id] === 0);
  const choices = neverPlayed.length ? neverPlayed : pool;
  const nextId = choices[Math.floor(Math.random() * choices.length)];

  await TruthOrDare.findByIdAndUpdate(gameId, {
    lastSelected: nextId,
    $inc: { ['playedCounts.' + nextId]: 1 }
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tod_truth_${gameId}`).setLabel('Doğruluk').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`tod_dare_${gameId}`).setLabel('Cesaret').setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle('Doğruluk mu Cesaret mi?')
    .setDescription(`<@${nextId}> seçildi, 30sn içinde seçim yap!`)
    .setColor('Blurple');

  const channel = await client.channels.fetch(channelId);
  const msg = await channel.send({ embeds: [embed], components: [row] });

  const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30_000 });
  collector.once('collect', async btn => {
    if (btn.user.id !== nextId) return btn.reply({ content: 'Seçim hakkın yok.', ephemeral: true });
    await btn.update({ content: `Seçim: **${btn.customId.includes('_dare_') ? 'Cesaret' : 'Doğruluk'}**`, components: [] });
    setImmediate(() => askAnswered(client, gameId));
  });

  collector.on('end', async collected => {
    if (!collected.size) {
      await msg.edit({ content: 'Süre doldu, varsayılan **Doğruluk** seçildi.', components: [] });
      askAnswered(client, gameId);
    }
  });
}

async function askAnswered(client, gameId) {
  const game = await TruthOrDare.findById(gameId).lean();
  const { currentQuestioner, lastSelected, channelId, rounds, maxRounds } = game;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tod_answered_${gameId}`).setLabel('Cevap verildi').setStyle(ButtonStyle.Success)
  );

  const user = await client.users.fetch(currentQuestioner);
  const dm = await user.send({ content: 'Cevap verildi mi? (60sn)', components: [row] });

  const collector = dm.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
  collector.once('collect', async btn => {
    await TruthOrDare.findByIdAndUpdate(gameId, {
      $inc: { rounds: 1 },
      currentQuestioner: lastSelected
    });
    await btn.reply({ content: 'Cevap alındı, sonraki tur...', ephemeral: true });
    if (rounds + 1 >= maxRounds) return endGame(client, gameId, false);
    startRound(client, gameId);
  });

  collector.on('end', async collected => {
    if (!collected.size) {
      endGame(client, gameId, true);
    }
  });
}

async function endGame(client, gameId, cancelled) {
  const game = await TruthOrDare.findById(gameId).lean();
  const embed = new EmbedBuilder()
    .setTitle(cancelled ? 'Oyun İptal Edildi' : 'Oyun Bitti')
    .addFields(
      { name: 'Tur Sayısı', value: String(game.rounds), inline: true },
      { name: 'Katılımcılar', value: game.participants.map(id => `<@${id}>`).join(', '), inline: true }
    )
    .setColor(cancelled ? 'Red' : 'Green');

  const channel = await client.channels.fetch(game.channelId);
  await channel.send({ embeds: [embed] });
  await TruthOrDare.findByIdAndDelete(gameId);
}
