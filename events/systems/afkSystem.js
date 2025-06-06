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

const { Events } = require('discord.js');
const Afk = require("../../models/AfkData");

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {

        if (!message.guild || message.author?.bot) return;

        const userID = message.author.id;

        const selfAfk = await Afk.findOne({ userID });
        if (selfAfk) {
            const now = Date.now();
            const diffMs = now - selfAfk.timestamp;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);

            let human;
            if (diffHour > 0) human = `${diffHour} saat ${diffMin % 60} dk`;
            else if (diffMin > 0) human = `${diffMin} dk ${diffSec % 60} sn`;
            else human = `${diffSec} saniye`;

            await Afk.deleteOne({ userID });

            try {
                const original = message.member.displayName.replace(/^AFK \|\s?/, "");
                if (original !== message.member.displayName) {
                    await message.member.setNickname(original);
                }
            } catch (e) { }

            return message
                .reply(`AFK modundan çıktınız. Süre: **${human}**.`)
                .then(m => setTimeout(() => m.delete(), 3000));
        }

        if (message.mentions.users.size > 0) {
            for (const [id, user] of message.mentions.users) {
                const target = await Afk.findOne({ userID: id });
                if (target) {
                    const elapsedMs = Date.now() - target.timestamp;
                    const elapsedSec = Math.floor(elapsedMs / 1000);
                    const elapsedMin = Math.floor(elapsedSec / 60);
                    const elapsedHour = Math.floor(elapsedMin / 60);

                    let human;
                    if (elapsedHour > 0) human = `${elapsedHour} saat ${elapsedMin % 60} dk`;
                    else if (elapsedMin > 0) human = `${elapsedMin} dk ${elapsedSec % 60} sn`;
                    else human = `${elapsedSec} saniye`;

                    const afkMsg = `**${user.username}** şu anda AFK.\nSebep: ${target.reason}\n(AFK Kaldığı Süre: ${human})`;
                    const reply = await message.reply({ content: afkMsg });
                    setTimeout(() => reply.delete().catch(() => { }), 3000);
                }
            }
        }

    }
}