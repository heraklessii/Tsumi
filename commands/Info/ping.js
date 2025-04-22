const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    category: "Info",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Botun güncel gecikmesini öğrenirsiniz."),

    run: async (client, interaction) => {

        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle("⌚ Ping")
            .addFields([{ name: "🏓 Pong:", value: `**${client.ws.ping}ms**` }])
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

    }
};
