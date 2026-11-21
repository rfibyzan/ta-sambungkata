import { test } from 'node:test';
import assert from 'node:assert/strict';
import { idKataBaru } from './kataBaru.js';

const d = [
  { id: 1, pertama_unlock: '2026-11-21T10:00:00Z' },
  { id: 2, pertama_unlock: '2026-11-20T10:00:00Z' },
  { id: 3, terkunci: true },
];

test('tanpa catatan tidak ada yang baru', () => assert.equal(idKataBaru(d, null).size, 0));

test('hanya yang lebih baru dari catatan', () => assert.deepEqual([...idKataBaru(d, '2026-11-21T00:00:00Z')], [1]));

test('pertama_unlock kosong atau rusak bukan baru', () =>
  assert.equal(idKataBaru([{ id: 9 }, { id: 8, pertama_unlock: 'x' }], '2020-01-01T00:00:00Z').size, 0));

test('dibatasi maks', () =>
  assert.equal(
    idKataBaru(Array.from({ length: 10 }, (_, i) => ({ id: i, pertama_unlock: '2026-11-21T10:00:00Z' })), '2026-01-01T00:00:00Z').size,
    6,
  ));
