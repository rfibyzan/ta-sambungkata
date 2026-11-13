// Semua aturan dan angka game di satu tempat. Ubah di sini, bukan di service.

export const ATURAN_KATA = {
  MIN_PANJANG: 3,
  PANJANG_SAMBUNGAN: 2,
};

export const SKOR = {
  PER_HURUF: 1,
  KATA_BARU: 5,
  JAWAB_CEPAT: 3,
  KUNCI_MATI: 10,
  MENANG_BOT: 20,
};

// Jawaban di bawah batas ini (milidetik sejak giliran dimulai) mendapat bonus JAWAB_CEPAT.
export const BATAS_JAWAB_CEPAT_MS = 5_000;

export const SOLO = {
  DURASI_MS: 60_000,
  PENALTI_SALAH_MS: 3_000,
};

export const BOT = {
  DURASI_GILIRAN_MS: 15_000,
  NYAWA_AWAL: 3,
  // Persentase kosakata yang dikenal bot, supaya bot bisa kehabisan kata dan dikalahkan.
  KOSAKATA_PERSEN: { mudah: 35, sulit: 80 },
};

// Kata pembuka harus punya minimal sekian kata lanjutan.
export const MIN_SAMBUNGAN_PEMBUKA = 5;

// Toleransi keterlambatan jaringan saat mengecek batas waktu.
export const TOLERANSI_MS = 1_500;

// Level dari XP: level n butuh total XP_PER_LEVEL * n * (n - 1) / 2.
// Level 1 = 0 XP, level 2 = 100, level 3 = 300, level 4 = 600, dst.
export const XP_PER_LEVEL = 100;

export function levelDariXp(xp) {
  let level = 1;
  while ((XP_PER_LEVEL * (level + 1) * level) / 2 <= xp) level++;
  return level;
}

export const QUEST_PER_HARI = 3;
export const ZONA_WAKTU = 'Asia/Jakarta';
