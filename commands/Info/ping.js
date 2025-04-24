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
module.exports = {
    category: "Info",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botun güncel gecikmesini öğrenirsiniz.'),

    run: async (client, interaction) => {
        
        const ping = client.ws.ping;
        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle('🏓 Pong!')
            .setDescription(`Bot gecikmesi: **${ping}ms**`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });

    },
};