import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bacaGambarAvatar } from '../src/utils/avatar.js';

const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PESAN_FORMAT = /Format foto harus JPG, PNG, atau WebP/;
const PESAN_UKURAN = /Ukuran foto maksimal 200 KB/;

const dataUrl = (mime, buffer) => `data:${mime};base64,${buffer.toString('base64')}`;
const jpegBerukuran = (n) => {
  const b = Buffer.alloc(n);
  b[0] = 0xff;
  b[1] = 0xd8;
  b[2] = 0xff;
  return b;
};

test('PNG valid diterima', () => {
  const hasil = bacaGambarAvatar(`data:image/png;base64,${PNG_1X1}`);
  assert.equal(hasil.ext, 'png');
  assert.equal(hasil.mime, 'image/png');
  assert.ok(hasil.buffer.length > 0);
});

test('WebP valid diterima', () => {
  const b = Buffer.alloc(16);
  b.write('RIFF', 0, 'ascii');
  b.write('WEBP', 8, 'ascii');
  assert.equal(bacaGambarAvatar(dataUrl('image/webp', b)).ext, 'webp');
});

test('MIME PNG berisi HTML ditolak', () => {
  assert.throws(() => bacaGambarAvatar(dataUrl('image/png', Buffer.from('<html><script>'))), PESAN_FORMAT);
});

test('SVG ditolak', () => {
  assert.throws(() => bacaGambarAvatar(dataUrl('image/svg+xml', Buffer.from('<svg/>'))), PESAN_FORMAT);
});

test('nilai bukan data URL ditolak', () => {
  for (const nilai of ['', null, 123, 'bukan data url', 'data:image/png;base64,']) {
    assert.throws(() => bacaGambarAvatar(nilai), PESAN_FORMAT);
  }
});

test('lebih dari 200 KB ditolak, tepat 200 KB diterima', () => {
  assert.throws(() => bacaGambarAvatar(dataUrl('image/jpeg', jpegBerukuran(200 * 1024 + 1))), PESAN_UKURAN);
  assert.equal(bacaGambarAvatar(dataUrl('image/jpeg', jpegBerukuran(200 * 1024))).ext, 'jpg');
});
