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

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ReputationUser = require('../../models/ReputationUser');
const ReputationSettings = require('../../models/ReputationSettings');
module.exports = {
    category: "Utility",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('rep')
        .setDescription('Bir kullanıcıya rep ver')
        .addUserOption(opt =>
            opt.setName('kişi')
                .setDescription('Rep vermek istediğiniz kullanıcı')
                .setRequired(true)),
    run: async (client, interaction) => {

        const giverId = interaction.user.id;
        const receiver = interaction.options.getUser('kişi');
        if (receiver.bot) return interaction.reply({ content: ':x: | Botlara **rep** veremezsiniz!', ephemeral: true });
        if (receiver.id === giverId) return interaction.reply({ content: ':x: | Kendinize **rep** veremezsiniz!', ephemeral: true });

        const setting = await ReputationSettings.findOne({ guildId: interaction.guild.id });
        if (!setting?.sistemDurumu) return interaction.reply({ content: ':x: | Rep sistemi kapalı.', ephemeral: true });

        const now = new Date();
        let giver = await ReputationUser.findOne({ userId: giverId, guildId: interaction.guild.id });
        if (!giver) giver = new ReputationUser({ userId: giverId, guildId: interaction.guild.id });
        else if (giver.lastRepGivenAt && now - giver.lastRepGivenAt < 1000 * 60 * 60)
            return interaction.reply({ content: ':x: | Bir saatte sadece bir kere **rep** verebilirsiniz!', ephemeral: true });

        let recUser = await ReputationUser.findOne({ userId: receiver.id, guildId: interaction.guild.id });
        if (!recUser) recUser = new ReputationUser({ userId: receiver.id, guildId: interaction.guild.id });

        recUser.points += 1;
        giver.lastRepGivenAt = now;
        await Promise.all([recUser.save(), giver.save()]);

        await interaction.reply({ content: `✅ | <@${receiver.id}> kullanıcısına rep verildi!`, ephemeral: false });
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

    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessage = messages.find(m => m.author.id === guild.client.user.id && m.embeds.length > 0);

    if (botMessage) await botMessage.edit({ embeds: [embed] });
    else await channel.send({ embeds: [embed] });
}