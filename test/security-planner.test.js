import test from 'node:test';
import assert from 'node:assert/strict';
import { Collection } from 'discord.js';
import { validateSecurityPlan } from '../src/security-planner.js';

const guild = {
  roles: {
    everyone: { id: 'guild' },
    cache: new Collection([['guild', { id: 'guild' }], ['staff', { id: 'staff' }]])
  }
};
const channels = new Set(['channel-1']);

test('rencana keamanan valid diterima', () => {
  const plan = validateSecurityPlan({ summary: 'Aman', actions: [{
    channelId: 'channel-1', targetId: 'staff', allow: ['ViewChannel', 'SendMessages'], deny: [], reason: 'Staff'
  }] }, guild, channels);
  assert.equal(plan.actions.length, 1);
});

test('AI tidak dapat memakai channel atau permission di luar whitelist', () => {
  assert.throws(() => validateSecurityPlan({ actions: [{ channelId: 'asing', targetId: 'staff', allow: [], deny: [] }] }, guild, channels), /channelId tidak valid/);
  assert.throws(() => validateSecurityPlan({ actions: [{ channelId: 'channel-1', targetId: 'staff', allow: ['Administrator'], deny: [] }] }, guild, channels), /tidak diizinkan/);
});

test('permission konflik ditolak', () => {
  assert.throws(() => validateSecurityPlan({ actions: [{ channelId: 'channel-1', targetId: 'guild', allow: ['ViewChannel'], deny: ['ViewChannel'] }] }, guild, channels), /allow dan deny/);
});
