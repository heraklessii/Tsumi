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
const ReactionRole = require('../../models/ReactionRole');

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (err) {
                return;
            }
        }

        const { message, emoji } = reaction;
        if (!message.guild) return;

        const member = await message.guild.members
            .fetch(user.id)
            .catch(err => {
                return null;
            });
        if (!member) return;

        const doc = await ReactionRole.findOne(
            { guildId: message.guild.id, 'messages.messageId': message.id },
            { 'messages.$': 1 }
        ).catch(err => {
            return null;
        });
        const msgCfg = doc?.messages?.[0];
        if (!msgCfg) return;

        const map = msgCfg.roles.find(r =>
            r.emoji === emoji.id || r.emoji === emoji.toString()
        );
        if (!map) return;

        const hasWhitelist = Array.isArray(msgCfg.whitelistRoles) && msgCfg.whitelistRoles.length > 0;
        const inWhitelist = hasWhitelist && msgCfg.whitelistRoles.some(r => member.roles.cache.has(r));
        const inBlacklist = Array.isArray(msgCfg.blacklistRoles) && msgCfg.blacklistRoles.some(r => member.roles.cache.has(r));
        if ((hasWhitelist && !inWhitelist) || inBlacklist) return;

        const targetRoleId = map.roleId;
        const roleObj = message.guild.roles.cache.get(targetRoleId)
            || await message.guild.roles.fetch(targetRoleId).catch(err => {
                return null;
            });

        const roleName = roleObj?.name || 'Bilinmeyen Rol';
        const cache = member.roles.cache;
        const mode = msgCfg.mode;

        try {
            switch (mode) {
                // normal, unique ve limit modlarında rolü kaldır
                case 'normal':
                case 'unique':
                case 'limit':
                    if (cache.has(targetRoleId)) {
                        await member.roles.remove(targetRoleId);
                    }
                    break;

                // reversed modunda kaldırılan reaksiyona karşılık rol ekle
                case 'reversed':
                    if (!cache.has(targetRoleId)) {
                        await member.roles.add(targetRoleId);
                    }
                    break;

                // verify, drop, binding modlarında tepki kaldırmak DM tetiklemez
                case 'verify':
                case 'drop':
                case 'binding':
                    break;

                default:
            }

        } catch (err) {
            sendRoleRemoveFailedDM(user, roleName, message);
        }
    }
};

function createEmbed(user, roleName, message, description) {
    return new EmbedBuilder()
        .setColor(client.red)
        .setTitle(message.guild.name)
        .setDescription(`${user}, ${description}`)
        .setFooter({ text: 'Tsumi, HERA tarafından geliştirilmektedir.' });
}

function sendRoleRemoveFailedDM(user, roleName, message) {
    const embed = createEmbed(user, roleName, message, `**${roleName}** rolü kaldırılamadı.`);
    return user.send({ embeds: [embed] })
        .catch(err => { });
}

