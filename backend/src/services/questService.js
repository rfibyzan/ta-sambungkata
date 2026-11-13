import * as questModel from '../models/questModel.js';
import * as userModel from '../models/userModel.js';
import * as gameModel from '../models/gameModel.js';
import { QUEST_PER_HARI, levelDariXp } from '../config/gameRules.js';
import { tanggalWib, tambahHari, awalHariWib, sisaHariIniMs } from '../utils/waktu.js';
import { badRequest, notFound } from '../utils/httpError.js';

// Acak deterministik per tanggal, supaya request yang datang bersamaan memilih quest yang sama.
function acakBerbibit(daftar, bibit) {
  let h = 2166136261;
  for (const c of bibit) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rng = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const hasil = [...daftar].sort((a, b) => a.id - b.id);
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

// Quest dibuat secara lazy pada request pertama di hari itu (tanpa cron).
export async function pastikanHariIni(tanggal = tanggalWib()) {
  let harian = await questModel.harian(tanggal);
  if (harian.length >= QUEST_PER_HARI) return harian.slice(0, QUEST_PER_HARI);

  const template = acakBerbibit(await questModel.templateAktif(), tanggal);
  const dipilih = [];
  const tipeDipakai = new Set();
  for (const t of template) {
    if (dipilih.length === QUEST_PER_HARI) break;
    if (!tipeDipakai.has(t.tipe)) {
      dipilih.push(t);
      tipeDipakai.add(t.tipe);
    }
  }
  await questModel.buatHarian(dipilih.map((t) => ({ tanggal, template_id: t.id })));
  harian = await questModel.harian(tanggal);
  return harian.slice(0, QUEST_PER_HARI);
}

function bentukQuest(harian, progres) {
  const t = harian.template;
  return {
    id: harian.id,
    tanggal: harian.tanggal,
    judul: t.judul,
    deskripsi: t.deskripsi,
    tipe: t.tipe,
    target: t.target,
    parameter: t.parameter,
    hadiah_xp: t.hadiah_xp,
    progres: progres?.progres ?? 0,
    selesai: progres?.selesai ?? false,
    diklaim: progres?.diklaim ?? false,
  };
}

// Streak dianggap putus jika hari terakhir semua quest diklaim lebih lama dari kemarin.
export function streakEfektif(user) {
  if (!user?.last_streak_date) return 0;
  const kemarin = tambahHari(tanggalWib(), -1);
  return user.last_streak_date >= kemarin ? user.streak : 0;
}

export async function hariIni(userId) {
  const harian = await pastikanHariIni();
  const progres = await questModel.progresUser(userId, harian.map((h) => h.id));
  const user = await userModel.cariId(userId);
  return {
    tanggal: tanggalWib(),
    reset_dalam_ms: sisaHariIniMs(),
    xp: user?.xp ?? 0,
    level: user?.level ?? 1,
    streak: streakEfektif(user),
    quests: harian.map((h) => bentukQuest(h, progres.find((p) => p.daily_quest_id === h.id))),
  };
}

// Hitung progres baru satu quest dari satu peristiwa game.
function progresBaru(quest, p) {
  const param = quest.parameter ?? {};
  const sekarang = quest.progres;
  if (p.jenis === 'kata') {
    switch (quest.tipe) {
      case 'unlock_kata':
        return p.baru ? sekarang + 1 : sekarang;
      case 'huruf_awal':
        return p.awalan === param.awalan ? sekarang + 1 : sekarang;
      case 'panjang_kata':
        return p.panjang >= (param.min_panjang ?? 7) ? sekarang + 1 : sekarang;
      case 'rantai':
        return Math.max(sekarang, p.jumlahKata);
      default:
        return sekarang;
    }
  }
  if (p.jenis === 'selesai') {
    switch (quest.tipe) {
      case 'main_game':
        return sekarang + 1;
      case 'skor':
        return p.skor >= (param.min_skor ?? 0) ? quest.target : sekarang;
      case 'kalahkan_bot':
        return p.menang && (!param.tingkat || param.tingkat === p.tingkat) ? sekarang + 1 : sekarang;
      default:
        return sekarang;
    }
  }
  return sekarang;
}

// Dipanggil dari gameService. Mengembalikan quest yang baru saja selesai.
export async function catat(userId, peristiwa) {
  const harian = await pastikanHariIni();
  const progres = await questModel.progresUser(userId, harian.map((h) => h.id));
  const simpan = [];
  const baruSelesai = [];

  for (const h of harian) {
    const quest = bentukQuest(h, progres.find((p) => p.daily_quest_id === h.id));
    if (quest.selesai) continue;
    const nilai = Math.min(quest.target, progresBaru(quest, peristiwa));
    if (nilai === quest.progres) continue;
    const selesai = nilai >= quest.target;
    simpan.push({ user_id: userId, daily_quest_id: h.id, progres: nilai, selesai });
    if (selesai) baruSelesai.push({ ...quest, progres: nilai, selesai: true });
  }

  await questModel.simpanProgres(simpan);
  return baruSelesai;
}

export async function detail(userId, dailyId) {
  const harian = await questModel.harianId(dailyId);
  if (!harian) throw notFound('Quest tidak ditemukan');
  const [progres] = await questModel.progresUser(userId, [harian.id]);
  const quest = bentukQuest(harian, progres);

  let kataTerhitung = [];
  if (['unlock_kata', 'huruf_awal', 'panjang_kata'].includes(quest.tipe)) {
    const param = quest.parameter ?? {};
    const sejak = awalHariWib(harian.tanggal);
    const sampai = awalHariWib(tambahHari(harian.tanggal, 1));
    const kata = await gameModel.kataUserSejak(userId, sejak);
    kataTerhitung = kata
      .filter((k) => new Date(k.created_at) < sampai)
      .filter((k) => {
        if (quest.tipe === 'unlock_kata') return k.baru;
        if (quest.tipe === 'huruf_awal') return k.kata.awalan === param.awalan;
        return k.kata.panjang >= (param.min_panjang ?? 7);
      })
      .slice(0, quest.target)
      .map((k) => ({ id: k.kata.id, kata: k.kata.kata }));
  }

  return { ...quest, hari_ini: harian.tanggal === tanggalWib(), kata_terhitung: kataTerhitung };
}

export async function klaim(userId, dailyId) {
  const harian = await questModel.harianId(dailyId);
  if (!harian) throw notFound('Quest tidak ditemukan');

  const diklaim = await questModel.klaim(userId, harian.id);
  if (!diklaim.length) {
    const [p] = await questModel.progresUser(userId, [harian.id]);
    if (p?.diklaim) throw badRequest('Hadiah quest ini sudah diklaim');
    throw badRequest('Quest belum selesai');
  }

  const user = await userModel.cariId(userId);
  const hadiah = harian.template.hadiah_xp;
  const xp = user.xp + hadiah;
  const level = levelDariXp(xp);
  const perubahan = { xp, level };

  // Streak bertambah saat semua quest di tanggal itu sudah diklaim.
  const semuaHarian = await questModel.harian(harian.tanggal);
  const semuaProgres = await questModel.progresUser(userId, semuaHarian.map((h) => h.id));
  const semuaDiklaim = semuaHarian.every((h) => semuaProgres.find((p) => p.daily_quest_id === h.id)?.diklaim);
  let streakBertambah = false;
  if (semuaDiklaim && user.last_streak_date !== harian.tanggal) {
    const lanjut = user.last_streak_date === tambahHari(harian.tanggal, -1);
    perubahan.streak = lanjut ? user.streak + 1 : 1;
    perubahan.last_streak_date = harian.tanggal;
    streakBertambah = true;
  }

  const baru = await userModel.ubah(userId, perubahan);
  return {
    xp_didapat: hadiah,
    xp: baru.xp,
    level: baru.level,
    naik_level: baru.level > user.level,
    streak: streakEfektif(baru),
    streak_bertambah: streakBertambah,
  };
}
