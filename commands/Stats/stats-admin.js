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
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ComponentType
} = require('discord.js');
const Stats = require('../../models/Stats');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats-admin')
        .setDescription('Eski günlük/haftalık kayıtları temizler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    run: async (client, interaction) => {
        const state = { target: null, userId: null, period: null, threshold: null };

        const embed1 = new EmbedBuilder()
            .setTitle('🔧 Temizleme Hedefi Seçin')
            .setDescription('⤷ Sunucu mu yoksa Kullanıcı mı için işlem yapacaksınız?')
            .setColor(client.color);

        const menu1 = new StringSelectMenuBuilder()
            .setCustomId('cleanup_target')
            .setPlaceholder('Sunucu veya Kullanıcı')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Sunucu').setValue('guild'),
                new StringSelectMenuOptionBuilder().setLabel('Kullanıcı').setValue('user')
            );
        const row1 = new ActionRowBuilder().addComponents(menu1);

        const msg = await interaction.reply({
            embeds: [embed1],
            components: [row1],
            fetchReply: true
        });

        const selectCollector = msg.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter: i => i.user.id === interaction.user.id,
            time: 120_000
        });

        selectCollector.on('collect', async i => {
            await i.deferUpdate();
            state.target = i.values[0]; // 'guild' veya 'user'

            // Eğer Kullanıcı seçildiyse, ID isteyelim
            if (state.target === 'user') {
                const askUserEmbed = new EmbedBuilder()
                    .setTitle('➡️ Kullanıcı Seçimi')
                    .setDescription('Lütfen **30 saniye** içinde kullanıcıyı etiketleyin veya ID yazın.')
                    .setColor(client.color);
                await msg.edit({ embeds: [askUserEmbed], components: [] });

                // Mesaj bekle
                try {
                    const collected = await interaction.channel.awaitMessages({
                        filter: m => m.author.id === interaction.user.id,
                        max: 1, time: 30_000, errors: ['time']
                    });
                    const input = collected.first().content.trim();
                    const mention = input.match(/^<@!?(\d+)>$/);
                    state.userId = mention ? mention[1] : input;
                } catch {
                    return interaction.followUp({ content: '⏱️ Süre doldu, işlem iptal edildi.', ephemeral: true });
                }
            }

            const embed2 = new EmbedBuilder()
                .setTitle('⏲️ Temizleme Periyodu Seçin')
                .setDescription('⤷ **Genel**, **Günlük** veya **Haftalık** verileri temizleyebilirsiniz.')
                .setColor(client.color);

            const btnGenel = new ButtonBuilder().setCustomId('period_general').setLabel('Genel').setStyle(ButtonStyle.Primary);
            const btnGun = new ButtonBuilder().setCustomId('period_daily').setLabel('Günlük').setStyle(ButtonStyle.Success);
            const btnHaf = new ButtonBuilder().setCustomId('period_weekly').setLabel('Haftalık').setStyle(ButtonStyle.Success);
            const row2 = new ActionRowBuilder().addComponents(btnGenel, btnGun, btnHaf);

            return msg.edit({ embeds: [embed2], components: [row2] });
        });

        const buttonCollector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: b => b.user.id === interaction.user.id,
            time: 120_000
        });

        buttonCollector.on('collect', async b => {
            await b.deferUpdate();
            state.period = b.customId.split('_')[1]; // general|daily|weekly

            // — Genel Temizleme —
            if (state.period === 'general') {
                const filter = { guildId: interaction.guild.id };
                if (state.target === 'user') filter.userId = state.userId;
                await Stats.deleteMany(filter);
                return interaction.followUp({ content: '✅ Genel kayıtlar temizlendi.', ephemeral: true });
            }

            // — Günlük / Haftalık Eşik —
            const label = state.period === 'daily' ? 'gün' : 'hafta';
            const askEmbed = new EmbedBuilder()
                .setTitle(`⌛ Kaç ${label} Eski?`)
                .setDescription(`⤷ Lütfen kaç **${label}** eski kayıt silineceğini **sayı** olarak girin.`)
                .setColor(client.color);
            await msg.edit({ embeds: [askEmbed], components: [] });

            // Eşik Mesajını Bekle
            let num;
            try {
                const collected = await interaction.channel.awaitMessages({
                    filter: m => m.author.id === interaction.user.id && /^\d+$/.test(m.content.trim()),
                    max: 1, time: 30_000, errors: ['time']
                });
                num = parseInt(collected.first().content.trim());
            } catch {
                return interaction.followUp({ content: '⏱️ Süre doldu, işlem iptal edildi.', ephemeral: true });
            }
            state.threshold = num;

            // — Silme İşlemi —
            const cutoffDate = state.period === 'daily'
                ? moment().subtract(num, 'days').format('YYYY-MM-DD')
                : null;
            const cutoffWeek = state.period === 'weekly'
                ? moment().subtract(num, 'weeks').isoWeek().toString()
                : null;

            const query = { guildId: interaction.guild.id };
            if (state.target === 'user') query.userId = state.userId;
            const allStats = await Stats.find(query);

            for (const s of allStats) {
                if (state.period === 'daily') {
                    // Günlük temizle
                    for (const key of Array.from(s.dailyMessages.keys()))
                        if (key < cutoffDate) s.dailyMessages.delete(key);
                    for (const key of Array.from(s.dailyVoice.keys()))
                        if (key < cutoffDate) s.dailyVoice.delete(key);
                    for (const [ch, data] of s.channelMessages)
                        for (const k of Array.from(data.daily.keys()))
                            if (k < cutoffDate) data.daily.delete(k);
                    for (const [ch, data] of s.channelVoice)
                        for (const k of Array.from(data.daily.keys()))
                            if (k < cutoffDate) data.daily.delete(k);
                } 
                
                else {
                    // Haftalık temizle
                    for (const key of Array.from(s.weeklyMessages.keys()))
                        if (parseInt(key) < parseInt(cutoffWeek)) s.weeklyMessages.delete(key);
                    for (const key of Array.from(s.weeklyVoice.keys()))
                        if (parseInt(key) < parseInt(cutoffWeek)) s.weeklyVoice.delete(key);
                    for (const [ch, data] of s.channelMessages)
                        for (const k of Array.from(data.weekly.keys()))
                            if (parseInt(k) < parseInt(cutoffWeek)) data.weekly.delete(k);
                    for (const [ch, data] of s.channelVoice)
                        for (const k of Array.from(data.weekly.keys()))
                            if (parseInt(k) < parseInt(cutoffWeek)) data.weekly.delete(k);
                }
                await s.save();
            }

            return interaction.followUp({
                content: `✅ ${num} ${label} eski ${state.period === 'daily' ? 'günlük' : 'haftalık'} kayıtlar temizlendi.`,
                ephemeral: true
            });
        });

        selectCollector.on('end', () => msg.edit({ components: [] }).catch(() => { }));
        buttonCollector.on('end', () => msg.edit({ components: [] }).catch(() => { }));
    }
};
