const { Events, EmbedBuilder, AuditLogEvent } = require("discord.js");
const LogSettings = require("../../models/LogsSettings");

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {

        const timestamp = Math.floor(Date.now() / 1000);
        const guild = newState.guild;

        const logData = await LogSettings.findOne({ guildId: guild.id });
        if (!logData?.sistemDurumu || !logData.sesDurumu || !logData.sesLogChannelId) return;
        const logChannel = guild.channels.cache.get(logData.sesLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;

        // ——— 1) Join ———
        if (!oldState.channelId && newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor(client.green)
                .setTitle(`✅ SES KANALINA KATILDI`)
                .setAuthor({
                    name: `${newState.member.user.username}`,
                    iconURL: newState.member.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(`
<@${newState.id}> **${newState.channel.name}** kanalına katıldı.

\`🗓️\`  Tarih:  ${`<t:${timestamp}:R>`}
`)
            return logChannel.send({ embeds: [embed] });
        }

        // ——— 2) Leave / Kick ———
        if (oldState.channelId && !newState.channelId) {
            const audit = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberDisconnect });
            const entry = audit.entries.first();
            const moderator = entry?.targetId === oldState.id ? entry.executor.tag : null;

            const description = moderator
                ? `**${oldState.member.user.tag}**, ${moderator} tarafından kanaldan atıldı.`
                : `<@${oldState.id}> **${oldState.channel.name}** kanalından ayrıldı.`;

            const title = moderator
                ? `⛔ SES KANALINDAN ATILDI`
                : `⛔ SES KANALINDAN AYRILDI`;

            const embed = new EmbedBuilder()
                .setColor(client.red)
                .setTitle(title)
                .setAuthor({
                    name: `${oldState.member.user.username}`,
                    iconURL: oldState.member.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(`
${description}

\`🗓️\`  Tarih:  ${`<t:${timestamp}:R>`}
        `)

            return logChannel.send({ embeds: [embed] });
        }

        // ——— 3) Switch ———
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            const audit = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberMove });
            const entry = audit.entries.first();
            const moderator = entry?.targetId === newState.id ? entry.executor : `<@${newState.member.user.id}>`;

            const embed = new EmbedBuilder()
                .setColor(client.blue)
                .setTitle(`🔊 SES KANALI DEĞİŞTİRDİ`)
                .setAuthor({
                    name: `${newState.member.user.username}`,
                    iconURL: newState.member.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(`
**${oldState.channel}** ➔ **${newState.channel}**

\`✍️\`  Moderatör:  ${moderator}
\`🗓️\`  Tarih:  ${`<t:${timestamp}:R>`}
`)

            return logChannel.send({ embeds: [embed] });
        }

        // ——— 4) Server‑Mute / Unmute ———
        if (oldState.serverMute !== newState.serverMute) {
            const isMute = newState.serverMute;
            const audit = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
            const entry = audit.entries.first();
            const moderator = entry?.targetId === newState.id && entry.changes.some(c => c.key === "mute")
                ? entry.executor
                : "Bilinmeyen";

            const title = isMute
                ? `🔇 SUSTURULDU`
                : `🔊 SUSTURMA KALDIRILDI`;

            const color = isMute
                ? client.red
                : client.green

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setAuthor({
                    name: `${newState.member.user.username}`,
                    iconURL: newState.member.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(`
**<@${newState.id}>**, ${moderator} tarafından ${isMute ? "sunucuda susturuldu." : "susturması kaldırıldı."}

\`🗓️\`  Tarih:  ${`<t:${timestamp}:R>`}
`)

            return logChannel.send({ embeds: [embed] });
        }

        // ——— 5) Server‑Deaf / Undeaf ———
        if (oldState.serverDeaf !== newState.serverDeaf) {
            const isDeaf = newState.serverDeaf;
            const audit = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
            const entry = audit.entries.first();
            const moderator = entry?.targetId === newState.id && entry.changes.some(c => c.key === "deaf")
                ? entry.executor
                : "Bilinmeyen";

            const title = isDeaf
                ? `🔇 SUSTURULDU`
                : `🔊 SUSTURMA KALDIRILDI`;

            const color = isDeaf
                ? client.red
                : client.green

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setAuthor({
                    name: `${newState.member.user.username}`,
                    iconURL: newState.member.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(`
**${newState.member.user.tag}**, ${moderator} tarafından ${isDeaf ? "sunucuda sağırlaştırıldı." : "sağırlaştırması kaldırıldı."}

\`🗓️\`  Tarih:  ${`<t:${timestamp}:R>`}
`)

            return logChannel.send({ embeds: [embed] });
        }

        // ——— 6) Self‑Mute / Self‑Deaf ———
        if (oldState.selfMute !== newState.selfMute) {

            const title = newState.selfMute
                ? `🔇 KENDİSİNİ SUSTURDU`
                : `🔊 KENDİ SUSTURMASINI KALDIRDI`;

            const color = newState.selfMute
                ? client.red
                : client.green

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setAuthor({
                    name: `${newState.member.user.username}`,
                    iconURL: newState.member.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(`
<@${newState.id}>, ${newState.channel} kanalında ${newState.selfMute ? "kendisini susturdu." : "kendi susturmasını kaldırdı."}

\`🗓️\`  Tarih:  ${`<t:${timestamp}:R>`}
`)

            return logChannel.send({ embeds: [embed] });
        }

    }
};
