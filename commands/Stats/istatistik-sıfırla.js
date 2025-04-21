const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Stats = require('../../models/Stats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('istatistik-sıfırla')
        .setDescription('Seçtiğiniz kullanıcının istatistiklerini sıfırlar.')
        .addUserOption(opt =>
            opt.setName('kullanıcı')
                .setDescription('İstatistiklerini sıfırlamak istediğin kullanıcı.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    run: async (client, interaction) => {

        const user = interaction.options.getUser('kullanıcı');
        await Stats.deleteMany({ guildId: interaction.guild.id, userId: user.id });
        return interaction.reply({ content: `${user} için tüm istatistikler sıfırlandı.`, ephemeral: false });

    }
};
