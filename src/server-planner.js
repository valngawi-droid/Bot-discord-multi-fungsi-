import { extractJsonObject } from './utils.js';
import { previewTemplate } from './setup-engine.js';

export function setupGeneratorPrompt(description) {
  return `Anda adalah generator konfigurasi server Discord. Ubah permintaan pengguna menjadi SATU object JSON valid, tanpa markdown dan tanpa penjelasan.

Schema wajib:
{"roles":[{"name":"string","color":"#RRGGBB","hoist":false,"mentionable":true,"permissions":["PermissionName"]}],"categories":[{"name":"string","everyone":{"allow":["PermissionName"],"deny":["PermissionName"]},"roles":{"Nama Role":{"allow":["PermissionName"],"deny":["PermissionName"]}},"channels":[{"name":"string","type":"text|voice|announcement|forum|stage","topic":"string","everyone":{"allow":[],"deny":[]},"roles":{}}]}]}

Aturan:
- Semua role yang disebut dalam category/channel roles WAJIB ada di array roles.
- Gunakan nama permission discord.js yang valid, misalnya ViewChannel, SendMessages, ReadMessageHistory, ManageMessages, Connect, Speak, ManageChannels, ManageRoles, ModerateMembers, KickMembers.
- Untuk area private: category.everyone.deny berisi ViewChannel dan role yang berhak mendapat allow ViewChannel.
- Untuk channel pengumuman/peraturan: @everyone dapat ViewChannel dan ReadMessageHistory tetapi deny SendMessages; Admin/Moderator allow SendMessages.
- Jangan membuat permission Administrator kecuali diminta secara eksplisit.
- Maksimal 20 role, 20 kategori, dan 80 channel. Buat struktur yang ringkas dan masuk akal.
- Properti opsional yang tidak diperlukan boleh dihilangkan. Output harus dapat diparse JSON.parse.

Permintaan pengguna:
${description}`;
}

export async function generateServerPlan(aiClient, guild, description) {
  if (typeof description !== 'string' || !description.trim()) throw new Error('Prompt tidak boleh kosong.');
  if (description.length > 50_000) throw new Error('Prompt maksimal 50.000 karakter.');
  const answer = await aiClient.chat(
    [{ role: 'user', content: setupGeneratorPrompt(description) }],
    { maxTokens: 8192, temperature: 0.25 }
  );
  const template = extractJsonObject(answer);
  const actions = previewTemplate(guild, template);
  return { template, actions };
}
