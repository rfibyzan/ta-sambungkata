// Sama dengan backend/src/config/gameRules.js: level n dimulai di 100 * n * (n - 1) / 2 XP.
const XP_PER_LEVEL = 100;

export function rentangLevel(level) {
  const awal = (XP_PER_LEVEL * level * (level - 1)) / 2;
  const akhir = (XP_PER_LEVEL * (level + 1) * level) / 2;
  return { awal, akhir };
}

export function progresLevel(xp, level) {
  const { awal, akhir } = rentangLevel(level);
  return { didapat: xp - awal, butuh: akhir - awal, sisa: akhir - xp, akhir };
}
