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

const { SlashCommandBuilder } = require("discord.js");
const Afk = require("../../models/AfkData");
module.exports = {
    category: "Utility",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("afk")
        .setDescription("AFK modunu açar/kapatır.")
        .addStringOption(opt =>
            opt.setName("sebep")
                .setDescription("AFK sebebiniz")
                .setRequired(false))
        .addBooleanOption(opt =>
            opt.setName("nickdegis")
                .setDescription("Nickname'e AFK | eklensin mi?")
                .setRequired(false)),

    run: async (client, interaction) => {

        const userID = interaction.user.id;
        const reason = interaction.options.getString("sebep") || "AFK";
        const nickChg = interaction.options.getBoolean("nickdegis") || false;

        const existing = await Afk.findOne({ userID });
        if (existing) {
            const now = Date.now();
            const diffMs = now - existing.timestamp;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);

            let human;
            if (diffHour > 0) human = `${diffHour} saat ${diffMin % 60} dk`;
            else if (diffMin > 0) human = `${diffMin} dk ${diffSec % 60} sn`;
            else human = `${diffSec} saniye`;

            await Afk.deleteOne({ userID });

            try {
                const member = interaction.member;
                const original = member.displayName.replace(/^AFK \|\s?/, "");
                if (original !== member.displayName) {
                    await member.setNickname(original);
                }
            } catch (e) { /* yetki yoksa atla */ }

            return interaction.reply({
                content: `✅ | AFK modundan çıktınız. Toplam **AFK** süreniz: **${human}**.`,
                ephemeral: true
            });
        }

        await Afk.create({ userID, reason, timestamp: Date.now() });

        if (nickChg) {
            const member = interaction.member;
            const newNick = `AFK | ${member.displayName}`;
            if (newNick.length <= 32) {
                try {
                    await member.setNickname(newNick);
                } catch (e) {
                    return interaction.reply({
                        content: ":x: | Nickname güncellenemedi, yetkim yetersiz olabilir. Ancak yine de **AFK** oldunuz.",
                        ephemeral: true
                    });
                }
            } else {
                return interaction.reply({
                    content: ":x: | Nickname çok uzun, `AFK |` eklenemedi. Ancak yine de **AFK** oldunuz.",
                    ephemeral: true
                });
            }
        }

        return interaction.reply({
            content: `✅ | AFK moduna geçtiniz. Sebep: **${reason}**`,
            ephemeral: true
        });

    }
};
