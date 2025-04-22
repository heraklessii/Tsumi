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

const { ChannelType, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, PermissionsBitField } = require('discord.js');
const VoiceRoom = require('../../models/VoiceRoom');
const VoiceSettings = require('../../models/VoiceSettings');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {

        const settingsGuild = await VoiceSettings.findOne({ guildId: newState.guild.id }) || {};
        const { sistemDurumu, categoryId, joinChannelId } = settingsGuild;
        if (!sistemDurumu || !joinChannelId) return;

        // Kişi join kanalına girerse
        if (newState.channelId === joinChannelId) {
            // önceki odası var mı?
            let persistentData = await VoiceRoom.findOne({ ownerId: newState.member.id }) || {};

            // 1.1) Eğer aktif bir eski odası varsa, önce devir-ya da sil işlemi
            if (persistentData.channelId) {
                const prevChannel = newState.guild.channels.cache.get(persistentData.channelId);
                if (prevChannel && prevChannel.type === ChannelType.GuildVoice) {
                    const otherMembers = prevChannel.members.filter(m => m.id !== newState.member.id);
                    let transferred = false;

                    for (const [id, member] of otherMembers) {
                        // bu üyenin başka odası var mı?
                        const hasRoom = await VoiceRoom.findOne({
                            ownerId: id,
                            channelId: { $ne: null }
                        });
                        if (!hasRoom) {
                            // devret
                            await VoiceRoom.findOneAndUpdate(
                                { ownerId: id },
                                {
                                    ownerId: id,
                                    channelId: prevChannel.id
                                },
                                { upsert: true }
                            );
                            // eski sahibin kaydını temizle
                            await VoiceRoom.updateOne(
                                { ownerId: newState.member.id },
                                { channelId: null }
                            );
                            transferred = true;
                            prevChannel.send({ content: `<@${id}>, Önceki oda sahibi başka oda oluşturduğu için bu oda artık size ait.` })
                            break;
                        }
                    }

                    // 1.2) Kimseye devretilemediyse odayı sil
                    if (!transferred) {
                        try {
                            await prevChannel.delete();
                        } catch (err) {
                            console.error("Önceki oda silinemedi:", err);
                        }
                        await VoiceRoom.updateOne(
                            { ownerId: newState.member.id },
                            { channelId: null }
                        );
                    }
                }
            }

            // **2️⃣** Yeni kanal bilgilerini al
            const channelName = persistentData.channelName || newState.member.user.username;
            const userLimit = persistentData.userLimit ?? 10;

            // **3️⃣** Yeni kanalı oluştur ve ayarla
            try {
                const newChannel = await newState.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: categoryId,
                    userLimit,
                    bitrate: 64000,
                    permissionOverwrites: [
                        {
                            id: newState.member.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.Connect,
                                PermissionsBitField.Flags.Speak
                            ]
                        }
                    ]
                });

                // DB’ye kaydet
                await VoiceRoom.findOneAndUpdate(
                    { ownerId: newState.member.id },
                    {
                        ownerId: newState.member.id,
                        channelName,
                        userLimit,
                        channelId: newChannel.id
                    },
                    { upsert: true }
                );

                // kullanıcıyı taşı
                await newState.setChannel(newChannel);

                // ayar menü mesajı
                const embed = new EmbedBuilder()
                    .setTitle("Sesli Oda Ayarları")
                    .setDescription("Aşağıdan odanı yönetebilirsin.");

                const settingsMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('vchannel_settings')
                        .setPlaceholder('Kanal ayarlarını değiştir...')
                        .addOptions([
                            { label: 'Kanal Adı', value: 'vchange_name', emoji: '📝' },
                            { label: 'Kanal Limiti', value: 'vchange_limit', emoji: '👥' },
                            { label: 'Sahiplen', value: 'vclaim', emoji: '👑' }
                        ])
                );
                const permissionsMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('vchannel_permissions')
                        .setPlaceholder('İzinleri değiştir...')
                        .addOptions([
                            { label: 'Kitle', value: 'vlock_channel', emoji: '🔒' },
                            { label: 'Aç', value: 'vunlock_channel', emoji: '🔓' },
                            { label: 'Ver', value: 'vgrant_permission', emoji: '✅' },
                            { label: 'Reddet', value: 'vdeny_permission', emoji: '❌' }
                        ])
                );

                await newChannel.send({
                    content: `${newState.member}`,
                    embeds: [embed],
                    components: [settingsMenu, permissionsMenu]
                });
            } catch (err) {
                console.error("Yeni kanal oluşturulurken hata:", err);
            }
        }

        // Oda boş kalırsa
        if (oldState.channelId && oldState.channelId !== joinChannelId) {
            const oldCh = oldState.guild.channels.cache.get(oldState.channelId);
            if (oldCh && oldCh.type === ChannelType.GuildVoice) {
                const vr = await VoiceRoom.findOne({ channelId: oldCh.id });
                if (!vr) return;

                const isOwnerLeaving = (oldState.member.id === vr.ownerId);
                const stillOwnerIn = oldCh.members.has(vr.ownerId);

                if (isOwnerLeaving && !stillOwnerIn) {
                    if (oldCh.members.size === 0) {
                        await oldCh.delete().catch(console.error);
                        vr.channelId = null;
                        await vr.save();
                    }
                } else if (!isOwnerLeaving && oldCh.members.size === 0) {
                    await oldCh.delete().catch(console.error);
                    vr.channelId = null;
                    await vr.save();
                }
            }
        }

    }
};
