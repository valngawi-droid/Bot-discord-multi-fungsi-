import { config, requireDiscordConfig } from './config.js';
import { registerCommands } from './register-commands.js';

requireDiscordConfig();
console.log(`Mendaftarkan command secara ${config.guildId ? `guild (${config.guildId})` : 'global'}...`);
const result = await registerCommands(config);
console.log(`${result.count} slash command berhasil didaftarkan ke ${result.scope}.`);
