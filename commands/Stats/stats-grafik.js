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

const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Stats = require('../../models/Stats');
const moment = require('moment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats-grafik')
    .setDescription('Kullanıcının günlük mesaj/ses geçmişini grafik olarak gösterir.')
    .addUserOption(opt =>
      opt.setName('kullanıcı')
        .setDescription('Grafiğini görmek istediğiniz kullanıcı')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('tür')
        .setDescription('Mesaj mı yoksa ses mi?')
        .addChoices(
          { name: 'Mesaj', value: 'message' },
          { name: 'Ses', value: 'voice' }
        )
        .setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('gün_sayısı')
        .setDescription('Kaç gün geriye (max 14)')
        .setMinValue(1)
        .setMaxValue(14))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  run: async (client, interaction) => {

    const user = interaction.options.getUser('kullanıcı');
    const type = interaction.options.getString('tür');
    const chartType = 'bar';
    const days = Math.min(interaction.options.getInteger('gün_sayısı') || 7, 14);

    // İstatistiği çek
    const stats = await Stats.findOne({ guildId: interaction.guild.id, userId: user.id });
    if (!stats)
      return interaction.reply({ content: ':x: | İstatistik bulunamadı.', ephemeral: true });

    // Tarih listesi (son N gün)
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
    }

    // Y ekseni değerleri
    const values = dates.map(d => {
      if (type === 'message') {
        return stats.dailyMessages.get(d) || 0;
      } else {
        // ses saniyesini dakikaya çevir
        return Math.floor((stats.dailyVoice.get(d) || 0) / 60);
      }
    });

    // ChartJS ayarları
    const width = 800, height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    const configuration = {
      type: chartType,
      data: {
        labels: dates,
        datasets: [{
          label: type === 'message' ? 'Günlük Mesaj' : 'Günlük Ses (dk)',
          data: values,
          backgroundColor: chartType === 'pie'
            ? ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7']
            : 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          ...(chartType === 'line' ? { fill: true, tension: 0.3 } : {})
        }]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: `${user.username} — Son ${days} Günlük ${type === 'message' ? 'Mesaj' : 'Ses'} Grafiği`,
            color: '#000',
            font: {
              size: 22,
              weight: 'bold'
            }
          },
          legend: {
            labels: {
              color: '#000',
              font: {
                size: 16
              }
            }
          },
          tooltip: {
            bodyFont: { size: 16 },
            titleFont: { size: 16 }
          }
        },
        ...(chartType !== 'pie' ? {
          scales: {
            x: {
              title: {
                display: true,
                text: 'Tarih',
                color: '#000',
                font: {
                  size: 16
                }
              },
              ticks: {
                color: '#000',
                font: {
                  size: 14
                }
              }
            },
            y: {
              title: {
                display: true,
                text: type === 'message' ? 'Mesaj Sayısı' : 'Dakika',
                color: '#000',
                font: {
                  size: 16
                }
              },
              ticks: {
                color: '#000',
                font: {
                  size: 14
                }
              }
            }
          }
        } : {})
      }
    };

    // Grafiği oluştur ve gönder
    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    const attachment = new AttachmentBuilder(image, { name: 'istatistik-grafik.png' });
    await interaction.reply({ files: [attachment] });

  }
};
