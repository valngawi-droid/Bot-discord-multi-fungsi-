import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { applySecurityPlan, generateSecurityPlan } from './security-planner.js';

const plans = new Map();
const TTL = 30 * 60 * 1000;

export const securityCommandData = new SlashCommandBuilder()
  .setName('autokeamanan').setDescription('AI mengatur permission category dan channel secara otomatis')
  .addSubcommand((s) => s.setName('analisis').setDescription('Analisis dan buat preview permission')
    .addChannelOption((o) => o.setName('kategori').setDescription('Kosong = seluruh server').addChannelTypes(ChannelType.GuildCategory))
    .addStringOption((o) => o.setName('mode').setDescription('Tingkat keamanan').addChoices(
      { name: 'Aman (disarankan)', value: 'aman' }, { name: 'Ketat', value: 'ketat' }
    )))
  .addSubcommand((s) => s.setName('lihat').setDescription('Lihat kembali rencana keamanan terakhir'))
  .addSubcommand((s) => s.setName('terapkan').setDescription('Terapkan rencana permission terakhir')
    .addStringOption((o) => o.setName('konfirmasi').setDescription('Ketik APPLY').setRequired(true)))
  .addSubcommand((s) => s.setName('batal').setDescription('Batalkan rencana keamanan'))
  .toJSON();

export async function handleSecurityCommand(interaction, context) {
  const action = interaction.options.getSubcommand();
  const key = `${interaction.guildId}:${interaction.user.id}`;
  if (action === 'batal') {
    plans.delete(key);
    return interaction.reply({ content: '✅ Rencana keamanan dibatalkan.', ephemeral: true });
  }
  if (action === 'lihat') {
    const plan = getPlan(key);
    if (!plan) return interaction.reply({ content: 'Tidak ada rencana aktif. Jalankan `/autokeamanan analisis`.', ephemeral: true });
    return sendPreview(interaction, plan);
  }
  if (action === 'terapkan') {
    if (interaction.options.getString('konfirmasi', true) !== 'APPLY') throw new Error('Konfirmasi harus persis: APPLY');
    const plan = getPlan(key);
    if (!plan) throw new Error('Rencana tidak ada atau sudah kedaluwarsa. Jalankan analisis lagi.');
    await interaction.deferReply({ ephemeral: true });
    const count = await applySecurityPlan(interaction.guild, plan, `Auto keamanan AI oleh ${interaction.user.tag}`);
    plans.delete(key);
    await context.audit?.send('Auto Keamanan Diterapkan', `${interaction.user.tag} menerapkan ${count} permission action di ${interaction.guild.name}`);
    return interaction.editReply(`✅ **${count} pengaturan permission** berhasil diterapkan. Gunakan \`/permission inspect\` untuk memeriksa channel tertentu.`);
  }

  await interaction.deferReply({ ephemeral: true });
  const category = interaction.options.getChannel('kategori');
  const mode = interaction.options.getString('mode') || 'aman';
  const plan = await generateSecurityPlan(context.aiClient, interaction.guild, category?.id, mode);
  plans.set(key, { ...plan, createdAt: Date.now(), categoryId: category?.id || null, mode });
  return sendPreview(interaction, plans.get(key), true);
}

function getPlan(key) {
  const plan = plans.get(key);
  if (!plan || Date.now() - plan.createdAt > TTL) {
    plans.delete(key);
    return null;
  }
  return plan;
}

async function sendPreview(interaction, plan, editing = false) {
  const lines = plan.actions.slice(0, 35).map((action, index) => {
    const allow = action.allow.length ? `✅ ${action.allow.join(', ')}` : '';
    const deny = action.deny.length ? `⛔ ${action.deny.join(', ')}` : '';
    return `${index + 1}. <#${action.channelId}> → <@&${action.targetId}> ${allow} ${deny}\n   ${action.reason}`;
  });
  const remaining = plan.actions.length > 35 ? `\n...dan ${plan.actions.length - 35} tindakan lain (lihat file JSON).` : '';
  const content = `**Preview Auto Keamanan — ${plan.mode || 'aman'}**\n${plan.summary}\n\n${lines.join('\n').slice(0, 1600)}${remaining}\n\nTerapkan dengan \`/autokeamanan terapkan konfirmasi:APPLY\`. Rencana berlaku 30 menit.`;
  const payload = {
    content,
    files: [{ attachment: Buffer.from(JSON.stringify({ summary: plan.summary, actions: plan.actions }, null, 2)), name: 'rencana-keamanan.json' }],
    ephemeral: true
  };
  return editing ? interaction.editReply(payload) : interaction.reply(payload);
}
