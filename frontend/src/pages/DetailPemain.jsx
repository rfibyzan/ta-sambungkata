import { useParams } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { profil } from '../api/users.js';
import { useMuat } from '../lib/useMuat.js';
import { angka, bulanTahun } from '../lib/format.js';
import StateView from '../components/StateView.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { Avatar, HeaderDetail, Pil, Progres } from '../components/ui.jsx';

export default function DetailPemain() {
  const { userId } = useParams();
  const { data, error, memuat, ulang } = useMuat(() => profil(userId), [userId]);

  if (memuat) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-5" aria-busy="true" aria-label="Memuat profil pemain">
        <HeaderDetail judul="Profil Pemain" />
        <Skeleton className="h-60 rounded-[20px]" />
        <Skeleton className="h-16" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-[640px]">
        <HeaderDetail judul="Profil Pemain" />
        {error.status === 404 ? (
          <StateView keping="404" hot={0} judul="Pemain tidak ditemukan" pesan="Akun pemain ini mungkin sudah dihapus." aksi={{ label: 'Ke peringkat', ke: '/peringkat', gelap: true }} />
        ) : (
          <StateView keping="OFF" hot={1} judul="Profil belum bisa dimuat" pesan={error.pesan} aksi={{ label: 'Coba lagi', onClick: ulang, gelap: true, error: true }} />
        )}
      </div>
    );
  }

  const s = data.statistik;
  const skor = [
    ['Solo', s.skor_tertinggi.solo, 'bg-accent'],
    ['Bot Mudah', s.skor_tertinggi.bot_mudah, 'bg-teal'],
    ['Bot Sulit', s.skor_tertinggi.bot_sulit, 'bg-ink'],
  ];
  const maks = Math.max(1, ...skor.map(([, v]) => v));
  const persenMenang = s.game_bot ? Math.round((s.menang_bot / s.game_bot) * 100) : null;

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <HeaderDetail judul="Profil Pemain" />

      <section className="flex flex-col items-center gap-3.5 rounded-[20px] bg-ink p-5 text-white">
        <Avatar user={data} ukuran={80} />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-[22px]">{data.username}</h1>
          <p className="text-xs text-white/70">Bergabung {bulanTahun(data.created_at)}</p>
        </div>
        <div className="flex gap-1.5">
          <Pil className="bg-gold font-head text-ink">LV {data.level}</Pil>
          <Pil className="bg-white/10 text-white">
            <Flame size={12} aria-hidden="true" /> {data.streak} hari streak
          </Pil>
        </div>
      </section>

      <dl className="grid grid-cols-3 border-y border-line py-4 text-center">
        {[
          [angka(s.kata_terkumpul), 'kata unlock'],
          [s.jumlah_game, 'game'],
          [persenMenang == null ? '-' : `${persenMenang}%`, 'menang bot'],
        ].map(([v, l], i) => (
          <div key={l} className={`flex flex-col gap-0.5 ${i < 2 ? 'border-r border-line' : ''}`}>
            <dd className="font-head text-[22px] font-bold">{v}</dd>
            <dt className="text-[11px] text-muted">{l}</dt>
          </div>
        ))}
      </dl>

      <section aria-labelledby="judul-skor" className="flex flex-col gap-2.5">
        <h2 id="judul-skor" className="text-base">
          Skor terbaik per mode
        </h2>
        {skor.map(([label, v, warna]) => (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold">{label}</span>
              <span className="font-head text-sm font-bold">{v}</span>
            </div>
            <Progres nilai={v} total={maks} warna={warna} tinggi="h-2.5" label={`Skor terbaik ${label}`} />
          </div>
        ))}
      </section>

      {s.kata_favorit.length > 0 && (
        <section aria-labelledby="judul-favorit" className="flex flex-col gap-2.5">
          <h2 id="judul-favorit" className="text-base">
            Kata paling sering dipakai
          </h2>
          <ul className="grid grid-cols-3 gap-2">
            {s.kata_favorit.map((k) => (
              <li key={k.kata_id} className="flex flex-col gap-0.5 rounded-[10px] border border-line bg-surface p-3">
                <span className="truncate font-head text-base font-bold">{k.kata}</span>
                <span className="text-[11px] text-muted">{k.jumlah_dipakai}x</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
