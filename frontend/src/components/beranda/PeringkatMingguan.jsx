import { Link } from 'react-router-dom';
import { peringkat } from '../../api/leaderboard.js';
import { useMuat } from '../../lib/useMuat.js';
import { SkeletonBaris } from '../Skeleton.jsx';
import { Avatar } from '../ui.jsx';
import KotakGagal from './KotakGagal.jsx';

const TERATAS = 4;

function Baris({ r, saya }) {
  return (
    <li>
      <Link
        to={`/pemain/${r.user_id}`}
        aria-current={saya ? 'true' : undefined}
        className={`flex items-center gap-3 px-4 py-3 ${saya ? 'bg-accent-soft hover:brightness-[0.98]' : 'bg-surface hover:bg-bg'}`}
      >
        <span className={`w-6 shrink-0 font-head text-base font-extrabold ${saya ? 'text-accent' : r.peringkat <= 3 ? 'text-ink' : 'text-muted'}`}>{r.peringkat}</span>
        <Avatar user={r} ukuran={34} />
        <span className={`min-w-0 flex-1 truncate text-[15px] ${saya ? 'font-bold' : 'font-semibold'}`}>{saya ? `Kamu (${r.username})` : r.username}</span>
        <span className={`font-head text-[17px] font-extrabold ${saya ? 'text-accent' : ''}`}>{r.skor_tertinggi}</span>
      </Link>
    </li>
  );
}

export default function PeringkatMingguan({ userId }) {
  const { data, error, memuat, ulang } = useMuat(() => peringkat({ mode: 'solo', periode: 'mingguan' }));
  const teratas = data?.data.slice(0, TERATAS) ?? [];
  const saya = data?.posisi_saya;
  const sayaDiLuar = saya && !teratas.some((r) => r.user_id === saya.user_id);
  return (
    <section aria-labelledby="judul-peringkat-mingguan" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-end justify-between">
        <h2 id="judul-peringkat-mingguan" className="text-lg">
          Peringkat minggu ini
        </h2>
        <Link to="/peringkat" className="flex h-11 items-center px-1 text-[13px] font-bold text-teal hover:underline">
          Lihat semua
        </Link>
      </div>
      {memuat && (
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <SkeletonBaris jumlah={TERATAS} />
        </div>
      )}
      {error && <KotakGagal pesan="Peringkat belum bisa dimuat." onUlang={ulang} />}
      {data && teratas.length === 0 && (
        <p className="rounded-[14px] border border-line bg-surface p-4 text-sm text-muted">Belum ada skor Solo minggu ini. Jadilah yang pertama.</p>
      )}
      {teratas.length > 0 && (
        <ol className="flex flex-col gap-px overflow-hidden rounded-[14px] border border-line bg-line">
          {teratas.map((r) => (
            <Baris key={r.user_id} r={r} saya={r.user_id === userId} />
          ))}
          {sayaDiLuar && <Baris r={saya} saya />}
        </ol>
      )}
    </section>
  );
}
