import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import { applyTemplate, previewTemplate } from './setup-engine.js';
import { cleanChannelName, safeError, splitDiscordMessage } from './utils.js';

const admin = PermissionFlagsBits.Administrator;
const manageChannels = PermissionFlagsBits.ManageChannels;
const manageRoles = PermissionFlagsBits.ManageRoles;

export const commandData = [
  new SlashCommandBuilder()
    .setName('ai').setDescription('Chat dengan AI LMArena/OpenAI-compatible')
    .addSubcommand((s) => s.setName('chat').setDescription('Kirim pertanyaan ke AI').addStringOption((o) => o.setName('pesan').setDescription('Pertanyaan Anda').setRequired(true).setMaxLength(2000)))
    .addSubcommand((s) => s.setName('reset').setDescription('Hapus riwayat percakapan AI Anda'))
    .addSubcommand((s) => s.setName('status').setDescription('Lihat status konfigurasi AI')),

  new SlashCommandBuilder()
    .setName('setup-server').setDescription('Preview atau terapkan template role/category/channel JSON')
    .setDefaultMemberPermissions(admin)
    .addStringOption((o) => o.setName('aksi').setDescription('Pilih preview dahulu sebelum apply').setRequired(true).addChoices(
      { name: 'Preview (tidak mengubah server)', value: 'preview' },
      { name: 'Apply (buat item yang belum ada)', value: 'apply' }
    ))
    .addAttachmentOption((o) => o.setName('template').setDescription('File template JSON, maks. 256 KB').setRequired(true))
    .addStringOption((o) => o.setName('konfirmasi').setDescription('Ketik APPLY untuk aksi apply')),

  new SlashCommandBuilder()
    .setName('role').setDescription('Kelola role server').setDefaultMemberPermissions(manageRoles)
    .addSubcommand((s) => s.setName('buat').setDescription('Buat role baru')
      .addStringOption((o) => o.setName('nama').setDescription('Nama role').setRequired(true).setMaxLength(100))
      .addStringOption((o) => o.setName('warna').setDescription('Warna hex, contoh #3498DB'))
      .addStringOption((o) => o.setName('permissions').setDescription('Nama permission dipisah koma, contoh ManageMessages,KickMembers'))
      .addBooleanOption((o) => o.setName('ditampilkan').setDescription('Tampilkan role terpisah di daftar anggota'))
      .addBooleanOption((o) => o.setName('mentionable').setDescription('Role dapat di-mention')))
    .addSubcommand((s) => s.setName('hapus').setDescription('Hapus role (tidak dapat dibatalkan)')
      .addRoleOption((o) => o.setName('role').setDescription('Role yang akan dihapus').setRequired(true))
      .addStringOption((o) => o.setName('konfirmasi').setDescription('Ketik HAPUS').setRequired(true)))
    .addSubcommand((s) => s.setName('daftar').setDescription('Tampilkan daftar role')),

  new SlashCommandBuilder()
    .setName('category').setDescription('Kelola kategori server').setDefaultMemberPermissions(manageChannels)
    .addSubcommand((s) => s.setName('buat').setDescription('Buat kategori')
      .addStringOption((o) => o.setName('nama').setDescription('Nama kategori').setRequired(true).setMaxLength(100))
      .addBooleanOption((o) => o.setName('private').setDescription('Sembunyikan dari @everyone'))
      .addRoleOption((o) => o.setName('akses_role').setDescription('Role yang boleh melihat kategori private')))
    .addSubcommand((s) => s.setName('hapus').setDescription('Hapus kategori kosong')
      .addChannelOption((o) => o.setName('kategori').setDescription('Kategori yang akan dihapus').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
      .addStringOption((o) => o.setName('konfirmasi').setDescription('Ketik HAPUS').setRequired(true)))
    .addSubcommand((s) => s.setName('daftar').setDescription('Tampilkan daftar kategori')),

  new SlashCommandBuilder()
    .setName('channel').setDescription('Kelola text/voice/announcement/forum channel').setDefaultMemberPermissions(manageChannels)
    .addSubcommand((s) => s.setName('buat').setDescription('Buat channel baru')
      .addStringOption((o) => o.setName('nama').setDescription('Nama channel').setRequired(true).setMaxLength(100))
      .addStringOption((o) => o.setName('tipe').setDescription('Tipe channel').setRequired(true).addChoices(
        { name: 'Text', value: 'text' }, { name: 'Voice', value: 'voice' },
        { name: 'Announcement', value: 'announcement' }, { name: 'Forum', value: 'forum' }, { name: 'Stage', value: 'stage' }
      ))
      .addChannelOption((o) => o.setName('kategori').setDescription('Kategori induk').addChannelTypes(ChannelType.GuildCategory))
      .addStringOption((o) => o.setName('topik').setDescription('Topik channel').setMaxLength(1024))
      .addBooleanOption((o) => o.setName('private').setDescription('Sembunyikan dari @everyone'))
      .addRoleOption((o) => o.setName('akses_role').setDescription('Role yang boleh melihat channel private')))
    .addSubcommand((s) => s.setName('hapus').setDescription('Hapus channel (tidak dapat dibatalkan)')
      .addChannelOption((o) => o.setName('channel').setDescription('Channel yang akan dihapus').setRequired(true))
      .addStringOption((o) => o.setName('konfirmasi').setDescription('Ketik HAPUS').setRequired(true)))
    .addSubcommand((s) => s.setName('daftar').setDescription('Tampilkan daftar channel')),

  new SlashCommandBuilder().setName('clear').setDescription('Hapus sejumlah pesan terbaru').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) => o.setName('jumlah').setDescription('1–100 pesan').setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Tampilkan informasi server'),
  new SlashCommandBuilder().setName('ping').setDescription('Cek respons bot')
].map((command) => command.toJSON());

const channelTypes = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
  stage: ChannelType.GuildStageVoice
};

function parsePermissions(value) {
  if (!value) return [];
  return value.split(',').map((name) => name.trim()).filter(Boolean).map((name) => {
    const permission = PermissionsBitField.Flags[name];
    if (permission == null) throw new Error(`Permission "${name}" tidak dikenal. Gunakan nama discord.js seperti ManageMessages.`);
    return permission;
  });
}

function privateOverwrites(guild, isPrivate, role) {
  if (!isPrivate) return undefined;
  const overwrites = [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }];
  if (role) overwrites.push({ id: role.id, allow: [PermissionFlagsBits.ViewChannel] });
  return overwrites;
}

async function readJsonAttachment(attachment) {
  if (attachment.size > 256 * 1024) throw new Error('Template terlalu besar (maksimal 256 KB).');
  const response = await fetch(attachment.url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Gagal mengunduh template (${response.status}).`);
  const text = await response.text();
  try { return JSON.parse(text); } catch { throw new Error('Template bukan JSON yang valid.'); }
}

function historyKey(interaction) {
  return `${interaction.guildId}:${interaction.channelId}:${interaction.user.id}`;
}

export async function handleCommand(interaction, context) {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.inGuild() && !['ai', 'ping'].includes(interaction.commandName)) {
    return interaction.reply({ content: 'Command ini hanya dapat digunakan di server.', ephemeral: true });
  }

  try {
    switch (interaction.commandName) {
      case 'ping':
        return interaction.reply({ content: `Pong! WebSocket: ${interaction.client.ws.ping} ms`, ephemeral: true });
      case 'serverinfo':
        return await serverInfo(interaction);
      case 'clear':
        return await clearMessages(interaction);
      case 'ai':
        return await aiCommand(interaction, context);
      case 'setup-server':
        return await setupServer(interaction);
      case 'role':
        return await roleCommand(interaction);
      case 'category':
        return await categoryCommand(interaction);
      case 'channel':
        return await channelCommand(interaction);
      default:
        return interaction.reply({ content: 'Command tidak dikenal.', ephemeral: true });
    }
  } catch (error) {
    console.error(`Command /${interaction.commandName} gagal:`, error);
    const content = `❌ ${safeError(error).slice(0, 1800)}`;
    if (interaction.deferred || interaction.replied) return interaction.editReply({ content });
    return interaction.reply({ content, ephemeral: true });
  }
}

async function aiCommand(interaction, { aiClient, conversations, aiConfig }) {
  const action = interaction.options.getSubcommand();
  const key = historyKey(interaction);
  if (action === 'status') {
    return interaction.reply({
      content: `AI: **${aiClient.configured ? 'siap' : 'belum dikonfigurasi'}**\nProvider: \`${aiConfig.provider}\`\nModel: \`${aiConfig.model || '-'}\`\nEndpoint: ${aiConfig.baseUrl ? 'terisi' : 'kosong'}\nAPI key: ${aiConfig.apiKey ? 'terisi' : 'kosong'}`,
      ephemeral: true
    });
  }
  if (action === 'reset') {
    conversations.clear(key);
    return interaction.reply({ content: 'Riwayat percakapan AI Anda di channel ini sudah dihapus.', ephemeral: true });
  }
  if (aiConfig.channelIds.size && !aiConfig.channelIds.has(interaction.channelId)) {
    return interaction.reply({ content: 'AI tidak diaktifkan di channel ini.', ephemeral: true });
  }
  await interaction.deferReply();
  const prompt = interaction.options.getString('pesan', true);
  const messages = [...conversations.get(key), { role: 'user', content: prompt }];
  const answer = await aiClient.chat(messages);
  conversations.append(key, { role: 'user', content: prompt }, { role: 'assistant', content: answer });
  const chunks = splitDiscordMessage(answer);
  await interaction.editReply(chunks.shift());
  for (const chunk of chunks) await interaction.followUp(chunk);
}

async function setupServer(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const action = interaction.options.getString('aksi', true);
  if (action === 'apply' && interaction.options.getString('konfirmasi') !== 'APPLY') {
    throw new Error('Untuk apply, isi konfirmasi persis: APPLY');
  }
  const template = await readJsonAttachment(interaction.options.getAttachment('template', true));
  if (action === 'preview') {
    const actions = previewTemplate(interaction.guild, template);
    const shown = actions.slice(0, 60).join('\n');
    const suffix = actions.length > 60 ? `\n...dan ${actions.length - 60} tindakan lainnya.` : '';
    return interaction.editReply(`**Preview (${actions.length} item):**\n\`\`\`\n${shown}${suffix}\n\`\`\``);
  }
  const result = await applyTemplate(interaction.guild, template, `Setup oleh ${interaction.user.tag}`);
  return interaction.editReply(`✅ Setup selesai. Dibuat: **${result.roles} role**, **${result.categories} kategori**, **${result.channels} channel**. Item yang sudah ada dilewati.`);
}

async function roleCommand(interaction) {
  const action = interaction.options.getSubcommand();
  if (action === 'daftar') {
    const roles = [...interaction.guild.roles.cache.values()].filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);
    return interaction.reply({ content: roles.length ? roles.slice(0, 80).map((r) => `${r} — ${r.members.size} anggota`).join('\n') : 'Belum ada role.', ephemeral: true });
  }
  if (action === 'buat') {
    const name = interaction.options.getString('nama', true);
    const color = interaction.options.getString('warna');
    if (color && !/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Warna harus format hex seperti #3498DB.');
    const role = await interaction.guild.roles.create({
      name, color: color || undefined,
      permissions: parsePermissions(interaction.options.getString('permissions')),
      hoist: interaction.options.getBoolean('ditampilkan') ?? false,
      mentionable: interaction.options.getBoolean('mentionable') ?? false,
      reason: `Dibuat oleh ${interaction.user.tag}`
    });
    return interaction.reply({ content: `✅ Role ${role} berhasil dibuat.`, ephemeral: true });
  }
  const role = interaction.options.getRole('role', true);
  if (interaction.options.getString('konfirmasi', true) !== 'HAPUS') throw new Error('Konfirmasi harus persis: HAPUS');
  if (role.id === interaction.guild.id || role.managed) throw new Error('Role @everyone atau role terkelola integrasi tidak dapat dihapus.');
  const name = role.name;
  await role.delete(`Dihapus oleh ${interaction.user.tag}`);
  return interaction.reply({ content: `✅ Role **${name}** dihapus.`, ephemeral: true });
}

async function categoryCommand(interaction) {
  const action = interaction.options.getSubcommand();
  if (action === 'daftar') {
    const categories = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
    return interaction.reply({ content: categories.size ? categories.map((c) => `**${c.name}** — ${c.children.cache.size} channel`).join('\n') : 'Belum ada kategori.', ephemeral: true });
  }
  if (action === 'buat') {
    const role = interaction.options.getRole('akses_role');
    const category = await interaction.guild.channels.create({
      name: interaction.options.getString('nama', true), type: ChannelType.GuildCategory,
      permissionOverwrites: privateOverwrites(interaction.guild, interaction.options.getBoolean('private') ?? false, role),
      reason: `Dibuat oleh ${interaction.user.tag}`
    });
    return interaction.reply({ content: `✅ Kategori **${category.name}** dibuat.`, ephemeral: true });
  }
  const category = interaction.options.getChannel('kategori', true);
  if (interaction.options.getString('konfirmasi', true) !== 'HAPUS') throw new Error('Konfirmasi harus persis: HAPUS');
  if (category.children.cache.size) throw new Error('Kategori harus kosong. Pindahkan atau hapus channel di dalamnya terlebih dahulu.');
  const name = category.name;
  await category.delete(`Dihapus oleh ${interaction.user.tag}`);
  return interaction.reply({ content: `✅ Kategori **${name}** dihapus.`, ephemeral: true });
}

async function channelCommand(interaction) {
  const action = interaction.options.getSubcommand();
  if (action === 'daftar') {
    const channels = interaction.guild.channels.cache.filter((c) => c.type !== ChannelType.GuildCategory).sort((a, b) => a.rawPosition - b.rawPosition);
    return interaction.reply({ content: channels.size ? channels.first(100).map((c) => `${c} — ${ChannelType[c.type]}`).join('\n') : 'Belum ada channel.', ephemeral: true });
  }
  if (action === 'buat') {
    const typeName = interaction.options.getString('tipe', true);
    const type = channelTypes[typeName];
    const rawName = interaction.options.getString('nama', true);
    const role = interaction.options.getRole('akses_role');
    const channel = await interaction.guild.channels.create({
      name: typeName === 'text' || typeName === 'announcement' || typeName === 'forum' ? (cleanChannelName(rawName) || rawName) : rawName,
      type,
      parent: interaction.options.getChannel('kategori')?.id,
      topic: ['text', 'announcement', 'forum'].includes(typeName) ? interaction.options.getString('topik') : undefined,
      permissionOverwrites: privateOverwrites(interaction.guild, interaction.options.getBoolean('private') ?? false, role),
      reason: `Dibuat oleh ${interaction.user.tag}`
    });
    return interaction.reply({ content: `✅ Channel ${channel} berhasil dibuat.`, ephemeral: true });
  }
  const channel = interaction.options.getChannel('channel', true);
  if (interaction.options.getString('konfirmasi', true) !== 'HAPUS') throw new Error('Konfirmasi harus persis: HAPUS');
  const name = channel.name;
  if (channel.id === interaction.channelId) await interaction.reply({ content: `✅ Menghapus channel **${name}**...`, ephemeral: true });
  await channel.delete(`Dihapus oleh ${interaction.user.tag}`);
  if (channel.id !== interaction.channelId) return interaction.reply({ content: `✅ Channel **${name}** dihapus.`, ephemeral: true });
}

async function clearMessages(interaction) {
  if (!interaction.channel?.bulkDelete) throw new Error('Command ini hanya bisa digunakan di text channel server.');
  await interaction.deferReply({ ephemeral: true });
  const deleted = await interaction.channel.bulkDelete(interaction.options.getInteger('jumlah', true), true);
  return interaction.editReply(`✅ ${deleted.size} pesan berhasil dihapus. Pesan lebih lama dari 14 hari otomatis dilewati Discord.`);
}

function serverInfo(interaction) {
  const guild = interaction.guild;
  const embed = new EmbedBuilder().setTitle(guild.name).setThumbnail(guild.iconURL()).setColor(0x5865f2)
    .addFields(
      { name: 'Pemilik', value: `<@${guild.ownerId}>`, inline: true },
      { name: 'Anggota', value: String(guild.memberCount), inline: true },
      { name: 'Channel', value: String(guild.channels.cache.size), inline: true },
      { name: 'Role', value: String(guild.roles.cache.size), inline: true },
      { name: 'Dibuat', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
    );
  return interaction.reply({ embeds: [embed] });
}
