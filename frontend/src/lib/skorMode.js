import { angka } from './format.js';

const MODE = [
  ['solo', 'Solo'],
  ['bot_mudah', 'Bot Mudah'],
  ['bot_sulit', 'Bot Sulit'],
];

// Skor 0 berarti belum ada game selesai di mode itu.
export function daftarSkorMode(skorTertinggi) {
  return MODE.map(([mode, label]) => {
    const nilai = skorTertinggi?.[mode] ?? 0;
    return { mode, label, nilai, teks: nilai > 0 ? angka(nilai) : 'Belum main' };
  });
}

export function persenMenang(menang, total) {
  return total ? `${Math.round((menang / total) * 100)}%` : '-';
}
