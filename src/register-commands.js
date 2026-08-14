import { REST, Routes } from 'discord.js';
import { commandData } from './commands.js';

export async function registerCommands({ discordToken, clientId, guildId }) {
  const rest = new REST({ version: '10' }).setToken(discordToken);
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  const result = await rest.put(route, { body: commandData });
  return {
    count: Array.isArray(result) ? result.length : commandData.length,
    scope: guildId ? `guild ${guildId}` : 'global'
  };
}
