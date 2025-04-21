const client = global.client;
const { Events, Embed, EmbedBuilder } = require('discord.js');
const Stats = require('../../models/Stats');
const StatsSettings = require('../../models/StatsSettings');
const moment = require('moment');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {

        if (!message.guild || message.author.bot) return;

        const setting = await StatsSettings.findOne({ guildId: message.guild.id });
        if (!setting?.sistemDurumu) return;

        const date = new Date().toISOString().split('T')[0];
        const week = moment().isoWeek();

        const stats = await Stats.findOneAndUpdate(
            { guildId: message.guild.id, userId: message.author.id },
            { $inc: { totalMessages: 1 } },
            { upsert: true, new: true }
        );

        // Günlük ve haftalık
        stats.dailyMessages.set(date, (stats.dailyMessages.get(date) || 0) + 1);
        stats.weeklyMessages.set(week.toString(), (stats.weeklyMessages.get(week.toString()) || 0) + 1);

        // Kanal bazlı
        const channel = stats.channelMessages.get(message.channel.id) || { total: 0, daily: new Map(), weekly: new Map() };
        channel.total++;
        channel.daily.set(date, (channel.daily.get(date) || 0) + 1);
        channel.weekly.set(week.toString(), (channel.weekly.get(week.toString()) || 0) + 1);
        stats.channelMessages.set(message.channel.id, channel);

        await stats.save();

    },
};
