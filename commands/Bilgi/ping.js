const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    category: "Bilgi",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("ping")
        .setNameLocalizations({ tr: 'ping' })
        .setDescription("You can see the current ping of the bot.")
        .setDescriptionLocalizations({ tr: 'Botun güncel gecikmesini öğrenirsiniz.' }),

    run: async (client, interaction) => {
        const locales = {
            tr: {
                title: "⌚ Gecikme Bilgi"
            },
            default: {
                title: "⌚ Ping"
            }
        };

        const locale = locales[interaction.locale] || locales.default;

        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle(locale.title)
            .addFields([{ name: "🏓 Pong:", value: `**${client.ws.ping}ms**` }])
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
