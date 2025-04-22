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
  name: Events.MessageReactionAdd,
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
    let roleObj = message.guild.roles.cache.get(targetRoleId)
      || await message.guild.roles.fetch(targetRoleId).catch(err => {
        return null;
      });

    const roleName = roleObj?.name || 'Bilinmeyen Rol';
    const cache = member.roles.cache;
    const mode = msgCfg.mode;

    try {
      switch (mode) {
        case 'normal':
          if (!cache.has(targetRoleId)) {
            await member.roles.add(targetRoleId);
          }
          break;

        case 'unique':
          for (const r of msgCfg.roles) {
            if (cache.has(r.roleId) && r.roleId !== targetRoleId) {
              await member.roles.remove(r.roleId);
            }
          }
          if (!cache.has(targetRoleId)) {
            await member.roles.add(targetRoleId);
          }
          break;

        case 'verify':
          if (!cache.has(targetRoleId)) {
            await member.roles.add(targetRoleId);
          }
          break;

        case 'drop':
        case 'reversed':
          if (cache.has(targetRoleId)) {
            await member.roles.remove(targetRoleId);
          }
          break;

        case 'limit': {
          const ownedCount = msgCfg.roles.filter(r => cache.has(r.roleId)).length;
          if (ownedCount < (msgCfg.maxRoles || 0)) {
            if (!cache.has(targetRoleId)) {
              await member.roles.add(targetRoleId);
            }
          } else if (message.guild.members.me.permissions.has('ManageMessages')) {
            sendRoleLimitFailedDM(user, roleName, message, client);
            await reaction.users.remove(user.id);
          }
          break;
        }

        case 'binding': {
          const hasAny = msgCfg.roles.some(r => cache.has(r.roleId));
          if (!hasAny) {
            await member.roles.add(targetRoleId);
          } else if (message.guild.members.me.permissions.has('ManageMessages')) {
            await reaction.users.remove(user.id);
          }
          break;
        }

        default:
      }

    } catch (err) {
      sendRoleAddFailedDM(user, roleName, message, client);
    }
  }
};

function createEmbed(user, roleName, message, description) {
  return new EmbedBuilder()
    .setColor(client.red)
    .setTitle(`Sunucu: ` + message.guild.name)
    .setDescription(`${user}, ${description}`)
    .setFooter({ text: 'Tsumi, HERA tarafından geliştirilmektedir.' });
}

function sendRoleAddFailedDM(user, roleName, message) {
  const embed = createEmbed(user, roleName, message, `**${roleName}** rolü eklenemedi.`);
  return user.send({ embeds: [embed] })
    .catch(err => {});
}

function sendRoleLimitFailedDM(user, roleName, message) {
    const embed = createEmbed(user, roleName, message, `**${roleName}** rolü eklenemedi.\nÇünkü bu rol grubu için limit'e ulaştınız.`);
    return user.send({ embeds: [embed] })
      .catch(err => {});
  }