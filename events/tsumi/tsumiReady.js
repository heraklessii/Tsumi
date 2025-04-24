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

const chalk = require('chalk');
const { Events, ActivityType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const cron = require('node-cron');
const Stats = require('../../models/Stats');
const StatsSettings = require('../../models/StatsSettings');
const PremiumGuild = require('../../models/PremiumGuild');
const dayjs = require('dayjs');

module.exports = {
  name: Events.ClientReady,
  async execute(client) {

    // Aktiviteleri döngüyle ayarla
    const activities = [
      { name: 'Tsumi, HERA tarafından geliştirilmektedir.', type: ActivityType.Custom },
      { name: 'Komutlara /yardım ile ulaşabilirsiniz.', type: ActivityType.Custom }
    ];

    let index = 0;
    setInterval(() => {
      client.user.setActivity(activities[index]);
      index = (index + 1) % activities.length;
    }, 120_000);

    // Premium süresi dolan sunucuları temizle
    const purgeExpired = async () => {
      const now = new Date();
      const expired = await PremiumGuild.find({ expiresAt: { $lt: now } });
      expired.forEach(async ({ guildId }) => {
        await PremiumGuild.deleteOne({ guildId });
      });
    };

    await purgeExpired();
    setInterval(purgeExpired, 3_600_000);

    console.log(chalk.blue(`${client.user.tag} olarak giriş yapıldı!`));

    // Günlük rapor cron
    cron.schedule('0 0 * * *', async () => {
      const date = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      const settings = await StatsSettings.find({
        sistemDurumu: true,
        gunlukRaporDurumu: true,
        logChannelId: { $exists: true }
      });

      for (const { guildId, logChannelId } of settings) {
        try {
          const guild = await client.guilds.fetch(guildId);
          const channel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId);
          if (!channel?.isTextBased()) continue;

          const statsList = await Stats.find({ guildId });

          // Sunucu geneli mesaj ve ses
          const serverTotalMessages = statsList.reduce((sum, s) => sum + (s.dailyMessages.get(date) || 0), 0);
          const serverTotalVoiceSec = statsList.reduce((sum, s) => sum + (s.dailyVoice.get(date) || 0), 0);
          const serverTotalVoiceMin = Math.floor(serverTotalVoiceSec / 60);

          // Kanal bazlı istatistik
          const channelMsgCounts = {};
          const channelVoiceCounts = {};
          statsList.forEach(s => {
            s.channelMessages.forEach((data, chId) => {
              const cnt = data.daily.get(date) || 0;
              if (cnt) channelMsgCounts[chId] = (channelMsgCounts[chId] || 0) + cnt;
            });
            s.channelVoice.forEach((data, chId) => {
              const sec = data.daily.get(date) || 0;
              if (sec) channelVoiceCounts[chId] = (channelVoiceCounts[chId] || 0) + sec;
            });
          });

          const [topChMsgId, topChMsgCnt = 0] = Object.entries(channelMsgCounts).sort((a, b) => b[1] - a[1])[0] || [];
          const [topChVoiceId, topChVoiceSec = 0] = Object.entries(channelVoiceCounts).sort((a, b) => b[1] - a[1])[0] || [];

          // Top 5 kullanıcı
          const topMsgs = statsList
            .map(s => ({ userId: s.userId, count: s.dailyMessages.get(date) || 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          const topVoice = statsList
            .map(s => ({ userId: s.userId, sec: s.dailyVoice.get(date) || 0 }))
            .sort((a, b) => b.sec - a.sec)
            .slice(0, 5);

          // Grafik oluştur
          const chartCanvas = new ChartJSNodeCanvas({ width: 600, height: 300, backgroundColour: '#fff' });
          const chartConfig = {
            type: 'bar',
            data: {
              labels: ['Mesaj', 'Ses (dk)'],
              datasets: [{
                label: 'Sunucu Toplamı',
                data: [serverTotalMessages, serverTotalVoiceMin],
                backgroundColor: ['rgba(54,162,235,0.5)', 'rgba(255,159,64,0.5)'],
                borderColor: ['rgba(54,162,235,1)', 'rgba(255,159,64,1)'],
                borderWidth: 2
              }]
            },
            options: {
              plugins: {
                title: { display: true, text: `${date} — Mesaj vs Ses`, font: { size: 16 } },
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Adet / Dakika' } }
              }
            }
          };
          const chartBuffer = await chartCanvas.renderToBuffer(chartConfig);
          const chartAttachment = new AttachmentBuilder(chartBuffer, { name: 'daily-chart.png' });

          // Embed mesajı
          const embed = new EmbedBuilder()
            .setTitle(`📅 ${date} Günlük Rapor`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 128 }))
            .setDescription(
              `💬 Mesaj: **${serverTotalMessages}**\n` +
              `🔊 Ses: **${serverTotalVoiceMin}** dk\n\n` +
              `💬 En aktif kanal: ${topChMsgId ? `<#${topChMsgId}> — ${topChMsgCnt}` : 'Yok'}\n` +
              `🔉 En aktif ses kanalı: ${topChVoiceId ? `<#${topChVoiceId}> — ${Math.floor(topChVoiceSec/60)} dk` : 'Yok'}`
            )
            .addFields(
              { name: '📈 Mesajda İlk 5', value: topMsgs.length ? topMsgs.map((u,i) => `\`${i+1}.\` <@${u.userId}> — **${u.count}**`).join('\n') : 'Veri yok', inline: true },
              { name: '🔉 Seste İlk 5', value: topVoice.length ? topVoice.map((u,i) => `\`${i+1}.\` <@${u.userId}> — **${Math.floor(u.sec/60)}** dk`).join('\n') : 'Veri yok', inline: true }
            )
            .setImage('attachment://daily-chart.png')
            .setColor(0x2F3136)
            .setTimestamp();

          await channel.send({ embeds: [embed], files: [chartAttachment] });
          console.log(chalk.green(`Günlük rapor gönderildi: ${guildId} (${date})`));
        } catch (error) {
          console.error(chalk.red(`Rapor hatası [${guildId}]:`), error);
        }
      }
    });

  }
};
