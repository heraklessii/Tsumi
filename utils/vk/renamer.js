const ServerConfig = require('../../models/VKSettings');
const shuffleArray = array => array.sort(() => Math.random() - 0.5);

/**
 * Üyelere roller atar.
 * @param {GuildMember[]} members
 * @param {'normal'|'advanced'} mode
 * @param {string} guildId
 */
async function assignRoles(members, mode, guildId) {
  const numPlayers = members.length;

  if (mode === 'normal') {

    const vampCount = Math.floor(numPlayers / 5) || 1;
    const shuffled = shuffleArray([...members]);
    const assigned = [];
    let idx = 0;

    // Vampir sayısı
    for (let i = 0; i < vampCount; i++) {
      const m = shuffled[idx++];
      assigned.push({ id: m.id, originalNick: m.nickname || m.user.username, role: 'Vampir' });
    }

    // Gözcü
    const seer = shuffled[idx++];
    assigned.push({ id: seer.id, originalNick: seer.nickname || seer.user.username, role: 'Gözcü' });

    // Doktor
    const doctor = shuffled[idx++];
    assigned.push({ id: doctor.id, originalNick: doctor.nickname || doctor.user.username, role: 'Doktor' });

    // Koruma
    const guard = shuffled[idx++];
    assigned.push({ id: guard.id, originalNick: guard.nickname || guard.user.username, role: 'Koruma' });

    // Kalanlar köylü
    for (; idx < shuffled.length; idx++) {
      const m = shuffled[idx];
      assigned.push({ id: m.id, originalNick: m.nickname || m.user.username, role: 'Köylü' });
    }

    return assigned;

  } 
  
  else if (mode === 'advanced') {

    // Gelişmiş mod rol havuzunu al
    const config = await ServerConfig.findOne({ guildId });
    if (!config) throw new Error('❌ | Gelişmiş mod için rol havuzu bulunamadı.');
    if (members.length < config.roles.length) throw new Error('Yeterli oyuncu yok; rol sayısından az oyuncu var.');

    const shuffled = shuffleArray([...members]);
    const assigned = [];

    // Havuzdan rollerin dağıtımı
    for (let i = 0; i < config.roles.length; i++) {
      const roleDef = config.roles[i];
      const m = shuffled[i];
      assigned.push({ id: m.id, originalNick: m.nickname || m.user.username, role: roleDef.name });
    }

    // Fazlalıklar köylü
    for (let i = config.roles.length; i < shuffled.length; i++) {
      const m = shuffled[i];
      assigned.push({ id: m.id, originalNick: m.nickname || m.user.username, role: 'Köylü' });
    }

    return assigned;

  } 
  
  else {
    throw new Error('❌ | Geçersiz mod.');
  }
}

/**
 * Oyuncu nicklerini "Oyuncu 01", "Oyuncu 02" şeklinde değiştirir.
 * @param {Guild} guild
 * @param {Array<{id, originalNick, role}>} players
 */
async function renamePlayers(guild, players) {
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    try {
      const member = await guild.members.fetch(p.id);
      const newNick = `Oyuncu ${String(i + 1).padStart(2, '0')}`;
      await member.setNickname(newNick, 'VK oyun başlatma: İsim değiştirme');
    } catch (err) {}
  }
}

module.exports = { assignRoles, renamePlayers };
