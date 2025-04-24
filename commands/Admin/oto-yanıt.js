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

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AutoReply = require('../../models/AutoReply');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('oto-yanıt')
        .setDescription('Otomatik yanıt sistemini yönetir')
        .addSubcommand(sub =>
            sub
                .setName('ekle')
                .setDescription('Yeni otomatik yanıt ekle')
                .addStringOption(opt => opt
                    .setName('mesaj')
                    .setDescription('Dinlenecek mesaj')
                    .setRequired(true))
                .addStringOption(opt => opt
                    .setName('yanit')
                    .setDescription('Verilecek yanıt')
                    .setRequired(true))
                .addChannelOption(opt => opt
                    .setName('kanal')
                    .setDescription('Yanıtın çalışacağı kanal (opsiyonel)')
                    .setRequired(false)))
        .addSubcommand(sub =>
            sub
                .setName('kaldır')
                .setDescription('Otomatik yanıt kaldır')
                .addIntegerOption(opt => opt
                    .setName('id')
                    .setDescription('Yanıt ID')
                    .setRequired(true)))
        .addSubcommand(sub =>
            sub
                .setName('ayarla')
                .setDescription('Embed ayarını güncelle')
                .addIntegerOption(opt => opt
                    .setName('id')
                    .setDescription('Yanıt ID')
                    .setRequired(true))
                .addBooleanOption(opt => opt
                    .setName('embed')
                    .setDescription('Embed olarak gönderilsin mi?')
                    .setRequired(true)))
        .addSubcommand(sub =>
            sub
                .setName('liste')
                .setDescription('Tüm otomatik yanıtları listeler'))
        .addSubcommand(sub =>
            sub
                .setName('aç')
                .setDescription("Belirli ID'li otomatik yanıtı aktif eder")
                .addIntegerOption(opt => opt
                    .setName('id')
                    .setDescription('Yanıt ID')
                    .setRequired(true)))
        .addSubcommand(sub =>
            sub
                .setName('kapat')
                .setDescription("Belirli ID'li otomatik yanıtı devre dışı bırakır")
                .addIntegerOption(opt => opt
                    .setName('id')
                    .setDescription('Yanıt ID')
                    .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async (client, interaction) => {

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (sub === 'ekle') {

            const trigger = interaction.options.getString('mesaj');
            const response = interaction.options.getString('yanit');
            const channel = interaction.options.getChannel('kanal');
            const channelId = channel ? channel.id : null;
            const last = await AutoReply.find({ guildId }).sort({ autoId: -1 }).limit(1);
            const nextId = last.length ? last[0].autoId + 1 : 1;
            await AutoReply.create({ guildId, autoId: nextId, trigger, response, channelId });
            return interaction.reply({ content: `✅ | Otomatik yanıt eklendi. ID: **${nextId}**${channelId ? ` | Kanal: <#${channelId}>` : ''}`, ephemeral: true });

        }

        else if (sub === 'kaldır') {

            const id = interaction.options.getInteger('id');
            const res = await AutoReply.findOneAndDelete({ guildId, autoId: id });
            if (!res) return interaction.reply({ content: `⚠️ ID **${id}** bulunamadı.`, ephemeral: true });
            return interaction.reply({ content: `✅ | ID **${id}** kaldırıldı.`, ephemeral: true });

        }

        else if (sub === 'ayarla') {

            const id = interaction.options.getInteger('id');
            const embedOpt = interaction.options.getBoolean('embed');
            const res = await AutoReply.findOneAndUpdate(
                { guildId, autoId: id },
                { embed: embedOpt },
                { new: true }
            );

            if (!res) return interaction.reply({ content: `:x: | ID **${id}** bulunamadı.`, ephemeral: true });
            return interaction.reply({ content: `✅ | ID **${id}** için embed: **${embedOpt}** olarak ayarlandı.`, ephemeral: true });

        }

        else if (sub === 'liste') {

            const list = await AutoReply.find({ guildId }).sort({ autoId: 1 });
            if (!list.length) return interaction.reply({ content: ':x: | Henüz otomatik yanıt eklenmemiş.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle('Otomatik Yanıt Listesi')
                .setColor(client.color)
                .setDescription(list.map(r =>
                    `**ID:** ${r.autoId}` +
                    ` | **Trigger:** \`${r.trigger}\`` +
                    ` | **Embed:** ${r.embed}` +
                    ` | **Durum:** ${r.enabled ? 'Açık' : 'Kapalı'}` +
                    ` | **Kanal:** ${r.channelId ? `<#${r.channelId}>` : 'Her Kanal'}`
                ).join('\n'));

            return interaction.reply({ embeds: [embed], ephemeral: true });

        }

        else if (sub === 'aç' || sub === 'kapat') {

            const id = interaction.options.getInteger('id');
            const enable = sub === 'aç';
            const res = await AutoReply.findOneAndUpdate(
                { guildId, autoId: id },
                { enabled: enable },
                { new: true }
            );

            if (!res) return interaction.reply({ content: `:x: | ID **${id}** bulunamadı.`, ephemeral: true });
            return interaction.reply({ content: `✅ | ID **${id}** için durum: **${enable ? 'Açık' : 'Kapalı'}** olarak güncellendi.`, ephemeral: true });

        }

    }
};
