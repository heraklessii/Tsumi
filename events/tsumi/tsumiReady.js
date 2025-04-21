const chalk = require('chalk');
const { Events, ActivityType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const cron = require('node-cron');
const Stats = require('../../models/Stats');
const StatsSettings = require('../../models/StatsSettings');
const moment = require('moment');

module.exports = {
	name: Events.ClientReady,
	async execute(client) {

		const activities = [
			{ name: `Tsumi, HERA tarafından geliştirilmektedir.`, type: ActivityType.Custom },
			{ name: `Bütün komutlarıma /yardım yazarak ulaşabilirsin.`, type: ActivityType.Custom }
		];

		let i = 0;
		setInterval(() => {
			client.user.setActivity(activities[i]);
			i = (i + 1) % activities.length;
		}, 120000);

		console.log(chalk.blue(`${client.user.tag} olarak giriş yaptım ve göreve hazırım!`));

		cron.schedule('0 3 * * *', async () => {
			const date = moment().subtract(1, 'day').format('YYYY-MM-DD');
			const activeGuilds = await StatsSettings.find({
				sistemDurumu: true,
				gunlukRaporDurumu: true,
				logChannelId: { $exists: true }
			});

			for (const setting of activeGuilds) {
				try {
					const guild = await client.guilds.fetch(setting.guildId);
					const channel = guild.channels.cache.get(setting.logChannelId)
						|| await guild.channels.fetch(setting.logChannelId);
					if (!channel?.isTextBased()) continue;

					// 1️⃣ O güne ait kullanıcı istatistikleri
					const statsList = await Stats.find({ guildId: setting.guildId });

					// 2️⃣ Sunucu geneli toplam mesaj & ses (dakika)
					const serverTotalMessages = statsList.reduce(
						(sum, s) => sum + (s.dailyMessages.get(date) || 0),
						0
					);
					const serverTotalVoiceSec = statsList.reduce(
						(sum, s) => sum + (s.dailyVoice.get(date) || 0),
						0
					);
					const serverTotalVoiceMin = Math.floor(serverTotalVoiceSec / 60);

					// 3️⃣ Kanal bazlı günlük toplamlar
					const channelMsgCounts = {};
					const channelVoiceCounts = {};
					for (const s of statsList) {
						for (const [chId, chData] of s.channelMessages) {
							const cnt = chData.daily.get(date) || 0;
							if (cnt > 0) channelMsgCounts[chId] = (channelMsgCounts[chId] || 0) + cnt;
						}
						for (const [chId, chData] of s.channelVoice) {
							const sec = chData.daily.get(date) || 0;
							if (sec > 0) channelVoiceCounts[chId] = (channelVoiceCounts[chId] || 0) + sec;
						}
					}
					// En aktif kanal
					const [topChMsgId, topChMsgCnt] = Object.entries(channelMsgCounts)
						.sort((a, b) => b[1] - a[1])[0] || [null, 0];
					const [topChVoiceId, topChVoiceSec] = Object.entries(channelVoiceCounts)
						.sort((a, b) => b[1] - a[1])[0] || [null, 0];

					// 4️⃣ Top 5 kullanıcı
					const topMsgs = statsList
						.map(s => ({ userId: s.userId, count: s.dailyMessages.get(date) || 0 }))
						.sort((a, b) => b.count - a.count)
						.slice(0, 5);
					const topVoice = statsList
						.map(s => ({ userId: s.userId, sec: s.dailyVoice.get(date) || 0 }))
						.sort((a, b) => b.sec - b.sec)
						.slice(0, 5);

					// 5️⃣ Bar grafik (mesaj vs ses)
					const width = 600, height = 300;
					const chartCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
					const config = {
						type: 'bar',
						data: {
							labels: ['Mesaj', 'Ses (dk)'],
							datasets: [{
								label: 'Sunucu Genel',
								data: [serverTotalMessages, serverTotalVoiceMin],
								backgroundColor: ['rgba(54,162,235,0.5)', 'rgba(255,159,64,0.5)'],
								borderColor: ['rgba(54,162,235,1)', 'rgba(255,159,64,1)'],
								borderWidth: 2
							}]
						},
						options: {
							plugins: {
								legend: { display: false },
								title: {
									display: true,
									text: `${date} — Mesaj ve Ses Karşılaştırması`,
									font: { size: 16 },
									color: '#000'
								}
							},
							scales: {
								y: {
									beginAtZero: true,
									ticks: { color: '#000', font: { size: 12 } },
									title: { display: true, text: 'Adet / Dakika', color: '#000', font: { size: 14 } }
								},
								x: {
									ticks: { color: '#000', font: { size: 12 } }
								}
							}
						}
					};
					const chartBuffer = await chartCanvas.renderToBuffer(config);
					const chartAttachment = new AttachmentBuilder(chartBuffer, { name: 'chart.png' });

					// 6️⃣ Embed hazırlama
					const embed = new EmbedBuilder()
						.setTitle(`📅 ${date} günün verileri`)
						.setThumbnail(guild.iconURL({ size: 128 }))
						.setDescription(
							`💬 **Günlük Mesaj:** ${serverTotalMessages}\n` +
							`🔊 **Günlük Ses:** ${serverTotalVoiceMin} dk\n\n` +
							`💬 **En aktif kanal (Mesaj):** ${topChMsgId ? `<#${topChMsgId}> — ${topChMsgCnt}` : 'Yok'}\n` +
							`🔉 **En aktif kanal (Ses):** ${topChVoiceId ? `<#${topChVoiceId}> — ${Math.floor(topChVoiceSec / 60)} dk` : 'Yok'}\n\n` +
							`📝 **Toplam Mesaj (Tüm Zaman):** ${ /* istersen ayrıca tüm zaman */ serverTotalMessages}\n` +
							`📝 **Toplam Ses (Tüm Zaman):** ${serverTotalVoiceMin} dk`
						)
						.addFields(
							{
								name: '📈 Mesajda İlk 5', value:
									topMsgs.length
										? topMsgs.map((u, i) => `\`${i + 1}.\` <@${u.userId}> — **${u.count}**`).join('\n')
										: 'Veri yok',
								inline: true
							},
							{
								name: '🔉 Seste İlk 5', value:
									topVoice.length
										? topVoice.map((u, i) => `\`${i + 1}.\` <@${u.userId}> — **${Math.floor(u.sec / 60)}** dk`).join('\n')
										: 'Veri yok',
								inline: true
							}
						)
						.setImage('attachment://chart.png')
						.setColor(0x2F3136)
						.setTimestamp();

					// 7️⃣ Gönder
					await channel.send({ embeds: [embed], files: [chartAttachment] });
					console.log(`[Rapor] ${setting.guildId} için ${date} raporu gönderildi.`);
				} catch (err) {
					console.error(`Rapor gönderme hatası [${setting.guildId}]:`, err);
				}
			}
		});

	},
};
