import * as userModel from '../models/userModel.js';
import { awalMingguWib } from '../utils/waktu.js';
import { badRequest } from '../utils/httpError.js';

const MODE = {
  solo: { mode: 'solo', tingkat: null },
  bot_mudah: { mode: 'bot', tingkat: 'mudah' },
  bot_sulit: { mode: 'bot', tingkat: 'sulit' },
};

// GET /leaderboard?mode=solo|bot_mudah|bot_sulit&periode=mingguan|semua
export async function daftar(req, res) {
  const mode = req.query.mode ?? 'solo';
  const periode = req.query.periode ?? 'mingguan';
  if (!MODE[mode]) throw badRequest('mode harus solo, bot_mudah, atau bot_sulit');
  if (!['mingguan', 'semua'].includes(periode)) throw badRequest('periode harus mingguan atau semua');

  const sejak = periode === 'mingguan' ? awalMingguWib() : null;
  const semua = await userModel.peringkat({ ...MODE[mode], sejak, limit: 1000 });
  const saya = req.user ? semua.find((r) => r.user_id === req.user.id) ?? null : null;

  res.json({
    mode,
    periode,
    sejak: sejak?.toISOString() ?? null,
    data: semua.slice(0, 50),
    posisi_saya: saya,
  });
}
