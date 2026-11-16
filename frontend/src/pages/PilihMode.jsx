import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, ChevronRight, Heart, History, Play, Timer } from 'lucide-react';
import { mulai } from '../api/games.js';
import { pesanError } from '../api/axios.js';
import KataSambung from '../components/KataSambung.jsx';
import { JudulHalaman } from '../components/ui.jsx';

export default function PilihMode() {
  const navigate = useNavigate();
  const [tingkat, setTingkat] = useState('mudah');
  const [memulai, setMemulai] = useState(null);
  const [error, setError] = useState(null);

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
    <div className="mx-auto flex max-w-[560px] flex-col gap-5">
      <header className="flex flex-col gap-1">
        <JudulHalaman>Mau main apa?</JudulHalaman>
        <p className="text-sm text-muted">Sambung kata dari 2 huruf terakhir kata sebelumnya.</p>
      </header>

      <p className="flex items-center justify-center gap-2 rounded-[14px] border border-line bg-surface p-3.5 text-base" aria-label="Contoh: buku, kursi, siang">
        <KataSambung kata="buku" kepala={false} />
        <ArrowRight size={14} className="text-muted" aria-hidden="true" />
        <KataSambung kata="kursi" />
        <ArrowRight size={14} className="text-muted" aria-hidden="true" />
        <KataSambung kata="siang" />
      </p>

      {error && (
        <p role="alert" className="rounded-[10px] bg-accent-soft px-3 py-2.5 text-[13px] font-semibold text-accent">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => main('solo')}
        disabled={Boolean(memulai)}
        className="flex flex-col gap-3.5 rounded-[20px] bg-accent p-5 text-left text-white shadow-[0_4px_0_var(--color-accent-shadow)] transition hover:brightness-110 active:translate-y-1 active:shadow-none disabled:opacity-70"
      >
        <span className="flex size-11 items-center justify-center rounded-[10px] bg-white/20" aria-hidden="true">
          <Timer size={22} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-head text-2xl font-bold">{memulai === 'solo' ? 'Menyiapkan...' : 'Solo'}</span>
          <span className="text-[13px] leading-relaxed">60 detik, sambung sebanyak mungkin. Salah jawab -3 detik.</span>
        </span>
      </button>

      <section aria-labelledby="judul-bot" className="flex flex-col gap-3.5 rounded-[20px] bg-ink p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="flex size-11 items-center justify-center rounded-[10px] bg-white/10 text-gold" aria-hidden="true">
            <Bot size={22} />
          </span>
          <span className="flex gap-0.5 text-accent-soft" aria-label="3 nyawa">
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
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-gold font-head text-[15px] font-bold text-ink hover:brightness-105 active:translate-y-px disabled:opacity-70"
        >
          {memulai === 'bot' ? 'Menyiapkan...' : 'Mulai lawan bot'}
          <Play size={16} aria-hidden="true" />
        </button>
      </section>

      <Link to="/riwayat" className="flex h-11 items-center justify-between px-1 text-[13px] font-semibold text-teal hover:underline">
        <span className="flex items-center gap-2">
          <History size={16} aria-hidden="true" /> Lihat riwayat permainan
        </span>
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
