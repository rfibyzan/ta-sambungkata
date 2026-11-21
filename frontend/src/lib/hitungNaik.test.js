import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nilaiHitung } from './hitungNaik.js';

test('awal dan akhir', () => {
  assert.equal(nilaiHitung(138, 0), 0);
  assert.equal(nilaiHitung(138, 1), 138);
  assert.equal(nilaiHitung(138, 1.5), 138);
});
test('skor 0 tetap 0', () => assert.equal(nilaiHitung(0, 0.5), 0));
test('ease-out sudah lewat separuh di tengah', () => assert.ok(nilaiHitung(100, 0.5) > 50));
