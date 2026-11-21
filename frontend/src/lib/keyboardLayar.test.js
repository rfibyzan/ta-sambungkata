import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aksiTombol, BARIS_KEYBOARD, hapusHuruf, tambahHuruf } from './keyboardLayar.js';

test('susunan QWERTY tiga baris', () => assert.deepEqual(BARIS_KEYBOARD, ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']));

test('tambah huruf menjadi huruf kecil', () => assert.equal(tambahHuruf('ab', 'C'), 'abc'));

test('selain huruf a sampai z diabaikan', () => {
  for (const x of ['1', ' ', '-', 'é', 'ab']) assert.equal(tambahHuruf('ab', x), 'ab', x);
});

test('berhenti di 30 huruf', () => assert.equal(tambahHuruf('x'.repeat(30), 'a').length, 30));

test('hapus huruf terakhir, aman saat kosong', () => {
  assert.equal(hapusHuruf('abc'), 'ab');
  assert.equal(hapusHuruf(''), '');
});

test('tombol fisik menjadi aksi keyboard', () => {
  assert.deepEqual(aksiTombol({ key: 'A' }), { jenis: 'huruf', huruf: 'a' });
  assert.deepEqual(aksiTombol({ key: 'Backspace' }), { jenis: 'hapus' });
  assert.deepEqual(aksiTombol({ key: 'Enter' }), { jenis: 'kirim' });
});

test('tombol lain dan kombinasi Ctrl atau Alt diabaikan', () => {
  for (const e of [{ key: '1' }, { key: 'Tab' }, { key: ' ' }, { key: 'a', ctrlKey: true }, { key: 'v', metaKey: true }, { key: 'a', altKey: true }]) {
    assert.equal(aksiTombol(e), null, JSON.stringify(e));
  }
});
