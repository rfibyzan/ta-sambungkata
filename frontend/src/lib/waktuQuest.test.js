import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sisaHariWib } from './waktuQuest.js';

test('23.47 WIB tinggal 13 menit', () => assert.deepEqual(sisaHariWib(Date.parse('2026-11-21T16:47:00Z')), { jam: 0, menit: 13 }));
test('17.00 WIB tinggal 7 jam', () => assert.deepEqual(sisaHariWib(Date.parse('2026-11-21T10:00:00Z')), { jam: 7, menit: 0 }));
test('detik dibulatkan ke atas', () => assert.deepEqual(sisaHariWib(Date.parse('2026-11-21T16:59:30Z')), { jam: 0, menit: 1 }));
