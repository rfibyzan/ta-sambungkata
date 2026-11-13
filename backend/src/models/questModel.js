import { supabase } from '../config/supabaseClient.js';
import { cekSupabase } from '../utils/httpError.js';

const KOLOM_HARIAN = 'id, tanggal, template:template_id (id, judul, deskripsi, tipe, target, parameter, hadiah_xp)';

export async function templateAktif() {
  return cekSupabase(await supabase.from('quest_templates').select('id, tipe').eq('aktif', true));
}

export async function harian(tanggal) {
  return cekSupabase(await supabase.from('daily_quests').select(KOLOM_HARIAN).eq('tanggal', tanggal).order('id'));
}

export async function harianId(id) {
  return cekSupabase(await supabase.from('daily_quests').select(KOLOM_HARIAN).eq('id', id).maybeSingle());
}

// Aman dari balapan request: duplikat (tanggal, template_id) diabaikan.
export async function buatHarian(baris) {
  cekSupabase(
    await supabase.from('daily_quests').upsert(baris, { onConflict: 'tanggal,template_id', ignoreDuplicates: true }),
  );
}

export async function progresUser(userId, dailyIds) {
  if (!dailyIds.length) return [];
  return cekSupabase(
    await supabase
      .from('user_quests')
      .select('daily_quest_id, progres, selesai, diklaim, diklaim_at')
      .eq('user_id', userId)
      .in('daily_quest_id', dailyIds),
  );
}

export async function simpanProgres(baris) {
  if (!baris.length) return;
  cekSupabase(await supabase.from('user_quests').upsert(baris, { onConflict: 'user_id,daily_quest_id' }));
}

// Tandai diklaim hanya jika belum diklaim (mencegah klaim ganda).
export async function klaim(userId, dailyId) {
  return cekSupabase(
    await supabase
      .from('user_quests')
      .update({ diklaim: true, diklaim_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('daily_quest_id', dailyId)
      .eq('selesai', true)
      .eq('diklaim', false)
      .select('daily_quest_id'),
  );
}
