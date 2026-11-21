import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daftarSkorMode, persenMenang } from './skorMode.js';

test('urutan dan label mode', () =>
  assert.deepEqual(
    daftarSkorMode({ solo: 138, bot_mudah: 90, bot_sulit: 0 }).map((s) => [s.mode, s.label, s.teks]),
    [['solo', 'Solo', '138'], ['bot_mudah', 'Bot Mudah', '90'], ['bot_sulit', 'Bot Sulit', 'Belum main']],
  ));

test('tanpa data semua Belum main', () =>
  assert.deepEqual(daftarSkorMode(undefined).map((s) => s.teks), ['Belum main', 'Belum main', 'Belum main']));

test('angka ribuan diformat', () => assert.equal(daftarSkorMode({ solo: 1250 }).at(0).teks, '1.250'));

test('persen menang', () => {
  assert.equal(persenMenang(0, 0), '-');
  assert.equal(persenMenang(2, 16), '13%');
});
