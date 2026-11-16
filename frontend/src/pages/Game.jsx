import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowUp, Bot, ChevronRight, CircleAlert, Flag, Heart, HeartOff, Sparkles, Trophy, WifiOff } from 'lucide-react';
import { detail, kirimKata, selesaikan } from '../api/games.js';
import { pesanError } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import LetterTile from '../components/LetterTile.jsx';
import KataSambung from '../components/KataSambung.jsx';
import StateView from '../components/StateView.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { Avatar, Sheet, Tombol } from '../components/ui.jsx';

const DURASI = { solo: 60000, bot: 15000 };

// Ubah respons API menjadi item rantai untuk ditampilkan.
const item = (kata, pemain, extra = {}) => ({ kata: kata.kata, pemain, ...extra });

function rantaiDariDetail(d) {
  return d.rantai.map((w) => item(w.kata, w.pemain, { baru: w.baru, kunci_mati: w.kunci_mati }));
}

function useJam(game, offset) {
  const [sisa, setSisa] = useState(null);
  useEffect(() => {
    if (!game?.deadline_at || game.status !== 'berjalan') return undefined;
    const hitung = () => setSisa(new Date(game.deadline_at).getTime() - (Date.now() + offset.current));
    hitung();
    const t = setInterval(hitung, 200);
    return () => clearInterval(t);
  }, [game?.deadline_at, game?.status, offset]);
  return sisa;
}

function CincinWaktu({ sisaMs }) {
  const detik = Math.max(0, Math.ceil(sisaMs / 1000));
  const r = 66;
  const keliling = 2 * Math.PI * r;
  const rasio = Math.max(0, Math.min(1, sisaMs / DURASI.solo));
  return (
    <div className="relative mx-auto size-[150px]" role="timer" aria-live="off" aria-label={`Sisa waktu ${detik} detik`}>
      <svg viewBox="0 0 150 150" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="75" cy="75" r={r} fill="none" strokeWidth="9" className="stroke-line" />
        <circle
          cx="75"
          cy="75"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={keliling}
          strokeDashoffset={keliling * (1 - rasio)}
          className={`transition-[stroke-dashoffset] duration-200 ${detik <= 10 ? 'stroke-accent' : 'stroke-ink'}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-head text-[52px] leading-none font-extrabold ${detik <= 10 ? 'text-accent' : ''}`}>{detik}</span>
        <span className="text-xs text-muted">detik</span>
      </div>
    </div>
  );
}

function Nyawa({ jumlah, label }) {
  return (
    <span className="flex gap-0.5" aria-label={`${label}: ${jumlah} dari 3 nyawa`}>
      {[0, 1, 2].map((i) =>
        i < jumlah ? <Heart key={i} size={14} className="text-accent" aria-hidden="true" /> : <HeartOff key={i} size={14} className="text-muted" aria-hidden="true" />,
      )}
    </span>
  );
}

function RantaiSolo({ rantai }) {
  const tampil = rantai.slice(-4);
  return (
    <section aria-label="Rantai kata" className="flex flex-col gap-2.5">
      <h2 className="font-body text-xs font-bold text-muted">Rantai kata</h2>
      <ol className="flex flex-wrap items-center gap-1.5">
        {tampil.map((w, i) => {
          const terakhir = i === tampil.length - 1;
          return (
            <li key={`${w.kata}-${i}`} className="flex items-center gap-1.5">
              <span className={`rounded-[8px] border-[1.5px] px-2 py-1.5 text-sm ${terakhir ? 'border-ink bg-surface' : 'border-line opacity-70'}`}>
                <KataSambung kata={w.kata} kepala={w.pemain !== 'sistem'} />
              </span>
              {!terakhir && <ChevronRight size={14} className="text-muted" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RantaiBot({ rantai, user, tingkat }) {
  const ujung = useRef(null);
  useEffect(() => {
    ujung.current?.scrollIntoView({ block: 'nearest' });
  }, [rantai.length]);
  return (
    <section aria-label="Rantai kata" className="max-h-[260px] overflow-y-auto rounded-[20px] border border-line bg-surface p-3.5">
      <ol className="flex flex-col gap-2">
        {rantai.map((w, i) => {
          if (w.pemain === 'sistem') {
            return (
              <li key={i} className="flex justify-center">
                <span className="rounded-full bg-bg px-3 py-1 text-xs text-muted">
                  {i === 0 ? 'Kata pembuka' : 'Kata acak baru'}: <KataSambung kata={w.kata} kepala={false} className="text-xs" />
                </span>
              </li>
            );
          }
          const saya = w.pemain === 'user';
          return (
            <li key={i} className={`flex items-end gap-1.5 ${saya ? 'justify-end' : 'justify-start'}`}>
              {!saya && <Bot size={16} className="mb-2 text-muted" aria-label={`Bot ${tingkat}`} />}
              <span className={`flex items-center gap-2 px-3 py-2 text-[15px] ${saya ? 'rounded-[14px_14px_4px_14px] bg-teal-soft' : 'rounded-[14px_14px_14px_4px] bg-bg'}`}>
                <KataSambung kata={w.kata} warna={saya ? 'text-teal' : 'text-ink'} />
                {saya && w.poin ? <span className="text-[11px] font-bold text-teal">+{w.poin}</span> : null}
              </span>
              {saya && <Avatar user={user} ukuran={22} className="mb-1" />}
            </li>
          );
        })}
      </ol>
      <div ref={ujung} />
    </section>
  );
}

function Umpan({ umpan }) {
  if (!umpan) return null;
  const gaya = {
    sukses: 'bg-teal-soft text-teal',
    salah: 'bg-accent-soft text-accent',
    info: 'bg-ink text-white',
  }[umpan.jenis];
  const Ikon = { sukses: Sparkles, salah: CircleAlert, info: WifiOff }[umpan.jenis];
  return (
    <div role="status" className={`flex animate-muncul items-start gap-2.5 rounded-[14px] px-3.5 py-2.5 ${gaya}`}>
      <Ikon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="font-head text-sm font-bold">{umpan.judul}</p>
        {umpan.pesan && <p className="text-xs">{umpan.pesan}</p>}
      </div>
      {umpan.aksi}
    </div>
  );
}

export default function Game() {
  const { gameId } = useParams();
  const lokasi = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState(lokasi.state?.game ?? null);
  const [rantai, setRantai] = useState(() =>
    lokasi.state?.kata_pembuka ? [item(lokasi.state.kata_pembuka, 'sistem')] : [],
  );
  const [memuat, setMemuat] = useState(!lokasi.state?.game);
  const [errorMuat, setErrorMuat] = useState(null);
  const [isian, setIsian] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [umpan, setUmpan] = useState(null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [goyang, setGoyang] = useState(false);
  const offset = useRef(lokasi.state?.game ? Date.parse(lokasi.state.game.server_time) - Date.now() : 0);
  const questSelesai = useRef([]);
  const sinkronUntuk = useRef(null);
  const input = useRef(null);
  const sisa = useJam(game, offset);

  const terima = useCallback((g) => {
    offset.current = Date.parse(g.server_time) - Date.now();
    setGame(g);
  }, []);

  const keHasil = useCallback(
    (id) => navigate(`/main/hasil/${id}`, { replace: true, state: { quest_selesai: questSelesai.current } }),
    [navigate],
  );

  // Data dari halaman Pilih Mode hanya untuk tampilan pertama. Kondisi asli selalu diambil
  // dari server, karena state navigasi ikut tersimpan saat halaman di-reload.
  const muat = useCallback(async (diam = false) => {
    if (!diam) setMemuat(true);
    setErrorMuat(null);
    try {
      const d = await detail(gameId);
      questSelesai.current.push(...(d.quest_selesai ?? []));
      if (d.game.status !== 'berjalan') return keHasil(d.game.id);
      terima(d.game);
      setRantai(rantaiDariDetail(d));
    } catch (err) {
      setErrorMuat({ pesan: pesanError(err), status: err?.response?.status });
    } finally {
      setMemuat(false);
    }
  }, [gameId, keHasil, terima]);

  useEffect(() => {
    muat(Boolean(lokasi.state?.game));
    // Hanya saat pertama dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Waktu habis: tanya server (server yang memutuskan, bukan jam di browser).
  useEffect(() => {
    if (sisa == null || sisa > 0 || !game || game.status !== 'berjalan') return;
    if (sinkronUntuk.current === game.deadline_at) return;
    sinkronUntuk.current = game.deadline_at;
    detail(game.id)
      .then((d) => {
        questSelesai.current.push(...(d.quest_selesai ?? []));
        if (d.game.status !== 'berjalan') return keHasil(d.game.id);
        // Server memberi toleransi jaringan, jadi bisa saja belum dianggap habis. Tanya lagi sebentar lagi.
        if (d.game.deadline_at === game.deadline_at) {
          setTimeout(() => {
            sinkronUntuk.current = null;
          }, 800);
          return;
        }
        terima(d.game);
        if (game.mode === 'bot' && d.game.nyawa < game.nyawa) {
          setUmpan({ jenis: 'salah', judul: 'Waktu giliranmu habis', pesan: 'Nyawa berkurang 1. Giliranmu diulang.' });
        }
      })
      .catch(() => {
        sinkronUntuk.current = null;
      });
  }, [sisa, game, keHasil, terima]);

  async function kirim(e) {
    e.preventDefault();
    if (!game || mengirim || !isian.trim()) return;
    const kata = `${game.awalan_berikutnya}${isian.trim().toLowerCase()}`;
    setMengirim(true);
    try {
      const r = await kirimKata(game.id, kata);
      questSelesai.current.push(...(r.quest_selesai ?? []));
      terima(r.game);
      if (!r.valid) {
        setGoyang(true);
        setTimeout(() => setGoyang(false), 300);
        const penalti = r.penalti?.detik ? `Waktu berkurang ${r.penalti.detik} detik.` : r.penalti?.nyawa ? 'Nyawa berkurang 1.' : '';
        setUmpan({ jenis: 'salah', judul: r.pesan, pesan: penalti });
      } else {
        const baru = [item(r.kata, 'user', { poin: r.poin, baru: r.unlock, kunci_mati: r.kunci_mati })];
        if (r.kata_acak_baru) baru.push(item(r.kata_acak_baru, 'sistem'));
        if (r.balasan_bot) {
          baru.push(item(r.balasan_bot.kata, 'bot', { kunci_mati: r.balasan_bot.kunci_mati }));
          if (r.balasan_bot.kata_acak_baru) baru.push(item(r.balasan_bot.kata_acak_baru, 'sistem'));
        }
        setRantai((lama) => [...lama, ...baru]);
        setIsian('');
        const detailPoin = [
          r.unlock && 'Kata baru masuk Kamusku',
          r.rincian.jawab_cepat && 'jawab cepat +3',
          r.kunci_mati && 'Kunci mati +10, rantai diulang',
          r.balasan_bot?.kunci_mati && 'Bot membuat kunci mati, rantai diulang',
        ].filter(Boolean);
        setUmpan({ jenis: 'sukses', judul: `"${r.kata.kata}" diterima  +${r.poin}`, pesan: detailPoin.join(', ') });
      }
      if (r.selesai) keHasil(r.game.id);
    } catch (err) {
      setUmpan({
        jenis: 'info',
        judul: 'Jawaban belum terkirim',
        pesan: pesanError(err),
      });
    } finally {
      setMengirim(false);
      input.current?.focus();
    }
  }

  async function menyerah() {
    setKonfirmasi(false);
    try {
      const r = await selesaikan(game.id, 'menyerah');
      questSelesai.current.push(...(r.quest_selesai ?? []));
      keHasil(game.id);
    } catch (err) {
      setUmpan({ jenis: 'info', judul: 'Gagal menyerah', pesan: pesanError(err) });
    }
  }

  if (memuat) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Memuat game">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="mx-auto size-[150px] rounded-full" />
        <Skeleton className="h-32 w-full rounded-[20px]" />
      </div>
    );
  }
  if (errorMuat) {
    return errorMuat.status === 404 || errorMuat.status === 403 ? (
      <StateView keping="404" hot={0} judul="Game tidak ditemukan" pesan="Game ini mungkin sudah dihapus atau milik pemain lain." aksi={{ label: 'Pilih mode', ke: '/main', gelap: true }} />
    ) : (
      <StateView keping="OFF" hot={1} judul="Game belum bisa dimuat" pesan={errorMuat.pesan} aksi={{ label: 'Coba lagi', onClick: () => muat(), gelap: true, error: true }} />
    );
  }
  if (!game) return null;

  const solo = game.mode === 'solo';
  const awalan = game.awalan_berikutnya;
  const detikGiliran = Math.max(0, Math.ceil((sisa ?? DURASI.bot) / 1000));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setKonfirmasi(true)}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-bold hover:bg-bg"
        >
          <Flag size={16} aria-hidden="true" /> Menyerah
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-muted">{solo ? 'Mode Solo' : `Lawan Bot · ${game.tingkat === 'sulit' ? 'Sulit' : 'Mudah'}`}</span>
          <span className="text-sm font-semibold">{game.jumlah_kata} kata</span>
        </div>
        <span className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-3.5 text-white" aria-label={`Skor ${game.skor}`}>
          <Trophy size={14} className="text-gold" aria-hidden="true" />
          <span className="font-head text-[15px] font-bold">{game.skor}</span>
        </span>
      </header>

      {solo ? (
        <>
          <CincinWaktu sisaMs={sisa ?? DURASI.solo} />
          <RantaiSolo rantai={rantai} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex flex-1 items-center gap-2.5 rounded-[14px] border-2 border-ink bg-surface p-3">
              <Avatar user={user} ukuran={36} />
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-bold">Kamu</span>
                <Nyawa jumlah={game.nyawa} label="Kamu" />
              </div>
            </div>
            <span className="font-head text-sm font-extrabold text-muted">VS</span>
            <div className="flex flex-1 items-center gap-2.5 rounded-[14px] border border-line bg-transparent p-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
                <Bot size={18} />
              </span>
              <span className="text-[13px] font-bold">Bot {game.tingkat === 'sulit' ? 'Sulit' : 'Mudah'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5" role="timer" aria-label={`Sisa waktu giliran ${detikGiliran} detik`}>
            <div className="flex justify-between text-[13px] font-bold">
              <span className="text-accent">Giliranmu</span>
              <span className="font-head">0:{String(detikGiliran).padStart(2, '0')}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${Math.max(0, Math.min(100, ((sisa ?? 0) / DURASI.bot) * 100))}%` }} />
            </div>
          </div>
          <RantaiBot rantai={rantai} user={user} tingkat={game.tingkat} />
        </>
      )}

      <section aria-label="Awalan yang harus disambung" className="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-5">
        <p className="text-[13px] text-muted">Kata berikutnya diawali</p>
        <div className="flex items-center gap-2" role="img" aria-label={awalan}>
          {[...awalan].map((h, i) => (
            <LetterTile key={i} huruf={h} ukuran="lg" hot />
          ))}
          <span className="ml-1 h-1 w-7 rounded-full bg-line" aria-hidden="true" />
          <span className="h-1 w-7 rounded-full bg-line" aria-hidden="true" />
        </div>
      </section>

      <Umpan umpan={umpan} />

      <form onSubmit={kirim} className="flex items-center gap-2.5">
        <label htmlFor="isian-kata" className="sr-only">
          Lanjutkan kata yang diawali {awalan}
        </label>
        <div
          className={`flex h-14 flex-1 items-center rounded-[14px] border-2 border-ink bg-surface px-4 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ink ${goyang ? 'animate-[tekan_150ms]' : ''}`}
        >
          <span className="font-head text-xl font-bold text-accent" aria-hidden="true">
            {awalan}
          </span>
          <input
            id="isian-kata"
            ref={input}
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            value={isian}
            onChange={(e) => setIsian(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
            disabled={mengirim}
            className="min-w-0 flex-1 bg-transparent font-head text-xl font-bold outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={mengirim || !isian}
          aria-label="Kirim kata"
          className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-ink text-white hover:bg-ink/90 active:translate-y-px disabled:opacity-40"
        >
          <ArrowUp size={24} aria-hidden="true" />
        </button>
      </form>
      <p className="text-center text-xs text-muted">
        {solo ? 'Salah jawab mengurangi waktu 3 detik' : 'Salah jawab atau waktu habis mengurangi 1 nyawa'}
      </p>

      <Sheet
        terbuka={konfirmasi}
        onTutup={() => setKonfirmasi(false)}
        ikon={Flag}
        judul="Menyerah dari game ini?"
        pesan={
          solo
            ? `Game selesai sekarang dan skor ${game.skor} tetap tersimpan. Kata yang sudah ter-unlock tetap masuk Kamusku.`
            : 'Game dihitung kalah. Kata yang sudah ter-unlock tetap masuk Kamusku.'
        }
      >
        <Tombol onClick={() => setKonfirmasi(false)} className="w-full">
          Lanjut main
        </Tombol>
        <Tombol varian="garisBahaya" onClick={menyerah} className="w-full">
          Ya, menyerah
        </Tombol>
      </Sheet>
    </div>
  );
}
