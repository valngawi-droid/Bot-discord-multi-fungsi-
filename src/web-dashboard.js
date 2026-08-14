import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { applyTemplate } from './setup-engine.js';
import { generateServerPlan } from './server-planner.js';
import { safeError } from './utils.js';

const htmlPath = fileURLToPath(new URL('../public/dashboard.html', import.meta.url));
const PLAN_TTL = 30 * 60 * 1000;

export async function startWebDashboard({ client, aiClient, config, commandCount }) {
  const html = await readFile(htmlPath);
  const plans = new Map();

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (request.method === 'GET' && url.pathname === '/') {
        return send(response, 200, html, 'text/html; charset=utf-8');
      }
      if (request.method === 'GET' && url.pathname === '/api/status') {
        const guild = getGuild(client, config.guildId);
        return json(response, 200, {
          guild: guild.name,
          ai: aiClient.configured,
          commands: commandCount,
          requiresToken: Boolean(config.dashboard.token)
        });
      }
      if (request.method === 'POST' && url.pathname === '/api/plan') {
        const body = await readJsonBody(request);
        authorize(body.token, config.dashboard.token);
        const guild = getGuild(client, config.guildId);
        const result = await generateServerPlan(aiClient, guild, body.prompt);
        const planId = randomUUID();
        plans.set(planId, { ...result, createdAt: Date.now() });
        cleanPlans(plans);
        return json(response, 200, { planId, ...result });
      }
      if (request.method === 'POST' && url.pathname === '/api/apply') {
        const body = await readJsonBody(request);
        authorize(body.token, config.dashboard.token);
        if (body.confirmation !== 'APPLY') throw new HttpError(400, 'Konfirmasi harus persis: APPLY');
        const plan = plans.get(body.planId);
        if (!plan || Date.now() - plan.createdAt > PLAN_TTL) throw new HttpError(404, 'Rencana tidak ditemukan atau sudah kedaluwarsa. Buat preview baru.');
        const guild = getGuild(client, config.guildId);
        const result = await applyTemplate(guild, plan.template, 'Setup melalui dashboard lokal');
        plans.delete(body.planId);
        return json(response, 200, result);
      }
      return json(response, 404, { error: 'Halaman tidak ditemukan.' });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      console.error('Dashboard request gagal:', error);
      return json(response, status, { error: safeError(error) });
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.dashboard.port, config.dashboard.host, resolve);
  });
  console.log(`Dashboard web aktif: http://${config.dashboard.host}:${config.dashboard.port}`);
  if (!config.dashboard.token) console.log('Dashboard tanpa token, tetapi hanya bind ke alamat lokal. Isi DASHBOARD_TOKEN untuk proteksi tambahan.');
  return server;
}

function getGuild(client, guildId) {
  if (!guildId) throw new HttpError(400, 'DISCORD_GUILD_ID wajib diisi untuk dashboard.');
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new HttpError(404, 'Guild tidak ditemukan. Periksa DISCORD_GUILD_ID dan pastikan bot berada di server.');
  return guild;
}

function authorize(provided, expected) {
  if (!expected) return;
  const left = Buffer.from(String(provided || ''));
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new HttpError(401, 'Dashboard token salah.');
}

function cleanPlans(plans) {
  for (const [id, plan] of plans) if (Date.now() - plan.createdAt > PLAN_TTL) plans.delete(id);
  while (plans.size > 20) plans.delete(plans.keys().next().value);
}

async function readJsonBody(request) {
  if (!String(request.headers['content-type'] || '').startsWith('application/json')) throw new HttpError(415, 'Content-Type harus application/json.');
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 100_000) throw new HttpError(413, 'Request terlalu besar (maksimal 100 KB).');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'Body JSON tidak valid.'); }
}

function send(response, status, body, contentType) {
  response.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY'
  });
  response.end(body);
}

function json(response, status, body) {
  send(response, status, JSON.stringify(body), 'application/json; charset=utf-8');
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
