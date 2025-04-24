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

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const PremiumCode = require('../../models/PremiumCode');
const PremiumGuild = require('../../models/PremiumGuild');
const crypto = require('crypto');
module.exports = {
    category: "Kurucu",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Premium sistemi komutları')
        .addSubcommand(sub =>
            sub.setName('oluştur')
                .setDescription('Yeni bir premium kodu oluştur')
                .addStringOption(opt =>
                    opt.setName('süre')
                        .setDescription('Premium süresi')
                        .setRequired(true)
                        .addChoices(
                            { name: '1 Ay', value: '30' },
                            { name: '3 Ay', value: '90' },
                            { name: '6 Ay', value: '180' },
                            { name: '9 Ay', value: '270' },
                            { name: '1 Sene', value: '365' }
                        )))
        .addSubcommand(sub =>
            sub.setName('kullan')
                .setDescription('Premium kodu kullan')
                .addStringOption(opt =>
                    opt.setName('kod')
                        .setDescription('Premium kodu')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('kaldır')
                .setDescription('Premium iptali')
                .addStringOption(opt =>
                    opt.setName('kod')
                        .setDescription('Kaldırmak istediğiniz premium kodu')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('durum')
                .setDescription('Sunucunun premium durumunu gösterir')),

    run: async (client, interaction) => {
        const sub = interaction.options.getSubcommand();

        // Oluştur
        if (sub === 'oluştur') {
            if (interaction.user.id !== process.env.DEVELOPERID)
                return interaction.reply({ content: ":x: | Bu komut bot sahibine özeldir!", ephemeral: true });

            const days = parseInt(interaction.options.getString('süre'));
            const code = generateCode(8);
            await new PremiumCode({ code, durationDays: days }).save();
            return interaction.reply(`✅ Premium kod oluşturuldu: \`${code}\` geçerlilik: ${days} gün`);
        }

        // Kullan
        else if (sub === 'kullan') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
                return interaction.reply({ content: ':x: | Bu komudu kullanabilmek için yetkiniz yetersiz.', ephemeral: true });

            const existing = await PremiumGuild.findOne({ guildId: interaction.guildId });
            if (existing)
                return interaction.reply({ content: ':x: | Bu sunucuda zaten aktif bir premium üyeliğiniz bulunuyor.', ephemeral: true });

            const code = interaction.options.getString('kod');
            const record = await PremiumCode.findOne({ code });
            if (!record)
                return interaction.reply({ content: 'Geçersiz veya kullanılmış kod.', ephemeral: true });

            const expiresAt = new Date(Date.now() + record.durationDays * 24 * 60 * 60 * 1000);
            await new PremiumGuild({ guildId: interaction.guildId, code, expiresAt }).save();
            await PremiumCode.deleteOne({ code });
            return interaction.reply(`🎉 Premium aktif edildi. Bitiş tarihi: <t:${Math.floor(expiresAt.getTime()/1000)}:F> (<t:${Math.floor(expiresAt.getTime()/1000)}:R>)`);
        }

        // Kaldır
        else if (sub === 'kaldır') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
                return interaction.reply({ content: ':x: | Bu komudu kullanabilmek için yetkiniz yetersiz.', ephemeral: true });

            const code = interaction.options.getString('kod');
            const removed = await PremiumGuild.deleteOne({ guildId: interaction.guildId, code });
            if (removed.deletedCount === 0)
                return interaction.reply({ content: ':x: | Bu kod ile eşleşen aktif premium bulunamadı.', ephemeral: true });

            return interaction.reply('✅ Premium başarıyla kaldırıldı.');
        }

        // Durum
        else if (sub === 'durum') {
            const record = await PremiumGuild.findOne({ guildId: interaction.guildId });
            if (!record)
                return interaction.reply({ content: ':x: | Bu sunucuda aktif premium bulunmuyor.', ephemeral: true });

            const expiresAt = record.expiresAt;
            return interaction.reply(`🔔 Sunucunun premium bitiş tarihi: <t:${Math.floor(expiresAt.getTime()/1000)}:F> (<t:${Math.floor(expiresAt.getTime()/1000)}:R>)`);
        }
        
    }
};

function generateCode(length = 12) {
    return crypto.randomBytes(length).toString('hex');
}