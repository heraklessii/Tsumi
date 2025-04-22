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

const { EmbedBuilder } = require("discord.js");
const ChannelID = process.env.LOGS;

module.exports = async (client) => {
    const createEmbed = (title, description) => {
        return new EmbedBuilder()
            .setColor(client.color)
            .setFooter({ text: "Tsumi Anti-Crash" })
            .setTitle(title)
            .setDescription(description);
    };

    const sendError = (title, description) => {
        const channel = client.channels.cache.get(ChannelID);
        if (!channel) {
            console.error("Log kanalı bulunamadı!");
            return;
        }

        const embed = createEmbed(title, description);
        channel.send({ embeds: [embed] }).catch(console.error);
    };

    const handleError = (eventName, error, origin) => {
        console.error(`[${eventName}]`, error, origin);
        sendError(
            `⚠️ ${eventName}`,
            `**${eventName}:\n\n** \`\`\`${error}\n\n${origin?.toString() || "Bilinmeyen Köken"}\`\`\``
        );
    };

    process.on("unhandledRejection", (reason, promise) => {
        handleError("Unhandled Rejection", reason, promise);
    });

    process.on("uncaughtException", (error, origin) => {
        handleError("Uncaught Exception", error, origin);
    });

    process.on("uncaughtExceptionMonitor", (error, origin) => {
        handleError("Uncaught Exception (Monitor)", error, origin);
    });
    
};