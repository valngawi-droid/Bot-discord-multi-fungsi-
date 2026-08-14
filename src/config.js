import 'dotenv/config';

function numberEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} harus berupa angka.`);
  return parsed;
}

function boolEnv(name, fallback) {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  ai: {
    baseUrl: (process.env.LMARENA_BASE_URL || '').replace(/\/$/, ''),
    apiKey: process.env.LMARENA_API_KEY || '',
    model: process.env.LMARENA_MODEL || '',
    systemPrompt: process.env.AI_SYSTEM_PROMPT || 'Kamu adalah asisten yang ramah dan membantu.',
    maxTokens: numberEnv('AI_MAX_TOKENS', 1200),
    temperature: numberEnv('AI_TEMPERATURE', 0.7),
    timeoutMs: numberEnv('AI_TIMEOUT_MS', 60_000),
    channelIds: new Set((process.env.AI_CHANNEL_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)),
    replyOnMention: boolEnv('AI_REPLY_ON_MENTION', true)
  }
};

export function requireDiscordConfig() {
  const missing = [];
  if (!config.discordToken) missing.push('DISCORD_TOKEN');
  if (!config.clientId) missing.push('DISCORD_CLIENT_ID');
  if (missing.length) throw new Error(`Environment variable wajib belum diisi: ${missing.join(', ')}`);
}
