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
const Progress = require('../../models/YProgress');
const Group = require('../../models/YGroup');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {

        if (!message.guild || message.author.bot) return;

        const progress = await Progress.findOne({ guildId: message.guild.id, userId: message.author.id, groupName: { $exists: true } });
        if (!progress) return;
        const grp = await Group.findOne({ guildId: message.guild.id, name: progress.groupName });
        if (!grp || !['metin', 'metin+ses'].includes(grp.type)) return;

        const gained = randomMessageXP();
        progress.xp += gained;
        const needed = xpForNext(progress.level, grp.difficulty);
        if (progress.xp >= needed) {
            progress.xp -= needed;
            progress.level++;
            const nextRole = grp.roles.find(r => r.level === progress.level);
            if (nextRole) await message.member.roles.add(nextRole.roleId);
            message.channel.send(`${message.member} seviye atladı! Yeni seviyen: ${progress.level}`);
        }

        await progress.save();

    },
};


function randomMessageXP() {
  return Math.floor(Math.random() * (5 - 3 + 1)) + 3;
}

function xpForNext(level, difficulty) {
  let base, mul;
  switch(difficulty) {
    case 'kolay': base=100; mul=1.01; break;
    case 'orta':  base=200; mul=1.02; break;
    case 'zor':   base=300; mul=1.03; break;
  }
  return level * base * mul;
}
