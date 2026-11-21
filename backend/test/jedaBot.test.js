import { test } from 'node:test';
import assert from 'node:assert/strict';
import { akhirJedaBot, jadwalBot, sisaJedaMs } from '../src/config/gameRules.js';

test('jadwalBot: berpikir minimum, kata 6 huruf, tanpa kunci mati', () => {
  const j = jadwalBot({ sekarang: 1_000_000, panjang: 6, kunciMati: false, acak: () => 0 });
  assert.equal(j.berpikir_ms, 600);
  assert.equal(j.jeda_ms, 1500);
  assert.equal(Date.parse(j.created_at), 1_001_500);
  assert.equal(Date.parse(j.deadline_at) - Date.parse(j.created_at), 15_000);
});

test('jadwalBot: berpikir maksimum dan kunci mati menambah waktu alasan', () => {
  const j = jadwalBot({ sekarang: 0, panjang: 4, kunciMati: true, acak: () => 1 });
  assert.equal(j.berpikir_ms, 1200);
  assert.equal(j.jeda_ms, 1200 + 600 + 1500);
});

test('akhirJedaBot: hanya baris yang waktunya diatur server (bot, atau kata acak setelah kunci mati bot)', () => {
  const pembuka = { pemain: 'sistem', created_at: 'db-1' };
  const user = { pemain: 'user', created_at: 'db-2' };
  const bot = { pemain: 'bot', created_at: 'app-3' };
  const acakSetelahBot = { pemain: 'sistem', created_at: 'app-4' };
  const acakSetelahUser = { pemain: 'sistem', created_at: 'db-5' };
  assert.equal(akhirJedaBot([pembuka]), null);
  assert.equal(akhirJedaBot([pembuka, user]), null);
  assert.equal(akhirJedaBot([pembuka, user, acakSetelahUser]), null);
  assert.equal(akhirJedaBot([pembuka, user, bot]), 'app-3');
  assert.equal(akhirJedaBot([pembuka, user, bot, acakSetelahBot]), 'app-4');
});

test('sisaJedaMs: positif selama jeda, nol setelahnya', () => {
  assert.equal(sisaJedaMs(new Date(5000).toISOString(), 4000), 1000);
  assert.equal(sisaJedaMs(new Date(5000).toISOString(), 6000), 0);
});
