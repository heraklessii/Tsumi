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

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Group = require('../../models/YGroup');
const Progress = require('../../models/YProgress');
const Settings = require('../../models/YSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetki')
        .setDescription('Yetki işlemleri')
        .addSubcommand(sc => sc
            .setName('kur')
            .setDescription('Yetki grubu oluştur')
            .addStringOption(o => o
                .setName('grup')
                .setDescription('Grup adı')
                .setRequired(true))
            .addStringOption(o => o
                .setName('tür')
                .setDescription('metin/ses/metin+ses'))
            .addStringOption(o => o
                .setName('roller')
                .setDescription('Rol(ler), virgülle ayrılmış ID veya mention dizisi')))
        .addSubcommand(sc => sc
            .setName('kurucu')
            .setDescription('Kurucu rolü ayarla')
            .addRoleOption(o => o
                .setName('rol')
                .setDescription('Kurucu rolü')
                .setRequired(true)))
        .addSubcommand(sc => sc
            .setName('başlat')
            .setDescription('Kişiyi yetki grubuna başlat')
            .addUserOption(o => o
                .setName('kişi')
                .setDescription('Hedef kullanıcı')
                .setRequired(true))
            .addStringOption(o => o
                .setName('grup')
                .setDescription('Grup adı')
                .setRequired(true)))
        .addSubcommand(sc => sc
            .setName('ayarla')
            .setDescription('Rolleri seviyelere eşle')
            .addStringOption(o => o
                .setName('grup')
                .setDescription('Grup adı')
                .setRequired(true))
            .addRoleOption(o => o
                .setName('rol')
                .setDescription('Rol')
                .setRequired(true))
            .addIntegerOption(o => o
                .setName('seviye')
                .setDescription('Seviye')
                .setRequired(true)))
        .addSubcommand(sc => sc
            .setName('zorluk')
            .setDescription('Grup zorluğunu ayarla')
            .addStringOption(o => o
                .setName('grup')
                .setDescription('Zorluğu ayarlanacak grup adı.')
                .setRequired(true))
            .addStringOption(o => o.
                setName('seviye')
                .setDescription('kolay/orta/zor')
                .setRequired(true)))
        .addSubcommand(sc => sc
            .setName('yönetim-ayarla')
            .setDescription('Yönetim rollerini ayarlarsınız.')
            .addRoleOption(o => o
                .setName('rol')
                .setDescription('Rol')
                .setRequired(true))
            .addIntegerOption(o => o
                .setName('sıra')
                .setDescription('Sıra')
                .setRequired(true)))
        .addSubcommand(sc => sc
            .setName('sıralama')
            .setDescription('Yetkili sıralaması')
            .addStringOption(o => o
                .setName('grup')
                .setDescription('Grup adı (opsiyonel)')))
        .addSubcommand(sc => sc
            .setName('değiştir')
            .setDescription('Seçtiğiniz kişinin yetki grubunu değiştirirsiniz.')
            .addUserOption(o => o
                .setName('kişi')
                .setDescription('Yetki grubu değişecek kişi.')
                .setRequired(true))
            .addStringOption(o => o
                .setName('grup')
                .setDescription('Yeni grup.')
                .setRequired(true))
            .addBooleanOption(o => o
                .setName('sıfırla-seviye')
                .setDescription('XP & seviye sıfırlansın mı?'))
            .addBooleanOption(o => o
                .setName('sıfırla-rol')
                .setDescription('Roller sıfırlansın mı?')))
        .addSubcommand(sc => sc
            .setName('atlat')
            .setDescription('Bir sonraki role atlat.')
            .addUserOption(o => o
                .setName('kişi')
                .setDescription('Hedef kullanıcı.')
                .setRequired(true)))
        .addSubcommand(sc => sc.setName('düşür')
            .setDescription('Önceki role düşür.')
            .addUserOption(o => o
                .setName('kişi')
                .setDescription('Hedef kullanıcı.')
                .setRequired(true))),

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

                    if (!isCreator)
                        return interaction.reply({ content: ':x: | Bu komut yalnızca **Kurucu** rolüne sahip kişiler tarafından kullanılabilir.', ephemeral: true });

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

                    if (interaction.user.id !== interaction.guild.ownerId)
                        return interaction.reply({ content: ':x: | Sadece taç sahibi bu komutu kullanabilir.', ephemeral: true });

                    const creatorRole = options.getRole('rol');
                    await Settings.findOneAndUpdate({ guildId }, { creatorRole: creatorRole.id }, { upsert: true });
                    return interaction.reply({ content: `✅ | Kurucu rolü ${creatorRole} olarak ayarlandı.`, ephemeral: true });

                }

                case 'başlat': {

                    const user = options.getUser('kişi');
                    const grpName = options.getString('grup');
                    const grp = await Group.findOne({ guildId, name: grpName });

                    if (!grp) return interaction.reply({ content: ':x: | Böyle bir grup bulunamadı.', ephemeral: true });
                    if (grp.roles.length === 0) return interaction.reply({
                        content: ':x: | Önce o gruba seviye-rol eşlemesi yapmalısın.',
                        ephemeral: true
                    });

                    let prog = await Progress.findOne({ guildId, userId: user.id });
                    if (!prog) prog = new Progress({ guildId, userId: user.id, groupName: grpName });

                    prog.groupName = grpName;
                    prog.level = 1;
                    prog.xp = 0;
                    await prog.save();

                    const memberObj = await guild.members.fetch(user.id);
                    const firstRole = grp.roles.find(r => r.level === 1);
                    if (firstRole) await memberObj.roles.add(firstRole.roleId);

                    return interaction.reply({
                        content: `✅ | ${user} için **${grpName}** grubu başlatıldı ve birinci seviye rolü verildi.`,
                        ephemeral: false
                    });

                }

                case 'ayarla': {

                    const grpName = options.getString('grup');
                    const role = options.getRole('rol');
                    const lvl = options.getInteger('seviye');

                    const grp = await Group.findOne({ guildId, name: grpName });
                    if (!grp) return interaction.reply({ content: ':x: | Grup bulunamadı.', ephemeral: true });

                    const mapping = grp.roles.find(r => r.roleId === role.id);
                    if (!mapping) return interaction.reply({ content: ':x: | Bu rol bu grupta tanımlı değil.', ephemeral: true });

                    mapping.level = lvl;
                    await grp.save();
                    return interaction.reply({ content: `✅ | ${role} rolünün seviyesi **${lvl}** olarak güncellendi.`, ephemeral: true });

                }

                case 'zorluk': {

                    const grpName = options.getString('grup');
                    const lvlStr = options.getString('seviye');
                    const grp = await Group.findOne({ guildId, name: grpName });

                    if (!grp) return interaction.reply({ content: ':x: | Grup bulunamadı.', ephemeral: true });
                    if (!['kolay', 'orta', 'zor'].includes(lvlStr)) return interaction.reply({
                        content: ':x: | Geçersiz zorluk girdiniz.',
                        ephemeral: true
                    });

                    grp.difficulty = lvlStr;
                    await grp.save();
                    return interaction.reply({
                        content: `✅ | ${grpName} grubu zorluk seviyesi **${lvlStr}** olarak ayarlandı.`,
                        ephemeral: false
                    });

                }

                case 'yönetim-ayarla': {

                    const role = options.getRole('rol');
                    const pos = options.getInteger('sıra');
                    await Settings.findOneAndUpdate(
                        { guildId },
                        { $pull: { management: { roleId: role.id } } },
                        { upsert: true }
                    );

                    await Settings.findOneAndUpdate(
                        { guildId },
                        { $push: { management: { roleId: role.id, position: pos } } }
                    );

                    return interaction.reply({
                        content: `✅ | ${role} rolü yönetim grubuna eklendi. Sıra: **${pos}**`,
                        ephemeral: true
                    });

                }

                case 'sıralama': {

                    const grpName = options.getString('grup');
                    const filter = grpName ? { guildId, groupName: grpName } : { guildId };
                    const list = await Progress.find(filter).sort([['level', 'desc'], ['xp', 'desc']]).limit(10);
                    const embed = new EmbedBuilder().setTitle(`${grpName || 'Sunucu'} Yetkili Sıralaması`);

                    list.forEach((p, i) => {
                        embed.addFields({
                            name: `#${i + 1}`, value: `<@${p.userId}> Lv:${p.level} XP:${p.xp}`
                        })
                    });

                    return interaction.reply({ embeds: [embed], ephemeral: true });

                }

                case 'değiştir': {

                    const user = options.getUser('kişi');
                    const grpName = options.getString('grup');
                    const resetLvl = options.getBoolean('sıfırla-seviye');
                    const resetRole = options.getBoolean('sıfırla-rol');

                    const grp = await Group.findOne({ guildId, name: grpName });
                    if (!grp) return interaction.reply({ content: ':x: | Grup bulunamadı.', ephemeral: true });

                    const prog = await Progress.findOne({ guildId, userId: user.id });
                    if (!prog) return interaction.reply({ content: ':x: | Bu kullanıcı yetkili değil.', ephemeral: true });

                    const memberObj = await guild.members.fetch(user.id);
                    if (resetRole) grp.roles.forEach(r => memberObj.roles.remove(r.roleId));

                    prog.groupName = grpName;
                    if (resetLvl) { prog.level = 1; prog.xp = 0; }
                    await prog.save();

                    const newRole = grp.roles.find(r => r.level === prog.level);
                    if (newRole) await memberObj.roles.add(newRole.roleId);

                    return interaction.reply({ content: `✅ | ${user} artık **${grpName}** grubunda (Seviye: ${prog.level}).`, ephemeral: false });
                }

                case 'atlat': {
                    const user = options.getUser('kişi');
                    const targetMember = await guild.members.fetch(user.id);
                    const targetIsManagement = managementRoles.some(r => targetMember.roles.cache.has(r));

                    if (targetIsManagement && !isCreator)
                        return interaction.reply({ content: ':x: | Yönetim grubundaki bir kişiye işlem yapmak için sadece Kurucu rolüne sahip kişi yetkilidir.', ephemeral: true });

                    if (!targetIsManagement && !(isCreator || isManagement))
                        return interaction.reply({ content: ':x: | Bu komutu kullanmak için yönetim grubundaki rollere sahip olmalısınız.', ephemeral: true });

                    const prog = await Progress.findOne({ guildId, userId: user.id });
                    if (!prog) return interaction.reply({ content: ':x: | Bu kullanıcı yetkili değil.', ephemeral: true });
                    prog.level++;
                    const grp = await Group.findOne({ guildId, name: prog.groupName });
                    const nextRole = grp.roles.find(r => r.level === prog.level);

                    if (!nextRole) {
                        await prog.save();
                        return interaction.reply({ content: ':x: | Daha fazla ilerleyemezsiniz.', ephemeral: true });
                    }

                    await targetMember.roles.add(nextRole.roleId);
                    await prog.save();
                    return interaction.reply({ content: `✅ | ${targetMember} başarıyla bir sonraki role atlatıldı.`, ephemeral: false });

                }

                case 'düşür': {

                    const user = options.getUser('kişi');
                    const targetMember = await guild.members.fetch(user.id);
                    const targetIsManagement = managementRoles.some(r => targetMember.roles.cache.has(r));

                    if (targetIsManagement && !isCreator)
                        return interaction.reply({ content: ':x: | Yönetim grubundaki bir kişiye işlem yapmak için sadece **Kurucu** rolüne sahip kişi yetkilidir.', ephemeral: true });

                    if (!targetIsManagement && !(isCreator || isManagement))
                        return interaction.reply({ content: ':x: | Bu komutu kullanmak için yönetim grubundaki rollere sahip olmalısınız.', ephemeral: true });

                    const prog = await Progress.findOne({ guildId, userId: user.id });
                    if (!prog) return interaction.reply({ content: ':x: | Bu kullanıcı yetkili değil.', ephemeral: true });
                    if (prog.level <= 1)
                        return interaction.reply({ content: ':x: | En düşük seviyeden daha fazla düşürülemez.', ephemeral: true });

                    const grp = await Group.findOne({ guildId, name: prog.groupName });
                    const dropRole = grp.roles.find(r => r.level === prog.level);
                    prog.level--;
                    const addRole = grp.roles.find(r => r.level === prog.level);
                    if (dropRole) await targetMember.roles.remove(dropRole.roleId);
                    if (addRole) await targetMember.roles.add(addRole.roleId);
                    await prog.save();
                    return interaction.reply({ content: `✅ | ${targetMember} bir seviye düşürüldü.`, ephemeral: false });

                }

                default:
                    return interaction.reply({ content: ':x: | Bilinmeyen alt komut.', ephemeral: true });

            }

        } catch (err) { return interaction.reply({ content: ':x: | Bir hata oluştu.', ephemeral: true }); }

    }
};