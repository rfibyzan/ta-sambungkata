import { BookOpen, Bot, Gamepad2, Trophy } from 'lucide-react';
import { profil } from '../../api/users.js';
import { useMuat } from '../../lib/useMuat.js';
import Skeleton from '../Skeleton.jsx';
import { Progres } from '../ui.jsx';
import KotakGagal from './KotakGagal.jsx';

const angka = (n) => Number(n ?? 0).toLocaleString('id-ID');

function Kartu({ label, ikon: Ikon, warnaIkon, nilai, sub, children }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        <Ikon size={18} className={`shrink-0 ${warnaIkon}`} aria-hidden="true" />
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="font-head text-[26px] leading-none font-extrabold lg:text-3xl">{nilai}</span>
        {sub && <span className="text-[13px] text-muted">{sub}</span>}
      </p>
      {children}
    </div>
  );
}

export default function StatistikRingkas({ userId }) {
  const { data, error, memuat, ulang } = useMuat(() => profil(userId), [userId]);
  const s = data?.statistik;
  return (
    <section aria-labelledby="judul-statistik" className="flex flex-col gap-3">
      <h2 id="judul-statistik" className="sr-only">
        Statistik kamu
      </h2>
      {memuat && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-busy="true" aria-label="Memuat statistik">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[108px] rounded-[14px]" />
          ))}
        </div>
      )}
      {error && <KotakGagal pesan="Statistik belum bisa dimuat." onUlang={ulang} />}
      {s && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Kartu label="Koleksi Kamusku" ikon={BookOpen} warnaIkon="text-teal" nilai={angka(s.kata_terkumpul)} sub={`/ ${angka(s.total_kata)}`}>
            <Progres nilai={s.kata_terkumpul ?? 0} total={s.total_kata ?? 0} warna="bg-teal" tinggi="h-1.5" label="Progres koleksi Kamusku" />
          </Kartu>
          <Kartu label="Game dimainkan" ikon={Gamepad2} warnaIkon="text-ink" nilai={angka(s.jumlah_game)} />
          <Kartu label="Skor tertinggi Solo" ikon={Trophy} warnaIkon="text-accent" nilai={angka(s.skor_tertinggi?.solo)} />
          <Kartu label="Menang lawan bot" ikon={Bot} warnaIkon="text-ink" nilai={angka(s.menang_bot)} sub={`dari ${angka(s.game_bot)}`} />
        </div>
      )}
    </section>
  );
}
