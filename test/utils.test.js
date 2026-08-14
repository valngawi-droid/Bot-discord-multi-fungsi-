import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanChannelName, splitDiscordMessage } from '../src/utils.js';
import { ConversationStore } from '../src/ai-client.js';

 test('splitDiscordMessage menjaga setiap bagian di bawah limit', () => {
  const chunks = splitDiscordMessage('kata '.repeat(100), 80);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 80));
});

test('cleanChannelName membuat nama text channel aman', () => {
  assert.equal(cleanChannelName('  Ruang Umum!  '), 'ruang-umum');
});

test('ConversationStore membatasi riwayat', () => {
  const store = new ConversationStore(2);
  store.append('x', { role: 'user', content: '1' }, { role: 'assistant', content: '2' }, { role: 'user', content: '3' });
  assert.deepEqual(store.get('x').map((item) => item.content), ['2', '3']);
  assert.equal(store.clear('x'), true);
});
