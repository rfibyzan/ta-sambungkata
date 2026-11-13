import { supabase } from '../config/supabaseClient.js';
import { cekSupabase } from '../utils/httpError.js';

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
  cekSupabase({ data, error });
  return { data, total: count ?? 0 };
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
