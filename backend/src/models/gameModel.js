import { supabase } from '../config/supabaseClient.js';
import { cekSupabase } from '../utils/httpError.js';

const KOLOM_GAME =
  'id, user_id, mode, tingkat, skor, jumlah_kata, nyawa, status, kata_terakhir, started_at, deadline_at, finished_at';

export async function buat(game) {
  return cekSupabase(await supabase.from('games').insert(game).select(KOLOM_GAME).single());
}

export async function cariId(id) {
  return cekSupabase(await supabase.from('games').select(KOLOM_GAME).eq('id', id).maybeSingle());
}

export async function ubah(id, perubahan) {
  return cekSupabase(await supabase.from('games').update(perubahan).eq('id', id).select(KOLOM_GAME).single());
}

export async function hapus(id) {
  cekSupabase(await supabase.from('games').delete().eq('id', id));
}

export async function berjalanMilik(userId) {
  return cekSupabase(await supabase.from('games').select(KOLOM_GAME).eq('user_id', userId).eq('status', 'berjalan'));
}

export async function daftarMilik(userId, { dari, sampai }) {
  const { data, error, count } = await supabase
    .from('games')
    .select(KOLOM_GAME, { count: 'exact' })
    .eq('user_id', userId)
    .neq('status', 'berjalan')
    .order('started_at', { ascending: false })
    .range(dari, sampai);
  cekSupabase({ data, error });
  return { data, total: count ?? 0 };
}

export async function kataGame(gameId) {
  return cekSupabase(
    await supabase
      .from('game_words')
      .select('id, urutan, pemain, poin, baru, kunci_mati, created_at, kata:kata_id (id, kata, jenis, panjang)')
      .eq('game_id', gameId)
      .order('urutan'),
  );
}

export async function tambahKata(baris) {
  return cekSupabase(await supabase.from('game_words').insert(baris).select('id, urutan, created_at').single());
}

export async function ubahKata(id, perubahan) {
  cekSupabase(await supabase.from('game_words').update(perubahan).eq('id', id));
}

// Kata user hari ini (untuk detail quest).
export async function kataUserSejak(userId, sejak) {
  return cekSupabase(
    await supabase
      .from('game_words')
      .select('created_at, baru, kata:kata_id (id, kata, awalan, panjang), game:game_id!inner (user_id)')
      .eq('game.user_id', userId)
      .eq('pemain', 'user')
      .gte('created_at', sejak.toISOString())
      .order('created_at'),
  );
}
