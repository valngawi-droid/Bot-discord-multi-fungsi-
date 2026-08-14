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

export function extractJsonObject(text) {
  const source = String(text || '');
  for (let start = 0; start < source.length; start++) {
    if (source[start] !== '{') continue;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < source.length; index++) {
      const char = source[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(source.slice(start, index + 1)); } catch { break; }
        }
      }
    }
  }
  throw new Error('AI tidak menghasilkan object JSON yang valid. Coba sederhanakan prompt.');
}

export function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}
