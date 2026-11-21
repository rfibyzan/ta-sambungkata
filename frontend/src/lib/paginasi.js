export function jepitHalaman(page, totalHalaman) {
  const maks = Math.max(1, totalHalaman || 0);
  if (!Number.isFinite(page)) return 1;
  return Math.min(maks, Math.max(1, Math.trunc(page)));
}
