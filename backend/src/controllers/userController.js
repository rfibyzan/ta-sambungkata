import * as userModel from '../models/userModel.js';
import { profilPublik, POLA_USERNAME } from './authController.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';

// GET /users/:id (publik): profil + statistik.
export async function profil(req, res) {
  const user = await userModel.cariId(req.params.id);
  if (!user) throw notFound('Pemain tidak ditemukan');
  const statistik = await userModel.statistik(user.id);
  res.json({ ...profilPublik(user), statistik });
}

// PUT /users/:id (hanya pemilik): ubah username dan/atau avatar_url.
export async function ubah(req, res) {
  if (req.params.id !== req.user.id) throw forbidden('Kamu hanya bisa mengubah profilmu sendiri');
  const perubahan = {};

  if (req.body?.username !== undefined) {
    const username = String(req.body.username).trim().toLowerCase();
    if (!POLA_USERNAME.test(username)) {
      throw badRequest('Username 3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah');
    }
    const pemilik = await userModel.cariUsername(username);
    if (pemilik && pemilik.id !== req.user.id) throw badRequest('Username sudah dipakai');
    perubahan.username = username;
  }

  if (req.body?.avatar_url !== undefined) {
    const url = req.body.avatar_url;
    if (url !== null && !/^https:\/\/\S+$/.test(String(url))) throw badRequest('avatar_url harus URL https atau null');
    perubahan.avatar_url = url;
  }

  if (!Object.keys(perubahan).length) throw badRequest('Tidak ada data yang diubah');
  const user = await userModel.ubah(req.user.id, perubahan);
  res.json(profilPublik(user));
}
