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

const client = global.client;
const {
    EmbedBuilder,
    InteractionType,
    UserSelectMenuBuilder,
    StringSelectMenuBuilder,
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require("discord.js");
const cooldowns = new Map();
const VoiceRoom = require('../../models/VoiceRoom');
const Game = require('../../models/VKGame');
const { createAdminPanel } = require('../../utils/vk/adminPanel');
const { createPlayerPanel } = require('../../utils/vk/selectMenus');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        if (!interaction.guild || interaction.user.bot) return;

        if (interaction.isChatInputCommand()) {
            const cmd = client.commands.get(interaction.commandName);
            if (!cmd) return;

            // cooldown
            const now = Date.now();
            const timestamps = cooldowns.get(cmd.name) || new Map();
            cooldowns.set(cmd.name, timestamps);

            const cooldownAmount = (cmd.cooldown || 5) * 1000;
            if (timestamps.has(interaction.user.id)) {
                const expire = timestamps.get(interaction.user.id) + cooldownAmount;
                if (now < expire) {
                    const remain = ((expire - now) / 1000).toFixed(1);
                    return interaction.reply({ content: `❌ | ${remain}s bekle!`, ephemeral: true });
                }
            }
            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            try {
                if (interaction.type === InteractionType.ApplicationCommand) {
                    await cmd.run(client, interaction);
                }
            } catch (err) {
                console.error(err);
                interaction.reply({ content: '❌ | Bir hata oluştu.', ephemeral: true });
            }
            return;
        }

        else if (interaction.isButton()) {

            if (interaction.customId.includes('vk_') && interaction.customId.startsWith('vk_')) {

                const parts = interaction.customId.split('_');
                const action = parts[1];
                const guildId = parts[2];
                const targetId = parts[3] || null;
                const game = await Game.findOne({ guildId, isActive: true });
                if (!game) return interaction.reply({ content: '❌ | Aktif oyun bulunamadı.', ephemeral: true });

                const guild = interaction.guild;
                const textChannel = guild.channels.cache.get(game.channels.textChannel);
                const voiceChannel = guild.channels.cache.get(game.channels.voiceChannel);

                switch (action) {
                    case 'day':
                        game.dayCount++;
                        await game.save();
                        //voiceChannel.members.forEach(m => { if (!m.user.bot) m.voice.setMute(false).catch(() => { }); });
                        //await textChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
                        await textChannel.send({ embeds: [new EmbedBuilder().setTitle('GÜNDÜZ OLDU!').setColor(client.yellow).setDescription(`**${game.dayCount}.** gündüz başladı.`)] });
                        return interaction.reply({ content: '✅ | Gündüz moduna geçildi.', ephemeral: true });

                    case 'night':
                        game.nightCount++;
                        await game.save();
                        // voiceChannel.members.forEach(m => { if (m.id !== game.adminId && !m.user.bot) m.voice.setMute(true).catch(() => { }); });
                        // await textChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
                        await textChannel.send({ embeds: [new EmbedBuilder().setTitle('GECE OLDU!').setColor(client.black).setDescription(`**${game.nightCount}. gece** başladı, lütfen sessiz kalın.`)] });
                        return interaction.reply({ content: '✅ | Gece moduna geçildi.', ephemeral: true });

                    case 'talkline':
                        await textChannel.send('**---- ---- ---- ---- ---- ----**');
                        return interaction.reply({ content: '✅ | Konuşma çizgisi atıldı.', ephemeral: true });

                    case 'muteVoiceAll':
                        voiceChannel.members.forEach(m => { if (m.id !== game.adminId && !m.user.bot) m.voice.setMute(true).catch(() => { }); });
                        return interaction.reply({ content: '✅ | Ses kanalı susturuldu.', ephemeral: true });

                    case 'disableText':
                        await textChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
                        return interaction.reply({ content: '✅ | Metin kanalı yazma kapatıldı.', ephemeral: true });

                    case 'unmuteVoiceAll':
                        voiceChannel.members.forEach(m => { if (!m.user.bot) m.voice.setMute(false).catch(() => { }); });
                        return interaction.reply({ content: '✅ | Ses susturması açıldı.', ephemeral: true });

                    case 'enableText':
                        await textChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
                        return interaction.reply({ content: '✅ | Metin kanalı yazma açıldı.', ephemeral: true });

                    case 'endGame': {
                        game.isActive = false;
                        await game.save();
                        const alive = game.players.filter(p => p.status === 'alive');
                        const dead = game.players.filter(p => p.status === 'dead');
                        const embed = new EmbedBuilder()
                            .setTitle('Oyun Bitti')
                            .setDescription(`
\`❤️\`  Yaşayan Oyuncular: 
${alive.map(p => `<@${p.userId}> (${p.role})`).join('\n') || 'Yok'}

\`☠️\`  Ölü Oyuncular: 
${dead.map(p => `<@${p.userId}> (${p.role})`).join('\n') || 'Yok'}

\`☀️\`  Gündüz Sayısı:  **${game.dayCount}**
\`🌙\`  Gece Sayısı:  **${game.nightCount}**
                                `)

                        // nick & ses reset
                        for (const p of game.players) {
                            const m = await guild.members.fetch(p.userId);
                            await m.setNickname(p.originalNick).catch(() => { });
                            if (m.voice) await m.voice.setMute(false).catch(() => { });
                        }

                        await textChannel.send({ embeds: [embed] });
                        return interaction.reply({ content: '✅ | Oyun bitirildi ve log atıldı.', ephemeral: true });
                    }

                    case 'kill': {
                        const member = await guild.members.fetch(targetId);
                        game.players = game.players.map(p => p.userId === targetId ? { ...p, status: 'dead' } : p);
                        await game.save();
                        await member.setNickname('! Ölü').catch(() => { });
                        if (member.voice) await member.voice.setMute(true).catch(() => { });
                        return interaction.reply({ content: `✅ | <@${targetId}> öldürüldü.`, ephemeral: true });
                    }

                    case 'revive': {
                        const member = await guild.members.fetch(targetId);
                        game.players = game.players.map(p => {
                            if (p.userId === targetId) {
                                p.status = 'alive';
                                member.setNickname(p.originalNick).catch(() => { });
                                if (member.voice) member.voice.setMute(false).catch(() => { });
                            }
                            return p;
                        });
                        await game.save();
                        return interaction.reply({ content: `✅ | <@${targetId}> diriltildi.`, ephemeral: true });
                    }

                    case 'viewRole': {
                        const player = game.players.find(p => p.userId === targetId);
                        return interaction.reply({ content: `✅ | <@${targetId}> rolü: ${player.role}`, ephemeral: true });
                    }

                    case 'changeRole': {
                        const modal = new ModalBuilder()
                            .setCustomId(`vk_changeRoleModal_${guildId}_${targetId}`)
                            .setTitle('Rol Değiştir');
                        const input = new TextInputBuilder()
                            .setCustomId('roleInput')
                            .setLabel('Yeni rol adı')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder(game.players.find(p => p.userId === targetId).role)
                            .setRequired(true);
                        const row = new ActionRowBuilder().addComponents(input);
                        modal.addComponents(row);
                        await interaction.showModal(modal);
                        return;
                    }

                    case 'muteVoice': {
                        const member = await guild.members.fetch(targetId);
                        if (member.voice.channelId === game.channels.voiceChannel) {
                            await member.voice.setMute(true);
                            return interaction.reply({ content: `✅ | <@${targetId}> seste susturuldu.`, ephemeral: true });
                        } else {
                            return interaction.reply({ content: '❌ | Kullanıcı ses kanalında değil.', ephemeral: true });
                        }
                    }

                    case 'disableText': {
                        await textChannel.permissionOverwrites.edit(targetId, { SendMessages: false });
                        return interaction.reply({ content: `✅ | <@${targetId}> metin kanalında yazması kapatıldı.`, ephemeral: true });
                    }

                    case 'unmuteVoice': {
                        const member = await guild.members.fetch(targetId);
                        await member.voice.setMute(false);
                        return interaction.reply({ content: `✅ | <@${targetId}> ses susturması kaldırıldı.`, ephemeral: true });
                    }

                    case 'enableText': {
                        await textChannel.permissionOverwrites.edit(targetId, { SendMessages: true });
                        return interaction.reply({ content: `✅ | <@${targetId}> metin kanalında yazma izni verildi.`, ephemeral: true });
                    }

                    case 'voteResult': {
                        const member = await guild.members.fetch(targetId);
                        game.players = game.players.map(p => p.userId === targetId ? { ...p, status: 'dead' } : p);
                        await game.save();
                        await member.setNickname('! Ölü').catch(() => { });
                        await textChannel.send(
                            `**Oylama sonucu: <@${targetId}> asıldı. Rolü: ${game.players.find(p => p.userId === targetId).role}**`
                        );
                        return interaction.reply({ content: '✅ | Oylama sonucu işlendi.', ephemeral: true });
                    }

                    case 'back': {
                        const panel = createAdminPanel(game);
                        return interaction.update({ components: panel });
                    }
                }

            }

        }

        else if (interaction.isStringSelectMenu()) {

            const { customId, values, member, guild, message } = interaction;

            if (customId.includes('vk_select_player_') && customId.startsWith('vk_select_player_')) {
                const [, , , guildId] = interaction.customId.split('_');
                const selectedId = interaction.values[0];
                const game = await Game.findOne({ guildId, isActive: true });
                if (!game) return interaction.reply({ content: '❌ | Aktif oyun bulunamadı.', ephemeral: true });
                const panel = createPlayerPanel(game, selectedId, guildId);
                return interaction.update({ components: panel });
            }

            else if (customId === 'vchannel_settings') {

                const voiceChannel = member.voice.channel;

                if (!voiceChannel) {
                    await interaction.reply({ content: "❌ | Ses kanalında değilsiniz.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                const vr = await VoiceRoom.findOne({ channelId: voiceChannel.id });
                if (!vr) {
                    await interaction.reply({ content: "❌ | Oda verisi bulunamadı.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                const choice = values[0];

                // Sahip kontrolü (vclaim hariç)
                if (choice !== 'vclaim' && vr.ownerId !== member.id) {
                    await interaction.reply({ content: "❌ | Bu oda size ait değil.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                // **1)** İsim değiştir
                if (choice === 'vchange_name') {
                    const modal = new ModalBuilder()
                        .setCustomId('vmodal_change_name')
                        .setTitle('Yeni Kanal Adı');
                    const input = new TextInputBuilder()
                        .setCustomId('vnew_channel_name')
                        .setLabel('Ad:')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);
                    modal.addComponents(new ActionRowBuilder().addComponents(input));
                    await interaction.showModal(modal);
                    return message.edit(getVoiceRoomMessage());
                }

                // **2)** Limit değiştir
                if (choice === 'vchange_limit') {
                    const modal = new ModalBuilder()
                        .setCustomId('vmodal_change_limit')
                        .setTitle('Yeni Limit');
                    const input = new TextInputBuilder()
                        .setCustomId('vnew_channel_limit')
                        .setLabel('Limit:')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);
                    modal.addComponents(new ActionRowBuilder().addComponents(input));
                    await interaction.showModal(modal);
                    return message.edit(getVoiceRoomMessage());
                }

                // **3)** Sahiplen
                if (choice === 'vclaim') {
                    // zaten oda sahibi mi?
                    const existing = await VoiceRoom.findOne({
                        ownerId: member.id,
                        channelId: { $ne: null }
                    });
                    if (existing) {
                        await interaction.reply({ content: "❌ | Zaten odanız var.", ephemeral: true });
                        return message.edit(getVoiceRoomMessage());
                    }

                    // eski sahibi kanalda mı?
                    if (guild.members.cache.get(vr.ownerId)?.voice.channelId === voiceChannel.id) {
                        await interaction.reply({ content: "❌ | Eski sahibi hâlâ kanalda.", ephemeral: true });
                        return message.edit(getVoiceRoomMessage());
                    }

                    await VoiceRoom.updateOne(
                        { channelId: voiceChannel.id },
                        { ownerId: member.id }
                    );

                    await interaction.reply({ content: `✅ | Odayı artık ${member} yönetecek.`, ephemeral: false });
                    return message.edit(getVoiceRoomMessage());
                }
            }

            else if (customId === 'vchannel_permissions') {

                const voiceChannel = member.voice.channel;
                if (!voiceChannel) {
                    await interaction.reply({ content: "❌ | Ses kanalında değilsiniz.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }
                const vr = await VoiceRoom.findOne({ channelId: voiceChannel.id });
                if (!vr || vr.ownerId !== member.id) {
                    await interaction.reply({ content: "❌ | Bu oda size ait değil.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }

                const sel = values[0];
                const everyone = guild.roles.everyone;

                if (sel === 'vlock_channel') {
                    await voiceChannel.permissionOverwrites.edit(everyone, { Connect: false });
                    await interaction.reply({ content: "✅ | Kilitlendi.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }
                if (sel === 'vunlock_channel') {
                    await voiceChannel.permissionOverwrites.edit(everyone, { Connect: null });
                    await interaction.reply({ content: "✅ | Kilit kaldırıldı.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }

                // kullanıcı seçtiren menüler
                const userSelectRow = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder()
                        .setCustomId(sel === 'vgrant_permission'
                            ? 'vgrant_user_select'
                            : 'vdeny_user_select')
                        .setPlaceholder('Kullanıcı seçin')
                );

                await interaction.reply({
                    content: sel === 'vgrant_permission'
                        ? 'İzin verilecek kullanıcıyı seçin.'
                        : 'İzin alınacak kullanıcıyı seçin.',
                    ephemeral: true
                });

                // mevcut menüleri alıp, select ekle
                const base = getVoiceRoomMessage().components;
                return interaction.message.edit({
                    components: [...base, userSelectRow]
                });
            }

        }

        else if (interaction.isUserSelectMenu()) {

            const { customId, values, member, guild, message } = interaction;

            if (customId === 'vgrant_user_select') {

                const voiceChannel = member.voice.channel;
                if (!voiceChannel) {
                    await interaction.reply({ content: "❌ | Ses kanalında değilsiniz.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                const vr = await VoiceRoom.findOne({ channelId: voiceChannel.id });
                if (!vr || vr.ownerId !== member.id) {
                    await interaction.reply({ content: "❌ | Bu işlemi yalnızca kanal sahibi yapabilir.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                for (const uid of values) {
                    await voiceChannel.permissionOverwrites.edit(uid, { Connect: true });
                }

                await interaction.reply({ content: "✅ | İzinler verildi.", ephemeral: true });
                return message.edit(getVoiceRoomMessage());
            }

            else if (customId === 'vdeny_user_select') {

                const voiceChannel = member.voice.channel;
                if (!voiceChannel) {
                    await interaction.reply({ content: "❌ | Ses kanalında değilsiniz.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                const vr = await VoiceRoom.findOne({ channelId: voiceChannel.id });
                if (!vr || vr.ownerId !== member.id) {
                    await interaction.reply({ content: "❌ | Bu işlemi yalnızca kanal sahibi yapabilir.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                for (const uid of values) {
                    await voiceChannel.permissionOverwrites.edit(uid, { Connect: false });
                    const m = guild.members.cache.get(uid);
                    if (m?.voice.channelId === voiceChannel.id) {
                        await m.voice.disconnect("İzin reddedildi.");
                    }
                }

                await interaction.reply({ content: "✅ | İzinler kaldırıldı.", ephemeral: true });
                return message.edit(getVoiceRoomMessage());
            }

        }

        else if (interaction.isModalSubmit()) {

            const { customId, member } = interaction;

            if (customId.includes("vk_changeRoleModal") && customId.startsWith("vk_changeRoleModal")) {

                const [, guildId, targetId] = interaction.customId.split('_');
                const newRole = interaction.fields.getTextInputValue('roleInput').trim();
                const game = await Game.findOne({ guildId, isActive: true });
                if (!game) return interaction.reply({ content: '❌ | Aktif oyun bulunamadı.', ephemeral: true });


                game.players = game.players.map(p => p.userId === targetId ? { ...p, role: newRole } : p);
                await game.save();

                const member = await interaction.guild.members.fetch(targetId);
                await member.send(`✅ | Rolünüz değiştirildi: ${newRole} Kimseye söylemeyin!`).catch(() => { });
                return interaction.reply({ content: `✅ | Rol ${newRole} olarak değiştirildi.`, ephemeral: true });
            }

            else if (customId === 'vmodal_change_name') {

                const voiceChannel = member.voice.channel;
                if (!voiceChannel) {
                    await interaction.reply({ content: "Ses kanalında değilsiniz.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }

                const newName = interaction.fields.getTextInputValue('vnew_channel_name');
                await voiceChannel.setName(newName);
                await VoiceRoom.updateOne(
                    { channelId: voiceChannel.id },
                    { channelName: newName }
                );
                await interaction.reply({ content: `Ad değişti: ${newName}`, ephemeral: true });
                return interaction.message.edit(getVoiceRoomMessage());
            }

            else if (customId === 'vmodal_change_limit') {

                const voiceChannel = member.voice.channel;
                if (!voiceChannel) {
                    await interaction.reply({ content: "Ses kanalında değilsiniz.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }

                const val = parseInt(interaction.fields.getTextInputValue('vnew_channel_limit'), 10);
                if (isNaN(val) || val < 0) {
                    await interaction.reply({ content: "Geçersiz limit.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }
                await voiceChannel.setUserLimit(val);
                await VoiceRoom.updateOne(
                    { channelId: voiceChannel.id },
                    { userLimit: val }
                );
                await interaction.reply({ content: `Limit değişti: ${val}`, ephemeral: true });
                return interaction.message.edit(getVoiceRoomMessage());
            }

        }

    }
};

function getVoiceRoomMessage() {
    const settingsMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vchannel_settings')
            .setPlaceholder('Ayarlar...')
            .addOptions([
                { label: 'Ad', value: 'vchange_name', emoji: '📝' },
                { label: 'Limit', value: 'vchange_limit', emoji: '👥' },
                { label: 'Sahiplen', value: 'vclaim', emoji: '👑' }
            ])
    );
    const permissionsMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vchannel_permissions')
            .setPlaceholder('İzinler...')
            .addOptions([
                { label: 'Kitle', value: 'vlock_channel', emoji: '🔒' },
                { label: 'Aç', value: 'vunlock_channel', emoji: '🔓' },
                { label: 'Ver', value: 'vgrant_permission', emoji: '✅' },
                { label: 'Reddet', value: 'vdeny_permission', emoji: '❌' }
            ])
    );
    return { components: [settingsMenu, permissionsMenu] };
}
