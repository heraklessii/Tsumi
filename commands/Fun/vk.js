const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Game = require('../../models/VKGame');
const { createAdminPanel } = require('../../utils/vk/adminPanel');
const { assignRoles, renamePlayers } = require('../../utils/vk/renamer');
const ServerConfig = require('../../models/VKSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vampir-köylü')
        .setDescription('Vampir Köylü oyununu başlatır.')
        .addSubcommand(sub =>
            sub
                .setName('başlat')
                .setDescription('Yeni bir Vampir Köylü oyunu başlatır.')
                .addChannelOption(opt =>
                    opt
                        .setName('adminchannel')
                        .setDescription('Yönetim panelinin gönderileceği kanal')
                        .setRequired(true)
                        .addChannelTypes(0)
                )
                .addChannelOption(opt =>
                    opt
                        .setName('metinkanalı')
                        .setDescription('Oyun duyurularının yapılacağı metin kanalı')
                        .setRequired(true)
                        .addChannelTypes(0)
                )
                .addChannelOption(opt =>
                    opt
                        .setName('seskanalı')
                        .setDescription('Oyuncuların katılacağı ses kanalı')
                        .setRequired(true)
                        .addChannelTypes(2)
                )
                .addStringOption(opt =>
                    opt
                        .setName('mode')
                        .setDescription('Oynanacak mod (normal veya advanced)')
                        .setRequired(false)
                        .addChoices(
                            { name: 'normal', value: 'normal' },
                            { name: 'gelişmiş', value: 'advanced' }
                        )
                )
                .addBooleanOption(opt =>
                    opt
                        .setName('isimdeğiştirilsinmi')
                        .setDescription('Ses kanalındaki oyuncu nickleri "Oyuncu 01" şeklinde değiştirilsin mi?')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('gelişmiş')
                .setDescription('Sunucuya özel rol havuzu ayarlarına girer.')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async run(client, interaction) {

        const guildId = interaction.guild.id;
        const sub = interaction.options.getSubcommand();

        if (sub === 'başlat') {

            const guildId = interaction.guild.id;
            const adminChannel = interaction.options.getChannel('adminchannel');
            const textChannel = interaction.options.getChannel('metinkanalı');
            const voiceChannel = interaction.options.getChannel('seskanalı');
            const mode = interaction.options.getString('mode') || 'normal';
            const renameFlag = interaction.options.getBoolean('isimdeğiştirilsinmi') ?? false;

            const existing = await Game.findOne({ guildId, isActive: true });
            if (existing) return interaction.reply({ content: '❌ | Bu sunucuda hâlihazırda aktif bir oyun var.', ephemeral: true });

            // Oyuncu havuzu: BOT olmayan ve ADMIN olmayan.
            const playersInVoice = voiceChannel.members
                .filter(m => !m.user.bot && m.id !== interaction.user.id)
                .map(m => m);
            if (playersInVoice.length < 5) return interaction.reply({ content: '❌ | En az 5 oyuncu olmalı.', ephemeral: true });

            if (mode === 'advanced') {
                const cfg = await ServerConfig.findOne({ guildId });
                if (!cfg || cfg.roles.length === 0) return interaction.reply({ content: '❌ | Gelişmiş mod için rol havuzu ayarlanmamış.', ephemeral: true });
                if (members.size < cfg.roles.length) return interaction.reply({ content: `❌ | En az ${cfg.roles.length} oyuncu olmalı.`, ephemeral: true });
            }

            // Rol dağıtımı
            const assigned = await assignRoles(playersInVoice, mode, guildId);

            // İsim değişikliği
            if (renameFlag) await renamePlayers(interaction.guild, assigned);

            // Yönetici nick sabit
            try {
                await interaction.guild.members.fetch(interaction.user.id)
                    .then(m => m.setNickname('! Yönetici', 'VK yönetici etiketi'));
            } catch (e) { /* ignore */ }

            // DM ile rol bildir
            for (const p of assigned) {
                try {
                    await interaction.guild.members.fetch(p.id)
                        .then(m => m.send(`Senin rolün: **${p.role}**`).catch(() => { }));
                } catch (_) { }
            }

            const game = await Game.create({
                guildId,
                adminId: interaction.user.id,
                mode,
                channels: {
                    adminChannel: adminChannel.id,
                    textChannel: textChannel.id,
                    voiceChannel: voiceChannel.id
                },
                renameOnStart: renameFlag,
                players: assigned.map(p => ({
                    userId: p.id,
                    role: p.role,
                    originalNick: p.originalNick,
                    status: 'alive'
                })),
                dayCount: 0,
                nightCount: 1,
                isActive: true
            });

            const panel = createAdminPanel(game);
            await adminChannel.send({ components: panel });

            // İlk gece başlangıcı
            voiceChannel.members
                .filter(m => !m.user.bot && m.id !== interaction.user.id)
                .forEach(m => { if (m.voice) m.voice.setMute(true).catch(() => { }); });
            // await textChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            await textChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('GECE OLDU!')
                        .setColor(client.black)
                        .setDescription('**1. gece** başladı, lütfen sessiz kalın.')
                ]
            });

            return interaction.reply({ content: '✅ | **Vampir Köylü** oyunu başlatıldı!', ephemeral: true });
        }

        // GELİŞMİŞ AYAR
        else if (sub === 'gelişmiş') {

            let config = await ServerConfig.findOne({ guildId });
            if (!config) config = await ServerConfig.create({ guildId, roles: [] });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`vkg_adv_add_${guildId}`).setLabel('Rol Ekle').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`vkg_adv_remove_${guildId}`).setLabel('Rol Sil').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`vkg_adv_list_${guildId}`).setLabel('Rolleri Listele').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`vkg_adv_finish_${guildId}`).setLabel('Ayarları Bitir').setStyle(ButtonStyle.Success)
            );

            await interaction.reply({ content: 'Gelişmiş mod rol havuzu yöneticisi (5 dakika geçerli):', components: [row], ephemeral: true });
            const message = await interaction.fetchReply();

            const filter = btn => btn.user.id === interaction.user.id && btn.customId.startsWith('vkg_adv_');
            const collector = message.createMessageComponentCollector({ filter, time: 300000 });

            collector.on('collect', async btn => {
                await btn.deferUpdate();
                const [, action] = btn.customId.split(`_${guildId}`)[0].split('_adv_');

                if (action === 'add') {
                    await interaction.followUp({ content: 'Eklemek istediğiniz rolü ve alignment girin. Örnek: Seri Katil, evil', ephemeral: true });
                    const msgFilter = m => m.author.id === interaction.user.id;
                    const msgCollector = interaction.channel.createMessageCollector({ filter: msgFilter, time: 60000, max: 1 });
                    msgCollector.on('collect', m => {
                        const [name, alignment] = m.content.split(',').map(s => s.trim());
                        config.roles.push({ name, alignment: alignment || 'neutral', metadata: {} });
                        config.save();
                        m.reply({ content: `Rol eklendi: ${name} (${alignment || 'neutral'})`, ephemeral: true });
                    });
                }

                else if (action === 'remove') {
                    await interaction.followUp({ content: 'Silmek istediğiniz rol adını girin:', ephemeral: true });
                    const msgFilter = m => m.author.id === interaction.user.id;
                    const msgCollector = interaction.channel.createMessageCollector({ filter: msgFilter, time: 60000, max: 1 });
                    msgCollector.on('collect', m => {
                        config.roles = config.roles.filter(r => r.name !== m.content.trim());
                        config.save();
                        m.reply({ content: `Rol silindi: ${m.content.trim()}`, ephemeral: true });
                    });
                }

                else if (action === 'list') {
                    const list = config.roles.map(r => `• ${r.name} [${r.alignment}]`).join('\n') || 'Rol yok';
                    await interaction.followUp({ content: `Mevcut roller:\n${list}`, ephemeral: true });
                }

                else if (action === 'finish') {
                    collector.stop();
                    await interaction.followUp({ content: 'Gelişmiş mod ayarları kaydedildi ve yönetici paneli kapatıldı.', ephemeral: true });
                }

            });
        }

    }
};
