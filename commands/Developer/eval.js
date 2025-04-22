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

require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
module.exports = {
    category: "Kurucu",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("eval")
        .setDescription("Kurucu özel bir komut.")
        .addStringOption(option =>
            option
                .setName('kod')
                .setDescription('Eval için kodunuz.')
                .setRequired(true)),

    run: async (client, interaction) => {

        if (interaction.user.id !== process.env.DEVELOPERID) return interaction.reply({
            content: ":x: | Bu komut bot sahibine özeldir!",
            ephemeral: true,
        })

        try {

            const code = interaction.options.getString("kod")
            let evaled = await eval(code);

            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled);

            const embed = new EmbedBuilder()
                .setAuthor({ name: "Eval", iconURL: interaction.user.avatarURL() })
                .addFields([
                    { name: "KOD:", value: `\`\`\`${code}\`\`\`` },
                    { name: "SONUÇ:", value: `\`\`\`${evaled}\`\`\`` },
                ])
                .setColor(client.green)

            interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (err) {

            return interaction.reply({
                content: `\`HATA\` \`\`\`\n${err}\`\`\``,
                ephemeral: true,
            });

        }
    },

};