require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
module.exports = {
    category: "Kurucu",
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("eval")
        .setDescription("Kurucu özel bir komut.")
        .addStringOption(option =>
            option
                .setName('kod')
                .setDescription('Eval için kodunuz.')
                .setRequired(true)),

    run: async (client, interaction) => {

        if (interaction.user.id !== process.env.DEVELOPERID) return interaction.reply({
            content: ":x: | Bu komut bot sahibine özeldir!",
            ephemeral: true,
        })

        try {

            const code = interaction.options.getString("kod")
            let evaled = await eval(code);

            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled);

            const embed = new EmbedBuilder()
                .setAuthor({ name: "Eval", iconURL: interaction.user.avatarURL() })
                .addFields([
                    { name: "KOD:", value: `\`\`\`${code}\`\`\`` },
                    { name: "SONUÇ:", value: `\`\`\`${evaled}\`\`\`` },
                ])
                .setColor(client.green)

            interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (err) {

            return interaction.reply({
                content: `\`HATA\` \`\`\`\n${err}\`\`\``,
                ephemeral: true,
            });

        }
    },

};