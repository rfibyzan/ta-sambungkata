import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookPlus, RotateCcw, Target, Trophy, X } from 'lucide-react';
import { detail, mulai } from '../api/games.js';
import { pesanError } from '../api/axios.js';
import { useMuat } from '../lib/useMuat.js';
import { labelMode } from '../lib/format.js';
import { nilaiHitung } from '../lib/hitungNaik.js';
import { useLayar } from '../lib/useLayar.js';
import StateView from '../components/StateView.jsx';
import RincianSkor from '../components/RincianSkor.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { Pil, TombolIkon, Tombol } from '../components/ui.jsx';

const DURASI_HITUNG = 700;
const MAKS_BERGILIR = 12;

// Skor dihitung naik sekali saat layar hasil tampil. Di mode kurangi gerak langsung angka akhir.
function SkorNaik({ skor }) {
  const kurangiGerak = useLayar('(prefers-reduced-motion: reduce)');
  const [tampil, setTampil] = useState(kurangiGerak ? skor : 0);
  useEffect(() => {
    if (kurangiGerak) return undefined;
    let id;
    const mulai = performance.now();
    const langkah = (t) => {
      const p = (t - mulai) / DURASI_HITUNG;
      setTampil(nilaiHitung(skor, p));
      if (p < 1) id = requestAnimationFrame(langkah);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [skor, kurangiGerak]);
  return (
    <p className="font-head text-7xl leading-none font-extrabold tabular-nums">
      <span aria-hidden="true">{kurangiGerak ? skor : tampil}</span>
      <span className="sr-only">{skor}</span>
    </p>
  );
}


function judulStatus(game) {
  if (game.status === 'menang') return { teks: `Menang lawan ${labelMode(game.mode, game.tingkat)}`, gaya: 'bg-teal-soft text-teal' };
  if (game.status === 'kalah') return { teks: `Kalah dari ${labelMode(game.mode, game.tingkat)}`, gaya: 'bg-accent-soft text-accent' };
  return { teks: 'Mode Solo selesai', gaya: 'bg-teal-soft text-teal' };
}

export default function HasilGame() {
  const { gameId } = useParams();
  const lokasi = useLocation();
  const navigate = useNavigate();
  const { data, error, memuat, ulang } = useMuat(() => detail(gameId), [gameId]);
  const [memulai, setMemulai] = useState(false);
  const [errorMulai, setErrorMulai] = useState(null);
  const questSelesai = lokasi.state?.quest_selesai ?? [];

  async function mainLagi() {
    setMemulai(true);
    setErrorMulai(null);
    try {
      const g = data.game;
      const hasil = await mulai(g.mode === 'solo' ? { mode: 'solo' } : { mode: 'bot', tingkat: g.tingkat });
      navigate(`/main/${hasil.game.id}`, { state: hasil, replace: true });
    } catch (err) {
      setErrorMulai(pesanError(err));
      setMemulai(false);
    }
  }

  if (memuat) {
    return (
      <div className="flex flex-col items-center gap-5 pt-10" aria-busy="true" aria-label="Memuat hasil">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-32" />
        <Skeleton className="h-56 w-full rounded-[14px]" />
      </div>
    );
  }
  if (error) {
    return error.status === 404 || error.status === 403 ? (
      <StateView keping="404" hot={0} judul="Hasil game tidak ditemukan" pesan="Game ini mungkin sudah dihapus." aksi={{ label: 'Pilih mode', ke: '/main', gelap: true }} />
    ) : (
      <StateView keping="OFF" hot={1} judul="Hasil belum bisa dimuat" pesan={error.pesan} aksi={{ label: 'Coba lagi', onClick: ulang, gelap: true, error: true }} />
    );
  }

  const { game, rincian_skor: rincian, rantai } = data;
  const status = judulStatus(game);
  const kataBaru = rantai.filter((w) => w.pemain === 'user' && w.baru);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <TombolIkon ikon={X} label="Tutup, kembali ke beranda" ke="/" />
      </div>

      <section className="flex flex-col items-center gap-2.5 py-2 text-center">
        <Pil className={`gap-1.5 rounded-full px-3.5 py-1.5 text-xs ${status.gaya}`}>
          <Trophy size={14} aria-hidden="true" /> {status.teks}
        </Pil>
        <h1 className="text-sm font-medium text-muted">Skor</h1>
        <SkorNaik skor={game.skor} />
        <p className="text-xs text-muted">{game.jumlah_kata} kata dijawab</p>
      </section>

      <RincianSkor rincian={rincian} mode={game.mode} />

      {kataBaru.length > 0 && (
        <section aria-labelledby="judul-kata-baru" className="flex flex-col gap-2.5">
          <h2 id="judul-kata-baru" className="flex items-center gap-1.5 font-body text-sm font-bold">
            <BookPlus size={16} className="text-teal" aria-hidden="true" /> {kataBaru.length} kata baru masuk Kamusku
          </h2>
          <ul className="grid grid-cols-3 gap-2">
            {kataBaru.map((w, i) => (
              <li key={w.kata.id} className="animate-pasang" style={{ animationDelay: `${300 + Math.min(i, MAKS_BERGILIR) * 60}ms` }}>
                <Link
                  to={`/kamus/${w.kata.id}`}
                  className="flex h-11 items-center justify-center rounded-[10px] border-[1.5px] border-gold bg-surface font-head text-sm font-bold hover:bg-bg"
                >
                  {w.kata.kata}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {questSelesai.length > 0 && (
        <ul className="flex flex-col gap-2">
          {questSelesai.map((q) => (
            <li key={q.id} className="flex items-center gap-2.5 rounded-[14px] bg-ink px-3.5 py-3 text-white">
              <Target size={18} className="shrink-0 text-gold" aria-hidden="true" />
              <span className="flex-1 text-[13px] font-semibold">Quest "{q.judul}" selesai</span>
              <Link to="/quest" className="flex h-11 items-center font-head text-[13px] font-bold text-gold hover:underline">
                Klaim +{q.hadiah_xp} XP
              </Link>
            </li>
          ))}
        </ul>
      )}

      {errorMulai && (
        <p role="alert" className="rounded-[10px] bg-accent-soft px-3 py-2.5 text-[13px] font-semibold text-accent">
          {errorMulai}
        </p>
      )}
      <div className="flex gap-2.5">
        <Link
          to={`/riwayat/${game.id}`}
          className="inline-flex h-13 flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-ink font-head text-[15px] font-bold hover:bg-surface"
        >
          Lihat rantai
        </Link>
        <Tombol varian="accent" onClick={mainLagi} disabled={memulai} className="flex-1">
          <RotateCcw size={16} aria-hidden="true" /> {memulai ? 'Menyiapkan...' : 'Main lagi'}
        </Tombol>
      </div>
    </div>
  );
}
