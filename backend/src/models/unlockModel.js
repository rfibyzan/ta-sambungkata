import { supabase } from '../config/supabaseClient.js';
import { cekSupabase } from '../utils/httpError.js';
import { hasilHalaman } from '../utils/paginasi.js';

export async function cari(userId, kataId) {
  return cekSupabase(
    await supabase
      .from('unlocked_words')
      .select('kata_id, pertama_unlock, jumlah_dipakai')
      .eq('user_id', userId)
      .eq('kata_id', kataId)
      .maybeSingle(),
  );
}

export async function buka(userId, kataId) {
  cekSupabase(await supabase.from('unlocked_words').insert({ user_id: userId, kata_id: kataId }));
}

export async function tambahPemakaian(userId, kataId, jumlahSekarang) {
  cekSupabase(
    await supabase
      .from('unlocked_words')
      .update({ jumlah_dipakai: jumlahSekarang + 1 })
      .eq('user_id', userId)
      .eq('kata_id', kataId),
  );
}

// Dari daftar id kata, mana yang sudah ter-unlock user.
export async function dariId(userId, kataIds) {
  if (!kataIds.length) return [];
  return cekSupabase(
    await supabase
      .from('unlocked_words')
      .select('kata_id, pertama_unlock, jumlah_dipakai')
      .eq('user_id', userId)
      .in('kata_id', kataIds),
  );
}

// Semua kata (opsional per huruf), kata milik user di depan. pertama_unlock null berarti terkunci.
export async function kamusUser(userId, { huruf, dari, limit }) {
  return cekSupabase(
    await supabase.rpc('kamus_user', { p_user: userId, p_huruf: huruf ?? null, p_offset: dari, p_limit: limit }),
  );
}

export async function cariMilik(userId, { search, huruf, dari, sampai }) {
  let q = supabase
    .from('unlocked_words')
    .select('pertama_unlock, jumlah_dipakai, kata:kata_id!inner (id, kata, jenis, makna, contoh, huruf_awal, panjang)', {
      count: 'exact',
    })
    .eq('user_id', userId);
  if (search) q = q.ilike('kata.kata', `${search}%`);
  if (huruf) q = q.eq('kata.huruf_awal', huruf);
  const { data, error, count } = await q.order('kata(kata)').range(dari, sampai);
  return hasilHalaman({ data, error, count });
}

export async function hitungMilik(userId, { huruf } = {}) {
  let q = supabase
    .from('unlocked_words')
    .select('kata_id, kata:kata_id!inner (huruf_awal)', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (huruf) q = q.eq('kata.huruf_awal', huruf);
  const { count, error } = await q;
  cekSupabase({ data: true, error });
  return count ?? 0;
}
