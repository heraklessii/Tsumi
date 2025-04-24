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

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ReputationSettings = require('../../models/ReputationSettings');
const ReputationUser = require('../../models/ReputationUser');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rep-admin')
        .setDescription('Rep sistemi yönetimi')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('ayarla')
                .setDescription('Puan rol ödülü ayarla')
                .addIntegerOption(opt => opt.setName('puan').setDescription('Ödül puanı').setRequired(true))
                .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('ver')
                .setDescription('Kişiye puan ver')
                .addUserOption(opt => opt.setName('kişi').setDescription('Hedef kullanıcı').setRequired(true))
                .addIntegerOption(opt => opt.setName('miktar').setDescription('Puan miktarı').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('al')
                .setDescription('Kişiden puan al')
                .addUserOption(opt => opt.setName('kişi').setDescription('Hedef kullanıcı').setRequired(true))
                .addIntegerOption(opt => opt.setName('miktar').setDescription('Puan miktarı').setRequired(true))),
    run: async (client, interaction) => {

        const setting = await ReputationSettings.findOne({ guildId: interaction.guild.id })
        const sub = interaction.options.getSubcommand();

        if (!setting?.sistemDurumu) return interaction.reply({ content: ':x: | Rep sistemi kapalı.', ephemeral: true });

        if (sub === 'ayarla') {

            const puan = interaction.options.getInteger('puan');
            const rol = interaction.options.getRole('rol');
            setting.rewards = setting.rewards || [];
            const existing = setting.rewards.find(r => r.points === puan);
            if (existing) existing.roles.push(rol.id);
            else setting.rewards.push({ points: puan, roles: [rol.id] });
            await setting.save();
            return interaction.reply({ content: `✅ | ${puan} puan için rol ödülü ayarlandı: <@&${rol.id}>`, ephemeral: true });

        }

        const target = interaction.options.getUser('kişi');
        let repUser = await ReputationUser.findOne({ userId: target.id, guildId: interaction.guild.id });
        if (!repUser) repUser = new ReputationUser({ userId: target.id, guildId: interaction.guild.id });

        const miktar = interaction.options.getInteger('miktar');
        if (sub === 'ver') repUser.points += miktar;
        else repUser.points = Math.max(0, repUser.points - miktar);
        await repUser.save();

        // Rol ödülü ver/al.
        if (setting.rewards?.length) {
            const member = await interaction.guild.members.fetch(target.id);
            for (const reward of setting.rewards) {
                if (repUser.points >= reward.points) {
                    for (const roleId of reward.roles) if (!member.roles.cache.has(roleId))
                        await member.roles.add(roleId);
                } else {
                    for (const roleId of reward.roles) if (member.roles.cache.has(roleId))
                        await member.roles.remove(roleId);
                }
            }
        }

        await interaction.reply({
            content: sub === 'ver'
                ? `✅ | **${miktar} rep** ${target} kullanıcısına verildi!`
                : `✅ | **${miktar} rep** ${target} kullanıcısından alındı!`, ephemeral: true
        });

        await updateLeaderboard(interaction.guild, setting.topChannelId);

    }
};

async function updateLeaderboard(guild, channelId) {

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const repUsers = await ReputationUser.find({ guildId: guild.id })
        .sort({ points: -1 })
        .limit(10);

    const embed = new EmbedBuilder()
        .setTitle("🏆 Sunucu Rep Sıralaması")
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setColor("Gold")
        .setDescription(repUsers.map((u, i) => `**${i + 1}.** <@${u.userId}> - \`${u.points}\` rep`).join("\n"))
        .setTimestamp();

    const messages = await channel.messages.fetch({ limit: 2 });
    const botMessage = messages.find(m => m.author.id === guild.client.user.id && m.embeds.length > 0);

    if (botMessage) await botMessage.edit({ embeds: [embed] });
    else await channel.send({ embeds: [embed] });
}