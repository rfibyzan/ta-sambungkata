import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Bot, ChevronRight, CircleAlert, Flag, Sparkles, Trophy, WifiOff } from 'lucide-react';
import { detail, kirimKata, selesaikan } from '../api/games.js';
import { pesanError } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import LetterTile from '../components/LetterTile.jsx';
import KataSambung from '../components/KataSambung.jsx';
import StateView from '../components/StateView.jsx';
import Skeleton from '../components/Skeleton.jsx';
import KartuLawan from '../components/game/KartuLawan.jsx';
import KilatanTepi from '../components/game/KilatanTepi.jsx';
import KeyboardLayar from '../components/game/KeyboardLayar.jsx';
import { hapusHuruf, MAKS_HURUF, tambahHuruf } from '../lib/keyboardLayar.js';
import { Avatar, Sheet, Tombol } from '../components/ui.jsx';
import { jadwalTampilBot, PER_HURUF_MS } from '../lib/jadwalTampilBot.js';
import { pisahTertunda } from '../lib/rantaiTertunda.js';
import { useLayar } from '../lib/useLayar.js';

const DURASI = { solo: 60000, bot: 15000 };
const ALASAN_KALAH_MS = 1500;
const LAMA_TANDA_MERAH_MS = 1000;
const LAMA_UMPAN_MS = 3000;
const LAMA_NYALA_MS = 120;

// Ubah respons API menjadi item rantai untuk ditampilkan.
const item = (kata, pemain, extra = {}) => ({ kata: kata.kata, pemain, ...extra });

function rantaiDariDetail(d) {
  return d.rantai.map((w) => item(w.kata, w.pemain, { baru: w.baru, kunci_mati: w.kunci_mati, created_at: w.created_at }));
}

// Kata bot muncul huruf demi huruf (150 ms per huruf), lalu tampil dengan sorotan sambungan.
function KataBertahap({ kata }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= kata.length) return undefined;
    const t = setTimeout(() => setN((x) => x + 1), PER_HURUF_MS);
    return () => clearTimeout(t);
  }, [n, kata.length]);
  if (n >= kata.length) return <KataSambung kata={kata} warna="text-ink" />;
  return (
    <span className="font-head font-bold" aria-hidden="true">
      {kata.slice(0, n)}
      <span className="opacity-30">{kata.slice(n).replace(/./g, '·')}</span>
    </span>
  );
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

// potong: { detik, kunci } setelah jawaban salah di Solo; kunci baru memutar ulang "-3".
function CincinWaktu({ sisaMs, potong }) {
  const detik = Math.max(0, Math.ceil(sisaMs / 1000));
  const r = 66;
  const keliling = 2 * Math.PI * r;
  const rasio = Math.max(0, Math.min(1, sisaMs / DURASI.solo));
  return (
    <div className="relative mx-auto size-[100px] shrink-0 sm:size-[128px]" role="timer" aria-live="off" aria-label={`Sisa waktu ${detik} detik`}>
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
        <span className={`font-head text-[34px] leading-none font-extrabold sm:text-[44px] ${detik <= 10 ? 'text-accent' : ''}`}>{detik}</span>
        <span className="text-[11px] text-muted">detik</span>
      </div>
      {potong && (
        <span key={potong.kunci} aria-hidden="true" className="absolute top-3 -right-2 animate-jatuh font-head text-xl font-extrabold text-accent">
          -{potong.detik}
        </span>
      )}
    </div>
  );
}

function PilKunciMati({ poin }) {
  return <span className="inline-flex shrink-0 animate-pop items-center rounded-[6px] bg-ink px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-white">Kunci mati{poin ? ' +10' : ''}</span>;
}

function RantaiSolo({ rantai }) {
  const tampil = rantai.slice(-4);
  // Kunci memakai posisi di seluruh rantai, jadi hanya kata baru yang dipasang (dianimasikan).
  const awal = rantai.length - tampil.length;
  return (
    <section aria-label="Rantai kata" className="flex flex-col gap-2.5">
      <h2 className="font-body text-xs font-bold text-muted">Rantai kata</h2>
      <ol className="flex flex-wrap items-center gap-1.5">
        {tampil.map((w, i) => {
          const terakhir = i === tampil.length - 1;
          return (
            <li key={awal + i} className="relative flex animate-pasang items-center gap-1.5">
              <span className={`rounded-[8px] border-[1.5px] px-2 py-1.5 text-sm ${terakhir ? 'border-ink bg-surface' : 'border-line opacity-70'}`}>
                <KataSambung kata={w.kata} kepala={w.pemain !== 'sistem'} />
              </span>
              {w.kunci_mati && <PilKunciMati poin={w.pemain === 'user'} />}
              {w.poin ? (
                <span aria-hidden="true" className="pointer-events-none absolute -top-4 left-2 animate-naik-hilang font-head text-sm font-extrabold text-teal">
                  +{w.poin}
                </span>
              ) : null}
              {!terakhir && <ChevronRight size={14} className="text-muted" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RantaiBot({ rantai, user, tingkat, kurangiGerak }) {
  const ujung = useRef(null);
  useEffect(() => {
    ujung.current?.scrollIntoView({ block: 'nearest' });
  }, [rantai.length]);
  return (
    <section aria-label="Rantai kata" className="h-full overflow-y-auto rounded-[16px] border border-line bg-surface p-3">
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
            <li key={i} className={`flex items-end gap-1.5 ${saya ? 'animate-pasang justify-end' : 'justify-start'}`}>
              {!saya && <Bot size={16} className="mb-2 text-muted" aria-label={`Bot ${tingkat}`} />}
              <span className={`flex items-center gap-2 px-3 py-2 text-[15px] ${saya ? 'rounded-[14px_14px_4px_14px] bg-teal-soft' : 'rounded-[14px_14px_14px_4px] bg-bg'}`}>
                {w.bertahap && !kurangiGerak ? <KataBertahap kata={w.kata} /> : <KataSambung kata={w.kata} warna={saya ? 'text-teal' : 'text-ink'} />}
                {saya && w.poin ? <span className="text-[11px] font-bold text-teal">+{w.poin}</span> : null}
                {w.kunci_mati && <PilKunciMati poin={saya} />}
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

// Ukuran keping mengecil saat kata makin panjang supaya tetap muat satu baris di HP.
// Kartu ketik dibuat pendek supaya keyboard muat; kata panjang memakai keping paling kecil.
function ukuranKeping(jumlah) {
  if (jumlah <= 6) return { ukuran: 'md', kursor: 'h-12 w-10', celah: 'gap-1.5' };
  if (jumlah <= 9) return { ukuran: 'sm', kursor: 'h-9 w-8', celah: 'gap-1.5' };
  return { ukuran: 'sm', kecil: 'h-7 w-[22px] rounded-[6px] text-sm', kursor: 'h-7 w-[22px] rounded-[6px]', celah: 'gap-1' };
}

// Tempat mengetik: huruf yang diketik muncul sebagai keping setelah awalan, lalu keyboard aplikasi.
// Input asli tetap ada (transparan, inputMode none) untuk keyboard fisik dan pembaca layar,
// tanpa memunculkan keyboard bawaan HP.
function KepingKetik({ awalan, isian, setIsian, mengirim, goyang, inputRef, onKirim, solo, terkunci, labelKirim, menyala }) {
  const [fokus, setFokus] = useState(false);
  const huruf = [...awalan, ...isian];
  const { ukuran, kursor, celah, kecil = '' } = ukuranKeping(huruf.length + 1);
  const ketik = (fn) => {
    if (mengirim || terkunci) return;
    setIsian(fn);
  };
  return (
    <form onSubmit={onKirim} className="flex shrink-0 flex-col gap-2.5 sm:gap-3">
      <section
        aria-label="Ketik kata"
        className={`relative flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-[16px] border-2 bg-surface px-3 py-2.5 transition-colors sm:min-h-[100px] ${fokus ? 'border-ink' : 'border-line'}`}
      >
        <p className="text-xs text-muted">
          {terkunci ? (
            terkunci
          ) : (
            <>
              Ketik kata yang diawali <strong className="font-bold text-accent uppercase">{awalan}</strong>
            </>
          )}
        </p>
        <div className={`flex flex-wrap items-center justify-center ${celah} ${goyang ? 'animate-tekan' : ''}`} aria-hidden="true">
          {huruf.map((h, i) => (
            <LetterTile key={i} huruf={h} ukuran={ukuran} hot={i < awalan.length} className={`${kecil} ${i < awalan.length ? '' : 'animate-letak'}`} />
          ))}
          <span className={`inline-flex shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-line-strong ${kursor}`}>
            {fokus && <span className="h-1/2 w-0.5 animate-kursor bg-accent" />}
          </span>
        </div>
        <label htmlFor="isian-kata" className="sr-only">
          {terkunci || `Lanjutkan kata yang diawali ${awalan}. ${solo ? 'Salah jawab mengurangi waktu 3 detik.' : 'Salah jawab atau waktu habis mengurangi 1 nyawa.'}`}
        </label>
        <input
          id="isian-kata"
          ref={inputRef}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          inputMode="none"
          maxLength={MAKS_HURUF}
          value={isian}
          // readOnly, bukan disabled: input disabled kehilangan fokus dan keyboard HP tertutup
          // setiap giliran bot. Kiriman tetap diblokir di kirim() selama giliran bot.
          readOnly={mengirim || Boolean(terkunci)}
          aria-disabled={Boolean(terkunci)}
          onFocus={() => setFokus(true)}
          onBlur={() => setFokus(false)}
          onChange={(e) => setIsian(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
          className="absolute inset-0 size-full cursor-text rounded-[20px] text-base opacity-0"
        />
      </section>
      <KeyboardLayar
        onHuruf={(h) => ketik((s) => tambahHuruf(s, h))}
        onHapus={() => ketik(hapusHuruf)}
        bisaKirim={!mengirim && Boolean(isian) && !terkunci}
        labelKirim={labelKirim}
        terkunci={terkunci}
        menyala={menyala}
      />
    </form>
  );
}

function Umpan({ umpan }) {
  if (!umpan) return null;
  const gaya = {
    sukses: 'bg-teal-soft text-teal',
    salah: 'bg-accent-soft text-accent',
    info: 'bg-ink text-white',
    tunggu: 'bg-ink text-white',
  }[umpan.jenis];
  const Ikon = { sukses: Sparkles, salah: CircleAlert, info: WifiOff, tunggu: Bot }[umpan.jenis];
  return (
    <div role="status" className={`pointer-events-none absolute inset-x-2 top-2 z-10 flex animate-muncul items-start gap-2.5 rounded-[12px] px-3 py-2 shadow-[0_2px_0_var(--color-line)] ${gaya}`}>
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
  const [potong, setPotong] = useState(null);
  // Tombol keyboard layar yang menyala sesaat saat tombol fisiknya ditekan.
  const [menyala, setMenyala] = useState(null);
  const padamkan = useRef(null);
  // Giliran bot: null (giliranmu) atau { fase: 'berpikir' | 'keping' | 'alasan' | 'kalah', teks? }.
  const [statusBot, setStatusBot] = useState(null);
  // pukulan naik setiap nyawa berkurang dan memutar ulang animasinya; tandaMerah menandai kartu Kamu.
  const [pukulan, setPukulan] = useState(0);
  const [tandaMerah, setTandaMerah] = useState(false);
  const [pengumuman, setPengumuman] = useState('');
  const kurangiGerak = useLayar('(prefers-reduced-motion: reduce)');
  const offset = useRef(lokasi.state?.game ? Date.parse(lokasi.state.game.server_time) - Date.now() : 0);
  const questSelesai = useRef([]);
  const sinkronUntuk = useRef(null);
  const input = useRef(null);
  const timer = useRef([]);
  const sisa = useJam(game, offset);

  const jadwalkan = useCallback((fn, ms) => {
    timer.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timer.current.forEach(clearTimeout), []);

  // Nyawa berkurang: hati pecah, kartu bergetar, -1, dan tepi layar merah sekali.
  // Saat gerak dikurangi, bingkai merah bertahan sampai giliran berikutnya.
  const kenaPukul = useCallback(() => {
    setPukulan((n) => n + 1);
    setTandaMerah(true);
    if (!kurangiGerak) jadwalkan(() => setTandaMerah(false), LAMA_TANDA_MERAH_MS);
  }, [jadwalkan, kurangiGerak]);

  // Kata bot (dan kata acak baru setelah kunci mati) ditahan lalu ditampilkan sesuai jadwal
  // dari server. Input terkunci sampai jeda_ms habis.
  const mainkanGiliranBot = useCallback(
    (balasan) => {
      const kunciMati = balasan.kunci_mati;
      for (const { fase, mulai } of jadwalTampilBot({ ...balasan, panjang: balasan.kata.kata.length })) {
        jadwalkan(() => {
          if (fase === 'berpikir') setStatusBot({ fase });
          if (fase === 'keping') {
            setStatusBot({ fase });
            setRantai((lama) => [...lama, item(balasan.kata, 'bot', { kunci_mati: kunciMati, bertahap: true })]);
            setPengumuman(`Bot menjawab ${balasan.kata.kata}`);
          }
          if (fase === 'alasan') {
            setStatusBot({ fase, teks: 'Kunci mati, rantai diulang' });
            setRantai((lama) => [...lama, item(balasan.kata_acak_baru, 'sistem')]);
            setPengumuman(`Bot membuat kunci mati. Kata acak baru: ${balasan.kata_acak_baru.kata}`);
          }
          if (fase === 'selesai') setStatusBot(null);
        }, mulai);
      }
    },
    [jadwalkan],
  );

  // Umpan balik melayang di atas rantai, lalu hilang sendiri supaya kata terbaru terlihat lagi.
  useEffect(() => {
    if (!umpan) return undefined;
    const t = setTimeout(() => setUmpan(null), LAMA_UMPAN_MS);
    return () => clearTimeout(t);
  }, [umpan]);

  // Fokus kembali ke kolom jawaban setelah input tidak lagi terkunci (setelah render).
  useEffect(() => {
    if (!statusBot) input.current?.focus();
  }, [statusBot]);

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
      // Dimuat ulang di tengah jeda bot: kata yang waktunya belum tiba ditahan dan input terkunci.
      const sekarang = Date.parse(d.game.server_time);
      const { tampil, tertunda } = pisahTertunda(rantaiDariDetail(d), sekarang);
      setRantai(tampil);
      if (tertunda.length) {
        setStatusBot({ fase: 'berpikir' });
        const sisaJeda = Math.max(...tertunda.map((w) => Date.parse(w.created_at))) - sekarang;
        jadwalkan(() => {
          setRantai((lama) => [...lama, ...tertunda]);
          setStatusBot(null);
        }, sisaJeda);
      }
    } catch (err) {
      setErrorMuat({ pesan: pesanError(err), status: err?.response?.status });
    } finally {
      setMemuat(false);
    }
  }, [gameId, keHasil, terima, jadwalkan]);

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
          kenaPukul();
          setUmpan({ jenis: 'salah', judul: 'Waktu giliranmu habis', pesan: 'Nyawa berkurang 1. Giliranmu diulang.' });
        }
      })
      .catch(() => {
        sinkronUntuk.current = null;
      });
  }, [sisa, game, keHasil, terima, kenaPukul]);

  // Input selalu siap: jika fokus sempat pindah (mis. klik di luar kartu), ketikan huruf,
  // Backspace, atau Enter langsung diarahkan kembali ke kartu ketik.
  useEffect(() => {
    if (konfirmasi) return undefined;
    const tangkap = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/^[a-zA-Z]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Enter') return;
      setMenyala(e.key.toLowerCase());
      clearTimeout(padamkan.current);
      padamkan.current = setTimeout(() => setMenyala(null), LAMA_NYALA_MS);
      const aktif = document.activeElement;
      if (aktif === input.current || aktif?.matches?.('input, textarea, button, a, [contenteditable]')) return;
      input.current?.focus();
    };
    window.addEventListener('keydown', tangkap);
    return () => window.removeEventListener('keydown', tangkap);
  }, [konfirmasi]);

  async function kirim(e) {
    e.preventDefault();
    if (!game || mengirim || statusBot || !isian.trim()) return;
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
        if (r.penalti?.nyawa) kenaPukul();
        if (r.penalti?.detik) setPotong({ detik: r.penalti.detik, kunci: Date.now() });
        setUmpan({ jenis: 'salah', judul: r.pesan, pesan: penalti });
      } else {
        setTandaMerah(false);
        const baru = [item(r.kata, 'user', { poin: r.poin, baru: r.unlock, kunci_mati: r.kunci_mati })];
        if (r.kata_acak_baru) baru.push(item(r.kata_acak_baru, 'sistem'));
        setRantai((lama) => [...lama, ...baru]);
        if (r.balasan_bot) mainkanGiliranBot(r.balasan_bot);
        setIsian('');
        const detailPoin = [
          r.unlock && 'Kata baru masuk Kamusku',
          r.rincian.jawab_cepat && 'jawab cepat +3',
          r.kunci_mati && 'Kunci mati +10, rantai diulang',
        ].filter(Boolean);
        setUmpan({ jenis: 'sukses', judul: `"${r.kata.kata}" diterima  +${r.poin}`, pesan: detailPoin.join(', ') });
      }
      if (r.bot_menyerah) {
        // Bot kalah: alasannya tampil di kartu Bot sebentar, baru pindah ke layar hasil.
        setStatusBot({ fase: 'kalah', teks: `Tidak menemukan kata berawalan ${r.bot_kalah_awalan ?? ''}`.trim() });
        setPengumuman(`Bot kalah. Tidak menemukan kata berawalan ${r.bot_kalah_awalan ?? ''}`);
        jadwalkan(() => keHasil(r.game.id), ALASAN_KALAH_MS);
      } else if (r.selesai) {
        keHasil(r.game.id);
      }
    } catch (err) {
      // 409: kata dikirim saat bot belum selesai. Bukan jawaban salah, isian tetap disimpan.
      setUmpan(
        err?.response?.status === 409
          ? { jenis: 'tunggu', judul: 'Tunggu giliran bot selesai', pesan: 'Kata kamu belum dikirim. Coba lagi setelah bot menjawab.' }
          : { jenis: 'info', judul: 'Jawaban belum terkirim', pesan: pesanError(err) },
      );
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
  // Selama giliran bot, awalan mengikuti kata terakhir yang sudah tampil, supaya akhiran
  // kata bot tidak bocor sebelum katanya muncul.
  const awalan = statusBot ? (rantai.at(-1)?.kata.slice(-2) ?? '') : game.awalan_berikutnya;
  const detikGiliran = Math.max(0, Math.ceil((sisa ?? DURASI.bot) / 1000));
  const kritis = !solo && detikGiliran <= 5;
  const terkunci = statusBot ? (statusBot.fase === 'kalah' ? 'Game selesai' : 'Tunggu bot selesai menjawab') : null;
  const labelKirim = mengirim ? 'Mengirim...' : statusBot ? (statusBot.fase === 'kalah' ? 'Game selesai' : 'Giliran bot') : 'Kirim';

  // Setinggi layar: bagian rantai menyusut dan bergulir di dalam kotaknya, sisanya tetap terlihat.
  return (
    <div className="flex h-full flex-col gap-2.5 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] sm:gap-3 sm:px-4 sm:pt-4 sm:pb-5">
      <header className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setKonfirmasi(true)}
          aria-label="Menyerah"
          title="Menyerah"
          className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface hover:bg-bg sm:size-11"
        >
          <Flag size={18} aria-hidden="true" />
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-muted">{solo ? 'Mode Solo' : `Lawan Bot · ${game.tingkat === 'sulit' ? 'Sulit' : 'Mudah'}`}</span>
          <span className="text-sm font-semibold">{game.jumlah_kata} kata</span>
        </div>
        <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-white sm:h-11" aria-label={`Skor ${game.skor}`}>
          <Trophy size={14} className="text-gold" aria-hidden="true" />
          <span className="font-head text-[15px] font-bold">{game.skor}</span>
        </span>
      </header>

      {solo ? (
        <>
          <CincinWaktu sisaMs={sisa ?? DURASI.solo} potong={potong} />
          <div className="relative min-h-0 flex-1">
            <RantaiSolo rantai={rantai} />
            <Umpan umpan={umpan} />
          </div>
        </>
      ) : (
        <>
          {pukulan > 0 && !kurangiGerak && <KilatanTepi key={pukulan} />}
          <KartuLawan
            user={user}
            nyawa={game.nyawa}
            tingkat={game.tingkat}
            giliran={statusBot ? 'bot' : 'kamu'}
            statusBot={statusBot}
            pukulan={pukulan}
            tandaMerah={tandaMerah}
            kurangiGerak={kurangiGerak}
          />
          {statusBot ? (
            <p className="flex h-[30px] shrink-0 items-center text-[13px] font-bold text-muted">{statusBot.fase === 'kalah' ? 'Game selesai' : 'Giliran bot'}</p>
          ) : (
            <div className="flex h-[30px] shrink-0 flex-col justify-center gap-1" role="timer" aria-label={`Sisa waktu giliran ${detikGiliran} detik`}>
              <div className={`flex justify-between text-[13px] font-bold ${kritis ? 'text-accent' : ''}`}>
                <span className="text-accent">Giliranmu</span>
                <span key={kritis ? detikGiliran : 'normal'} className={`font-head ${kritis ? 'animate-denyut' : ''}`}>
                  0:{String(detikGiliran).padStart(2, '0')}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ${kritis ? 'bg-accent' : 'bg-ink'}`}
                  style={{ width: `${Math.max(0, Math.min(100, ((sisa ?? 0) / DURASI.bot) * 100))}%` }}
                />
              </div>
            </div>
          )}
          <div className="relative min-h-0 flex-1">
            <RantaiBot rantai={rantai} user={user} tingkat={game.tingkat} kurangiGerak={kurangiGerak} />
            <Umpan umpan={umpan} />
          </div>
          <p className="sr-only" aria-live="polite">
            {pengumuman}
          </p>
        </>
      )}

      <KepingKetik
        awalan={awalan}
        isian={isian}
        setIsian={setIsian}
        mengirim={mengirim}
        goyang={goyang}
        inputRef={input}
        onKirim={kirim}
        solo={solo}
        terkunci={terkunci}
        labelKirim={labelKirim}
        menyala={menyala}
      />

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
