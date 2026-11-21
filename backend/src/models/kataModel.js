import { supabase } from '../config/supabaseClient.js';
import { cekSupabase } from '../utils/httpError.js';
import { hasilHalaman } from '../utils/paginasi.js';

const KOLOM = 'id, kata, jenis, makna, contoh, huruf_awal, panjang';

export async function daftar({ search, huruf, dari, sampai, ids }) {
  let q = supabase.from('kata').select(KOLOM, { count: 'exact' }).order('kata');
  if (search) q = q.ilike('kata', `${search}%`);
  if (huruf) q = q.eq('huruf_awal', huruf);
  if (ids) q = q.in('id', ids);
  const { data, error, count } = await q.range(dari, sampai);
  return hasilHalaman({ data, error, count });
}

export async function cariId(id) {
  return cekSupabase(await supabase.from('kata').select(KOLOM).eq('id', id).maybeSingle());
}

export async function cariKata(kata) {
  return cekSupabase(await supabase.from('kata').select(KOLOM).eq('kata', kata).maybeSingle());
}

export async function hitung({ huruf } = {}) {
  let q = supabase.from('kata').select('id', { count: 'exact', head: true });
  if (huruf) q = q.eq('huruf_awal', huruf);
  const { count, error } = await q;
  cekSupabase({ data: true, error });
  return count ?? 0;
}

// Kata ke-n (urut id) yang punya contoh. Dipakai untuk "kata hari ini".
export async function kataBercontohKe(n) {
  const { count, error } = await supabase.from('kata').select('id', { count: 'exact', head: true }).not('contoh', 'is', null);
  cekSupabase({ data: true, error });
  if (!count) return null;
  const idx = n % count;
  return cekSupabase(
    await supabase.from('kata').select(KOLOM).not('contoh', 'is', null).order('id').range(idx, idx).maybeSingle(),
  );
}

export async function acak({ awalan = null, kecuali = [], minSambungan = 0 } = {}) {
  const data = cekSupabase(
    await supabase.rpc('kata_acak', { p_awalan: awalan, p_kecuali: kecuali, p_min_sambungan: minSambungan }),
  );
  return data?.[0] ?? null;
}

export async function adaSambungan(awalan, kecuali = []) {
  return cekSupabase(await supabase.rpc('ada_sambungan', { p_awalan: awalan, p_kecuali: kecuali }));
}

export async function pilihanBot({ awalan, kecuali, tingkat, persen, seed }) {
  const data = cekSupabase(
    await supabase.rpc('bot_pilih_kata', {
      p_awalan: awalan,
      p_kecuali: kecuali,
      p_tingkat: tingkat,
      p_persen: persen,
      p_seed: seed,
    }),
  );
  return data?.[0] ?? null;
}

// Kata yang diawali `awalan` (untuk "bisa disambung dengan").
export async function denganAwalan(awalan, limit = 8) {
  return cekSupabase(await supabase.from('kata').select(KOLOM).eq('awalan', awalan).order('panjang').order('kata').limit(limit));
}
