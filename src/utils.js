export function splitDiscordMessage(text, limit = 1900) {
  if (!text) return ['AI tidak mengembalikan teks.'];
  const chunks = [];
  let remaining = String(text).trim();
  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf('\n', limit);
    if (cut < limit * 0.5) cut = remaining.lastIndexOf(' ', limit);
    if (cut < limit * 0.5) cut = limit;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks.length ? chunks : ['AI tidak mengembalikan teks.'];
}

export function cleanChannelName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '').slice(0, 100);
}

export function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}
