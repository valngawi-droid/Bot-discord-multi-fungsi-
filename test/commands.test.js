import test from 'node:test';
import assert from 'node:assert/strict';
import { commandData, totalFunctionCount } from '../src/commands.js';
import { extraFunctionCount } from '../src/extra-commands.js';

test('tepat 100 top-level slash command unik terdaftar', () => {
  const names = commandData.map((command) => command.name);
  assert.equal(commandData.length, 100);
  assert.equal(new Set(names).size, 100);
});

test('80 command tambahan dan 184 fungsi aktif', () => {
  assert.equal(extraFunctionCount, 80);
  assert.equal(totalFunctionCount, 184);
});
