import { badRequest } from './httpError.js';

export const MAKS_AVATAR_BYTE = 200 * 1024;

const PESAN_FORMAT = 'Format foto harus JPG, PNG, atau WebP';

// Tipe dicek dari isi file (magic bytes), bukan hanya dari MIME yang dikirim browser.
const FORMAT = {
  'image/jpeg': { ext: 'jpg', cocok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', cocok: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  'image/webp': {
    ext: 'webp',
    cocok: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
};

// Membaca data URL base64 dari Edit Profil menjadi buffer siap unggah.
export function bacaGambarAvatar(dataUrl) {
  const cocok = typeof dataUrl === 'string' && /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+=*)$/.exec(dataUrl);
  const format = cocok && FORMAT[cocok[1]];
  if (!format) throw badRequest(PESAN_FORMAT);

  const buffer = Buffer.from(cocok[2], 'base64');
  if (buffer.length > MAKS_AVATAR_BYTE) throw badRequest('Ukuran foto maksimal 200 KB');
  if (buffer.length < 12 || !format.cocok(buffer)) throw badRequest(PESAN_FORMAT);

  return { buffer, mime: cocok[1], ext: format.ext };
}
