// Uji end-to-end API terhadap database Supabase sungguhan.
// Membuat akun uji sementara, menjalankan alur utama, lalu menghapus akun itu.
// Pemakaian: node scripts/uji-e2e.js

import app from '../src/index.js';
import { supabase } from '../src/config/supabaseClient.js';

// API_URL=https://.../api untuk menguji server yang sudah di-deploy.
const server = process.env.API_URL ? null : app.listen(0);
const BASE = process.env.API_URL ?? `http://localhost:${server.address().port}/api`;
let token = null;
let gagal = 0;

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

function cek(nama, kondisi, info = '') {
  if (!kondisi) gagal++;
  console.log(`${kondisi ? 'LULUS' : 'GAGAL'}  ${nama}${info ? `  (${info})` : ''}`);
}

// Cari kata valid yang belum dipakai untuk awalan tertentu (curang lewat database, hanya untuk uji).
async function jawabanBenar(awalan, terpakai) {
  const { data } = await supabase.from('kata').select('kata').eq('awalan', awalan).limit(200);
  return data.map((k) => k.kata).find((k) => !terpakai.includes(k));
}

const akhir = Date.now().toString(36);
const akun = { username: `uji_${akhir}`, email: `uji.${akhir}@contoh.com`, password: 'rahasia123' };
let userId = null;

try {
  // Health & publik
  cek('health', (await api('GET', '/health')).status === 200);
  const daftarKata = await api('GET', '/kata?huruf=b&limit=5');
  cek('GET /kata?huruf=b', daftarKata.status === 200 && daftarKata.data.data.length === 5, `total ${daftarKata.data.meta?.total}`);
  const hariIni = await api('GET', '/kata/random');
  cek('GET /kata/random', hariIni.status === 200 && hariIni.data.kata?.contoh, hariIni.data.kata?.kata);
  cek('GET /kata/:id 404', (await api('GET', '/kata/999999')).status === 404);
  cek('validasi search', (await api('GET', '/kata?search=a1')).status === 400);

  // Auth
  cek('cek username tersedia', (await api('GET', `/auth/cek-username?username=${akun.username}`)).data.tersedia === true);
  cek('register password pendek', (await api('POST', '/auth/register', { ...akun, password: '123' })).status === 400);
  const reg = await api('POST', '/auth/register', akun);
  cek('register', reg.status === 201 && reg.data.access_token, reg.data.error);
  userId = reg.data.user?.id;
  cek('register username dobel', (await api('POST', '/auth/register', { ...akun, email: `x${akun.email}` })).status === 400);
  cek('login salah', (await api('POST', '/auth/login', { email: akun.email, password: 'salahsalah' })).status === 401);
  const log = await api('POST', '/auth/login', { email: akun.email, password: akun.password });
  cek('login', log.status === 200);
  token = log.data.access_token;
  cek('GET /auth/me', (await api('GET', '/auth/me')).data.username === akun.username);
  const ref = await api('POST', '/auth/refresh', { refresh_token: log.data.refresh_token });
  cek('refresh token', ref.status === 200 && ref.data.access_token);

  // Quest
  const quest = await api('GET', '/quests/today');
  cek('GET /quests/today', quest.status === 200 && quest.data.quests.length === 3, quest.data.quests?.map((q) => q.tipe).join(', '));

  // Game Solo
  const mulai = await api('POST', '/games', { mode: 'solo' });
  cek('POST /games solo', mulai.status === 201, mulai.data.kata_pembuka?.kata);
  const gid = mulai.data.game.id;
  const terpakai = [mulai.data.kata_pembuka.kata];
  let awalan = mulai.data.game.awalan_berikutnya;

  const salah = await api('POST', `/games/${gid}/moves`, { kata: 'zzzz' });
  cek('kata awalan salah', salah.data.valid === false && salah.data.alasan === 'awalan_salah', salah.data.pesan);
  const deadline1 = new Date(salah.data.game.deadline_at);
  cek('penalti -3 detik', new Date(mulai.data.game.deadline_at) - deadline1 === 3000);

  const tidakAda = await api('POST', `/games/${gid}/moves`, { kata: `${awalan}qqq` });
  cek('kata tidak ada di kamus', tidakAda.data.alasan === 'tidak_ada', tidakAda.data.pesan);

  let poinTotal = 0;
  for (let i = 0; i < 4; i++) {
    const kata = await jawabanBenar(awalan, terpakai);
    const r = await api('POST', `/games/${gid}/moves`, { kata });
    cek(`kata benar #${i + 1}`, r.data.valid === true, `${kata} +${r.data.poin} ${JSON.stringify(r.data.rincian)}${r.data.kunci_mati ? ' KUNCI MATI' : ''}`);
    poinTotal += r.data.poin;
    terpakai.push(kata);
    if (r.data.kata_acak_baru) terpakai.push(r.data.kata_acak_baru.kata);
    awalan = r.data.game.awalan_berikutnya;
    if (i === 0) {
      const dobel = await api('POST', `/games/${gid}/moves`, { kata: terpakai[0] });
      cek('kata sudah dipakai / awalan salah ditolak', dobel.data.valid === false, dobel.data.alasan);
    }
  }

  const selesai = await api('PUT', `/games/${gid}`, { aksi: 'selesai' });
  cek('PUT /games/:id selesai', selesai.data.game.status === 'selesai' && selesai.data.game.skor === poinTotal, `skor ${selesai.data.game.skor}`);
  cek('rincian skor konsisten', Object.values(selesai.data.rincian_skor).reduce((n, r) => n + r.poin, 0) === poinTotal);
  cek('kirim setelah selesai ditolak', (await api('POST', `/games/${gid}/moves`, { kata: 'buku' })).status === 400);

  // Game Bot
  const bot = await api('POST', '/games', { mode: 'bot', tingkat: 'mudah' });
  cek('POST /games bot', bot.status === 201 && bot.data.game.nyawa === 3);
  const bid = bot.data.game.id;
  const terpakaiBot = [bot.data.kata_pembuka.kata];
  let aw = bot.data.game.awalan_berikutnya;
  let menang = false;
  // Server menolak kiriman selama kata bot belum selesai tampil (409), jadi tunggu jeda_ms dulu.
  let jedaBot = 0;
  const tungguBot = () => new Promise((r) => setTimeout(r, jedaBot ? jedaBot + 300 : 0));
  for (let i = 0; i < 40 && !menang; i++) {
    const kata = await jawabanBenar(aw, terpakaiBot);
    await tungguBot();
    const r = await api('POST', `/games/${bid}/moves`, { kata });
    if (!r.data.valid) { cek('bot: jawaban valid', false, `${kata} ${r.data.pesan}`); break; }
    terpakaiBot.push(kata);
    if (r.data.kata_acak_baru) terpakaiBot.push(r.data.kata_acak_baru.kata);
    if (r.data.balasan_bot) {
      terpakaiBot.push(r.data.balasan_bot.kata.kata);
      if (r.data.balasan_bot.kata_acak_baru) terpakaiBot.push(r.data.balasan_bot.kata_acak_baru.kata);
    }
    jedaBot = r.data.balasan_bot?.jeda_ms ?? 0;
    if (i === 0) {
      cek('bot membalas', Boolean(r.data.balasan_bot), `${r.data.balasan_bot?.kata?.kata}, jeda ${jedaBot} ms`);
      // Kiriman langsung saat bot masih "berpikir": ditolak tanpa penalti nyawa.
      if (jedaBot) {
        const terlaluCepat = await api('POST', `/games/${bid}/moves`, { kata: 'xxxx' });
        cek('bot: kirim selama jeda ditolak 409', terlaluCepat.status === 409, terlaluCepat.data.error);
      }
    }
    if (r.data.bot_menyerah) { menang = true; cek('bot kehabisan kata, pemain menang', r.data.game.status === 'menang', `setelah ${i + 1} giliran, skor ${r.data.game.skor}`); }
    aw = r.data.game.awalan_berikutnya;
  }
  if (!menang) {
    await tungguBot();
    const salahBot = await api('POST', `/games/${bid}/moves`, { kata: 'xxxx' });
    cek('bot: salah mengurangi nyawa', salahBot.data.game.nyawa === 2);
    const nyerah = await api('PUT', `/games/${bid}`, { aksi: 'menyerah' });
    cek('bot: menyerah = kalah', nyerah.data.game.status === 'kalah');
  }

  // Riwayat, kamus, leaderboard, profil
  const riw = await api('GET', '/games');
  cek('GET /games riwayat', riw.data.data.length === 2);
  const det = await api('GET', `/games/${gid}`);
  cek('GET /games/:id rantai', det.data.rantai.length >= 5, det.data.rantai.map((w) => `${w.pemain[0]}:${w.kata.kata}`).join(' > '));

  const kamus = await api('GET', `/users/${userId}/kamus?huruf=${terpakai[1][0]}&limit=10`);
  cek('GET kamus per huruf', kamus.status === 200, `terkumpul ${kamus.data.progres?.terkumpul}, ${JSON.stringify(kamus.data.data?.[0])}`);
  const cari = await api('GET', `/users/${userId}/kamus?search=${terpakai[1]}`);
  cek('cari di kamus', cari.data.data?.[0]?.kata === terpakai[1]);
  const idKata = cari.data.data?.[0]?.id;
  const detKamus = await api('GET', `/users/${userId}/kamus/${idKata}`);
  cek('detail kata di kamus', detKamus.data.jumlah_dipakai === 1 && detKamus.data.sambungan, `sambungan ${detKamus.data.sambungan?.awalan}: ${detKamus.data.sambungan?.kata.length} kata`);
  cek('kamus orang lain 403', (await api('GET', '/users/00000000-0000-0000-0000-000000000000/kamus')).status === 403);

  const lb = await api('GET', '/leaderboard?mode=solo&periode=mingguan');
  cek('leaderboard + posisi_saya', lb.status === 200 && lb.data.posisi_saya?.username === akun.username, `peringkat ${lb.data.posisi_saya?.peringkat}`);
  cek('leaderboard mode salah', (await api('GET', '/leaderboard?mode=abc')).status === 400);

  const prof = await api('GET', `/users/${userId}`);
  cek('GET /users/:id statistik', prof.data.statistik?.jumlah_game === 2, JSON.stringify(prof.data.statistik?.skor_tertinggi));
  const ubah = await api('PUT', `/users/${userId}`, { username: `${akun.username}_x` });
  cek('PUT /users/:id username', ubah.data.username === `${akun.username}_x`);
  cek('PUT user lain 403', (await api('PUT', '/users/00000000-0000-0000-0000-000000000000', { username: 'abc' })).status === 403);
  cek('id tidak valid 404', (await api('GET', '/users/bukan-uuid')).status === 404);

  const q2 = await api('GET', '/quests/today');
  console.log('      progres quest:', q2.data.quests.map((q) => `${q.judul} ${q.progres}/${q.target}${q.selesai ? ' selesai' : ''}`).join(' | '));
  const selesaiQ = q2.data.quests.find((q) => q.selesai && !q.diklaim);
  if (selesaiQ) {
    const kl = await api('POST', `/quests/${selesaiQ.id}/claim`);
    cek('klaim quest', kl.status === 200 && kl.data.xp === selesaiQ.hadiah_xp, JSON.stringify(kl.data));
    cek('klaim ganda ditolak', (await api('POST', `/quests/${selesaiQ.id}/claim`)).status === 400);
  }
  const belum = q2.data.quests.find((q) => !q.selesai);
  if (belum) cek('klaim quest belum selesai ditolak', (await api('POST', `/quests/${belum.id}/claim`)).status === 400);
  const dq = await api('GET', `/quests/${q2.data.quests[0].id}`);
  cek('GET /quests/:id', dq.status === 200, `kata_terhitung ${dq.data.kata_terhitung?.length}`);

  cek('DELETE /games/:id', (await api('DELETE', `/games/${gid}`)).status === 200);
  cek('game terhapus 404', (await api('GET', `/games/${gid}`)).status === 404);
  token = 'token-palsu';
  cek('token palsu 401', (await api('GET', '/auth/me')).status === 401);
} catch (err) {
  gagal++;
  console.error('ERROR', err);
} finally {
  if (userId) await supabase.auth.admin.deleteUser(userId);
  server?.close();
  console.log(gagal ? `\n${gagal} uji gagal` : '\nSemua uji lulus');
  process.exit(gagal ? 1 : 0);
}
