const MAKS_FILE = 10 * 1024 * 1024;
const SISI = 256;

async function bukaGambar(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Foto profil dipotong persegi di tengah dan diperkecil ke 256 x 256 sebelum diunggah,
// jadi yang dikirim ke server hanya sekitar 20 sampai 40 KB.
export async function perkecilFoto(file) {
  if (file.size > MAKS_FILE) throw new Error('Foto terlalu besar. Pilih foto di bawah 10 MB.');
  let gambar;
  try {
    gambar = await bukaGambar(file);
  } catch {
    throw new Error('Foto tidak bisa dibaca. Pilih file JPG, PNG, atau WebP.');
  }
  const sisi = Math.min(gambar.width, gambar.height);
  const canvas = document.createElement('canvas');
  canvas.width = SISI;
  canvas.height = SISI;
  canvas.getContext('2d').drawImage(gambar, (gambar.width - sisi) / 2, (gambar.height - sisi) / 2, sisi, sisi, 0, 0, SISI, SISI);
  gambar.close?.();
  const webp = canvas.toDataURL('image/webp', 0.85);
  // Browser yang tidak mendukung WebP mengembalikan PNG; JPEG jauh lebih kecil.
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
}
