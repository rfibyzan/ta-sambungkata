import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { peringkat } from '../api/leaderboard.js';
import { useMuat } from '../lib/useMuat.js';
import StateView from '../components/StateView.jsx';
import { SkeletonBaris } from '../components/Skeleton.jsx';
import { Avatar, JudulHalaman } from '../components/ui.jsx';

const MODE = [
  ['solo', 'Solo'],
  ['bot_mudah', 'Bot Mudah'],
  ['bot_sulit', 'Bot Sulit'],
];

function Podium({ tiga, userId }) {
  const urut = [tiga[1], tiga[0], tiga[2]];
  const tinggi = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  return (
    <ol className="flex items-end gap-2.5 pt-2" aria-label="Tiga besar">
      {urut.map((r, i) =>
        r ? (
          <li key={r.user_id} className="flex flex-1 flex-col items-center gap-2">
            <Link to={`/pemain/${r.user_id}`} className="flex flex-col items-center gap-2 rounded-[14px] hover:opacity-80">
              {r.peringkat === 1 && <Crown size={22} className="text-gold-ink" aria-hidden="true" />}
              <Avatar user={r} ukuran={r.peringkat === 1 ? 60 : 48} />
              <span className="max-w-[100px] truncate text-[13px] font-bold">
                {r.username}
                {r.user_id === userId && ' (kamu)'}
              </span>
            </Link>
            <div
              className={`flex w-full flex-col items-center gap-0.5 rounded-[14px_14px_6px_6px] py-3 ${tinggi[r.peringkat] ?? 'h-20'} ${
                r.peringkat === 1 ? 'bg-ink text-white' : 'border border-line bg-surface'
              }`}
            >
              <span className={`font-head text-[28px] font-extrabold ${r.peringkat === 1 ? 'text-gold' : ''}`}>{r.peringkat}</span>
              <span className={`text-xs font-semibold ${r.peringkat === 1 ? 'text-white/80' : 'text-muted'}`}>{r.skor_tertinggi} poin</span>
            </div>
          </li>
        ) : (
          <li key={`kosong-${i}`} className="flex-1" aria-hidden="true" />
        ),
      )}
    </ol>
  );
}

function Baris({ r, saya }) {
  return (
    <li className={saya ? 'bg-accent-soft' : ''}>
      <Link to={`/pemain/${r.user_id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-bg/60">
        <span className="w-6 font-head text-[15px] font-bold text-muted">{r.peringkat}</span>
        <Avatar user={r} ukuran={36} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-bold">
            {r.username}
            {saya && ' (kamu)'}
          </span>
          <span className="text-[11px] text-muted">
            LV {r.level} · {r.jumlah_game} game
          </span>
        </span>
        <span className={`font-head text-[17px] font-bold ${saya ? 'text-accent' : ''}`}>{r.skor_tertinggi}</span>
        <ChevronRight size={16} className="text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function Peringkat() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const periode = params.get('periode') === 'semua' ? 'semua' : 'mingguan';
  const mode = MODE.some(([k]) => k === params.get('mode')) ? params.get('mode') : 'solo';
  const { data, error, memuat, ulang } = useMuat(() => peringkat({ mode, periode }), [mode, periode]);

  const atur = (k, v) =>
    setParams((p) => {
      const baru = new URLSearchParams(p);
      baru.set(k, v);
      return baru;
    });

  const tiga = data?.data.slice(0, 3) ?? [];
  const sisa = data?.data.slice(3) ?? [];
  const sayaDiLuar = data?.posisi_saya && !data.data.some((r) => r.user_id === user.id);

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <JudulHalaman>Peringkat</JudulHalaman>

      <div role="tablist" aria-label="Periode" className="flex rounded-[14px] bg-line p-1">
        {[
          ['mingguan', 'Mingguan'],
          ['semua', 'Sepanjang Masa'],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={periode === k}
            onClick={() => atur('periode', k)}
            className={`h-11 flex-1 rounded-[10px] text-[13px] font-bold transition-colors ${periode === k ? 'bg-surface' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Mode" className="flex flex-wrap gap-2">
        {MODE.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={mode === k}
            onClick={() => atur('mode', k)}
            className={`h-11 rounded-full px-4 text-[13px] font-semibold transition-colors ${mode === k ? 'bg-ink text-white' : 'border border-line-strong hover:border-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {memuat ? (
        <SkeletonBaris jumlah={6} />
      ) : error ? (
        <StateView keping="OFF" hot={1} judul="Gagal memuat peringkat" pesan={`${error.pesan} Coba lagi sebentar lagi.`} aksi={{ label: 'Coba lagi', onClick: ulang, gelap: true, error: true }} />
      ) : data.data.length === 0 ? (
        <StateView
          keping="SKOR"
          hot={0}
          judul={periode === 'mingguan' ? 'Belum ada skor minggu ini' : 'Belum ada skor'}
          pesan={periode === 'mingguan' ? 'Peringkat mingguan mulai lagi setiap Senin pukul 00.00 WIB. Main sekarang untuk jadi yang pertama.' : 'Main sekarang untuk jadi yang pertama di papan peringkat.'}
          aksi={{ label: 'Main sekarang', ke: '/main' }}
        />
      ) : (
        <>
          <Podium tiga={tiga} userId={user.id} />
          {(sisa.length > 0 || sayaDiLuar) && (
            <ol className="overflow-hidden rounded-[14px] border border-line bg-surface [&>li+li]:border-t [&>li+li]:border-line">
              {sisa.map((r) => (
                <Baris key={r.user_id} r={r} saya={r.user_id === user.id} />
              ))}
              {sayaDiLuar && <Baris r={data.posisi_saya} saya />}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
