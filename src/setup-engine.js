import { ChannelType, PermissionsBitField } from 'discord.js';

const TYPES = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
  stage: ChannelType.GuildStageVoice
};

function resolvedChannelType(guild, type) {
  // Discord hanya mengizinkan announcement channel pada Community Server.
  if (type === 'announcement' && !guild.features.includes('COMMUNITY')) return ChannelType.GuildText;
  return TYPES[type];
}

function displayedChannelType(guild, type) {
  return type === 'announcement' && resolvedChannelType(guild, type) === ChannelType.GuildText
    ? 'text; announcement butuh Community'
    : type;
}

function assert(condition, message) {
  if (!condition) throw new Error(`Template tidak valid: ${message}`);
}

function permissionBits(names = [], location = 'permissions') {
  assert(Array.isArray(names), `${location} harus berupa array.`);
  let bits = 0n;
  for (const name of names) {
    const value = PermissionsBitField.Flags[name];
    assert(value != null, `permission "${name}" pada ${location} tidak dikenal.`);
    bits |= value;
  }
  return bits;
}

function validateOverwrites(value, location) {
  if (value == null) return;
  assert(typeof value === 'object' && !Array.isArray(value), `${location} harus berupa object.`);
  permissionBits(value.allow || [], `${location}.allow`);
  permissionBits(value.deny || [], `${location}.deny`);
}

export function validateTemplate(template) {
  assert(template && typeof template === 'object' && !Array.isArray(template), 'root harus berupa object JSON.');
  assert(Array.isArray(template.roles), 'roles harus berupa array.');
  assert(Array.isArray(template.categories), 'categories harus berupa array.');
  assert(template.roles.length <= 100, 'maksimal 100 role per template.');
  assert(template.categories.length <= 50, 'maksimal 50 kategori per template.');

  const roleNames = new Set();
  for (const [i, role] of template.roles.entries()) {
    assert(typeof role.name === 'string' && role.name.trim(), `roles[${i}].name wajib diisi.`);
    assert(!roleNames.has(role.name.toLowerCase()), `role "${role.name}" duplikat.`);
    roleNames.add(role.name.toLowerCase());
    permissionBits(role.permissions || [], `roles[${i}].permissions`);
    if (role.color) assert(/^#[0-9a-f]{6}$/i.test(role.color), `warna role "${role.name}" harus seperti #3498DB.`);
  }

  const categoryNames = new Set();
  let channelCount = 0;
  for (const [i, category] of template.categories.entries()) {
    assert(typeof category.name === 'string' && category.name.trim(), `categories[${i}].name wajib diisi.`);
    assert(!categoryNames.has(category.name.toLowerCase()), `kategori "${category.name}" duplikat.`);
    categoryNames.add(category.name.toLowerCase());
    assert(Array.isArray(category.channels), `channels pada kategori "${category.name}" harus berupa array.`);
    validateOverwrites(category.everyone, `kategori ${category.name}.everyone`);
    validateRoleOverwrites(category.roles, roleNames, `kategori ${category.name}`);
    for (const [j, channel] of category.channels.entries()) {
      channelCount++;
      assert(typeof channel.name === 'string' && channel.name.trim(), `channel [${i}][${j}].name wajib diisi.`);
      assert(TYPES[channel.type] != null, `type "${channel.type}" pada channel "${channel.name}" tidak dikenal.`);
      validateOverwrites(channel.everyone, `channel ${channel.name}.everyone`);
      validateRoleOverwrites(channel.roles, roleNames, `channel ${channel.name}`);
    }
  }
  assert(channelCount <= 450, 'maksimal 450 channel per template.');
  return template;
}

function validateRoleOverwrites(roles, declaredRoleNames, location) {
  if (roles == null) return;
  assert(typeof roles === 'object' && !Array.isArray(roles), `${location}.roles harus berupa object.`);
  for (const [name, overwrite] of Object.entries(roles)) {
    assert(declaredRoleNames.has(name.toLowerCase()), `${location} merujuk role "${name}" yang tidak ada di roles.`);
    validateOverwrites(overwrite, `${location}.roles.${name}`);
  }
}

function findByName(collection, name) {
  return collection.find((item) => item.name.toLowerCase() === name.toLowerCase());
}

function makeOverwrites(guild, definition, rolesByName) {
  const result = [];
  if (definition.everyone) {
    result.push({ id: guild.roles.everyone.id, allow: permissionBits(definition.everyone.allow), deny: permissionBits(definition.everyone.deny) });
  }
  for (const [name, value] of Object.entries(definition.roles || {})) {
    const role = rolesByName.get(name.toLowerCase());
    if (!role) throw new Error(`Role "${name}" tidak ditemukan saat membuat permission channel.`);
    result.push({ id: role.id, allow: permissionBits(value.allow), deny: permissionBits(value.deny) });
  }
  return result;
}

function mergeOverwrites(parent, child) {
  const merged = new Map(parent.map((item) => [item.id, { ...item }]));
  for (const item of child) {
    const previous = merged.get(item.id) || { id: item.id, allow: 0n, deny: 0n };
    merged.set(item.id, {
      id: item.id,
      allow: (previous.allow & ~item.deny) | item.allow,
      deny: (previous.deny & ~item.allow) | item.deny
    });
  }
  return [...merged.values()];
}

export function previewTemplate(guild, input) {
  const template = validateTemplate(input);
  const actions = [];
  for (const role of template.roles) {
    actions.push(`${findByName(guild.roles.cache, role.name) ? 'LEWATI' : 'BUAT'} role @${role.name}`);
  }
  for (const category of template.categories) {
    const existingCategory = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === category.name.toLowerCase());
    actions.push(`${existingCategory ? 'LEWATI' : 'BUAT'} kategori ${category.name}`);
    for (const channel of category.channels) {
      const exists = guild.channels.cache.find((c) => c.parentId === existingCategory?.id && c.name.toLowerCase() === channel.name.toLowerCase());
      actions.push(`${exists ? 'LEWATI' : 'BUAT'} channel ${category.name}/${channel.name} (${displayedChannelType(guild, channel.type)})`);
    }
  }
  return actions;
}

export async function applyTemplate(guild, input, reason) {
  const template = validateTemplate(input);
  const created = { roles: 0, categories: 0, channels: 0 };
  const rolesByName = new Map();

  await guild.roles.fetch();
  await guild.channels.fetch();

  for (const definition of template.roles) {
    let role = findByName(guild.roles.cache, definition.name);
    if (!role) {
      role = await guild.roles.create({
        name: definition.name,
        color: definition.color,
        hoist: Boolean(definition.hoist),
        mentionable: Boolean(definition.mentionable),
        permissions: permissionBits(definition.permissions),
        reason
      });
      created.roles++;
    }
    rolesByName.set(definition.name.toLowerCase(), role);
  }

  for (const definition of template.categories) {
    let category = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === definition.name.toLowerCase());
    if (!category) {
      category = await guild.channels.create({
        name: definition.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: makeOverwrites(guild, definition, rolesByName),
        reason
      });
      created.categories++;
    }

    for (const channelDefinition of definition.channels) {
      let channel = guild.channels.cache.find((c) => c.parentId === category.id && c.name.toLowerCase() === channelDefinition.name.toLowerCase());
      if (channel) continue;
      const overwrites = mergeOverwrites(
        makeOverwrites(guild, definition, rolesByName),
        makeOverwrites(guild, channelDefinition, rolesByName)
      );
      channel = await guild.channels.create({
        name: channelDefinition.name,
        type: resolvedChannelType(guild, channelDefinition.type),
        parent: category.id,
        topic: ['text', 'announcement', 'forum'].includes(channelDefinition.type) ? channelDefinition.topic : undefined,
        bitrate: ['voice', 'stage'].includes(channelDefinition.type) ? channelDefinition.bitrate : undefined,
        userLimit: channelDefinition.type === 'voice' ? channelDefinition.userLimit : undefined,
        permissionOverwrites: overwrites.length ? overwrites : undefined,
        reason
      });
      created.channels++;
    }
  }
  return created;
}
