import { PermissionsBitField } from 'discord.js';
import { extractJsonObject } from './utils.js';

const ALLOWED_PERMISSIONS = new Set([
  'ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AddReactions',
  'CreatePublicThreads', 'CreatePrivateThreads', 'SendMessagesInThreads',
  'Connect', 'Speak', 'Stream', 'UseVAD', 'ManageMessages', 'ManageThreads',
  'ManageChannels', 'MuteMembers', 'DeafenMembers', 'MoveMembers'
]);

export async function generateSecurityPlan(aiClient, guild, categoryId, mode = 'aman') {
  await guild.channels.fetch();
  await guild.roles.fetch();
  const channels = guild.channels.cache.filter((channel) => {
    if (!categoryId) return !channel.isThread?.();
    return channel.id === categoryId || channel.parentId === categoryId;
  });
  if (!channels.size) throw new Error('Tidak ada category/channel yang dapat dianalisis.');

  const inventory = {
    mode,
    everyoneRoleId: guild.roles.everyone.id,
    roles: guild.roles.cache
      .filter((role) => !role.managed && role.id !== guild.roles.everyone.id)
      .map((role) => ({ id: role.id, name: role.name, permissions: role.permissions.toArray() })),
    channels: channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parentId: channel.parentId,
      topic: channel.topic || '',
      overwrites: channel.permissionOverwrites?.cache.map((overwrite) => ({
        targetId: overwrite.id,
        allow: overwrite.allow.toArray(),
        deny: overwrite.deny.toArray()
      })) || []
    }))
  };

  const answer = await aiClient.chat([{
    role: 'user',
    content: securityPrompt(inventory)
  }], { maxTokens: 8192, temperature: 0.1 });
  const parsed = extractJsonObject(answer);
  return validateSecurityPlan(parsed, guild, new Set(channels.keys()));
}

function securityPrompt(inventory) {
  return `Anda adalah auditor keamanan permission Discord. Analisis inventory berikut dan buat rencana permission berdasarkan nama kategori/channel, topik, tipe, serta nama role.

Output HANYA JSON valid tanpa markdown dengan schema:
{"summary":"ringkasan","actions":[{"channelId":"ID","targetId":"role ID atau everyoneRoleId","allow":["PermissionName"],"deny":["PermissionName"],"reason":"alasan singkat"}]}

Aturan wajib:
- Gunakan HANYA channelId dan targetId yang tersedia di inventory.
- Permission yang boleh digunakan: ViewChannel, SendMessages, ReadMessageHistory, AddReactions, CreatePublicThreads, CreatePrivateThreads, SendMessagesInThreads, Connect, Speak, Stream, UseVAD, ManageMessages, ManageThreads, ManageChannels, MuteMembers, DeafenMembers, MoveMembers.
- Jangan masukkan permission yang sama ke allow dan deny.
- Area bernama owner, admin, staff, moderator, logs, ticket internal, atau private harus deny ViewChannel untuk everyone dan allow ViewChannel hanya untuk role terkait.
- Channel rules, information, announcement, welcome: everyone boleh ViewChannel dan ReadMessageHistory, tetapi deny SendMessages/AddReactions; role staff boleh mengirim.
- Channel public/general/chat/community: everyone boleh ViewChannel, SendMessages, ReadMessageHistory.
- Voice public: everyone boleh ViewChannel, Connect, Speak. Voice staff mengikuti privasi kategori staff.
- Category overwrite harus menjadi dasar; channel anak hanya diberi pengecualian jika diperlukan.
- Mode "aman" menyeimbangkan keamanan dan penggunaan. Mode "ketat" memakai least privilege lebih agresif.
- Jangan menghapus akses Owner/Admin dari area manajemen.
- Maksimal 300 action. Hanya tulis perubahan yang berguna.

Inventory:
${JSON.stringify(inventory)}`;
}

export function validateSecurityPlan(plan, guild, allowedChannelIds) {
  if (!plan || typeof plan !== 'object' || !Array.isArray(plan.actions)) throw new Error('Rencana keamanan AI tidak memiliki actions yang valid.');
  if (plan.actions.length > 300) throw new Error('Rencana AI terlalu besar (maksimal 300 tindakan).');
  const validTargets = new Set([guild.roles.everyone.id, ...guild.roles.cache.keys()]);
  const actions = plan.actions.map((action, index) => {
    if (!allowedChannelIds.has(String(action.channelId))) throw new Error(`Action ${index + 1}: channelId tidak valid.`);
    if (!validTargets.has(String(action.targetId))) throw new Error(`Action ${index + 1}: targetId tidak valid.`);
    const allow = validatePermissionNames(action.allow, index);
    const deny = validatePermissionNames(action.deny, index);
    if (allow.some((permission) => deny.includes(permission))) throw new Error(`Action ${index + 1}: permission tidak boleh allow dan deny sekaligus.`);
    return {
      channelId: String(action.channelId), targetId: String(action.targetId), allow, deny,
      reason: String(action.reason || 'Rekomendasi AI').slice(0, 300)
    };
  });
  return { summary: String(plan.summary || 'Rencana keamanan otomatis').slice(0, 1000), actions };
}

function validatePermissionNames(value, index) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`Action ${index + 1}: allow/deny harus array.`);
  return [...new Set(value.map(String))].map((permission) => {
    if (!ALLOWED_PERMISSIONS.has(permission) || PermissionsBitField.Flags[permission] == null) {
      throw new Error(`Action ${index + 1}: permission ${permission} tidak diizinkan.`);
    }
    return permission;
  });
}

export async function applySecurityPlan(guild, plan, reason) {
  let applied = 0;
  for (const action of plan.actions) {
    const channel = guild.channels.cache.get(action.channelId) || await guild.channels.fetch(action.channelId);
    const target = action.targetId === guild.roles.everyone.id
      ? guild.roles.everyone
      : guild.roles.cache.get(action.targetId) || await guild.roles.fetch(action.targetId);
    if (!channel?.permissionOverwrites || !target) throw new Error(`Target action tidak ditemukan: ${action.channelId}/${action.targetId}`);
    const changes = {};
    for (const permission of action.allow) changes[permission] = true;
    for (const permission of action.deny) changes[permission] = false;
    await channel.permissionOverwrites.edit(target, changes, { reason });
    applied++;
  }
  return applied;
}
