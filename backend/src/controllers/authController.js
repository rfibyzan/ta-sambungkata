import { supabaseAuth } from '../config/supabaseClient.js';
import * as userModel from '../models/userModel.js';
import { streakEfektif } from '../services/questService.js';
import { badRequest, unauthorized, notFound } from '../utils/httpError.js';

export const POLA_USERNAME = /^[a-z0-9._]{3,20}$/;
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function profilPublik(user) {
  return {
    id: user.id,
    username: user.username,
    avatar_url: user.avatar_url,
    xp: user.xp,
    level: user.level,
    streak: streakEfektif(user),
    created_at: user.created_at,
  };
}

function bentukSesi(session, user) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: { ...profilPublik(user), email: session.user?.email },
  };
}

async function masuk(email, password) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw unauthorized('Email atau kata sandi salah');
  const user = await userModel.cariId(data.user.id);
  if (!user) throw notFound('Profil pemain tidak ditemukan');
  return bentukSesi(data.session, user);
}

export async function register(req, res) {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!POLA_USERNAME.test(username)) {
    throw badRequest('Username 3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah');
  }
  if (!POLA_EMAIL.test(email)) throw badRequest('Format email tidak valid');
  if (password.length < 8) throw badRequest('Kata sandi minimal 8 karakter');
  if (await userModel.cariUsername(username)) throw badRequest('Username sudah dipakai');

  const { data, error } = await userModel.buatAkunAuth(email, password);
  if (error) {
    if (/already|registered|exists/i.test(error.message)) throw badRequest('Email sudah terdaftar');
    throw badRequest('Gagal membuat akun. Coba lagi.');
  }

  try {
    await userModel.buat({ id: data.user.id, username });
  } catch (err) {
    await userModel.hapusAkunAuth(data.user.id);
    throw err;
  }

  res.status(201).json(await masuk(email, password));
}

export async function login(req, res) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!email || !password) throw badRequest('Email dan kata sandi wajib diisi');
  res.json(await masuk(email, password));
}

export async function refresh(req, res) {
  const refreshToken = req.body?.refresh_token;
  if (!refreshToken) throw badRequest('refresh_token wajib diisi');
  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) throw unauthorized('Sesi sudah berakhir. Silakan masuk lagi.');
  const user = await userModel.cariId(data.user.id);
  if (!user) throw notFound('Profil pemain tidak ditemukan');
  res.json(bentukSesi(data.session, user));
}

export async function me(req, res) {
  const user = await userModel.cariId(req.user.id);
  if (!user) throw notFound('Profil pemain tidak ditemukan');
  res.json({ ...profilPublik(user), email: req.user.email });
}

export async function cekUsername(req, res) {
  const username = String(req.query.username ?? '').trim().toLowerCase();
  if (!POLA_USERNAME.test(username)) {
    return res.json({ tersedia: false, pesan: 'Username 3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah' });
  }
  const dipakai = await userModel.cariUsername(username);
  res.json({ tersedia: !dipakai, pesan: dipakai ? 'Username sudah dipakai' : 'Username tersedia' });
}
