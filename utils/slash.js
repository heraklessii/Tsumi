require('dotenv').config();
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const token = process.env.TOKEN;

const slash = {
    register: async (clientId, commands) => {
        const rest = new REST({ version: "10" }).setToken(token);

        try {
            await rest.put(Routes.applicationCommands(clientId), { body: commands });
            console.log("Slash komutları yüklendi.");
        } catch (error) {
            console.error(`Slash komutları yüklenemedi.\n${error}`);
        }
    },
};

module.exports = slash;
