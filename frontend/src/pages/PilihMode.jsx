import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, ChevronRight, Heart, History, Play, Timer } from 'lucide-react';
import { mulai } from '../api/games.js';
import { pesanError } from '../api/axios.js';
import { profil } from '../api/users.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useMuat } from '../lib/useMuat.js';
import KataSambung from '../components/KataSambung.jsx';
import LetterTile from '../components/LetterTile.jsx';
import Skeleton from '../components/Skeleton.jsx';
import SkorPerMode from '../components/SkorPerMode.jsx';
import { JudulHalaman } from '../components/ui.jsx';

const ATURAN = [
  'Kata berikutnya diawali 2 huruf terakhir kata sebelumnya.',
  'Kata harus ada di kamus, minimal 3 huruf, tidak boleh diulang.',
  'Kata baru +5, jawab di bawah 5 detik +3, kunci mati +10.',
];

function LinkRiwayat() {
  return (
    <Link to="/riwayat" className="flex h-11 items-center justify-between px-1 text-[13px] font-semibold text-teal hover:underline">
      <span className="flex items-center gap-2">
        <History size={16} aria-hidden="true" /> Lihat riwayat permainan
      </span>
      <ChevronRight size={16} aria-hidden="true" />
    </Link>
  );
}

export default function PilihMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tingkat, setTingkat] = useState('mudah');
  const [memulai, setMemulai] = useState(null);
  const [error, setError] = useState(null);
  // Statistik hanya pelengkap: kalau gagal, kartu skor disembunyikan dan tombol main tetap jalan.
  const statistik = useMuat(() => profil(user.id), [user.id]);
  const skor = statistik.data?.statistik?.skor_tertinggi;

  async function main(mode) {
    setMemulai(mode);
    setError(null);
    try {
      const hasil = await mulai(mode === 'solo' ? { mode } : { mode, tingkat });
      navigate(`/main/${hasil.game.id}`, { state: hasil });
    } catch (err) {
      setError(pesanError(err));
      setMemulai(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <JudulHalaman>Mau main apa?</JudulHalaman>
        <p className="text-sm text-muted">Sambung kata dari 2 huruf terakhir kata sebelumnya.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-[10px] bg-accent-soft px-3 py-2.5 text-[13px] font-semibold text-accent">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="judul-solo" className="flex flex-col gap-3.5 rounded-[20px] bg-accent p-5 text-white shadow-[0_4px_0_var(--color-accent-shadow)]">
          <span className="flex size-11 items-center justify-center rounded-[10px] bg-white/20" aria-hidden="true">
            <Timer size={22} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id="judul-solo" className="text-2xl">
              Solo
            </h2>
            <p className="text-[13px] leading-relaxed">60 detik, sambung sebanyak mungkin. Salah jawab -3 detik.</p>
            <p className="text-[13px] leading-relaxed">Kejar skor tertinggi di papan peringkat Solo.</p>
          </div>
          <button
            type="button"
            onClick={() => main('solo')}
            disabled={Boolean(memulai)}
            className="mt-auto flex h-12 items-center justify-center gap-2 rounded-[14px] bg-white font-head text-[15px] font-bold text-accent hover:bg-white/90 active:translate-y-px disabled:opacity-70"
          >
            {memulai === 'solo' ? 'Menyiapkan...' : 'Mulai solo'}
            <Play size={16} aria-hidden="true" />
          </button>
        </section>

        <section aria-labelledby="judul-bot" className="flex flex-col gap-3.5 rounded-[20px] bg-ink p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-[10px] bg-white/10 text-gold" aria-hidden="true">
              <Bot size={22} />
            </span>
            <span className="flex gap-0.5 text-accent-soft" role="img" aria-label="3 nyawa">
              {[0, 1, 2].map((i) => (
                <Heart key={i} size={16} aria-hidden="true" />
              ))}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h2 id="judul-bot" className="text-2xl">
              Lawan Bot
            </h2>
            <p className="text-[13px] leading-relaxed text-white/80">Bergantian 15 detik per giliran. Kamu punya 3 nyawa.</p>
          </div>
          <div role="radiogroup" aria-label="Tingkat bot" className="flex gap-2">
            {[
              ['mudah', 'Mudah', 'kata pendek dan umum'],
              ['sulit', 'Sulit', 'bot cari jalan buntu'],
            ].map(([k, label, ket]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={tingkat === k}
                onClick={() => setTingkat(k)}
                className={`flex flex-1 flex-col gap-0.5 rounded-[10px] p-3 text-left transition-colors ${
                  tingkat === k ? 'bg-white text-ink' : 'border border-white/30 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="font-head text-[15px] font-bold">{label}</span>
                <span className={`text-[11px] ${tingkat === k ? 'text-muted' : 'text-white/75'}`}>{ket}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => main('bot')}
            disabled={Boolean(memulai)}
            className="mt-auto flex h-12 items-center justify-center gap-2 rounded-[14px] bg-gold font-head text-[15px] font-bold text-ink hover:brightness-105 active:translate-y-px disabled:opacity-70"
          >
            {memulai === 'bot' ? 'Menyiapkan...' : 'Mulai lawan bot'}
            <Play size={16} aria-hidden="true" />
          </button>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {statistik.memuat ? (
          <Skeleton className="h-56 rounded-[14px]" />
        ) : (
          skor && (
            <section aria-labelledby="judul-skor" className="flex flex-col gap-3.5 rounded-[14px] border border-line bg-surface p-5">
              <div className="flex flex-col gap-0.5">
                <h2 id="judul-skor" className="text-[17px]">
                  Skor terbaikmu
                </h2>
                <p className="text-xs text-muted">dari semua game yang sudah selesai</p>
              </div>
              <SkorPerMode skor={skor} />
              <LinkRiwayat />
            </section>
          )
        )}

        <section aria-labelledby="judul-cara" className="flex flex-col gap-3.5 rounded-[14px] border border-line bg-surface p-5">
          <h2 id="judul-cara" className="text-[17px]">
            Cara main
          </h2>
          <p className="flex flex-wrap items-center gap-2 text-base" aria-label="Contoh: buku, kursi, siang">
            <KataSambung kata="buku" kepala={false} />
            <ArrowRight size={14} className="text-muted" aria-hidden="true" />
            <KataSambung kata="kursi" />
            <ArrowRight size={14} className="text-muted" aria-hidden="true" />
            <KataSambung kata="siang" />
          </p>
          <ol className="flex flex-col gap-3">
            {ATURAN.map((a, i) => (
              <li key={i} className="flex gap-3">
                <LetterTile huruf={String(i + 1)} ukuran="sm" className="h-7 w-6 shrink-0 text-[13px]" />
                <span className="pt-0.5 text-[13px] leading-relaxed">{a}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {!statistik.memuat && !skor && <LinkRiwayat />}
    </div>
  );
}
