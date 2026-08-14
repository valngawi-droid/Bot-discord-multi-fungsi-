import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseCommand, memberAccessLevel, requiredLevel } from '../src/access-control.js';

const access = { ownerRoleId: 'owner', adminRoleId: 'admin', memberRoleId: 'member' };
const fakeMember = (...ids) => ({ roles: { cache: new Map(ids.map((id) => [id, {}])) } });

test('hierarki role diwariskan', () => {
  assert.equal(memberAccessLevel(fakeMember('owner'), access), 'owner');
  assert.equal(canUseCommand(fakeMember('owner'), 'ai', access), true);
  assert.equal(canUseCommand(fakeMember('admin'), 'ai', access), true);
  assert.equal(canUseCommand(fakeMember('member'), 'admin', access), false);
});

test('command pengelolaan default khusus owner', () => {
  assert.equal(requiredLevel('permission'), 'owner');
  assert.equal(canUseCommand(fakeMember('admin'), 'permission', access), false);
});
