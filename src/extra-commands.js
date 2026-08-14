import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ChannelType, SlashCommandBuilder } from 'discord.js';

const member = [
  ['m-avatar','Avatar pengguna'],['m-userinfo','Informasi pengguna'],['m-serverinfo','Informasi server'],['m-servericon','Ikon server'],
  ['m-membercount','Jumlah anggota'],['m-rolecount','Jumlah role'],['m-channelcount','Jumlah channel'],['m-ping','Latensi bot'],
  ['m-uptime','Uptime bot'],['m-coin','Lempar koin'],['m-dice','Lempar dadu'],['m-random','Angka acak'],
  ['m-choose','Pilih salah satu opsi'],['m-eightball','Jawaban bola delapan'],['m-time','Waktu Discord saat ini'],['m-snowflake','Baca waktu Discord ID'],
  ['m-uppercase','Ubah teks ke huruf besar'],['m-lowercase','Ubah teks ke huruf kecil'],['m-reverse','Balik teks'],['m-wordcount','Hitung kata'],
  ['m-charcount','Hitung karakter'],['m-base64','Encode Base64'],['m-unbase64','Decode Base64'],['m-urlencode','Encode URL'],
  ['m-urldecode','Decode URL'],['m-hex','Encode teks ke hex'],['m-unhex','Decode hex ke teks'],['m-sha256','Hash SHA-256'],
  ['m-uuid','Buat UUID'],['m-password','Buat password acak'],['m-percentage','Hitung persentase'],['m-repeat','Ulangi teks'],
  ['m-color','Informasi warna hex'],['m-id','Tampilkan ID Anda'],['m-roles','Daftar role pengguna']
];
const admin = [
  ['a-clear','Hapus pesan'],['a-lock','Kunci channel'],['a-unlock','Buka channel'],['a-hide','Sembunyikan channel'],['a-show','Tampilkan channel'],
  ['a-slowmode','Atur slowmode'],['a-channelinfo','Informasi channel'],['a-memberinfo','Informasi anggota'],['a-addrole','Tambahkan role'],
  ['a-removerole','Lepaskan role'],['a-timeout','Timeout anggota'],['a-untimeout','Hapus timeout'],['a-nickname','Ubah nickname'],
  ['a-clonechannel','Duplikat channel'],['a-createtext','Buat text channel'],['a-createvoice','Buat voice channel'],
  ['a-createcategory','Buat kategori'],['a-topic','Ubah topik channel'],['a-rename','Ubah nama channel'],['a-announce','Kirim pengumuman'],
  ['a-say','Kirim pesan bot'],['a-listbans','Daftar ban'],['a-roleinfo','Informasi role'],['a-permissions','Permission anggota'],
  ['a-syncperms','Sinkronkan permission kategori']
];
const owner = [
  ['o-botstatus','Status bot'],['o-aistatus','Status AI'],['o-dashboard','Status dashboard'],['o-config','Status konfigurasi'],
  ['o-memory','Pemakaian memori'],['o-uptime','Uptime bot'],['o-commandcount','Jumlah command'],['o-roleids','Daftar ID role'],
  ['o-channelids','Daftar ID channel'],['o-exportroles','Ekspor role'],['o-exportchannels','Ekspor channel'],['o-exportserver','Ekspor server'],
  ['o-notify','Kirim status online'],['o-webhooktest','Tes webhook'],['o-botperms','Permission bot'],['o-guilds','Daftar server bot'],
  ['o-integrations','Jumlah integrasi'],['o-emojis','Jumlah emoji'],['o-ownerinfo','Informasi pemilik server'],['o-health','Health check bot']
];

export const extraCommandsByTier = { member, admin, owner };
export const extraFunctionCount = member.length + admin.length + owner.length;

export const extraCommandData = [...member, ...admin, ...owner].map(([name, description]) => {
  const command = new SlashCommandBuilder().setName(name).setDescription(description);
  addOptions(command, name);
  return command.toJSON();
});

function addOptions(c, name) {
  if (['m-avatar','m-userinfo','m-roles'].includes(name)) c.addUserOption((o)=>o.setName('user').setDescription('Pengguna; kosong = Anda'));
  if (name==='m-dice') c.addIntegerOption((o)=>o.setName('sisi').setDescription('2–1000').setMinValue(2).setMaxValue(1000));
  if (name==='m-random') c.addIntegerOption((o)=>o.setName('min').setDescription('Minimum').setRequired(true)).addIntegerOption((o)=>o.setName('max').setDescription('Maksimum').setRequired(true));
  if (name==='m-choose') c.addStringOption((o)=>o.setName('opsi').setDescription('Pisahkan dengan |').setRequired(true).setMaxLength(1500));
  if (name==='m-eightball') c.addStringOption((o)=>o.setName('pertanyaan').setDescription('Pertanyaan').setRequired(true).setMaxLength(500));
  if (name==='m-snowflake') c.addStringOption((o)=>o.setName('id').setDescription('Discord ID').setRequired(true));
  if (['m-uppercase','m-lowercase','m-reverse','m-wordcount','m-charcount','m-base64','m-unbase64','m-urlencode','m-urldecode','m-hex','m-unhex','m-sha256'].includes(name)) c.addStringOption((o)=>o.setName('teks').setDescription('Teks').setRequired(true).setMaxLength(1800));
  if (name==='m-password') c.addIntegerOption((o)=>o.setName('panjang').setDescription('8–128').setMinValue(8).setMaxValue(128));
  if (name==='m-percentage') c.addNumberOption((o)=>o.setName('nilai').setDescription('Nilai').setRequired(true)).addNumberOption((o)=>o.setName('total').setDescription('Total').setRequired(true));
  if (name==='m-repeat') c.addStringOption((o)=>o.setName('teks').setDescription('Teks').setRequired(true).setMaxLength(300)).addIntegerOption((o)=>o.setName('jumlah').setDescription('1–10').setRequired(true).setMinValue(1).setMaxValue(10));
  if (name==='m-color') c.addStringOption((o)=>o.setName('hex').setDescription('Contoh #5865F2').setRequired(true));
  if (['a-memberinfo','a-addrole','a-removerole','a-timeout','a-untimeout','a-nickname','a-permissions'].includes(name)) c.addUserOption((o)=>o.setName('user').setDescription('Anggota target').setRequired(true));
  if (['a-addrole','a-removerole'].includes(name)) c.addRoleOption((o)=>o.setName('role').setDescription('Role target').setRequired(true));
  if (name==='a-clear') c.addIntegerOption((o)=>o.setName('jumlah').setDescription('1–100').setRequired(true).setMinValue(1).setMaxValue(100));
  if (name==='a-slowmode') c.addIntegerOption((o)=>o.setName('detik').setDescription('0–21600').setRequired(true).setMinValue(0).setMaxValue(21600));
  if (name==='a-timeout') c.addIntegerOption((o)=>o.setName('menit').setDescription('1–40320').setRequired(true).setMinValue(1).setMaxValue(40320));
  if (name==='a-nickname') c.addStringOption((o)=>o.setName('nama').setDescription('Nickname').setRequired(true).setMaxLength(32));
  if (['a-createtext','a-createvoice','a-createcategory'].includes(name)) c.addStringOption((o)=>o.setName('nama').setDescription('Nama').setRequired(true).setMaxLength(100));
  if (name==='a-topic') c.addStringOption((o)=>o.setName('teks').setDescription('Topik baru').setRequired(true).setMaxLength(1024));
  if (name==='a-rename') c.addStringOption((o)=>o.setName('nama').setDescription('Nama baru').setRequired(true).setMaxLength(100));
  if (['a-announce','a-say'].includes(name)) c.addStringOption((o)=>o.setName('pesan').setDescription('Pesan').setRequired(true).setMaxLength(2000)).addChannelOption((o)=>o.setName('tujuan').setDescription('Text channel').addChannelTypes(ChannelType.GuildText));
  if (name==='a-roleinfo') c.addRoleOption((o)=>o.setName('role').setDescription('Role').setRequired(true));
}

export async function handleExtraCommand(i, context) {
  if (i.commandName.startsWith('m-')) return memberCommand(i);
  if (i.commandName.startsWith('a-')) return adminCommand(i);
  return ownerCommand(i, context);
}

async function memberCommand(i) {
  const n=i.commandName,g=i.guild,u=i.options.getUser('user')||i.user,m=await g.members.fetch(u.id).catch(()=>null),text=i.options.getString('teks');
  const fixed={
    'm-serverinfo':`**${g.name}** • ${g.memberCount} anggota • ${g.channels.cache.size} channel • ${g.roles.cache.size} role`,
    'm-servericon':g.iconURL({size:1024})||'Tidak ada ikon.','m-membercount':`Anggota: **${g.memberCount}**`,
    'm-rolecount':`Role: **${g.roles.cache.size}**`,'m-channelcount':`Channel: **${g.channels.cache.size}**`,
    'm-ping':`Ping: **${i.client.ws.ping} ms**`,'m-uptime':`Uptime: **${Math.floor(i.client.uptime/1000)} detik**`,
    'm-coin':Math.random()<.5?'🪙 Kepala':'🪙 Ekor','m-time':`<t:${Math.floor(Date.now()/1000)}:F>`,
    'm-uuid':`\`${randomUUID()}\``,'m-id':`User: \`${i.user.id}\`\nServer: \`${g.id}\`\nChannel: \`${i.channelId}\``
  };
  if(fixed[n])return i.reply(fixed[n]);
  if(n==='m-avatar')return i.reply(u.displayAvatarURL({size:1024}));
  if(n==='m-userinfo')return i.reply(`**${u.tag}**\nID: \`${u.id}\`\nDibuat: <t:${Math.floor(u.createdTimestamp/1000)}:R>\nMasuk: ${m?.joinedTimestamp?`<t:${Math.floor(m.joinedTimestamp/1000)}:R>`:'-'}`);
  if(n==='m-roles')return i.reply({content:m?.roles.cache.filter(r=>r.id!==g.id).map(String).join(', ')||'Tidak ada role.',ephemeral:true});
  if(n==='m-dice')return i.reply(`🎲 **${1+Math.floor(Math.random()*(i.options.getInteger('sisi')||6))}**`);
  if(n==='m-random'){const a=i.options.getInteger('min'),b=i.options.getInteger('max');if(a>b)throw new Error('Minimum lebih besar dari maksimum.');return i.reply(`**${a+Math.floor(Math.random()*(b-a+1))}**`)}
  if(n==='m-choose'){const a=i.options.getString('opsi').split('|').map(x=>x.trim()).filter(Boolean);if(a.length<2)throw new Error('Minimal 2 opsi.');return i.reply(`Pilihan: **${a[Math.floor(Math.random()*a.length)]}**`)}
  if(n==='m-eightball'){const a=['Ya','Tidak','Mungkin','Sangat mungkin','Coba lagi nanti','Sepertinya tidak'];return i.reply(`🎱 ${a[Math.floor(Math.random()*a.length)]}`)}
  if(n==='m-snowflake'){const id=i.options.getString('id');if(!/^\d{17,20}$/.test(id))throw new Error('ID tidak valid.');return i.reply(`<t:${Math.floor(Number((BigInt(id)>>22n)+1420070400000n)/1000)}:F>`)}
  const transforms={'m-uppercase':()=>text.toUpperCase(),'m-lowercase':()=>text.toLowerCase(),'m-reverse':()=>[...text].reverse().join(''),'m-wordcount':()=>`Kata: **${text.trim()?text.trim().split(/\s+/).length:0}**`,'m-charcount':()=>`Karakter: **${[...text].length}**`,'m-base64':()=>Buffer.from(text).toString('base64'),'m-unbase64':()=>Buffer.from(text,'base64').toString('utf8'),'m-urlencode':()=>encodeURIComponent(text),'m-urldecode':()=>decodeURIComponent(text),'m-hex':()=>Buffer.from(text).toString('hex'),'m-unhex':()=>Buffer.from(text,'hex').toString('utf8'),'m-sha256':()=>createHash('sha256').update(text).digest('hex')};
  if(transforms[n])return i.reply({content:`\`${transforms[n]().slice(0,1900)}\``,ephemeral:true});
  if(n==='m-password'){const len=i.options.getInteger('panjang')||20;return i.reply({content:`Password: \`${randomBytes(len).toString('base64url').slice(0,len)}\``,ephemeral:true})}
  if(n==='m-percentage'){const value=i.options.getNumber('nilai'),total=i.options.getNumber('total');if(total===0)throw new Error('Total tidak boleh nol.');return i.reply(`Hasil: **${((value/total)*100).toFixed(2)}%**`)}
  if(n==='m-repeat')return i.reply(i.options.getString('teks').repeat(i.options.getInteger('jumlah')).slice(0,1900));
  if(n==='m-color'){const h=i.options.getString('hex').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))throw new Error('Format harus #RRGGBB.');return i.reply(`#${h.toUpperCase()} • RGB(${parseInt(h.slice(0,2),16)}, ${parseInt(h.slice(2,4),16)}, ${parseInt(h.slice(4),16)})`)}
}

async function adminCommand(i) {
  const n=i.commandName,g=i.guild,ch=i.channel,user=i.options.getUser('user'),m=user?await g.members.fetch(user.id):null;
  if(n==='a-clear'){await i.deferReply({ephemeral:true});const d=await ch.bulkDelete(i.options.getInteger('jumlah'),true);return i.editReply(`${d.size} pesan dihapus.`)}
  if(n==='a-lock'||n==='a-unlock'){await ch.permissionOverwrites.edit(g.roles.everyone,{SendMessages:n==='a-unlock'?null:false});return done(i)}
  if(n==='a-hide'||n==='a-show'){await ch.permissionOverwrites.edit(g.roles.everyone,{ViewChannel:n==='a-show'?null:false});return done(i)}
  if(n==='a-slowmode'){await ch.setRateLimitPerUser(i.options.getInteger('detik'));return done(i)}
  if(n==='a-channelinfo')return i.reply({content:`${ch}\nID: ${ch.id}\nType: ${ChannelType[ch.type]}\nCategory: ${ch.parent?.name||'-'}`,ephemeral:true});
  if(n==='a-memberinfo')return i.reply({content:`${m}\nID: ${m.id}\nRole: ${m.roles.cache.map(String).join(', ')}`,ephemeral:true});
  if(n==='a-addrole'){await m.roles.add(i.options.getRole('role'));return done(i)}if(n==='a-removerole'){await m.roles.remove(i.options.getRole('role'));return done(i)}
  if(n==='a-timeout'){await m.timeout(i.options.getInteger('menit')*60000,`Oleh ${i.user.tag}`);return done(i)}if(n==='a-untimeout'){await m.timeout(null);return done(i)}
  if(n==='a-nickname'){await m.setNickname(i.options.getString('nama'));return done(i)}if(n==='a-clonechannel'){const c=await ch.clone();return i.reply({content:`✅ ${c}`,ephemeral:true})}
  if(n.startsWith('a-create')){const type=n==='a-createtext'?ChannelType.GuildText:n==='a-createvoice'?ChannelType.GuildVoice:ChannelType.GuildCategory;const c=await g.channels.create({name:i.options.getString('nama'),type,parent:type===ChannelType.GuildCategory?undefined:ch.parentId});return i.reply({content:`✅ ${c}`,ephemeral:true})}
  if(n==='a-topic'){await ch.setTopic(i.options.getString('teks'));return done(i)}if(n==='a-rename'){await ch.setName(i.options.getString('nama'));return done(i)}
  if(n==='a-announce'||n==='a-say'){const dest=i.options.getChannel('tujuan')||ch,msg=i.options.getString('pesan');await dest.send(n==='a-announce'?{embeds:[{description:msg,color:0x5865f2}],allowedMentions:{parse:[]}}:{content:msg,allowedMentions:{parse:[]}});return done(i)}
  if(n==='a-listbans'){const b=await g.bans.fetch();return i.reply({content:b.size?[...b.values()].slice(0,50).map(x=>`${x.user.tag} — ${x.user.id}`).join('\n'):'Tidak ada ban.',ephemeral:true})}
  if(n==='a-roleinfo'){const r=i.options.getRole('role');return i.reply({content:`${r}\nID: ${r.id}\nAnggota: ${r.members.size}\nPermission: ${r.permissions.toArray().join(', ')||'-'}`,ephemeral:true})}
  if(n==='a-permissions')return i.reply({content:m.permissions.toArray().join(', ')||'Tidak ada.',ephemeral:true});
  if(n==='a-syncperms'){if(!ch.parentId)throw new Error('Channel tidak memiliki kategori.');await ch.lockPermissions();return done(i)}
}

async function ownerCommand(i,ctx){const n=i.commandName,g=i.guild,c=i.client;
  const fixed={'o-botstatus':`Online • ${c.ws.ping} ms • ${c.guilds.cache.size} server`,'o-aistatus':`${ctx.config.ai.provider}/${ctx.config.ai.model} • ${ctx.aiClient.configured?'aktif':'nonaktif'}`,'o-dashboard':`${ctx.config.dashboard.enabled?'aktif':'nonaktif'} • http://${ctx.config.dashboard.host}:${ctx.config.dashboard.port}`,'o-memory':`RSS ${(process.memoryUsage().rss/1048576).toFixed(1)} MB`,'o-uptime':`${Math.floor(c.uptime/1000)} detik`,'o-commandcount':`${ctx.totalFunctions} fungsi • 100 top-level command`,'o-botperms':g.members.me.permissions.toArray().join(', '),'o-guilds':c.guilds.cache.map(x=>`${x.name} — ${x.id}`).join('\n'),'o-emojis':`${g.emojis.cache.size} emoji`,'o-health':`✅ Bot sehat • WS ${c.ws.status} • ${c.ws.ping} ms • AI ${ctx.aiClient.configured?'OK':'OFF'}`};if(fixed[n])return long(i,fixed[n]);
  if(n==='o-config')return i.reply({content:`Guild ${ctx.config.guildId}\nOwner ${ctx.config.access.ownerRoleId}\nAdmin ${ctx.config.access.adminRoleId}\nMember ${ctx.config.access.memberRoleId}\nWebhook ${ctx.audit.configured?'aktif':'kosong'}`,ephemeral:true});
  if(n==='o-roleids')return long(i,g.roles.cache.map(r=>`${r.name} — ${r.id}`).join('\n'));if(n==='o-channelids')return long(i,g.channels.cache.map(x=>`${x.name} — ${x.id}`).join('\n'));
  if(['o-exportroles','o-exportchannels','o-exportserver'].includes(n)){const roles=g.roles.cache.map(r=>({name:r.name,id:r.id,permissions:r.permissions.toArray()})),channels=g.channels.cache.map(x=>({name:x.name,id:x.id,type:ChannelType[x.type],parent:x.parentId}));const data=n==='o-exportroles'?roles:n==='o-exportchannels'?channels:{guild:{name:g.name,id:g.id},roles,channels};return i.reply({files:[{attachment:Buffer.from(JSON.stringify(data,null,2)),name:`${n.slice(2)}.json`}],ephemeral:true})}
  if(n==='o-notify'){await ctx.notifyOnline();return done(i)}if(n==='o-webhooktest'){await ctx.audit.send('Tes Webhook',`Oleh ${i.user.tag}`);return done(i)}
  if(n==='o-integrations'){const x=await g.fetchIntegrations();return i.reply({content:`${x.size} integrasi`,ephemeral:true})}if(n==='o-ownerinfo'){const o=await g.fetchOwner();return i.reply({content:`${o.user.tag} — ${o.id}`,ephemeral:true})}
}

function done(i){return i.reply({content:'✅ Berhasil.',ephemeral:true})}async function long(i,t){const chunks=[];let s=String(t);while(s.length>1900){let p=s.lastIndexOf('\n',1900);if(p<500)p=1900;chunks.push(s.slice(0,p));s=s.slice(p)}chunks.push(s);await i.reply({content:chunks.shift(),ephemeral:true});for(const x of chunks)await i.followUp({content:x,ephemeral:true})}
