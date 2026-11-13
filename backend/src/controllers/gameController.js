import * as gameService from '../services/gameService.js';
import { bacaPaginasi, metaPaginasi } from '../utils/paginasi.js';

export async function mulai(req, res) {
  const hasil = await gameService.mulai(req.user.id, { mode: req.body?.mode, tingkat: req.body?.tingkat });
  res.status(201).json(hasil);
}

export async function kirimKata(req, res) {
  res.json(await gameService.kirimKata(req.user.id, req.params.id, req.body?.kata));
}

export async function selesaikan(req, res) {
  res.json(await gameService.selesaikan(req.user.id, req.params.id, req.body?.aksi));
}

export async function riwayat(req, res) {
  const paginasi = bacaPaginasi(req.query, { limitDefault: 10, limitMaks: 30 });
  const { data, total } = await gameService.riwayat(req.user.id, paginasi);
  res.json({ data, meta: metaPaginasi(paginasi, total) });
}

export async function detail(req, res) {
  res.json(await gameService.detail(req.user.id, req.params.id));
}

export async function hapus(req, res) {
  await gameService.hapus(req.user.id, req.params.id);
  res.json({ pesan: 'Riwayat game dihapus' });
}
