const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Stats = require('../../models/Stats.js');
const dayjs = require('dayjs');

module.exports = {
  category: "Utility",
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('stats-grafik')
    .setDescription('Kullanıcının günlük mesaj/ses geçmişini modern grafikle gösterir')
    .addUserOption(option =>
      option
        .setName('kullanıcı')
        .setDescription('Grafiğini görmek istediğiniz kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('tür')
        .setDescription('Mesaj mı ses mi?')
        .addChoices(
          { name: 'Mesaj', value: 'message' },
          { name: 'Ses', value: 'voice' })
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  run: async (client, interaction) => {

    const user = interaction.options.getUser('kullanıcı');
    const type = interaction.options.getString('tür');
    const days = (1, 7);

    const stats = await Stats.findOne({ guildId: interaction.guildId, userId: user.id });
    if (!stats) return interaction.reply({ content: ':x: | İstatistik bulunamadı.', ephemeral: true });

    // Son N gün için tarih dizisi
    const dates = Array.from({ length: days }, (_, i) =>
      dayjs().subtract(days - 1 - i, 'day').format('YYYY-MM-DD')
    );

    // Verileri hazırla
    const values = dates.map(date => {
      if (type === 'message') return stats.dailyMessages.get(date) ?? 0;
      return Math.floor((stats.dailyVoice.get(date) ?? 0) / 60);
    });

    const width = 800;
    const height = 400;
    const canvas = new ChartJSNodeCanvas({ width, height, backgroundColour: '#fff' });

    const config = {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [
          {
            label: type === 'message' ? 'Günlük Mesaj' : 'Günlük Ses (dk)',
            data: values,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.3
          }
        ]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'Tarih', font: { size: 24 } } },
          y: { title: { display: true, text: type === 'message' ? 'Mesaj Sayısı' : 'Dakika', font: { size: 24 } } }
        },
        plugins: {
          title: {
            display: true,
            text: `${user.username} • Son ${days} Gün ${type === 'message' ? 'Mesaj' : 'Ses'} Grafiği`,
            font: { size: 24, weight: '600' }
          },
          tooltip: { mode: 'index', intersect: false }
        },
        responsive: false
      }
    };

    const buffer = await canvas.renderToBuffer(config);
    const attachment = new AttachmentBuilder(buffer, { name: 'stats-graph.png' });
    await interaction.reply({ files: [attachment] });
  }
};
