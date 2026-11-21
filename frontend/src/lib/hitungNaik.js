// Angka yang tampil saat skor dihitung naik. t = 0 sampai 1, ease-out kubik.
export function nilaiHitung(target, t) {
  if (t >= 1) return target;
  const p = 1 - (1 - Math.max(0, t)) ** 3;
  return Math.round(target * p);
}
