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
    data: new SlashCommandBuilder()
        .setName('istatistik')
        .setDescription('Kullanıcının mesaj ve ses istatistiklerini gösterir.')
        .addUserOption(opt =>
            opt.setName('kullanıcı')
                .setDescription('İstatistiklerini görmek istediğin kullanıcı')),
    run: async (client, interaction) => {
        
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const stats = await Stats.findOne({ userId: user.id, guildId: interaction.guild.id });
        if (!stats)
            return interaction.reply({ content: 'Kullanıcıya ait istatistik bulunamadı.', ephemeral: true });

        // ————————————————————————————————
        // 1️⃣ Genel Embed & Butonlar
        // ————————————————————————————————
        const todayKey = new Date().toISOString().split('T')[0];
        const weekKey = moment().isoWeek().toString();

        const totalMsg = stats.totalMessages;
        const dailyMsg = stats.dailyMessages.get(todayKey) || 0;
        const weeklyMsg = stats.weeklyMessages.get(weekKey) || 0;
        const totalVoice = Math.floor(stats.totalVoice / 60);
        const dailyVoice = Math.floor((stats.dailyVoice.get(todayKey) || 0) / 60);
        const weeklyVoice = Math.floor((stats.weeklyVoice.get(weekKey) || 0) / 60);

        const genEmbed = new EmbedBuilder()
            .setAuthor({ name: user.username })
            .setTitle(`📊 Genel İstatistikler`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor(client.color)
            .setDescription(`
\`📝\`  **Toplam Mesaj:**  \`${totalMsg}\`
\`📅\`  **Günlük Mesaj:**  \`${dailyMsg}\`
\`📆\`  **Haftalık Mesaj:**  \`${weeklyMsg}\`

\`🔊\`  **Toplam Ses (dk):**  \`${totalVoice}\`
\`📅\`  **Günlük Ses (dk):**  \`${dailyVoice}\`
\`📆\`  **Haftalık Ses (dk)**:  \`${weeklyVoice}\`
            `)

        const rowMain = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats_text').setLabel('📝 Metin').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stats_voice').setLabel('🔊 Ses').setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({
            embeds: [genEmbed],
            components: [rowMain],
            fetchReply: true
        });

        // ————————————————————————————————
        // 2️⃣ “Metin” Menüsü Tanımı
        // ————————————————————————————————
        const buildTextMenu = () => {
            // Kanal bazlı toplam mesaj sayısı
            const counts = {};
            for (const [chId, chData] of stats.channelMessages) {
                if (chData.total > 0) counts[chId] = chData.total;
            }
            const sorted = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            const list = sorted.length
                ? sorted.map((e, i) => `\`${i + 1}.\` <#${e[0]}> — **${e[1]}**`).join('\n')
                : 'Veri yok';

            return new EmbedBuilder()
                .setAuthor({ name: user.username })
                .setTitle('📄 Mesaj Kanalları')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setColor(client.color)
                .setDescription(`
\`📝\`  **Toplam Mesaj:**  \`${totalMsg}\`
\`📅\`  **Günlük Mesaj:**  \`${dailyMsg}\`
\`📆\`  **Haftalık Mesaj:**  \`${weeklyMsg}\`

\`📊\`  **Toplam Kanal Verileri:**
${list}
            `)
        };

        const rowText = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats_text_daily').setLabel('📅 Günlük').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stats_text_weekly').setLabel('📅 Haftalık').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stats_back_main').setLabel('↩️ Geri Dön').setStyle(ButtonStyle.Primary)
        );

        // ————————————————————————————————
        // 3️⃣ “Ses” Menüsü Tanımı
        // ————————————————————————————————
        const buildVoiceMenu = () => {
            // Kanal bazlı toplam ses süresi (dk)
            const counts = {};
            for (const [chId, chData] of stats.channelVoice) {
                const mins = Math.floor(chData.total / 60);
                if (mins > 0) counts[chId] = mins;
            }
            const sorted = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            const list = sorted.length
                ? sorted.map((e, i) => `\`${i + 1}.\` <#${e[0]}> — **${e[1]}** dk`).join('\n')
                : 'Veri yok';

            return new EmbedBuilder()
                .setAuthor({ name: user.username })
                .setTitle('🔉 Ses Kanalları')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setColor(client.color)
                .setDescription(`
\`🔊\`  **Toplam Ses (dk):**  \`${totalVoice}\`
\`📅\`  **Günlük Ses (dk):**  \`${dailyVoice}\`
\`📆\`  **Haftalık Ses (dk)**:  \`${weeklyVoice}\`

\`📊\`  **Toplam Kanal Verileri:**
${list}
            `)
        };

        const rowVoice = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats_voice_daily').setLabel('📅 Günlük').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stats_voice_weekly').setLabel('📅 Haftalık').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stats_back_main').setLabel('↩️ Geri Dön').setStyle(ButtonStyle.Primary)
        );

        // ————————————————————————————————
        // 4️⃣ Collector ve Alt Menü İşlemleri
        // ————————————————————————————————
        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 120000
        });

        collector.on('collect', async i => {
            await i.deferUpdate();

            // Ana Menü
            if (i.customId === 'stats_back_main')
                return i.editReply({ embeds: [genEmbed], components: [rowMain] });

            // Metin Menüsü
            else if (i.customId === 'stats_text')
                return i.editReply({ embeds: [buildTextMenu()], components: [rowText] });

            // Ses Menüsü
            else if (i.customId === 'stats_voice')
                return i.editReply({ embeds: [buildVoiceMenu()], components: [rowVoice] });

            // Metin – Günlük / Haftalık Kanal Sıralaması
            else if (i.customId.startsWith('stats_text_')) {
                const isDaily = i.customId.endsWith('daily');
                const key = isDaily ? todayKey : weekKey;

                // periodik kanal bazlı mesaj
                const counts = {};
                const statsList = await Stats.find({ guildId: interaction.guild.id });
                for (const s of statsList) {
                    for (const [chId, chData] of s.channelMessages) {
                        const cnt = isDaily
                            ? (chData.daily.get(key) || 0)
                            : (chData.weekly.get(key) || 0);
                        if (cnt > 0) counts[chId] = (counts[chId] || 0) + cnt;
                    }
                }
                const sorted = Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                const list = sorted.length
                    ? sorted.map((e, i) => `\`${i + 1}.\` <#${e[0]}> — **${e[1]}**`).join('\n')
                    : 'Veri yok';

                const embed = new EmbedBuilder()
                    .setAuthor({ name: user.username })
                    .setTitle(`📄 Mesaj — ${isDaily ? 'Günlük' : 'Haftalık'}`)
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .setDescription(list)
                    .setColor(client.color);

                // Geri + Ana Menü
                const nav = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('stats_text').setLabel('↩️ Geri').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('stats_back_main').setLabel('📋 Ana Menü').setStyle(ButtonStyle.Primary)
                );
                return i.editReply({ embeds: [embed], components: [nav] });
            }

            // Ses – Günlük / Haftalık Kanal Sıralaması
            else if (i.customId.startsWith('stats_voice_')) {
                const isDaily = i.customId.endsWith('daily');
                const key = isDaily ? todayKey : weekKey;

                // periodik kanal bazlı ses
                const counts = {};
                const statsList = await Stats.find({ guildId: interaction.guild.id });
                for (const s of statsList) {
                    for (const [chId, chData] of s.channelVoice) {
                        const sec = isDaily
                            ? (chData.daily.get(key) || 0)
                            : (chData.weekly.get(key) || 0);
                        const mins = Math.floor(sec / 60);
                        if (mins > 0) counts[chId] = (counts[chId] || 0) + mins;
                    }
                }
                const sorted = Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                const list = sorted.length
                    ? sorted.map((e, i) => `\`${i + 1}.\` <#${e[0]}> — **${e[1]}** dk`).join('\n')
                    : 'Veri yok';

                const embed = new EmbedBuilder()
                    .setAuthor({ name: user.username })
                    .setTitle(`🔉 Ses — ${isDaily ? 'Günlük' : 'Haftalık'}`)
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .setDescription(list)
                    .setColor(client.color);

                const nav = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('stats_voice').setLabel('↩️ Geri').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('stats_back_main').setLabel('📋 Ana Menü').setStyle(ButtonStyle.Primary)
                );
                return i.editReply({ embeds: [embed], components: [nav] });
            }

        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => { });
        });
    }
};
