// Nomor halaman yang diketik di paginasi: bilangan bulat 1 sampai total, selain itu null.
export function bacaHalaman(teks, total) {
  const bersih = String(teks ?? '').trim();
  if (!/^\d+$/.test(bersih)) return null;
  const n = Number(bersih);
  return n >= 1 && n <= total ? n : null;
}
