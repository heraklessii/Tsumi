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

        else if (interaction.isStringSelectMenu()) {
            const { customId, values, member, guild, message } = interaction;

            if (customId === 'vchannel_settings') {
                const voiceChannel = member.voice.channel;

                if (!voiceChannel) {
                    await interaction.reply({ content: "Ses kanalında değilsiniz.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                const vr = await VoiceRoom.findOne({ channelId: voiceChannel.id });
                if (!vr) {
                    await interaction.reply({ content: "Oda verisi bulunamadı.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                const choice = values[0];

                // Sahip kontrolü (vclaim hariç)
                if (choice !== 'vclaim' && vr.ownerId !== member.id) {
                    await interaction.reply({ content: "Bu oda size ait değil.", ephemeral: true });
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
                        await interaction.reply({ content: "Zaten odanız var.", ephemeral: true });
                        return message.edit(getVoiceRoomMessage());
                    }

                    // eski sahibi kanalda mı?
                    if (guild.members.cache.get(vr.ownerId)?.voice.channelId === voiceChannel.id) {
                        await interaction.reply({ content: "Eski sahibi hâlâ kanalda.", ephemeral: true });
                        return message.edit(getVoiceRoomMessage());
                    }

                    await VoiceRoom.updateOne(
                        { channelId: voiceChannel.id },
                        { ownerId: member.id }
                    );
                    await interaction.reply({ content: `Odayı artık ${member} yönetecek.`, ephemeral: false });
                    return message.edit(getVoiceRoomMessage());
                }
            }

            else if (customId === 'vchannel_permissions') {
                const voiceChannel = member.voice.channel;
                if (!voiceChannel) {
                    await interaction.reply({ content: "Ses kanalında değilsiniz.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }
                const vr = await VoiceRoom.findOne({ channelId: voiceChannel.id });
                if (!vr || vr.ownerId !== member.id) {
                    await interaction.reply({ content: "Bu oda size ait değil.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }

                const sel = values[0];
                const everyone = guild.roles.everyone;

                if (sel === 'vlock_channel') {
                    await voiceChannel.permissionOverwrites.edit(everyone, { Connect: false });
                    await interaction.reply({ content: "Kilitlendi.", ephemeral: true });
                    return interaction.message.edit(getVoiceRoomMessage());
                }
                if (sel === 'vunlock_channel') {
                    await voiceChannel.permissionOverwrites.edit(everyone, { Connect: null });
                    await interaction.reply({ content: "Kilit kaldırıldı.", ephemeral: true });
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
                    await interaction.reply({ content: "Ses kanalında değilsiniz.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                const vr = await VoiceRoom.findOne({ channelId: voiceChannel.id });
                if (!vr || vr.ownerId !== member.id) {
                    await interaction.reply({ content: "✋ Bu işlemi yalnızca kanal sahibi yapabilir.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                for (const uid of values) {
                    await voiceChannel.permissionOverwrites.edit(uid, { Connect: true });
                }
                await interaction.reply({ content: "✅ İzinler verildi.", ephemeral: true });
                return message.edit(getVoiceRoomMessage());
            }

            else if (customId === 'vdeny_user_select') {

                const voiceChannel = member.voice.channel;
                if (!voiceChannel) {
                    await interaction.reply({ content: "Ses kanalında değilsiniz.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                const vr = await VoiceRoom.findOne({ channelId: voiceChannel.id });
                if (!vr || vr.ownerId !== member.id) {
                    await interaction.reply({ content: "✋ Bu işlemi yalnızca kanal sahibi yapabilir.", ephemeral: true });
                    return message.edit(getVoiceRoomMessage());
                }

                for (const uid of values) {
                    await voiceChannel.permissionOverwrites.edit(uid, { Connect: false });
                    const m = guild.members.cache.get(uid);
                    if (m?.voice.channelId === voiceChannel.id) {
                        await m.voice.disconnect("İzin reddedildi.");
                    }
                }
                await interaction.reply({ content: "🔒 İzinler kaldırıldı.", ephemeral: true });
                return message.edit(getVoiceRoomMessage());
            }
        }

        else if (interaction.isModalSubmit()) {
            const { customId, member } = interaction;

            if (customId === 'vmodal_change_name') {

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
