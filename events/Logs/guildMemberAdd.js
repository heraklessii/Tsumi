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

const { Events, EmbedBuilder } = require("discord.js");
const LogsSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {

        if(!member.guild) return;

        var date = Date.now();

        const logData = await LogsSettings.findOne({ guildId: member.guild.id });
        if (!logData || !logData.sistemDurumu || !logData.girmeCikmaDurumu || !logData.girmeCikmaLogChannelId) return;

        const logChannel = member.guild.channels.cache.get(logData.girmeCikmaLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;
        
        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setTitle(`✅ ÜYE SUNUCUYA KATILDI`)
            .setDescription(`
\`📋\`  Üye:  **${member.user.username}**
\`🆔\`  ID:  **${member.user.id}**
\`#️⃣\`  Etiket:  ${member.user}

\`🗓️\`  Katılma Tarihi:  <t:${parseInt(date / 1000)}:R>
`)
        await logChannel.send({ embeds: [embed] });
    }
};
