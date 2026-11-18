import { Link } from 'react-router-dom';
import { Bot, Timer } from 'lucide-react';
import { riwayat } from '../../api/games.js';
import { useMuat } from '../../lib/useMuat.js';
import { jamWib, labelHari } from '../../lib/format.js';
import { SkeletonBaris } from '../Skeleton.jsx';
import KotakGagal from './KotakGagal.jsx';

const JUMLAH = 3;

function judulMode(g) {
  if (g.mode === 'solo') return 'Solo';
  return `Lawan Bot ${g.tingkat === 'sulit' ? 'Sulit' : 'Mudah'}`;
}

function BarisGame({ g }) {
  const solo = g.mode === 'solo';
  const hasil = solo ? null : g.status === 'menang' ? 'Menang' : 'Kalah';
  return (
    <li>
      <Link to={`/riwayat/${g.id}`} className="flex items-center gap-3.5 bg-surface px-4 py-3.5 hover:bg-bg">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] ${solo ? 'bg-accent-soft text-accent' : 'bg-line text-ink'}`} aria-hidden="true">
          {solo ? <Timer size={20} /> : <Bot size={20} />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold">{judulMode(g)}</span>
          <span className="truncate text-[13px] text-muted">
            {g.jumlah_kata} kata · {labelHari(g.started_at)} {jamWib(g.started_at)}
          </span>
        </span>
        {hasil && (
          <span className={`rounded-[6px] px-2.5 py-1 text-xs font-bold ${hasil === 'Menang' ? 'bg-teal-soft text-teal' : 'bg-line text-muted'}`}>{hasil}</span>
        )}
        <span className="flex flex-col items-end">
          <span className="font-head text-[22px] leading-none font-extrabold">{g.skor}</span>
          <span className="text-xs text-muted">poin</span>
        </span>
      </Link>
    </li>
  );
}

export default function MainTerakhir() {
  const { data, error, memuat, ulang } = useMuat(() => riwayat(1));
  const games = data?.data.slice(0, JUMLAH) ?? [];
  return (
    <section aria-labelledby="judul-main-terakhir" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-end justify-between">
        <h2 id="judul-main-terakhir" className="text-lg">
          Main terakhir
        </h2>
        <Link to="/riwayat" className="flex h-11 items-center px-1 text-[13px] font-bold text-teal hover:underline">
          Lihat riwayat
        </Link>
      </div>
      {memuat && (
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <SkeletonBaris jumlah={JUMLAH} />
        </div>
      )}
      {error && <KotakGagal pesan="Riwayat game belum bisa dimuat." onUlang={ulang} />}
      {data && games.length === 0 && (
        <div className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface p-4">
          <p className="text-sm text-muted">Belum ada game. Main dulu, yuk.</p>
          <Link to="/main" className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-sm font-bold text-white hover:brightness-110">
            Mulai main
          </Link>
        </div>
      )}
      {games.length > 0 && (
        <ul className="flex flex-col gap-px overflow-hidden rounded-[14px] border border-line bg-line">
          {games.map((g) => (
            <BarisGame key={g.id} g={g} />
          ))}
        </ul>
      )}
    </section>
  );
}
