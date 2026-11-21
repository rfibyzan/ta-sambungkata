import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jepitHalaman } from './paginasi.js';

test('jepitHalaman: halaman di luar batas dijepit', () => {
  assert.equal(jepitHalaman(300, 5), 5);
  assert.equal(jepitHalaman(0, 5), 1);
  assert.equal(jepitHalaman(Number.NaN, 5), 1);
  assert.equal(jepitHalaman(3, 0), 1);
});
