import { ChannelType, PermissionFlagsBits } from 'discord.js';

export async function notifyOnline(client, config, audit) {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) throw new Error('Guild notifikasi tidak ditemukan.');

  const targetId = config.notifications.categoryId;
  const target = targetId
    ? await guild.channels.fetch(targetId).catch(() => null)
    : null;
  let channel;
  let fallbackNote = '';

  if (target?.type === ChannelType.GuildCategory) {
    channel = target.children.cache.find((item) => item.type === ChannelType.GuildText && item.name === config.notifications.channelName);
    if (!channel) {
      channel = await guild.channels.create({
        name: config.notifications.channelName,
        type: ChannelType.GuildText,
        parent: target.id,
        topic: 'Status online dan operasional bot',
        permissionOverwrites: [{
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages]
        }],
        reason: 'Channel status otomatis bot'
      });
    }
  } else if (target?.type === ChannelType.GuildText || target?.type === ChannelType.GuildAnnouncement) {
    // Mendukung pengguna yang memasukkan ID text channel alih-alih kategori.
    channel = target;
  } else {
    channel = guild.systemChannel
      || guild.channels.cache.find((item) => item.type === ChannelType.GuildText && item.viewable);
    if (!channel) throw new Error('Target status tidak valid dan tidak ada text channel fallback yang bisa dipakai.');
    fallbackNote = `\n⚠️ ID target \`${targetId || '-'}\` bukan kategori/text channel yang dapat diakses; status dikirim ke ${channel}.`;
  }

  const mention = config.notifications.mentionEveryone ? '@everyone ' : '';
  await channel.send({
    content: `${mention}🟢 **${client.user.username} online**`,
    embeds: [{
      color: 0x39d98a,
      description: `Bot aktif dan siap digunakan.\n<t:${Math.floor(Date.now() / 1000)}:F>${fallbackNote}`,
      footer: { text: `${client.guilds.cache.size} server • ${client.ws.ping} ms` }
    }],
    allowedMentions: { parse: config.notifications.mentionEveryone ? ['everyone'] : [] }
  });
  await audit?.send('Bot Online', `${client.user.tag} online di ${guild.name}\nStatus channel: #${channel.name}`, 0x39d98a);
  return channel;
}
