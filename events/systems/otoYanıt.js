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

const { Events, EmbedBuilder } = require('discord.js');
const AutoReply = require('../../models/AutoReply');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {

        if (!message.guild || message.author?.bot) return;

        const replies = await AutoReply.find({
            guildId: message.guild.id,
            enabled: true,
            $or: [
                { channelId: null },
                { channelId: message.channel.id }
            ]
        });

        const doc = replies.find(r => message.content.toLowerCase().includes(r.trigger.toLowerCase()));
        if (!doc) return;

        if (doc.embed) {
            const embed = new EmbedBuilder()
                .setDescription(doc.response)
                .setColor(client.color);
            return message.reply({ embeds: [embed] });
        }

        return message.reply({ content: doc.response });

    },
};
