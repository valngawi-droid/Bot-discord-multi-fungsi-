import { REST, Routes } from 'discord.js';
import { commandData } from './commands.js';
import { config, requireDiscordConfig } from './config.js';

requireDiscordConfig();
const rest = new REST({ version: '10' }).setToken(config.discordToken);
const route = config.guildId
  ? Routes.applicationGuildCommands(config.clientId, config.guildId)
  : Routes.applicationCommands(config.clientId);

console.log(`Mendaftarkan ${commandData.length} command secara ${config.guildId ? 'guild' : 'global'}...`);
await rest.put(route, { body: commandData });
console.log('Slash command berhasil didaftarkan.');
