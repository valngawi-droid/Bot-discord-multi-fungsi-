import {
  ActivityType, ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder
} from 'discord.js';
import { splitDiscordMessage } from './utils.js';

const memberNames = [
  ['profile', 'Lihat profil anggota'], ['avatar', 'Lihat avatar anggota'], ['server', 'Informasi singkat server'],
  ['server-icon', 'Tampilkan ikon server'], ['member-count', 'Jumlah anggota'], ['bot-count', 'Jumlah bot'],
  ['role-count', 'Jumlah role'], ['channel-count', 'Jumlah channel'], ['account-age', 'Umur akun'],
  ['server-age', 'Umur server'], ['latency', 'Latensi bot'], ['uptime', 'Lama bot online'],
  ['coinflip', 'Lempar koin'], ['dice', 'Lempar dadu'], ['random-number', 'Angka acak'],
  ['choose', 'Pilih salah satu opsi'], ['eightball', 'Jawaban acak'], ['timestamp', 'Timestamp saat ini'],
  ['snowflake-info', 'Baca waktu dari Discord ID'], ['roles', 'Daftar role Anda']
];
const adminNames = [
  ['member-info', 'Informasi anggota'], ['clear', 'Hapus pesan'], ['slowmode', 'Atur slowmode'], ['lock', 'Kunci channel'],
  ['unlock', 'Buka channel'], ['hide', 'Sembunyikan channel'], ['show', 'Tampilkan channel'], ['rename-channel', 'Ubah nama channel'],
  ['set-topic', 'Ubah topik channel'], ['create-text', 'Buat text channel'], ['create-voice', 'Buat voice channel'],
  ['create-category', 'Buat kategori'], ['clone-channel', 'Duplikat channel'], ['delete-channel', 'Hapus channel'],
  ['add-role', 'Tambahkan role'], ['remove-role', 'Lepaskan role'], ['nickname', 'Ubah nickname'], ['timeout', 'Timeout anggota'],
  ['untimeout', 'Hapus timeout'], ['kick', 'Kick anggota'], ['ban', 'Ban anggota'], ['unban', 'Unban berdasarkan ID'],
  ['announce', 'Kirim pengumuman embed'], ['say', 'Kirim pesan sebagai bot'], ['list-bans', 'Daftar ban']
];
const ownerNames = [
  ['bot-status', 'Status lengkap bot'], ['ai-status', 'Status AI'], ['guild-list', 'Daftar server bot'],
  ['role-list', 'Daftar role'], ['channel-list', 'Daftar channel'], ['command-count', 'Jumlah fungsi command'],
  ['memory', 'Pemakaian memori'], ['uptime', 'Lama bot online'], ['set-activity', 'Ubah aktivitas bot'],
  ['clear-activity', 'Hapus aktivitas bot'], ['set-bot-nickname', 'Ubah nickname bot'], ['webhook-test', 'Tes webhook log'],
  ['notify-online', 'Kirim notifikasi online'], ['dashboard-status', 'Status dashboard'], ['config-status', 'Status konfigurasi'],
  ['permission-check', 'Periksa permission bot'], ['export-structure', 'Ekspor struktur server'], ['guild-owner', 'Info pemilik server'],
  ['integration-count', 'Jumlah integrasi'], ['emoji-count', 'Jumlah emoji']
];

function buildGroup(name, description, definitions) {
  const command = new SlashCommandBuilder().setName(name).setDescription(description);
  for (const [sub, desc] of definitions) {
    command.addSubcommand((s) => {
      s.setName(sub).setDescription(desc);
      addSubcommandOptions(name, sub, s);
      return s;
    });
  }
  return command;
}

function addSubcommandOptions(group, sub, s) {
  if (group === 'member') {
    if (['profile', 'avatar', 'account-age'].includes(sub)) s.addUserOption((o) => o.setName('user').setDescription('Pengguna; kosong = Anda'));
    if (sub === 'dice') s.addIntegerOption((o) => o.setName('sisi').setDescription('Jumlah sisi').setMinValue(2).setMaxValue(1000));
    if (sub === 'random-number') s.addIntegerOption((o) => o.setName('min').setDescription('Minimum').setRequired(true)).addIntegerOption((o) => o.setName('max').setDescription('Maksimum').setRequired(true));
    if (sub === 'choose') s.addStringOption((o) => o.setName('opsi').setDescription('Pilihan dipisah tanda |').setRequired(true).setMaxLength(1500));
    if (sub === 'eightball') s.addStringOption((o) => o.setName('pertanyaan').setDescription('Pertanyaan Anda').setRequired(true).setMaxLength(500));
    if (sub === 'snowflake-info') s.addStringOption((o) => o.setName('id').setDescription('Discord snowflake ID').setRequired(true));
  }
  if (group === 'admin') addAdminOptions(sub, s);
  if (group === 'owner') {
    if (sub === 'set-activity') s.addStringOption((o) => o.setName('teks').setDescription('Teks aktivitas').setRequired(true).setMaxLength(128));
    if (sub === 'set-bot-nickname') s.addStringOption((o) => o.setName('nama').setDescription('Nickname baru').setRequired(true).setMaxLength(32));
  }
}

function addAdminOptions(sub, s) {
  if (['member-info', 'nickname', 'timeout', 'untimeout', 'kick', 'ban', 'add-role', 'remove-role'].includes(sub)) s.addUserOption((o) => o.setName('user').setDescription('Anggota target').setRequired(true));
  if (['add-role', 'remove-role'].includes(sub)) s.addRoleOption((o) => o.setName('role').setDescription('Role target').setRequired(true));
  if (sub === 'clear') s.addIntegerOption((o) => o.setName('jumlah').setDescription('1–100').setRequired(true).setMinValue(1).setMaxValue(100));
  if (sub === 'slowmode') s.addIntegerOption((o) => o.setName('detik').setDescription('0–21600').setRequired(true).setMinValue(0).setMaxValue(21600));
  if (['rename-channel', 'set-topic'].includes(sub)) s.addStringOption((o) => o.setName('teks').setDescription('Nilai baru').setRequired(true).setMaxLength(sub === 'set-topic' ? 1024 : 100));
  if (['create-text', 'create-voice', 'create-category'].includes(sub)) s.addStringOption((o) => o.setName('nama').setDescription('Nama').setRequired(true).setMaxLength(100));
  if (sub === 'delete-channel') s.addStringOption((o) => o.setName('konfirmasi').setDescription('Ketik HAPUS').setRequired(true));
  if (sub === 'nickname') s.addStringOption((o) => o.setName('nama').setDescription('Nickname baru').setRequired(true).setMaxLength(32));
  if (sub === 'timeout') s.addIntegerOption((o) => o.setName('menit').setDescription('1–40320').setRequired(true).setMinValue(1).setMaxValue(40320));
  if (['kick', 'ban'].includes(sub)) s.addStringOption((o) => o.setName('alasan').setDescription('Alasan').setMaxLength(500));
  if (sub === 'unban') s.addStringOption((o) => o.setName('user_id').setDescription('ID pengguna').setRequired(true));
  if (['announce', 'say'].includes(sub)) s.addStringOption((o) => o.setName('pesan').setDescription('Isi pesan').setRequired(true).setMaxLength(2000)).addChannelOption((o) => o.setName('tujuan').setDescription('Channel tujuan').addChannelTypes(ChannelType.GuildText));
}

function permissionCommand() {
  const command = new SlashCommandBuilder().setName('permission').setDescription('Atur otomatis akses role pada category/channel');
  for (const [name, description] of [
    ['view', 'Izinkan/larang/reset role melihat channel'], ['chat', 'Izinkan/larang/reset role mengirim chat'],
    ['voice', 'Izinkan/larang/reset role masuk voice'], ['readonly', 'Jadikan channel hanya-baca untuk sebuah role'],
    ['private', 'Sembunyikan channel dari everyone dan izinkan role'], ['public', 'Jadikan channel terlihat everyone'],
    ['sync-category', 'Samakan permission channel dengan kategorinya'], ['inspect', 'Lihat permission overwrite channel']
  ]) {
    command.addSubcommand((s) => {
      s.setName(name).setDescription(description)
        .addChannelOption((o) => o.setName('channel').setDescription('Category atau channel target').setRequired(true));
      if (['view','chat','voice'].includes(name)) s.addRoleOption((o) => o.setName('role').setDescription('Role target').setRequired(true)).addStringOption((o) => o.setName('mode').setDescription('Mode permission').setRequired(true).addChoices({name:'Izinkan',value:'allow'},{name:'Larang',value:'deny'},{name:'Reset/inherit',value:'reset'}));
      if (['readonly','private'].includes(name)) s.addRoleOption((o) => o.setName('role').setDescription('Role yang diizinkan').setRequired(true));
      return s;
    });
  }
  return command;
}

export const roleCommandData = [
  buildGroup('member', 'Kumpulan fitur khusus member', memberNames),
  buildGroup('admin', 'Kumpulan fitur moderasi khusus admin', adminNames),
  buildGroup('owner', 'Kumpulan kontrol khusus owner', ownerNames),
  permissionCommand(),
  new SlashCommandBuilder().setName('helpmember').setDescription('Daftar fitur khusus member'),
  new SlashCommandBuilder().setName('helpadmin').setDescription('Daftar fitur khusus admin'),
  new SlashCommandBuilder().setName('helpowner').setDescription('Daftar fitur khusus owner')
].map((command) => command.toJSON());

export const groupedFunctionCount = memberNames.length + adminNames.length + ownerNames.length + 3 + 8;

export async function handleRoleCommand(interaction, context) {
  if (interaction.commandName.startsWith('help')) return help(interaction);
  const sub = interaction.options.getSubcommand();
  if (interaction.commandName === 'permission') return permission(interaction, sub);
  if (interaction.commandName === 'member') return member(interaction, sub);
  if (interaction.commandName === 'admin') return admin(interaction, sub);
  if (interaction.commandName === 'owner') return owner(interaction, sub, context);
}

function help(interaction) {
  const kind = interaction.commandName.replace('help', '');
  const definitions = kind === 'member' ? memberNames : kind === 'admin' ? adminNames : ownerNames;
  const inherited = kind === 'owner' ? '\nOwner juga dapat memakai semua fitur Admin dan Member.' : kind === 'admin' ? '\nAdmin juga dapat memakai semua fitur Member.' : '';
  return interaction.reply({ content: `**Help ${kind.toUpperCase()}**\n${definitions.map(([n, d]) => `\`/${kind} ${n}\` — ${d}`).join('\n')}${inherited}`, ephemeral: true });
}

async function permission(i, sub) {
  const channel = i.options.getChannel('channel', true);
  if (!channel.permissionOverwrites) throw new Error('Target tidak mendukung permission overwrite.');
  if (sub === 'sync-category') {
    if (!channel.parentId || !channel.lockPermissions) throw new Error('Channel tidak memiliki kategori induk.');
    await channel.lockPermissions();
    return i.reply({ content: '✅ Permission disamakan dengan kategori.', ephemeral: true });
  }
  if (sub === 'inspect') {
    const lines = channel.permissionOverwrites.cache.map((o) => {
      const target = i.guild.roles.cache.get(o.id)?.toString() || `<@${o.id}>`;
      return `${target}\n  Allow: ${o.allow.toArray().join(', ') || '-'}\n  Deny: ${o.deny.toArray().join(', ') || '-'}`;
    });
    return sendLong(i, lines.join('\n') || 'Tidak ada permission overwrite.');
  }
  if (sub === 'public') {
    await channel.permissionOverwrites.edit(i.guild.roles.everyone, { ViewChannel: null });
    return i.reply({ content: '✅ Channel sekarang mengikuti akses publik @everyone.', ephemeral: true });
  }
  const role = i.options.getRole('role', true);
  if (sub === 'private') {
    await channel.permissionOverwrites.edit(i.guild.roles.everyone, { ViewChannel: false });
    await channel.permissionOverwrites.edit(role, { ViewChannel: true });
    return i.reply({ content: `✅ Channel private; ${role} dapat melihat.`, ephemeral: true });
  }
  if (sub === 'readonly') {
    await channel.permissionOverwrites.edit(role, { ViewChannel: true, SendMessages: false, AddReactions: false });
    return i.reply({ content: `✅ ${role} menjadi read-only di ${channel}.`, ephemeral: true });
  }
  const mode = i.options.getString('mode', true);
  const value = mode === 'allow' ? true : mode === 'deny' ? false : null;
  const changes = sub === 'view' ? { ViewChannel: value }
    : sub === 'chat' ? { SendMessages: value, SendMessagesInThreads: value }
      : { Connect: value, Speak: value };
  await channel.permissionOverwrites.edit(role, changes);
  return i.reply({ content: `✅ Permission **${sub}** untuk ${role} di ${channel}: **${mode}**.`, ephemeral: true });
}

async function member(i, sub) {
  const guild = i.guild;
  const user = i.options.getUser('user') || i.user;
  const member = await guild.members.fetch(user.id).catch(() => null);
  const now = Math.floor(Date.now() / 1000);
  const simple = {
    server: `**${guild.name}** — ${guild.memberCount} anggota, ${guild.channels.cache.size} channel, ${guild.roles.cache.size} role.`,
    'server-icon': guild.iconURL({ size: 1024 }) || 'Server tidak memiliki ikon.',
    'member-count': `Total anggota: **${guild.memberCount}**`,
    'bot-count': `Total bot: **${guild.members.cache.filter((m) => m.user.bot).size}**`,
    'role-count': `Total role: **${guild.roles.cache.size}**`,
    'channel-count': `Total channel: **${guild.channels.cache.size}**`,
    'server-age': `Server dibuat <t:${Math.floor(guild.createdTimestamp / 1000)}:R>.`,
    latency: `WebSocket: **${i.client.ws.ping} ms**`, uptime: `Bot online sejak <t:${Math.floor((Date.now() - i.client.uptime) / 1000)}:R>.`,
    coinflip: Math.random() < .5 ? '🪙 **Kepala**' : '🪙 **Ekor**', timestamp: `Sekarang: <t:${now}:F> — \`${now}\``
  };
  if (simple[sub]) return i.reply(simple[sub]);
  if (sub === 'avatar') return i.reply(user.displayAvatarURL({ size: 1024 }));
  if (sub === 'profile') return i.reply(`**${user.tag}**\nID: \`${user.id}\`\nAkun dibuat: <t:${Math.floor(user.createdTimestamp / 1000)}:R>\nMasuk server: ${member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : '-'}`);
  if (sub === 'account-age') return i.reply(`${user} membuat akun <t:${Math.floor(user.createdTimestamp / 1000)}:R>.`);
  if (sub === 'roles') return i.reply({ content: member ? member.roles.cache.filter((r) => r.id !== guild.id).map(String).join(', ') || 'Tidak ada role.' : 'Anggota tidak ditemukan.', ephemeral: true });
  if (sub === 'dice') return i.reply(`🎲 **${1 + Math.floor(Math.random() * (i.options.getInteger('sisi') || 6))}**`);
  if (sub === 'random-number') { const min=i.options.getInteger('min'),max=i.options.getInteger('max'); if(min>max) throw new Error('Minimum tidak boleh lebih besar dari maksimum.'); return i.reply(`🔢 **${min + Math.floor(Math.random() * (max-min+1))}**`); }
  if (sub === 'choose') { const a=i.options.getString('opsi').split('|').map(x=>x.trim()).filter(Boolean); if(a.length<2) throw new Error('Berikan minimal 2 opsi dipisah |.'); return i.reply(`Saya memilih: **${a[Math.floor(Math.random()*a.length)]}**`); }
  if (sub === 'eightball') { const a=['Ya.','Tidak.','Mungkin.','Sangat mungkin.','Coba lagi nanti.','Sepertinya tidak.']; return i.reply(`🎱 ${a[Math.floor(Math.random()*a.length)]}`); }
  if (sub === 'snowflake-info') { const id=i.options.getString('id'); if(!/^\d{17,20}$/.test(id)) throw new Error('ID Discord tidak valid.'); const time=Number((BigInt(id)>>22n)+1420070400000n); return i.reply(`ID dibuat <t:${Math.floor(time/1000)}:F>.`); }
}

async function admin(i, sub) {
  const ch=i.channel, guild=i.guild, targetUser=i.options.getUser('user'), target=targetUser ? await guild.members.fetch(targetUser.id) : null;
  if(sub==='member-info') return i.reply({content:`${target}\nID: \`${target.id}\`\nRole: ${target.roles.cache.map(String).join(', ')}`,ephemeral:true});
  if(sub==='clear'){await i.deferReply({ephemeral:true});const d=await ch.bulkDelete(i.options.getInteger('jumlah'),true);return i.editReply(`${d.size} pesan dihapus.`)}
  if(sub==='slowmode'){await ch.setRateLimitPerUser(i.options.getInteger('detik'));return i.reply({content:'✅ Slowmode diperbarui.',ephemeral:true})}
  if(['lock','unlock'].includes(sub)){await ch.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:sub==='unlock'?null:false});return i.reply({content:'✅ Permission kirim diperbarui.',ephemeral:true})}
  if(['hide','show'].includes(sub)){await ch.permissionOverwrites.edit(guild.roles.everyone,{ViewChannel:sub==='show'?null:false});return i.reply({content:'✅ Visibilitas diperbarui.',ephemeral:true})}
  if(sub==='rename-channel'){await ch.setName(i.options.getString('teks'));return i.reply({content:'✅ Nama channel diperbarui.',ephemeral:true})}
  if(sub==='set-topic'){await ch.setTopic(i.options.getString('teks'));return i.reply({content:'✅ Topik diperbarui.',ephemeral:true})}
  if(sub.startsWith('create-')){const type=sub==='create-text'?ChannelType.GuildText:sub==='create-voice'?ChannelType.GuildVoice:ChannelType.GuildCategory;const c=await guild.channels.create({name:i.options.getString('nama'),type,parent:type===ChannelType.GuildCategory?undefined:ch.parentId});return i.reply({content:`✅ Dibuat ${c}.`,ephemeral:true})}
  if(sub==='clone-channel'){const c=await ch.clone();return i.reply({content:`✅ Duplikat dibuat: ${c}`,ephemeral:true})}
  if(sub==='delete-channel'){if(i.options.getString('konfirmasi')!=='HAPUS')throw new Error('Konfirmasi harus HAPUS.');await i.reply({content:'Menghapus channel...',ephemeral:true});return ch.delete()}
  if(sub==='add-role'){await target.roles.add(i.options.getRole('role'));return i.reply({content:'✅ Role ditambahkan.',ephemeral:true})}
  if(sub==='remove-role'){await target.roles.remove(i.options.getRole('role'));return i.reply({content:'✅ Role dilepas.',ephemeral:true})}
  if(sub==='nickname'){await target.setNickname(i.options.getString('nama'));return i.reply({content:'✅ Nickname diperbarui.',ephemeral:true})}
  if(sub==='timeout'){await target.timeout(i.options.getInteger('menit')*60000,`Oleh ${i.user.tag}`);return i.reply({content:'✅ Anggota di-timeout.',ephemeral:true})}
  if(sub==='untimeout'){await target.timeout(null);return i.reply({content:'✅ Timeout dihapus.',ephemeral:true})}
  if(sub==='kick'){await target.kick(i.options.getString('alasan')||`Oleh ${i.user.tag}`);return i.reply({content:'✅ Anggota dikeluarkan.',ephemeral:true})}
  if(sub==='ban'){await target.ban({reason:i.options.getString('alasan')||`Oleh ${i.user.tag}`});return i.reply({content:'✅ Anggota diban.',ephemeral:true})}
  if(sub==='unban'){await guild.members.unban(i.options.getString('user_id'));return i.reply({content:'✅ Ban dihapus.',ephemeral:true})}
  if(['announce','say'].includes(sub)){const dest=i.options.getChannel('tujuan')||ch,msg=i.options.getString('pesan');if(sub==='announce')await dest.send({embeds:[new EmbedBuilder().setDescription(msg).setColor(0x5865f2).setTimestamp()]});else await dest.send({content:msg,allowedMentions:{parse:[]}});return i.reply({content:'✅ Pesan dikirim.',ephemeral:true})}
  if(sub==='list-bans'){const bans=await guild.bans.fetch();return i.reply({content:bans.size?[...bans.values()].slice(0,50).map(b=>`${b.user.tag} — ${b.user.id}`).join('\n'):'Tidak ada ban.',ephemeral:true})}
}

async function owner(i, sub, ctx) {
  const { config, audit, notifyOnline, totalFunctions }=ctx,g=i.guild,c=i.client;
  if(sub==='bot-status')return i.reply({content:`Online • ${c.ws.ping} ms • ${c.guilds.cache.size} server • uptime ${Math.floor(c.uptime/1000)} detik`,ephemeral:true});
  if(sub==='ai-status')return i.reply({content:`Provider: ${config.ai.provider}\nModel: ${config.ai.model}\nConfigured: ${ctx.aiClient.configured}`,ephemeral:true});
  if(sub==='guild-list')return i.reply({content:c.guilds.cache.map(x=>`${x.name} — ${x.id}`).join('\n'),ephemeral:true});
  if(sub==='role-list')return sendLong(i,g.roles.cache.sort((a,b)=>b.position-a.position).map(r=>`${r.name} — ${r.id}`).join('\n'));
  if(sub==='channel-list')return sendLong(i,g.channels.cache.map(x=>`${x.name} — ${x.id}`).join('\n'));
  if(sub==='command-count')return i.reply({content:`Total fungsi aktif: **${totalFunctions}**`,ephemeral:true});
  if(sub==='memory'){const m=process.memoryUsage();return i.reply({content:`RSS: ${(m.rss/1048576).toFixed(1)} MB\nHeap: ${(m.heapUsed/1048576).toFixed(1)} MB`,ephemeral:true})}
  if(sub==='uptime')return i.reply({content:`${Math.floor(c.uptime/1000)} detik`,ephemeral:true});
  if(sub==='set-activity'){c.user.setActivity(i.options.getString('teks'),{type:ActivityType.Playing});return i.reply({content:'✅ Aktivitas diperbarui.',ephemeral:true})}
  if(sub==='clear-activity'){c.user.setActivity(null);return i.reply({content:'✅ Aktivitas dihapus.',ephemeral:true})}
  if(sub==='set-bot-nickname'){await g.members.me.setNickname(i.options.getString('nama'));return i.reply({content:'✅ Nickname bot diperbarui.',ephemeral:true})}
  if(sub==='webhook-test'){await audit?.send('Tes Webhook',`Dikirim oleh ${i.user.tag}`);return i.reply({content:'✅ Tes webhook dikirim (jika LOG_WEBHOOK_URL terisi).',ephemeral:true})}
  if(sub==='notify-online'){await notifyOnline?.();return i.reply({content:'✅ Notifikasi online dikirim.',ephemeral:true})}
  if(sub==='dashboard-status')return i.reply({content:`Enabled: ${config.dashboard.enabled}\nAlamat: http://${config.dashboard.host}:${config.dashboard.port}\nToken: ${config.dashboard.token?'aktif':'kosong'}`,ephemeral:true});
  if(sub==='config-status')return i.reply({content:`Guild: ${config.guildId}\nOwner role: ${config.access.ownerRoleId}\nAdmin role: ${config.access.adminRoleId}\nMember role: ${config.access.memberRoleId}\nWebhook: ${config.notifications.webhookUrl?'terisi':'kosong'}`,ephemeral:true});
  if(sub==='permission-check')return i.reply({content:`Permission bot:\n${g.members.me.permissions.toArray().join(', ')}`,ephemeral:true});
  if(sub==='export-structure'){const data={roles:g.roles.cache.filter(r=>r.id!==g.id).map(r=>({name:r.name,color:r.hexColor,permissions:r.permissions.toArray()})),categories:g.channels.cache.filter(x=>x.type===ChannelType.GuildCategory).map(cat=>({name:cat.name,channels:cat.children.cache.map(x=>({name:x.name,type:ChannelType[x.type]}))}))};return i.reply({files:[{attachment:Buffer.from(JSON.stringify(data,null,2)),name:'server-structure.json'}],ephemeral:true})}
  if(sub==='guild-owner'){const o=await g.fetchOwner();return i.reply({content:`${o.user.tag} — ${o.id}`,ephemeral:true})}
  if(sub==='integration-count'){const x=await g.fetchIntegrations();return i.reply({content:`Total integrasi: ${x.size}`,ephemeral:true})}
  if(sub==='emoji-count')return i.reply({content:`Total emoji: ${g.emojis.cache.size}`,ephemeral:true});
}

async function sendLong(i,text){const parts=splitDiscordMessage(text);await i.reply({content:parts.shift(),ephemeral:true});for(const p of parts)await i.followUp({content:p,ephemeral:true})}
