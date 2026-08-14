const LEVELS = { none: 0, member: 1, admin: 2, owner: 3 };

export const OWNER_COMMANDS = new Set([
  'setup-server', 'buat-server', 'auto-setup', 'role', 'category', 'channel', 'akses-channel', 'owner', 'helpowner'
]);
export const ADMIN_COMMANDS = new Set(['clear', 'admin', 'helpadmin']);
export const MEMBER_COMMANDS = new Set(['ai', 'serverinfo', 'ping', 'member', 'helpmember', 'help']);

export function memberAccessLevel(member, access) {
  if (!member?.roles?.cache) return 'none';
  if (member.roles.cache.has(access.ownerRoleId)) return 'owner';
  if (member.roles.cache.has(access.adminRoleId)) return 'admin';
  if (member.roles.cache.has(access.memberRoleId)) return 'member';
  return 'none';
}

export function requiredLevel(commandName) {
  if (OWNER_COMMANDS.has(commandName)) return 'owner';
  if (ADMIN_COMMANDS.has(commandName)) return 'admin';
  if (MEMBER_COMMANDS.has(commandName)) return 'member';
  return 'owner';
}

export function canUseCommand(member, commandName, access) {
  return LEVELS[memberAccessLevel(member, access)] >= LEVELS[requiredLevel(commandName)];
}

export function accessDeniedMessage(commandName, access) {
  const required = requiredLevel(commandName);
  const roleId = access[`${required}RoleId`];
  return `❌ Command ini khusus role ${roleId ? `<@&${roleId}>` : required}.`;
}
