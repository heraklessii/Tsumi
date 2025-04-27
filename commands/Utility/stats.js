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
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require('discord.js');
const Stats = require('../../models/Stats');
const moment = require('moment');

module.exports = {
    category: "Utility",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Kullanıcının veya sunucunun mesaj ve ses istatistiklerini gösterir.')
        .addSubcommand(sub =>
            sub.setName('sunucu')
                .setDescription('Sunucu genel istatistiklerini gösterir')
        )
        .addSubcommand(sub =>
            sub.setName('kullanıcı')
                .setDescription('Belirli bir kullanıcı için istatistikleri gösterir')
                .addUserOption(opt =>
                    opt.setName('hedef')
                        .setDescription('İstatistiklerini görmek istediğin kullanıcı')
                        .setRequired(false)
                )
        ),
    run: async (client, interaction) => {

        const todayKey = new Date().toISOString().split('T')[0];
        const weekKey = moment().isoWeek().toString();
        const sub = interaction.options.getSubcommand();

        // Ortak buton satırları
        const mainButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats_text').setLabel('📝 Metin').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stats_voice').setLabel('🔊 Ses').setStyle(ButtonStyle.Secondary)
        );
        const backMain = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats_back_main').setLabel('↩️ Geri Dön').setStyle(ButtonStyle.Primary)
        );

        // SUNUCU İSTATİSTİKLERİ
        if (sub === 'sunucu') {
            const statsList = await Stats.find({ guildId: interaction.guild.id });
            if (!statsList.length) return interaction.reply({ content: ':x: | Sunucuya ait istatistik bulunamadı.', ephemeral: true });

            // Sunucu genel veriler
            let totalMsg = 0, totalSec = 0;
            let dailyMsg = 0, dailySec = 0;
            let weeklyMsg = 0, weeklySec = 0;
            const channelMsgTotal = {};
            const channelMsgDaily = {};
            const channelMsgWeekly = {};
            const channelVoiceTotal = {};
            const channelVoiceDaily = {};
            const channelVoiceWeekly = {};

            for (const s of statsList) {
                totalMsg += s.totalMessages;
                totalSec += s.totalVoice;
                dailyMsg += s.dailyMessages.get(todayKey) || 0;
                weeklyMsg += s.weeklyMessages.get(weekKey) || 0;
                dailySec += s.dailyVoice.get(todayKey) || 0;
                weeklySec += s.weeklyVoice.get(weekKey) || 0;

                for (const [chId, chData] of s.channelMessages) {
                    channelMsgTotal[chId] = (channelMsgTotal[chId] || 0) + chData.total;
                    channelMsgDaily[chId] = (channelMsgDaily[chId] || 0) + (chData.daily.get(todayKey) || 0);
                    channelMsgWeekly[chId] = (channelMsgWeekly[chId] || 0) + (chData.weekly.get(weekKey) || 0);
                }
                for (const [chId, chData] of s.channelVoice) {
                    const totM = Math.floor(chData.total / 60);
                    const dayM = Math.floor((chData.daily.get(todayKey) || 0) / 60);
                    const wkM = Math.floor((chData.weekly.get(weekKey) || 0) / 60);
                    channelVoiceTotal[chId] = (channelVoiceTotal[chId] || 0) + totM;
                    channelVoiceDaily[chId] = (channelVoiceDaily[chId] || 0) + dayM;
                    channelVoiceWeekly[chId] = (channelVoiceWeekly[chId] || 0) + wkM;
                }
            }

            const genEmbed = new EmbedBuilder()
                .setTitle('🌐 Sunucu Genel İstatistikler')
                .setColor(client.color)
                .setDescription(`
\`📝\` **Toplam Mesaj:** \`${totalMsg}\`
\`📅\` **Günlük Mesaj:** \`${dailyMsg}\`
\`📆\` **Haftalık Mesaj:** \`${weeklyMsg}\`

\`🔊\` **Toplam Ses (dk):** \`${Math.floor(totalSec / 60)}\`
\`📅\` **Günlük Ses (dk):** \`${Math.floor(dailySec / 60)}\`
\`📆\` **Haftalık Ses (dk):** \`${Math.floor(weeklySec / 60)}\`
                `);

            const msg = await interaction.reply({ embeds: [genEmbed], components: [mainButtons], fetchReply: true });

            // Sunucu Metin ve Ses alt menü fonksiyonları
            const buildServerText = (type) => {
                const data = type === 'daily'
                    ? channelMsgDaily
                    : type === 'weekly'
                        ? channelMsgWeekly
                        : channelMsgTotal;
                const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const title = type === 'daily'
                    ? '📄 Sunucu Mesaj — Günlük'
                    : type === 'weekly'
                        ? '📄 Sunucu Mesaj — Haftalık'
                        : '📄 Sunucu Mesaj Kanalları';
                const list = sorted.length
                    ? sorted.map((e, i) => `\`${i + 1}.\` <#${e[0]}> — **${e[1]} mesaj**`).join('\n')
                    : 'Veri yok';
                return new EmbedBuilder().setTitle(title).setColor(client.color).setDescription(list);
            };
            const buildServerVoice = (type) => {
                const data = type === 'daily'
                    ? channelVoiceDaily
                    : type === 'weekly'
                        ? channelVoiceWeekly
                        : channelVoiceTotal;
                const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const title = type === 'daily'
                    ? '🔉 Sunucu Ses — Günlük'
                    : type === 'weekly'
                        ? '🔉 Sunucu Ses — Haftalık'
                        : '🔉 Sunucu Ses Kanalları';
                const list = sorted.length
                    ? sorted.map((e, i) => `\`${i + 1}.\` <#${e[0]}> — **${e[1]} dk**`).join('\n')
                    : 'Veri yok';
                return new EmbedBuilder().setTitle(title).setColor(client.color).setDescription(list);
            };

            // Periyot buton satırları
            const rowPeriod = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('stats_text_daily').setLabel('📅 Günlük').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('stats_text_weekly').setLabel('📆 Haftalık').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('stats_back_main').setLabel('↩️ Geri Dön').setStyle(ButtonStyle.Primary)
            );
            const rowVoicePeriod = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('stats_voice_daily').setLabel('📅 Günlük').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('stats_voice_weekly').setLabel('📆 Haftalık').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('stats_back_main').setLabel('↩️ Geri Dön').setStyle(ButtonStyle.Primary)
            );

            const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 120000 });
            collector.on('collect', async i => {
                await i.deferUpdate();
                switch (i.customId) {
                    case 'stats_text':
                        return i.editReply({ embeds: [buildServerText('total')], components: [rowPeriod] });
                    case 'stats_text_daily':
                        return i.editReply({ embeds: [buildServerText('daily')], components: [rowPeriod] });
                    case 'stats_text_weekly':
                        return i.editReply({ embeds: [buildServerText('weekly')], components: [rowPeriod] });
                    case 'stats_voice':
                        return i.editReply({ embeds: [buildServerVoice('total')], components: [rowVoicePeriod] });
                    case 'stats_voice_daily':
                        return i.editReply({ embeds: [buildServerVoice('daily')], components: [rowVoicePeriod] });
                    case 'stats_voice_weekly':
                        return i.editReply({ embeds: [buildServerVoice('weekly')], components: [rowVoicePeriod] });
                    case 'stats_back_main':
                        return i.editReply({ embeds: [genEmbed], components: [mainButtons] });
                }
            });
            collector.on('end', () => interaction.editReply({ components: [] }).catch(() => { }));
            return;
        }

        // KULLANICI İSTATİSTİKLERİ
        else if (sub === 'kullanıcı') {

            const user = interaction.options.getUser('hedef') || interaction.user;
            const stats = await Stats.findOne({ userId: user.id, guildId: interaction.guild.id });
            if (!stats) return interaction.reply({ content: ':x: | Kullanıcıya ait istatistik bulunamadı.', ephemeral: true });

            const totalMsg = stats.totalMessages;
            const dailyMsg = stats.dailyMessages.get(todayKey) || 0;
            const weeklyMsg = stats.weeklyMessages.get(weekKey) || 0;
            const totalVoice = Math.floor(stats.totalVoice / 60);
            const dailyVoice = Math.floor((stats.dailyVoice.get(todayKey) || 0) / 60);
            const weeklyVoice = Math.floor((stats.weeklyVoice.get(weekKey) || 0) / 60);

            const genEmbed = new EmbedBuilder()
                .setAuthor({ name: user.username })
                .setTitle('📊 Genel İstatistikler')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setColor(client.color)
                .setDescription(`
\`📝\`  **Toplam Mesaj:**  \`${totalMsg}\`
\`📅\`  **Günlük Mesaj:**  \`${dailyMsg}\`
\`📆\`  **Haftalık Mesaj:**  \`${weeklyMsg}\`

\`🔊\`  **Toplam Ses (dk):**  \`${totalVoice}\`
\`📅\`  **Günlük Ses (dk):**  \`${dailyVoice}\`
\`📆\`  **Haftalık Ses (dk):**  \`${weeklyVoice}\`
            `);

            const msg = await interaction.reply({ embeds: [genEmbed], components: [mainButtons], fetchReply: true });

            // Kullanıcı alt menü fonksiyonları
            const buildTextMenu = () => {
                const counts = {};
                for (const [chId, chData] of stats.channelMessages) {
                    if (chData.total > 0) counts[chId] = chData.total;
                }
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const list = sorted.length
                    ? sorted.map((e, i) => `\`${i + 1}.\` <#${e[0]}> — **${e[1]}**`).join('\n')
                    : 'Veri yok';
                return new EmbedBuilder()
                    .setAuthor({ name: user.username })
                    .setTitle('📄 Mesaj Kanalları')
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .setColor(client.color)
                    .setDescription(
                        `📝  **Toplam Mesaj:**  ${totalMsg}\n📅  **Günlük Mesaj:**  ${dailyMsg}\n📆  **Haftalık Mesaj:**  ${weeklyMsg}\n
📊  **Toplam Kanal Verileri:**\n${list}`
                    );
            };
            const buildVoiceMenu = () => {
                const counts = {};
                for (const [chId, chData] of stats.channelVoice) {
                    const mins = Math.floor(chData.total / 60);
                    if (mins > 0) counts[chId] = mins;
                }
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const list = sorted.length
                    ? sorted.map((e, i) => `\`${i + 1}.\` <#${e[0]}> — **${e[1]} dk**`).join('\n')
                    : 'Veri yok';
                return new EmbedBuilder()
                    .setAuthor({ name: user.username })
                    .setTitle('🔉 Ses Kanalları')
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .setColor(client.color)
                    .setDescription(
                        `🔊  **Toplam Ses (dk):**  ${totalVoice}\n📅  **Günlük Ses (dk):**  ${dailyVoice}\n📆  **Haftalık Ses (dk):**  ${weeklyVoice}\n
📊  **Toplam Kanal Verileri:**\n${list}`
                    );
            };

            const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 120000 });
            collector.on('collect', async i => {
                await i.deferUpdate();
                if (i.customId === 'stats_text') return i.editReply({ embeds: [buildTextMenu()], components: [backMain] });
                if (i.customId === 'stats_voice') return i.editReply({ embeds: [buildVoiceMenu()], components: [backMain] });
                if (i.customId === 'stats_back_main') return i.editReply({ embeds: [genEmbed], components: [mainButtons] });
            });
            collector.on('end', () => interaction.editReply({ components: [] }).catch(() => { }));

        }

    }
};