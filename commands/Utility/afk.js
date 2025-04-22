const { SlashCommandBuilder } = require("discord.js");
const Afk = require("../../models/AfkData");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("afk")
        .setDescription("AFK modunu açar/kapatır.")
        .addStringOption(opt =>
            opt.setName("sebep")
                .setDescription("AFK sebebiniz")
                .setRequired(false)
        )
        .addBooleanOption(opt =>
            opt.setName("nickdegis")
                .setDescription("Nickname'e AFK | eklensin mi?")
                .setRequired(false)
        ),

    run: async (client, interaction) => {

        const userID = interaction.user.id;
        const reason = interaction.options.getString("sebep") || "AFK";
        const nickChg = interaction.options.getBoolean("nickdegis") || false;

        const existing = await Afk.findOne({ userID });
        // — Eğer zaten AFK ise: çıkışı yap ve süreyi hesapla —
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

            // Nick'i orijinal hale döndür
            try {
                const member = interaction.member;
                const original = member.displayName.replace(/^AFK \|\s?/, "");
                if (original !== member.displayName) {
                    await member.setNickname(original);
                }
            } catch (e) { /* yetki yoksa atla */ }

            return interaction.reply({
                content: `AFK modundan çıktınız. Toplam AFK süreniz: **${human}**.`,
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
                        content: "Nickname güncellenemedi, yetkim yetersiz olabilir.",
                        ephemeral: true
                    });
                }
            } else {
                return interaction.reply({
                    content: "Nickname çok uzun, `AFK |` eklenemedi.",
                    ephemeral: true
                });
            }
        }

        return interaction.reply({
            content: `AFK moduna geçtiniz. Sebep: **${reason}**`,
            ephemeral: true
        });
    }
};
