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

const aiProvider = (process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'openai-compatible')).toLowerCase();
if (!['gemini', 'openai-compatible'].includes(aiProvider)) {
  throw new Error('AI_PROVIDER harus "gemini" atau "openai-compatible".');
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  registerCommandsOnStart: boolEnv('REGISTER_COMMANDS_ON_START', true),
  dashboard: {
    enabled: boolEnv('DASHBOARD_ENABLED', true),
    host: process.env.DASHBOARD_HOST || '127.0.0.1',
    port: numberEnv('DASHBOARD_PORT', 3000),
    token: process.env.DASHBOARD_TOKEN || ''
  },
  ai: {
    provider: aiProvider,
    baseUrl: (aiProvider === 'gemini'
      ? (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta')
      : (process.env.LMARENA_BASE_URL || '')).replace(/\/$/, ''),
    apiKey: aiProvider === 'gemini' ? (process.env.GEMINI_API_KEY || '') : (process.env.LMARENA_API_KEY || ''),
    model: aiProvider === 'gemini' ? (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite') : (process.env.LMARENA_MODEL || ''),
    fallbackModels: (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.1-flash-lite,gemini-2.5-flash')
      .split(',').map((model) => model.trim()).filter(Boolean),
    maxRetries: numberEnv('AI_MAX_RETRIES', 3),
    systemPrompt: process.env.AI_SYSTEM_PROMPT || 'Kamu adalah asisten yang ramah dan membantu.',
    maxTokens: numberEnv('AI_MAX_TOKENS', 1200),
    temperature: numberEnv('AI_TEMPERATURE', 0.7),
    timeoutMs: numberEnv('AI_TIMEOUT_MS', 60_000),
    channelIds: new Set((process.env.AI_CHANNEL_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)),
    replyOnMention: boolEnv('AI_REPLY_ON_MENTION', false)
  }
};

export function requireDiscordConfig() {
  const missing = [];
  if (!config.discordToken) missing.push('DISCORD_TOKEN');
  if (!config.clientId) missing.push('DISCORD_CLIENT_ID');
  if (missing.length) throw new Error(`Environment variable wajib belum diisi: ${missing.join(', ')}`);
}
