import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jadwalTampilBot } from './jadwalTampilBot.js';

test('tanpa kunci mati: berpikir, keping, selesai', () => {
  assert.deepEqual(jadwalTampilBot({ berpikir_ms: 800, jeda_ms: 1700, panjang: 6, kunci_mati: false, kurangiGerak: false }), [
    { fase: 'berpikir', mulai: 0 },
    { fase: 'keping', mulai: 800 },
    { fase: 'selesai', mulai: 1700 },
  ]);
});

test('kunci mati menambah fase alasan setelah keping selesai', () => {
  assert.deepEqual(jadwalTampilBot({ berpikir_ms: 800, jeda_ms: 3200, panjang: 6, kunci_mati: true, kurangiGerak: false }), [
    { fase: 'berpikir', mulai: 0 },
    { fase: 'keping', mulai: 800 },
    { fase: 'alasan', mulai: 1700 },
    { fase: 'selesai', mulai: 3200 },
  ]);
});

test('kurangi gerak: kata tampil utuh setelah berpikir, tetap terkunci sampai jeda habis', () => {
  assert.deepEqual(jadwalTampilBot({ berpikir_ms: 800, jeda_ms: 1700, panjang: 6, kunci_mati: false, kurangiGerak: true }), [
    { fase: 'berpikir', mulai: 0 },
    { fase: 'keping', mulai: 800 },
    { fase: 'selesai', mulai: 1700 },
  ]);
});

test('jeda yang terpotong (mis. respons lambat) tidak membuat fase mundur', () => {
  const fase = jadwalTampilBot({ berpikir_ms: 800, jeda_ms: 500, panjang: 6, kunci_mati: false, kurangiGerak: false });
  assert.deepEqual(
    fase.map((f) => f.mulai),
    [0, 500, 500],
  );
});
