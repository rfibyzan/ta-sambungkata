// Keyboard di layar game: hanya huruf a sampai z, karena semua kata di kamus huruf kecil tanpa spasi.
export const BARIS_KEYBOARD = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
export const MAKS_HURUF = 30;

export function tambahHuruf(isian, huruf, maks = MAKS_HURUF) {
  if (!/^[a-zA-Z]$/.test(huruf) || isian.length >= maks) return isian;
  return isian + huruf.toLowerCase();
}

export function hapusHuruf(isian) {
  return isian.slice(0, -1);
}

// Tombol fisik (keyboard laptop) menjadi aksi yang sama dengan keyboard layar.
// Kombinasi Ctrl, Cmd, atau Alt dibiarkan untuk browser (salin, tempel, dan sebagainya).
export function aksiTombol(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (/^[a-zA-Z]$/.test(e.key)) return { jenis: 'huruf', huruf: e.key.toLowerCase() };
  if (e.key === 'Backspace') return { jenis: 'hapus' };
  if (e.key === 'Enter') return { jenis: 'kirim' };
  return null;
}
