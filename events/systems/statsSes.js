require("dotenv").config();
const { Events } = require('discord.js');
const Stats = require('../../models/Stats');
const StatsSettings = require('../../models/StatsSettings');
const moment = require('moment');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {

        const member = newState.member;
        if (!member || member.user.bot || !member.guild) return;

        const setting = await StatsSettings.findOne({ guildId: member.guild.id });
        if (!setting?.sistemDurumu) return;

        const stats = await Stats.findOneAndUpdate(
            { guildId: member.guild.id, userId: member.id },
            {},
            { upsert: true, new: true }
        );

        const now = Date.now();

        // Kullanıcı kanala GİRDİ
        if (!oldState.channelId && newState.channelId) {
            stats.lastJoin = now;
            await stats.save();
            return;
        }

        // Kullanıcı kanaldan ÇIKTI
        if (oldState.channelId && !newState.channelId && stats.lastJoin) {
            const duration = Math.floor((now - stats.lastJoin) / 1000); // saniye cinsinden
            const date = new Date().toISOString().split('T')[0];
            const week = moment().isoWeek();
            stats.totalVoice += duration;
            stats.dailyVoice.set(date, (stats.dailyVoice.get(date) || 0) + duration);
            stats.weeklyVoice.set(week.toString(), (stats.weeklyVoice.get(week.toString()) || 0) + duration);

            const channel = stats.channelVoice.get(oldState.channelId) || { total: 0, daily: new Map(), weekly: new Map() };
            channel.total += duration;
            channel.daily.set(date, (channel.daily.get(date) || 0) + duration);
            channel.weekly.set(week.toString(), (channel.weekly.get(week.toString()) || 0) + duration);
            stats.channelVoice.set(oldState.channelId, channel);

            stats.lastJoin = undefined;
            await stats.save();
        }

    },
};
