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
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {

        if (newState.member.user.bot) return;

        if (newState.channel && !oldState.channel) {
            newState.member.joinTimestamp = Date.now();
        }

        else if (!newState.channel && oldState.channel) {
            const joined = oldState.member.joinTimestamp;
            const seconds = Math.floor((Date.now() - joined) / 1000);
            const gained = voiceXP(seconds);
            const progress = await Progress.findOne({ guildId: oldState.guild.id, userId: oldState.id, groupName: { $exists: true } });
            if (!progress) return;
            progress.xp += gained;
            const grp = await Group.findOne({ guildId: oldState.guild.id, name: progress.groupName });
            const needed = xpForNext(progress.level, grp.difficulty);
            if (progress.xp >= needed) {
                progress.xp -= needed;
                progress.level++;
                const member = await oldState.guild.members.fetch(oldState.id);
                const nextRole = grp.roles.find(r => r.level === progress.level);
                if (nextRole) await member.roles.add(nextRole.roleId);
                oldState.guild.systemChannel.send(`<@${oldState.id}> seviye atladı! Yeni seviyesi: ${progress.level}`);
            }
            await progress.save();
        }

    },
};

function voiceXP(seconds) {
    return Math.floor(seconds * 0.1);
}

function xpForNext(level, difficulty) {
    let base, mul;
    switch (difficulty) {
        case 'kolay': base = 100; mul = 1.01; break;
        case 'orta': base = 200; mul = 1.02; break;
        case 'zor': base = 300; mul = 1.03; break;
    }
    return level * base * mul;
}