import { supabase } from '../config/supabaseClient.js';
import { unauthorized } from '../utils/httpError.js';

async function userDariToken(req) {
  const header = req.headers.authorization ?? '';
  const [skema, token] = header.split(' ');
  if (skema !== 'Bearer' || !token) return null;
  // getClaims memverifikasi tanda tangan JWT di backend memakai kunci publik Supabase
  // (disimpan setelah diambil sekali), jadi tidak perlu bertanya ke server Auth di setiap request.
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: data.claims.email };
}

// Wajib login: tolak dengan 401 jika token tidak ada atau tidak valid.
export async function wajibLogin(req, res, next) {
  const user = await userDariToken(req);
  if (!user) throw unauthorized('Sesi tidak valid atau sudah berakhir. Silakan masuk lagi.');
  req.user = user;
  next();
}

// Opsional: isi req.user jika token valid, lanjut tanpa error jika tidak.
export async function opsionalLogin(req, res, next) {
  req.user = await userDariToken(req);
  next();
}
