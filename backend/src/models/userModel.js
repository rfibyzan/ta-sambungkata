import { supabase } from '../config/supabaseClient.js';
import { cekSupabase } from '../utils/httpError.js';

const KOLOM = 'id, username, avatar_url, xp, level, streak, last_streak_date, created_at';

export async function cariId(id) {
  return cekSupabase(await supabase.from('users').select(KOLOM).eq('id', id).maybeSingle());
}

export async function cariUsername(username) {
  return cekSupabase(await supabase.from('users').select('id').eq('username', username).maybeSingle());
}

export async function buat({ id, username }) {
  return cekSupabase(await supabase.from('users').insert({ id, username }).select(KOLOM).single());
}

export async function ubah(id, perubahan) {
  return cekSupabase(await supabase.from('users').update(perubahan).eq('id', id).select(KOLOM).single());
}

export async function statistik(id) {
  return cekSupabase(await supabase.rpc('statistik_user', { p_user: id }));
}

export async function peringkat({ mode, tingkat = null, sejak = null, limit = 50 }) {
  return cekSupabase(
    await supabase.rpc('leaderboard', {
      p_mode: mode,
      p_tingkat: tingkat,
      p_sejak: sejak ? sejak.toISOString() : null,
      p_limit: limit,
    }),
  );
}

// Supabase Auth (admin): dipakai saat daftar.
export async function buatAkunAuth(email, password) {
  return supabase.auth.admin.createUser({ email, password, email_confirm: true });
}

export async function hapusAkunAuth(id) {
  return supabase.auth.admin.deleteUser(id);
}
