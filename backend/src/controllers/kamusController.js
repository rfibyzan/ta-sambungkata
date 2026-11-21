import * as kataModel from '../models/kataModel.js';
import * as unlockModel from '../models/unlockModel.js';
import { bacaFilter } from './kataController.js';
import { bacaPaginasi, metaPaginasi } from '../utils/paginasi.js';
import { forbidden, notFound } from '../utils/httpError.js';

// Kata yang belum ter-unlock tidak boleh bocor: hanya huruf awal dan panjang yang dikirim.
function terkunci(kata) {
  return { id: kata.id, terkunci: true, huruf_awal: kata.huruf_awal, panjang: kata.panjang };
}

function terbuka(kata, unlock) {
  return { ...kata, terkunci: false, pertama_unlock: unlock.pertama_unlock, jumlah_dipakai: unlock.jumlah_dipakai };
}

function pastikanPemilik(req) {
  if (req.params.id !== req.user.id) throw forbidden('Kamu hanya bisa melihat Kamusku milikmu sendiri');
}

// GET /users/:id/kamus
// - dengan search: hanya kata ter-unlock yang cocok.
// - tanpa search: semua kata (opsional per huruf) gaya Pokédex, kata terkunci disamarkan.
export async function daftar(req, res) {
  pastikanPemilik(req);
  const userId = req.user.id;
  const { search, huruf } = bacaFilter(req.query);
  const paginasi = bacaPaginasi(req.query, { limitDefault: 30, limitMaks: 60 });

  // Tanpa search: semua kata, yang sudah terbuka di depan (RPC kamus_user). Total diambil
  // dari hitungan kata, bukan dari baris yang kembali, supaya halaman di luar batas tetap
  // mendapat total yang benar.
  const [hasilCari, barisKamus, terkumpul, totalKata, terkumpulHuruf, totalHuruf] = await Promise.all([
    search ? unlockModel.cariMilik(userId, { search, huruf, ...paginasi }) : null,
    search ? null : unlockModel.kamusUser(userId, { huruf, dari: paginasi.dari, limit: paginasi.limit }),
    unlockModel.hitungMilik(userId),
    kataModel.hitung(),
    huruf ? unlockModel.hitungMilik(userId, { huruf }) : null,
    huruf ? kataModel.hitung({ huruf }) : null,
  ]);

  let data;
  let total;
  if (search) {
    data = hasilCari.data.map((u) => terbuka(u.kata, u));
    total = hasilCari.total;
  } else {
    data = barisKamus.map(({ pertama_unlock, jumlah_dipakai, ...k }) =>
      pertama_unlock ? terbuka(k, { pertama_unlock, jumlah_dipakai }) : terkunci(k),
    );
    total = huruf ? totalHuruf : totalKata;
  }

  res.json({
    data,
    meta: metaPaginasi(paginasi, total),
    progres: {
      terkumpul,
      total: totalKata,
      persen: totalKata ? Math.round((terkumpul / totalKata) * 1000) / 10 : 0,
      ...(huruf ? { huruf, terkumpul_huruf: terkumpulHuruf, total_huruf: totalHuruf } : {}),
    },
  });
}

// GET /users/:id/kamus/:kataId
export async function detail(req, res) {
  pastikanPemilik(req);
  const kataId = Number.parseInt(req.params.kataId, 10);
  const kata = Number.isInteger(kataId) ? await kataModel.cariId(kataId) : null;
  if (!kata) throw notFound('Kata tidak ditemukan');

  const unlock = await unlockModel.cari(req.user.id, kata.id);
  if (!unlock) return res.json(terkunci(kata));

  const akhiran = kata.kata.slice(-2);
  const lanjutan = (await kataModel.denganAwalan(akhiran)).filter((k) => k.id !== kata.id);
  const lanjutanUnlock = await unlockModel.dariId(req.user.id, lanjutan.map((k) => k.id));
  const sambungan = lanjutan.map((k) =>
    lanjutanUnlock.some((u) => u.kata_id === k.id) ? { id: k.id, kata: k.kata, terkunci: false } : terkunci(k),
  );

  res.json({ ...terbuka(kata, unlock), sambungan: { awalan: akhiran, kata: sambungan } });
}
