import test from 'node:test';
import assert from 'node:assert/strict';
import { AiClient } from '../src/ai-client.js';

const baseConfig = {
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  apiKey: 'test-key-not-secret',
  model: 'gemini-flash-latest',
  systemPrompt: 'Jawab singkat.',
  maxTokens: 100,
  temperature: 0.5,
  timeoutMs: 1_000
};

test('Gemini client mengirim format native dan membaca jawaban', async () => {
  let request;
  const fakeFetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Halo ' }, { text: 'dunia' }] } }]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const client = new AiClient(baseConfig, fakeFetch);
  const answer = await client.chat([{ role: 'user', content: 'Halo' }]);

  assert.equal(answer, 'Halo dunia');
  assert.match(request.url, /gemini-flash-latest:generateContent$/);
  assert.equal(request.options.headers['x-goog-api-key'], 'test-key-not-secret');
  const body = JSON.parse(request.options.body);
  assert.equal(body.system_instruction.parts[0].text, 'Jawab singkat.');
  assert.equal(body.contents[0].role, 'user');
});

test('Gemini client menampilkan pesan error API tanpa membocorkan key', async () => {
  const fakeFetch = async () => new Response(JSON.stringify({ error: { message: 'API key invalid' } }), { status: 400 });
  const client = new AiClient(baseConfig, fakeFetch);
  await assert.rejects(() => client.chat([{ role: 'user', content: 'Tes' }]), /Gemini gagal \(400\): API key invalid/);
});
