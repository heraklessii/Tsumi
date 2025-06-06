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

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardım')
        .setDescription('Bot komutlarını gösterir!'),

    run: async (client, interaction) => {

        const categoryEmojis = {
            Admin: '⚙️',
            Info: '🛡️',
            Fun: '🛡️',
            Utility: '🛠️',
        };

        const categoriesPath = path.join(__dirname, '..');
        const categories = fs
            .readdirSync(categoriesPath)
            .filter(category => category !== 'Developer');

        const categoryOptions = categories.map(category => ({
            label: `${categoryEmojis[category] || ''} ${category}`,
            value: category,
            description: `${category} kategorisindeki komutları görüntüle`
        }));

        const mainEmbed = new EmbedBuilder()
            .setTitle('📖 Yardım Menüsü')
            .setDescription('Bir kategori seçerek komutları görüntüleyebilirsin.')
            .setColor(client.color)
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Bu menü 3 dakika içinde sona erecek.' });

        const bannerURL = client.user.bannerURL() || process.env.BOT_BANNER_URL;
        if (bannerURL) mainEmbed.setImage(bannerURL);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('yardim_kategori')
            .setPlaceholder('Kategori seçin')
            .addOptions(categoryOptions);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        const message = await interaction.reply({
            embeds: [mainEmbed],
            components: [selectRow],
            ephemeral: true
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 180_000
        });

        collector.on('collect', async i => {

            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Bu menüyü kullanamazsın.', ephemeral: true });

            const selected = i.values[0];
            const cmdFiles = fs.readdirSync(path.join(categoriesPath, selected))
                .filter(f => f.endsWith('.js'));

            const list = cmdFiles.map(file => {
                const cmd = require(`../${selected}/${file}`);
                const cmdData = client.application.commands.cache.find(c => c.name === cmd.data.name);
                const mention = cmdData ? `</${cmd.data.name}:${cmdData.id}>` : `\`${cmd.data.name}\``;
                return `${mention} : ${cmd.data.description}`;
            }).join('\n') || 'Bu kategoride komut bulunamadı.';

            const categoryEmbed = new EmbedBuilder()
                .setTitle(`${categoryEmojis[selected] || ''} ${selected} Komutları`)
                .setDescription(list)
                .setColor(client.color);

            const backButton = new ButtonBuilder()
                .setCustomId('yardim_geri')
                .setLabel('🔙 Geri Dön')
                .setStyle(ButtonStyle.Secondary);

            const buttonRow = new ActionRowBuilder().addComponents(backButton);

            await i.update({ embeds: [categoryEmbed], components: [buttonRow] });
        });

        collector.on('end', async () => {

            const disabled = new ActionRowBuilder()
                .addComponents(selectMenu.setDisabled(true));
            await message.edit({ components: [disabled] });
        });

        const backCollector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 180_000
        });

        backCollector.on('collect', async i => {
            if (i.customId === 'yardim_geri' && i.user.id === interaction.user.id) {
                await i.update({ embeds: [mainEmbed], components: [selectRow] });
            }
        });
    }
};
