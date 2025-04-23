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

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { inspect } = require("util");
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
        .setRequired(true)
    ),

  run: async (client, interaction) => {

    if (interaction.user.id !== process.env.DEVELOPERID) return interaction.reply({
        content: ":x: | Bu komut bot sahibine özeldir!",
        ephemeral: true,
    })

    const code = interaction.options.getString('kod');
    try {

      const wrapped = `(async () => {\n${code}\n})()`;
      let evaled = await eval(wrapped);

      if (typeof evaled !== 'string') {
        evaled = inspect(evaled, { depth: 1 });
      }

      const sanitized = String(evaled)
        .replaceAll(client.token, '[TOKEN]')
        .replaceAll(/(process\.env\.[A-Z_]+)/g, '[SECRET]');

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Eval', iconURL: interaction.user.avatarURL() })
        .addFields(
          { name: '📥 Kod', value: `\`\`\`js
${code}
\`\`\`` },
          { name: '📤 Sonuç', value: `\`\`\`js
${sanitized}
\`\`\`` }
        )
        .setColor(client.green)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      const errorMsg = err.stack || err.toString();
      await interaction.reply({
        content: `❌ Hata:
\`\`\`js
${errorMsg}
\`\`\``,
        ephemeral: true,
      });
    }
  },
};
