// Tsumi Bot - Discord Bot Project
// Copyright (C) 2025  Tsumi Bot Contributors
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Group = require('../../models/YGroup');
const Progress = require('../../models/YProgress');
const Settings = require('../../models/YSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetki')
        .setDescription('Yetki işlemleri')

        .addSubcommand(sc => sc.setName('kur').setDescription('Yetki grubu oluştur')
            .addStringOption(o => o.setName('grup').setDescription('Grup adı').setRequired(true))
            .addStringOption(o => o.setName('tür').setDescription('metin/ses/metin+ses'))
            .addStringOption(o => o.setName('roller').setDescription('Rol(ler), virgülle ayrılmış ID veya mention dizisi'))
        )
        .addSubcommand(sc => sc.setName('kurucu').setDescription('Kurucu rolü ayarla')
            .addRoleOption(o => o.setName('rol').setDescription('Kurucu rolü').setRequired(true))
        )
        .addSubcommand(sc => sc.setName('başlat').setDescription('Kişiyi yetki grubuna başlat')
            .addUserOption(o => o.setName('kişi').setDescription('Hedef kullanıcı').setRequired(true))
            .addStringOption(o => o.setName('grup').setDescription('Grup adı').setRequired(true))
        )
        .addSubcommand(sc => sc.setName('ayarla').setDescription('Rolleri seviyelere eşle')
            .addStringOption(o => o.setName('grup').setDescription('Grup adı').setRequired(true))
            .addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true))
            .addIntegerOption(o => o.setName('seviye').setDescription('Seviye').setRequired(true))
        )
        .addSubcommand(sc => sc.setName('zorluk').setDescription('Grup zorluğunu ayarla')
            .addStringOption(o => o.setName('grup').setDescription('Grup adı').setRequired(true))
            .addStringOption(o => o.setName('seviye').setDescription('kolay/orta/zor').setRequired(true))
        )
        .addSubcommand(sc => sc.setName('yönetim-ayarla').setDescription('Yönetim rolü sırası')
            .addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true))
            .addIntegerOption(o => o.setName('sıra').setDescription('Pozisyon').setRequired(true))
        )
        .addSubcommand(sc => sc.setName('yetkim').setDescription('Kendi yetkinizi göster'))
        .addSubcommand(sc => sc.setName('sıralama').setDescription('Yetkili sıralaması')
            .addStringOption(o => o.setName('grup').setDescription('Opsiyonel grup adı'))
        )
        .addSubcommand(sc => sc.setName('değiştir').setDescription('Yetki grubunu değiştir')
            .addUserOption(o => o.setName('kişi').setDescription('Hedef kullanıcı').setRequired(true))
            .addStringOption(o => o.setName('grup').setDescription('Yeni grup').setRequired(true))
            .addBooleanOption(o => o.setName('sıfırla-seviye').setDescription('XP & seviye sıfırlansın mı?'))
            .addBooleanOption(o => o.setName('sıfırla-rol').setDescription('Roller silinsin mi?'))
        )
        .addSubcommand(sc => sc.setName('atlat').setDescription('Bir sonraki role atlat')
            .addUserOption(o => o.setName('kişi').setDescription('Hedef kullanıcı').setRequired(true))
        )
        .addSubcommand(sc => sc.setName('düşür').setDescription('Önceki role düşür')
            .addUserOption(o => o.setName('kişi').setDescription('Hedef kullanıcı').setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async run(client, interaction) {

        const { options, guildId, member, guild } = interaction;
        const sub = options.getSubcommand();
        const settings = await Settings.findOne({ guildId });
        const managementRoles = settings?.management?.map(m => m.roleId) || [];
        const isCreator = settings?.creatorRole && member.roles.cache.has(settings.creatorRole);
        const isManagement = managementRoles.some(r => member.roles.cache.has(r));

        try {
            switch (sub) {
                case 'kur': {
                    const name = options.getString('grup');
                    const type = options.getString('tür') || 'metin+ses';
                    const rollerStr = options.getString('roller');
                    const roles = rollerStr
                        ? rollerStr.split(',').map(r => {
                            const id = r.trim().replace(/[<@&>]/g, '');
                            return { roleId: id, level: 1 };
                        })
                        : [];
                    await Group.create({ guildId, name, type, difficulty: 'orta', roles });
                    return interaction.reply({
                        content: `Grup **${name}** (tür: ${type}) oluşturuldu. Roller: ${roles.length ? roles.map(r => `<@&${r.roleId}>`).join(', ') : 'Yok'
                            }`, ephemeral: true
                    });
                }

                case 'kurucu': {
                    if (interaction.user.id !== interaction.guild.ownerId) {
                        return interaction.reply({ content: 'Sadece sunucu sahibi bu komutu kullanabilir.', ephemeral: true });
                    }
                    const creatorRole = options.getRole('rol');
                    await Settings.findOneAndUpdate({ guildId }, { creatorRole: creatorRole.id }, { upsert: true });
                    return interaction.reply({ content: `Kurucu rolü ${creatorRole} olarak ayarlandı.`, ephemeral: true });
                }

                case 'başlat': {
                    const user = options.getUser('kişi');
                    const grpName = options.getString('grup');
                    const grp = await Group.findOne({ guildId, name: grpName });
                    if (!grp) return interaction.reply({ content: 'Böyle bir grup bulunamadı.', ephemeral: true });
                    if (grp.roles.length === 0) return interaction.reply({ content: 'Önce o gruba seviye-rol eşlemesi yapmalısın.', ephemeral: true });

                    let prog = await Progress.findOne({ guildId, userId: user.id });
                    if (!prog) prog = new Progress({ guildId, userId: user.id, groupName: grpName });
                    prog.groupName = grpName;
                    prog.level = 1;
                    prog.xp = 0;
                    await prog.save();

                    const memberObj = await guild.members.fetch(user.id);
                    const firstRole = grp.roles.find(r => r.level === 1);
                    if (firstRole) await memberObj.roles.add(firstRole.roleId);

                    return interaction.reply({ content: `${user} için **${grpName}** grubu başlatıldı ve birinci seviye rolü verildi.`, ephemeral: true });
                }

                case 'ayarla': {
                    const grpName = options.getString('grup');
                    const role = options.getRole('rol');
                    const lvl = options.getInteger('seviye');
                    const grp = await Group.findOne({ guildId, name: grpName });
                    if (!grp) return interaction.reply({ content: 'Grup bulunamadı.', ephemeral: true });
                    // Only update existing mapping
                    const mapping = grp.roles.find(r => r.roleId === role.id);
                    if (!mapping) {
                        return interaction.reply({ content: 'Bu rol bu grupta tanımlı değil.', ephemeral: true });
                    }
                    mapping.level = lvl;
                    await grp.save();
                    return interaction.reply({ content: `${role} rolünün seviyesi ${lvl} olarak güncellendi.`, ephemeral: true });
                }

                case 'zorluk': {
                    const grpName = options.getString('grup');
                    const lvlStr = options.getString('seviye');
                    const grp = await Group.findOne({ guildId, name: grpName });
                    if (!grp) return interaction.reply({ content: 'Grup bulunamadı.', ephemeral: true });
                    if (!['kolay', 'orta', 'zor'].includes(lvlStr)) return interaction.reply({ content: 'Geçersiz zorluk.', ephemeral: true });
                    grp.difficulty = lvlStr;
                    await grp.save();
                    return interaction.reply({ content: `${grpName} grubu zorluk seviyesi ${lvlStr} olarak ayarlandı.`, ephemeral: true });
                }

                case 'yönetim-ayarla': {
                    const role = options.getRole('rol');
                    const pos = options.getInteger('sıra');
                    const set = await Settings.findOneAndUpdate(
                        { guildId },
                        { $pull: { management: { roleId: role.id } } },
                        { upsert: true }
                    );
                    await Settings.findOneAndUpdate(
                        { guildId },
                        { $push: { management: { roleId: role.id, position: pos } } }
                    );
                    return interaction.reply({ content: `${role} rolü yönetim pozisyonuna eklendi (sıra: ${pos}).`, ephemeral: true });
                }

                case 'yetkim': {
                    const prog = await Progress.findOne({ guildId, userId: interaction.user.id });
                    if (!prog) return interaction.reply({ content: 'Henüz bir yetki grubuna başlamadınız.', ephemeral: true });
                    const grp = await Group.findOne({ guildId, name: prog.groupName });
                    if (!grp) return interaction.reply({ content: 'Grup verisi bulunamadı.', ephemeral: true });
                    // Hesaplanan gereken XP
                    const requiredXP = Math.floor(
                        prog.level * (
                            (grp.difficulty === 'kolay' ? 100 : grp.difficulty === 'orta' ? 200 : 300) *
                            (grp.difficulty === 'kolay' ? 1.01 : grp.difficulty === 'orta' ? 1.02 : 1.03)
                        )
                    );
                    const remainingXP = Math.max(requiredXP - prog.xp, 0);
                    const nextRole = grp.roles.find(r => r.level === prog.level + 1);
                    const embed = new EmbedBuilder()
                        .setTitle('Yetki Durumunuz')
                        .addFields(
                            { name: 'Grup', value: prog.groupName, inline: true },
                            { name: 'Seviye', value: `${prog.level}`, inline: true },
                            { name: 'XP', value: `${prog.xp}/${requiredXP}`, inline: true },
                            { name: 'Kalan XP', value: `${remainingXP}`, inline: true },
                            { name: 'Bir sonraki rol', value: nextRole ? `<@&${nextRole.roleId}>` : 'Yok', inline: true }
                        )
                        .setColor('Blue');
                    return interaction.reply({ embeds: [embed], ephemeral: true })
                }

                case 'sıralama': {
                    const grpName = options.getString('grup');
                    const filter = grpName ? { guildId, groupName: grpName } : { guildId };
                    const list = await Progress.find(filter).sort([['level', 'desc'], ['xp', 'desc']]).limit(10);
                    const embed = new EmbedBuilder().setTitle(`${grpName || 'Sunucu'} Yetki Sıralama`);
                    list.forEach((p, i) => {
                        embed.addFields({ name: `#${i + 1}`, value: `<@${p.userId}> Lv:${p.level} XP:${p.xp}` });
                    });
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                case 'değiştir': {
                    const user = options.getUser('kişi');
                    const grpName = options.getString('grup');
                    const resetLvl = options.getBoolean('sıfırla-seviye');
                    const resetRole = options.getBoolean('sıfırla-rol');

                    const grp = await Group.findOne({ guildId, name: grpName });
                    if (!grp) return interaction.reply({ content: 'Grup bulunamadı.', ephemeral: true });

                    const prog = await Progress.findOne({ guildId, userId: user.id });
                    if (!prog) return interaction.reply({ content: 'Bu kullanıcı henüz başlamadı.', ephemeral: true });

                    // Remove old roles if requested
                    const memberObj = await guild.members.fetch(user.id);
                    if (resetRole) {
                        grp.roles.forEach(r => memberObj.roles.remove(r.roleId));
                    }

                    // Update progress
                    prog.groupName = grpName;
                    if (resetLvl) { prog.level = 1; prog.xp = 0; }
                    await prog.save();

                    // Assign current level role
                    const newRole = grp.roles.find(r => r.level === prog.level);
                    if (newRole) await memberObj.roles.add(newRole.roleId);

                    return interaction.reply({ content: `${user} artık **${grpName}** grubunda (Seviye: ${prog.level}).`, ephemeral: true });
                }

                case 'atlat': {
                    const user = options.getUser('kişi');
                    const targetMember = await guild.members.fetch(user.id);
                    const targetIsManagement = managementRoles.some(r => targetMember.roles.cache.has(r));

                    // Permission checks
                    if (targetIsManagement && !isCreator) {
                        return interaction.reply({ content: 'Yönetim grubundaki bir kişiye işlem yapmak için sadece Kurucu rolüne sahip kişi yetkilidir.', ephemeral: true });
                    }
                    if (!targetIsManagement && !(isCreator || isManagement)) {
                        return interaction.reply({ content: 'Bu komutu kullanmak için yönetim grubundaki rollere sahip olmalısınız.', ephemeral: true });
                    }

                    // Proceed with atlat
                    const prog = await Progress.findOne({ guildId, userId: user.id });
                    if (!prog) return interaction.reply({ content: 'Kullanıcı henüz başlatılmamış.', ephemeral: true });
                    prog.level++;
                    const grp = await Group.findOne({ guildId, name: prog.groupName });
                    const nextRole = grp.roles.find(r => r.level === prog.level);
                    if (!nextRole) {
                        await prog.save();
                        return interaction.reply({ content: 'Daha fazla ilerleyemezsiniz.', ephemeral: true });
                    }
                    await targetMember.roles.add(nextRole.roleId);
                    await prog.save();
                    return interaction.reply({ content: `${targetMember} başarıyla bir sonraki role atlatıldı.`, ephemeral: true });
                }

                case 'düşür': {
                    const user = options.getUser('kişi');
                    const targetMember = await guild.members.fetch(user.id);
                    const targetIsManagement = managementRoles.some(r => targetMember.roles.cache.has(r));

                    // Permission checks
                    if (targetIsManagement && !isCreator) {
                        return interaction.reply({ content: 'Yönetim grubundaki bir kişiye işlem yapmak için sadece Kurucu rolüne sahip kişi yetkilidir.', ephemeral: true });
                    }
                    if (!targetIsManagement && !(isCreator || isManagement)) {
                        return interaction.reply({ content: 'Bu komutu kullanmak için yönetim grubundaki rollere sahip olmalısınız.', ephemeral: true });
                    }

                    // Proceed with düşür
                    const prog = await Progress.findOne({ guildId, userId: user.id });
                    if (!prog) return interaction.reply({ content: 'Kullanıcı henüz başlatılmamış.', ephemeral: true });
                    if (prog.level <= 1) {
                        return interaction.reply({ content: 'En düşük seviyeden daha fazla düşürülemez.', ephemeral: true });
                    }
                    const grp = await Group.findOne({ guildId, name: prog.groupName });
                    const dropRole = grp.roles.find(r => r.level === prog.level);
                    prog.level--;
                    const addRole = grp.roles.find(r => r.level === prog.level);
                    if (dropRole) await targetMember.roles.remove(dropRole.roleId);
                    if (addRole) await targetMember.roles.add(addRole.roleId);
                    await prog.save();
                    return interaction.reply({ content: `${targetMember} bir seviye düşürüldü.`, ephemeral: true });
                }

                default:
                    return interaction.reply({ content: 'Bilinmeyen alt komut.', ephemeral: true });
            }

        } catch (err) {
            return interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });
        }

    }
};