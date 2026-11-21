import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bacaHalaman } from './halamanKetik.js';

test('angka valid diterima', () => {
  assert.equal(bacaHalaman('12', 334), 12);
  assert.equal(bacaHalaman(' 7 ', 10), 7);
  assert.equal(bacaHalaman('334', 334), 334);
});

test('isian tidak valid ditolak', () => {
  for (const x of ['', 'abc', '0', '3.5', '335', '-1', '1e2']) assert.equal(bacaHalaman(x, 334), null, x);
});
