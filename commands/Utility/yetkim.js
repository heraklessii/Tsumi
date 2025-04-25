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
const Group = require('../../models/YGroup');
const Progress = require('../../models/YProgress');
module.exports = {
    category: "Utility",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("yetkim")
        .setDescription("Yetkili sistemindeki bilgilerinizi görmenizi sağlar."),

    run: async (client, interaction) => {

        const prog = await Progress.findOne({ guildId: interaction.guild.id, userId: interaction.user.id });
        if (!prog) return interaction.reply({ content: ':x: | Henüz bir yetki grubuna başlamadınız veya yetkili değilsiniz.', ephemeral: true });

        const grp = await Group.findOne({ guildId: interaction.guild.id, name: prog.groupName });
        if (!grp) return interaction.reply({ content: ':x: | Grup verisi bulunamadı.', ephemeral: true });

        const requiredXP = Math.floor(
            prog.level * (
                (grp.difficulty === 'kolay' ? 100 : grp.difficulty === 'orta' ? 200 : 300) *
                (grp.difficulty === 'kolay' ? 1.01 : grp.difficulty === 'orta' ? 1.02 : 1.03)
            )
        );

        const remainingXP = Math.max(requiredXP - prog.xp, 0);
        const nextRole = grp.roles.find(r => r.level === prog.level + 1);

        const embed = new EmbedBuilder()
            .setTitle('⚒️ Yetki Durumun')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor(client.color)
            .setDescription(`
\`📝\`  Grup:  **${prog.groupName}**
        
\`🥇\`  Seviye:  **${prog.level}**
\`✨\`  XP:  **${prog.xp}/${requiredXP}**
\`📈\`  Gerekli XP:  **${remainingXP}**
        
\`📌\`  Bir sonraki rol:  **${nextRole ? `<@&${nextRole.roleId}>` : "Son rol'e ulaştınız."}**
                                    `)

        return interaction.reply({ embeds: [embed], ephemeral: false })

    }
};
