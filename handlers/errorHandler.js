const { EmbedBuilder } = require("discord.js");
const ChannelID = process.env.LOGS;

module.exports = async (client) => {
    const createEmbed = (title, description) => {
        return new EmbedBuilder()
            .setColor(client.color)
            .setFooter({ text: "Tsumi Anti-Crash Sistemi" })
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