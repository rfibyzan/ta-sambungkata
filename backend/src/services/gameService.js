import * as gameModel from '../models/gameModel.js';
import * as kataModel from '../models/kataModel.js';
import * as unlockModel from '../models/unlockModel.js';
import * as botService from './botService.js';
import * as questService from './questService.js';
import {
  ATURAN_KATA,
  SKOR,
  SOLO,
  BOT,
  BATAS_JAWAB_CEPAT_MS,
  MIN_SAMBUNGAN_PEMBUKA,
  TOLERANSI_MS,
  akhirJedaBot,
  jadwalBot,
  sisaJedaMs,
} from '../config/gameRules.js';
import { badRequest, forbidden, notFound, HttpError } from '../utils/httpError.js';

const sambungan = (kata) => kata.slice(-ATURAN_KATA.PANJANG_SAMBUNGAN);

export function bentukState(game) {
  return {
    id: game.id,
    mode: game.mode,
    tingkat: game.tingkat,
    status: game.status,
    skor: game.skor,
    jumlah_kata: game.jumlah_kata,
    nyawa: game.nyawa,
    kata_terakhir: game.kata_terakhir,
    awalan_berikutnya: game.kata_terakhir ? sambungan(game.kata_terakhir) : null,
    started_at: game.started_at,
    deadline_at: game.deadline_at,
    finished_at: game.finished_at,
    server_time: new Date().toISOString(),
  };
}

async function ambilMilik(userId, gameId) {
  const game = await gameModel.cariId(gameId);
  if (!game) throw notFound('Game tidak ditemukan');
  if (game.user_id !== userId) throw forbidden('Game ini milik pemain lain');
  return game;
}

async function kataPembuka(kecuali = []) {
  const kata = await kataModel.acak({ kecuali, minSambungan: MIN_SAMBUNGAN_PEMBUKA });
  if (!kata) throw new HttpError(500, 'Gagal memilih kata pembuka');
  return kata;
}

// Mengakhiri game, memberi bonus menang, dan mencatat progres quest.
async function akhiri(game, status) {
  const skor = game.skor + (status === 'menang' ? SKOR.MENANG_BOT : 0);
  const selesai = await gameModel.ubah(game.id, { status, skor, finished_at: new Date().toISOString() });
  const questSelesai = await questService.catat(game.user_id, {
    jenis: 'selesai',
    skor,
    jumlahKata: selesai.jumlah_kata,
    menang: status === 'menang',
    tingkat: game.tingkat,
  });
  return { game: selesai, questSelesai };
}

// Cek batas waktu dari timestamp server. Solo: game selesai. Bot: setiap giliran yang
// terlewat mengurangi 1 nyawa.
async function sinkronWaktu(game) {
  if (game.status !== 'berjalan' || !game.deadline_at) return { game, questSelesai: [], timeout: false };
  const lewat = Date.now() - new Date(game.deadline_at).getTime() - TOLERANSI_MS;
  if (lewat <= 0) return { game, questSelesai: [], timeout: false };

  if (game.mode === 'solo') return { ...(await akhiri(game, 'selesai')), timeout: true };

  const giliranTerlewat = 1 + Math.floor(lewat / BOT.DURASI_GILIRAN_MS);
  const nyawa = Math.max(0, game.nyawa - giliranTerlewat);
  if (nyawa === 0) return { ...(await akhiri({ ...game, nyawa }, 'kalah')), timeout: true };
  const baru = await gameModel.ubah(game.id, {
    nyawa,
    deadline_at: new Date(Date.now() + BOT.DURASI_GILIRAN_MS).toISOString(),
  });
  return { game: baru, questSelesai: [], timeout: true };
}

export async function mulai(userId, { mode, tingkat }) {
  if (!['solo', 'bot'].includes(mode)) throw badRequest('Mode harus "solo" atau "bot"');
  if (mode === 'bot' && !['mudah', 'sulit'].includes(tingkat)) throw badRequest('Tingkat bot harus "mudah" atau "sulit"');

  // Game lama yang masih berjalan diakhiri dulu.
  for (const lama of await gameModel.berjalanMilik(userId)) {
    await akhiri(lama, lama.mode === 'bot' ? 'kalah' : 'selesai');
  }

  const pembuka = await kataPembuka();
  const durasi = mode === 'solo' ? SOLO.DURASI_MS : BOT.DURASI_GILIRAN_MS;
  const game = await gameModel.buat({
    user_id: userId,
    mode,
    tingkat: mode === 'bot' ? tingkat : null,
    nyawa: mode === 'bot' ? BOT.NYAWA_AWAL : null,
    kata_terakhir: pembuka.kata,
    deadline_at: new Date(Date.now() + durasi).toISOString(),
  });
  await gameModel.tambahKata({ game_id: game.id, kata_id: pembuka.id, urutan: 1, pemain: 'sistem' });

  return { game: bentukState(game), kata_pembuka: pembuka };
}

function validasiFormat(kata, awalan) {
  if (!kata) return { alasan: 'kosong', pesan: 'Ketik sebuah kata dulu' };
  if (!/^[a-z]+$/.test(kata)) return { alasan: 'format', pesan: 'Kata hanya boleh berisi huruf, tanpa spasi' };
  if (kata.length < ATURAN_KATA.MIN_PANJANG) return { alasan: 'terlalu_pendek', pesan: `Kata minimal ${ATURAN_KATA.MIN_PANJANG} huruf` };
  if (!kata.startsWith(awalan)) return { alasan: 'awalan_salah', pesan: `Kata harus diawali "${awalan}"` };
  return null;
}

// Hukuman jawaban salah. Solo: waktu berkurang. Bot: nyawa berkurang.
async function hukum(game) {
  if (game.mode === 'solo') {
    const deadline = new Date(new Date(game.deadline_at).getTime() - SOLO.PENALTI_SALAH_MS);
    if (deadline.getTime() <= Date.now()) return akhiri({ ...game, deadline_at: deadline.toISOString() }, 'selesai');
    return { game: await gameModel.ubah(game.id, { deadline_at: deadline.toISOString() }), questSelesai: [] };
  }
  const nyawa = game.nyawa - 1;
  if (nyawa <= 0) {
    await gameModel.ubah(game.id, { nyawa: 0 });
    return akhiri({ ...game, nyawa: 0 }, 'kalah');
  }
  return { game: await gameModel.ubah(game.id, { nyawa }), questSelesai: [] };
}

// Setelah sebuah kata masuk, cek kunci mati. Jika tidak ada sambungan lagi, rantai
// dimulai ulang dengan kata acak (pemain 'sistem').
// createdAt diisi untuk kunci mati buatan bot, supaya kata acak baru ikut muncul setelah jeda bot.
async function cekKunciMati(game, kata, terpakai, urutan, createdAt) {
  const ada = await kataModel.adaSambungan(sambungan(kata), terpakai);
  if (ada) return null;
  const acak = await kataPembuka(terpakai);
  await gameModel.tambahKata({
    game_id: game.id,
    kata_id: acak.id,
    urutan: urutan + 1,
    pemain: 'sistem',
    ...(createdAt ? { created_at: createdAt } : {}),
  });
  terpakai.push(acak.id);
  return acak;
}

async function giliranBot(game, kataTerakhir, terpakai, urutan) {
  const pilihan = await botService.pilihKata(game, sambungan(kataTerakhir), terpakai);
  if (!pilihan) return null;
  terpakai.push(pilihan.id);
  // Dua jadwal dengan waktu berpikir yang sama: kunci mati baru diketahui setelah query,
  // dan query itu jalan bersamaan dengan insert supaya tidak menambah waktu tunggu.
  const r = Math.random();
  const dasar = { sekarang: Date.now(), panjang: pilihan.kata.length, acak: () => r };
  const biasa = jadwalBot({ ...dasar, kunciMati: false });
  const km = jadwalBot({ ...dasar, kunciMati: true });
  const [baris, reset] = await Promise.all([
    gameModel.tambahKata({ game_id: game.id, kata_id: pilihan.id, urutan: urutan + 1, pemain: 'bot', created_at: biasa.created_at }),
    cekKunciMati(game, pilihan.kata, terpakai, urutan + 1, km.created_at),
  ]);
  if (reset) await gameModel.ubahKata(baris.id, { kunci_mati: true, created_at: km.created_at });
  return {
    jadwal: reset ? km : biasa,
    kata: pilihan,
    kunci_mati: Boolean(reset),
    kata_acak_baru: reset,
    kata_terakhir: reset ? reset.kata : pilihan.kata,
    urutan: urutan + (reset ? 2 : 1),
  };
}

// Setelah kata user diterima: kata acak baru jika kunci mati, giliran bot (mode bot),
// lalu simpan state game.
async function lanjutkanRantai(game, kataUser, kunciMati, terpakai, urutan, perubahan) {
  let kataTerakhir = kataUser;
  let kataAcakBaru = null;
  if (kunciMati) {
    kataAcakBaru = await kataPembuka(terpakai);
    urutan += 1;
    terpakai.push(kataAcakBaru.id);
    await gameModel.tambahKata({ game_id: game.id, kata_id: kataAcakBaru.id, urutan, pemain: 'sistem' });
    kataTerakhir = kataAcakBaru.kata;
  }

  let balasanBot = null;
  let botKalahAwalan = null;
  if (game.mode === 'bot') {
    const jawaban = await giliranBot(game, kataTerakhir, terpakai, urutan);
    if (!jawaban) {
      botKalahAwalan = sambungan(kataTerakhir);
    } else {
      balasanBot = {
        kata: jawaban.kata,
        kunci_mati: jawaban.kunci_mati,
        kata_acak_baru: jawaban.kata_acak_baru,
        jeda_ms: jawaban.jadwal.jeda_ms,
        berpikir_ms: jawaban.jadwal.berpikir_ms,
      };
      kataTerakhir = jawaban.kata_terakhir;
      perubahan.deadline_at = jawaban.jadwal.deadline_at;
    }
  }

  const baru = await gameModel.ubah(game.id, { ...perubahan, kata_terakhir: kataTerakhir });
  return { game: baru, kataAcakBaru, balasanBot, botKalah: botKalahAwalan !== null, botKalahAwalan };
}

// Setiap query ke Supabase memakan ±200 ms karena jarak jaringan. Query yang tidak saling
// bergantung dijalankan bersamaan supaya pemain tidak menunggu lama setelah menekan kirim.
export async function kirimKata(userId, gameId, input) {
  const kata = String(input ?? '').trim().toLowerCase();
  const [gameAwal, daftar, barisKamus] = await Promise.all([
    ambilMilik(userId, gameId),
    gameModel.kataGame(gameId),
    /^[a-z]+$/.test(kata) ? kataModel.cariKata(kata) : null,
  ]);
  let game = gameAwal;
  if (game.status !== 'berjalan') throw badRequest('Game sudah selesai');
  // Kata bot belum selesai tampil. Bukan jawaban salah, jadi tanpa penalti.
  const akhirJeda = akhirJedaBot(daftar);
  if (akhirJeda && sisaJedaMs(akhirJeda, Date.now()) > 0) throw new HttpError(409, 'Tunggu giliran bot selesai');

  const sinkron = await sinkronWaktu(game);
  if (sinkron.timeout) {
    const selesai = sinkron.game.status !== 'berjalan';
    return {
      valid: false,
      alasan: 'waktu_habis',
      pesan: selesai ? 'Waktu habis, game selesai' : 'Waktu giliranmu habis. Nyawa berkurang.',
      game: bentukState(sinkron.game),
      selesai,
      quest_selesai: sinkron.questSelesai,
    };
  }

  const awalan = sambungan(game.kata_terakhir);
  const terpakai = daftar.map((w) => w.kata.id);
  const terakhir = daftar.at(-1);

  let salah = validasiFormat(kata, awalan);
  const baris = salah ? null : barisKamus;
  if (!salah && !baris) salah = { alasan: 'tidak_ada', pesan: `"${kata}" tidak ada di kamus` };
  if (!salah && terpakai.includes(baris.id)) salah = { alasan: 'sudah_dipakai', pesan: `"${kata}" sudah dipakai di game ini` };

  if (salah) {
    const hasil = await hukum(game);
    return {
      valid: false,
      ...salah,
      penalti: game.mode === 'solo' ? { detik: SOLO.PENALTI_SALAH_MS / 1000 } : { nyawa: 1 },
      game: bentukState(hasil.game),
      selesai: hasil.game.status !== 'berjalan',
      quest_selesai: hasil.questSelesai,
    };
  }

  // Jawaban benar: hitung poin.
  const sekarang = Date.now();
  const cepat = sekarang - new Date(terakhir.created_at).getTime() < BATAS_JAWAB_CEPAT_MS;
  terpakai.push(baris.id);
  const [unlock, adaLanjutan, muatanQuest] = await Promise.all([
    unlockModel.cari(userId, baris.id),
    kataModel.adaSambungan(sambungan(baris.kata), terpakai),
    questService.muatProgres(userId),
  ]);
  const baru = !unlock;
  const kunciMati = !adaLanjutan;
  const rincian = {
    huruf: baris.panjang * SKOR.PER_HURUF,
    kata_baru: baru ? SKOR.KATA_BARU : 0,
    jawab_cepat: cepat ? SKOR.JAWAB_CEPAT : 0,
    kunci_mati: kunciMati ? SKOR.KUNCI_MATI : 0,
  };
  const poin = Object.values(rincian).reduce((a, b) => a + b, 0);

  const urutan = terakhir.urutan + 1;
  const jumlahKata = game.jumlah_kata + 1;
  const [, , questSelesai, rantai] = await Promise.all([
    gameModel.tambahKata({
      game_id: game.id,
      kata_id: baris.id,
      urutan,
      pemain: 'user',
      poin,
      baru,
      kunci_mati: kunciMati,
    }),
    baru ? unlockModel.buka(userId, baris.id) : unlockModel.tambahPemakaian(userId, baris.id, unlock.jumlah_dipakai),
    questService.catat(
      userId,
      { jenis: 'kata', baru, awalan: baris.kata.slice(0, 2), panjang: baris.panjang, jumlahKata },
      muatanQuest,
    ),
    lanjutkanRantai(game, baris.kata, kunciMati, terpakai, urutan, { skor: game.skor + poin, jumlah_kata: jumlahKata }),
  ]);
  const { kataAcakBaru, balasanBot, botKalah, botKalahAwalan } = rantai;
  game = rantai.game;
  if (botKalah) {
    const hasil = await akhiri(game, 'menang');
    game = hasil.game;
    questSelesai.push(...hasil.questSelesai);
  }

  return {
    valid: true,
    pesan: `"${baris.kata}" diterima`,
    kata: baris,
    poin,
    rincian,
    unlock: baru,
    kunci_mati: kunciMati,
    kata_acak_baru: kataAcakBaru,
    balasan_bot: balasanBot,
    bot_menyerah: botKalah,
    bot_kalah_awalan: botKalahAwalan,
    game: bentukState(game),
    selesai: game.status !== 'berjalan',
    quest_selesai: questSelesai,
  };
}

// Rincian skor dihitung ulang dari rantai kata.
function rincianSkor(game, rantai) {
  const milikUser = rantai.filter((w) => w.pemain === 'user');
  const huruf = milikUser.reduce((n, w) => n + w.kata.panjang * SKOR.PER_HURUF, 0);
  const kataBaru = milikUser.filter((w) => w.baru).length;
  const kunciMati = milikUser.filter((w) => w.kunci_mati).length;
  const totalPoin = milikUser.reduce((n, w) => n + w.poin, 0);
  const jawabCepat = Math.round((totalPoin - huruf - kataBaru * SKOR.KATA_BARU - kunciMati * SKOR.KUNCI_MATI) / SKOR.JAWAB_CEPAT);
  return {
    huruf: { jumlah: huruf, poin: huruf },
    kata_baru: { jumlah: kataBaru, poin: kataBaru * SKOR.KATA_BARU },
    jawab_cepat: { jumlah: jawabCepat, poin: jawabCepat * SKOR.JAWAB_CEPAT },
    kunci_mati: { jumlah: kunciMati, poin: kunciMati * SKOR.KUNCI_MATI },
    menang_bot: { jumlah: game.status === 'menang' ? 1 : 0, poin: game.status === 'menang' ? SKOR.MENANG_BOT : 0 },
  };
}

export async function detail(userId, gameId) {
  let game = await ambilMilik(userId, gameId);
  const sinkron = await sinkronWaktu(game);
  game = sinkron.game;
  const rantai = await gameModel.kataGame(game.id);
  // Game yang ditutup lewat batas waktu baru tercatat selesai saat server mengeceknya,
  // jadi durasi dibatasi sampai deadline.
  let durasiMs = null;
  if (game.finished_at) {
    const akhir = Math.min(new Date(game.finished_at).getTime(), new Date(game.deadline_at ?? game.finished_at).getTime());
    durasiMs = Math.max(0, akhir - new Date(game.started_at).getTime());
  }
  return {
    game: bentukState(game),
    durasi_ms: durasiMs,
    rincian_skor: rincianSkor(game, rantai),
    rantai: rantai.map((w) => ({
      urutan: w.urutan,
      pemain: w.pemain,
      kata: w.kata,
      poin: w.poin,
      baru: w.baru,
      kunci_mati: w.kunci_mati,
      created_at: w.created_at,
    })),
    quest_selesai: sinkron.questSelesai,
  };
}

// aksi: 'selesai' (waktu habis atau keluar) atau 'menyerah'. Di mode bot keduanya berarti kalah.
export async function selesaikan(userId, gameId, aksi = 'selesai') {
  if (!['selesai', 'menyerah'].includes(aksi)) throw badRequest('Aksi harus "selesai" atau "menyerah"');
  let game = await ambilMilik(userId, gameId);
  let questSelesai = [];
  if (game.status === 'berjalan') {
    const sinkron = await sinkronWaktu(game);
    ({ game, questSelesai } = sinkron);
    if (game.status === 'berjalan') {
      const hasil = await akhiri(game, game.mode === 'bot' ? 'kalah' : 'selesai');
      game = hasil.game;
      questSelesai = hasil.questSelesai;
    }
  }
  const hasil = await detail(userId, game.id);
  return { ...hasil, quest_selesai: questSelesai };
}

export async function riwayat(userId, paginasi) {
  const { data, total } = await gameModel.daftarMilik(userId, paginasi);
  return { data: data.map(bentukState), total };
}

export async function hapus(userId, gameId) {
  const game = await ambilMilik(userId, gameId);
  if (game.status === 'berjalan') throw badRequest('Game yang masih berjalan tidak bisa dihapus');
  await gameModel.hapus(game.id);
}
