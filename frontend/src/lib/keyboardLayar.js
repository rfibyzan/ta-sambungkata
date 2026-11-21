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
