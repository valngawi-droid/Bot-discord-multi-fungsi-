import { Client, Events, GatewayIntentBits } from 'discord.js';
import { AiClient, ConversationStore } from './ai-client.js';
import { handleCommand } from './commands.js';
import { config, requireDiscordConfig } from './config.js';
import { safeError, splitDiscordMessage } from './utils.js';

requireDiscordConfig();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
const aiClient = new AiClient(config.ai);
const conversations = new ConversationStore(12);
const context = { aiClient, conversations, aiConfig: config.ai };

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot aktif sebagai ${readyClient.user.tag} di ${readyClient.guilds.cache.size} server.`);
  console.log(`AI: ${aiClient.configured ? `aktif (${config.ai.provider}/${config.ai.model})` : 'belum dikonfigurasi'}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  await handleCommand(interaction, context);
});

client.on(Events.MessageCreate, async (message) => {
  if (!config.ai.replyOnMention || message.author.bot || !message.guild || !client.user) return;
  if (!message.mentions.has(client.user)) return;
  if (config.ai.channelIds.size && !config.ai.channelIds.has(message.channelId)) return;

  const prompt = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
  if (!prompt) return message.reply('Tulis pertanyaan setelah mention saya, atau gunakan `/ai chat`.');
  if (prompt.length > 2000) return message.reply('Pesan terlalu panjang (maksimal 2.000 karakter).');

  const key = `${message.guildId}:${message.channelId}:${message.author.id}`;
  try {
    await message.channel.sendTyping();
    const history = [...conversations.get(key), { role: 'user', content: prompt }];
    const answer = await aiClient.chat(history);
    conversations.append(key, { role: 'user', content: prompt }, { role: 'assistant', content: answer });
    const chunks = splitDiscordMessage(answer);
    await message.reply({ content: chunks.shift(), allowedMentions: { repliedUser: false } });
    for (const chunk of chunks) await message.channel.send(chunk);
  } catch (error) {
    console.error('Balasan mention AI gagal:', error);
    await message.reply(`❌ ${safeError(error).slice(0, 1800)}`);
  }
});

client.on(Events.Error, (error) => console.error('Discord client error:', error));
process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));

await client.login(config.discordToken);
