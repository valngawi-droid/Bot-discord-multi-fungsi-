import { ChannelType, PermissionFlagsBits } from 'discord.js';

export async function notifyOnline(client, config, audit) {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) throw new Error('Guild notifikasi tidak ditemukan.');
  const category = guild.channels.cache.get(config.notifications.categoryId);
  if (!category || category.type !== ChannelType.GuildCategory) throw new Error('ONLINE_CATEGORY_ID bukan kategori yang valid.');

  let channel = category.children.cache.find((item) => item.type === ChannelType.GuildText && item.name === config.notifications.channelName);
  if (!channel) {
    channel = await guild.channels.create({
      name: config.notifications.channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: 'Status online dan operasional bot',
      permissionOverwrites: [{
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages]
      }],
      reason: 'Channel status otomatis bot'
    });
  }
  const mention = config.notifications.mentionEveryone ? '@everyone ' : '';
  await channel.send({
    content: `${mention}🟢 **${client.user.username} online**`,
    embeds: [{
      color: 0x39d98a,
      description: `Bot aktif dan siap digunakan.\n<t:${Math.floor(Date.now() / 1000)}:F>`,
      footer: { text: `${client.guilds.cache.size} server • ${client.ws.ping} ms` }
    }],
    allowedMentions: { parse: config.notifications.mentionEveryone ? ['everyone'] : [] }
  });
  await audit?.send('Bot Online', `${client.user.tag} online di ${guild.name}\nStatus channel: #${channel.name}`, 0x39d98a);
  return channel;
}
