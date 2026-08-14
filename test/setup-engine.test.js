import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTemplate } from '../src/setup-engine.js';

const valid = {
  roles: [{ name: 'Member', color: '#3498DB', permissions: ['SendMessages'] }],
  categories: [{ name: 'UMUM', channels: [{ name: 'chat', type: 'text', roles: { Member: { allow: ['ViewChannel'] } } }] }]
};

test('template valid diterima', () => assert.equal(validateTemplate(valid), valid));
test('permission tidak dikenal ditolak', () => {
  assert.throws(() => validateTemplate({ roles: [{ name: 'X', permissions: ['BukanPermission'] }], categories: [] }), /tidak dikenal/);
});
test('referensi role yang tidak dideklarasikan ditolak', () => {
  assert.throws(() => validateTemplate({ roles: [], categories: [{ name: 'X', roles: { Staff: { allow: [] } }, channels: [] }] }), /tidak ada/);
});
