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
  // Jeda giliran bot sampai pemain bisa menjawab lagi, termasuk animasi di layar.
  BERPIKIR_MS: { min: 600, maks: 1200 },
  PER_HURUF_MS: 150,
  ALASAN_MS: 1500,
};

// Jadwal balasan bot. Baris kata bot diberi created_at di masa depan, jadi 15 detik
// giliran dan bonus jawab cepat baru dihitung setelah kata bot selesai tampil.
export function jadwalBot({ sekarang, panjang, kunciMati, acak = Math.random }) {
  const { min, maks } = BOT.BERPIKIR_MS;
  const berpikir = Math.round(min + acak() * (maks - min));
  const jeda = berpikir + panjang * BOT.PER_HURUF_MS + (kunciMati ? BOT.ALASAN_MS : 0);
  return {
    berpikir_ms: berpikir,
    jeda_ms: jeda,
    created_at: new Date(sekarang + jeda).toISOString(),
    deadline_at: new Date(sekarang + jeda + BOT.DURASI_GILIRAN_MS).toISOString(),
  };
}

// created_at akhir jeda bot, atau null jika baris terakhir tidak berasal dari giliran bot.
// Hanya baris bot (dan kata acak setelah kunci mati buatan bot) yang waktunya diatur server;
// baris lain memakai jam database, yang bisa berbeda beberapa detik dari jam server.
export function akhirJedaBot(daftar) {
  const terakhir = daftar.at(-1);
  if (terakhir?.pemain === 'bot') return terakhir.created_at;
  if (terakhir?.pemain === 'sistem' && daftar.at(-2)?.pemain === 'bot') return terakhir.created_at;
  return null;
}

// Sisa waktu sampai baris terakhir rantai "terjadi". Lebih dari 0 berarti bot belum selesai.
export function sisaJedaMs(createdAtTerakhir, sekarang) {
  return Math.max(0, Date.parse(createdAtTerakhir) - sekarang);
}

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
