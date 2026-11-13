import { supabase } from '../config/supabaseClient.js';
import { unauthorized } from '../utils/httpError.js';

async function userDariToken(req) {
  const header = req.headers.authorization ?? '';
  const [skema, token] = header.split(' ');
  if (skema !== 'Bearer' || !token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email };
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
