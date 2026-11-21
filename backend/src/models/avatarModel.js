import { supabase } from '../config/supabaseClient.js';
import { cekSupabase } from '../utils/httpError.js';

const BUCKET = 'avatar';
const EKSTENSI = ['webp', 'jpg', 'png'];

// Satu file per user. Varian ekstensi lain dihapus supaya ganti format tidak meninggalkan file lama.
export async function hapus(userId, kecuali = null) {
  const path = EKSTENSI.filter((e) => e !== kecuali).map((e) => `${userId}.${e}`);
  cekSupabase(await supabase.storage.from(BUCKET).remove(path), 'Foto lama gagal dihapus');
}

// Mengembalikan URL publik. ?v= membuat cache browser dan service worker mengambil foto baru.
// Foto lama berformat lain baru dihapus setelah unggahan berhasil, supaya gagal unggah tidak
// menghilangkan foto yang masih dipakai avatar_url.
export async function unggah(userId, { buffer, mime, ext }) {
  const path = `${userId}.${ext}`;
  cekSupabase(
    await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: mime, upsert: true, cacheControl: '31536000' }),
    'Foto gagal diunggah',
  );
  await hapus(userId, ext).catch(() => {});
  const { publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path).data;
  return `${publicUrl}?v=${Date.now()}`;
}
