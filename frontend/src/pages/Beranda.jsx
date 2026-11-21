import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Play, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { kataHariIni } from '../api/kata.js';
import { questHariIni } from '../api/quests.js';
import { useMuat } from '../lib/useMuat.js';
import { useKlaim } from '../lib/useKlaim.js';
import { progresLevel } from '../lib/level.js';
import { sapaan } from '../lib/format.js';
import { DeretKeping } from '../components/LetterTile.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { QuestCard } from '../components/QuestCard.jsx';
import { Avatar, LencanaXp, Pil, Progres } from '../components/ui.jsx';
import StatistikRingkas from '../components/beranda/StatistikRingkas.jsx';
import MainTerakhir from '../components/beranda/MainTerakhir.jsx';
import PeringkatMingguan from '../components/beranda/PeringkatMingguan.jsx';
import { useLayar } from '../lib/useLayar.js';

function KataHariIni() {
  const { data, error, memuat, ulang } = useMuat(kataHariIni);
  return (
    <section aria-labelledby="judul-kata-hari-ini" className="flex flex-col gap-3.5 rounded-[20px] bg-ink p-5 text-white lg:p-8">
      <h2 id="judul-kata-hari-ini" className="font-body text-xs font-bold text-gold">
        Kata hari ini
      </h2>
      {memuat && (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Memuat kata hari ini">
          <Skeleton className="h-12 w-56 bg-white/15" />
          <Skeleton className="h-3 w-full bg-white/15" />
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/80">Kata hari ini belum bisa dimuat.</p>
          <button type="button" onClick={ulang} className="inline-flex h-11 items-center gap-1.5 rounded-[10px] bg-white/15 px-3 text-sm font-bold hover:bg-white/25">
            <RotateCcw size={14} aria-hidden="true" /> Coba lagi
          </button>
        </div>
      )}
      {data && (
        <>
          <DeretKeping teks={data.kata.kata} label={data.kata.kata} className="[&>span]:h-[46px] [&>span]:w-10 lg:[&>span]:h-16 lg:[&>span]:w-14" />
          <div className="flex flex-col gap-1">
            <p className="text-xs text-gold italic">{data.kata.jenis}</p>
            <p className="text-sm leading-relaxed text-white lg:text-lg">{data.kata.makna}.</p>
            {data.kata.contoh && <p className="text-[13px] text-white/70 italic">"{data.kata.contoh}"</p>}
          </div>
        </>
      )}
    </section>
  );
}

function TombolMain() {
  return (
    <Link
      to="/main"
      className="flex items-center justify-between rounded-[14px] bg-accent px-5 py-4 text-white shadow-[0_4px_0_var(--color-accent-shadow)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-head text-xl font-bold lg:text-2xl">Mulai Main</span>
        <span className="text-xs lg:text-sm">Solo 60 detik atau lawan bot</span>
      </span>
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-accent" aria-hidden="true">
        <Play size={22} />
      </span>
    </Link>
  );
}

function QuestHariIni({ onHadiah }) {
  const { data, setData, error, memuat, ulang } = useMuat(questHariIni);
  const { klaim, mengklaim, pesan } = useKlaim(setData, onHadiah);
  return (
    <section aria-labelledby="judul-quest" className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <h2 id="judul-quest" className="text-lg">
          Quest Hari Ini
        </h2>
        <Link to="/quest" className="flex h-11 items-center px-1 text-[13px] font-bold text-teal hover:underline">
          Lihat semua
        </Link>
      </div>
      {memuat && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[70px] rounded-[14px]" />)}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-[14px] border border-line-strong bg-surface p-4">
          <p className="text-sm text-muted">Quest belum bisa dimuat.</p>
          <button type="button" onClick={ulang} className="h-11 rounded-[10px] bg-ink px-4 text-sm font-bold text-white">
            Coba lagi
          </button>
        </div>
      )}
      {data && (
        <ul className="flex flex-col gap-3">
          {data.quests.map((q) => (
            <QuestCard key={q.id} quest={q} ringkas onKlaim={klaim} mengklaim={mengklaim === q.id} />
          ))}
        </ul>
      )}
      {pesan && (
        <p role="status" className={`text-[13px] font-semibold ${pesan.jenis === 'sukses' ? 'text-teal' : 'text-accent'}`}>
          {pesan.teks}
        </p>
      )}
    </section>
  );
}

export default function Beranda() {
  const [hadiah, setHadiah] = useState(null);
  const { user } = useAuth();
  const lv = progresLevel(user.xp, user.level);
  const layarLebar = useLayar('(min-width: 1024px)');
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] text-muted">{sapaan()},</p>
          <h1 className="text-2xl lg:text-3xl">{user.username}</h1>
        </div>
        <Link to="/profil" aria-label="Buka profil" className="rounded-full">
          <Avatar user={user} ukuran={44} />
        </Link>
      </header>

      <section aria-label="Level dan streak" className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pil className="bg-ink font-head text-xs text-white">LV {user.level}</Pil>
            <span className="relative text-[13px] text-muted">
              {lv.didapat} / {lv.butuh} XP
              <LencanaXp hadiah={hadiah} className="-top-0.5 left-full ml-2 text-accent" />
            </span>
          </div>
          <span className="flex items-center gap-1 text-[13px] font-bold text-accent">
            <Flame size={16} aria-hidden="true" /> {user.streak} hari
          </span>
        </div>
        <Progres nilai={lv.didapat} total={lv.butuh} warna="bg-accent" label="Progres XP menuju level berikutnya" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-6">
          <KataHariIni />
          <TombolMain />
        </div>
        <QuestHariIni onHadiah={setHadiah} />
      </div>

      <StatistikRingkas userId={user.id} />

      {layarLebar && (
        <div className="grid grid-cols-2 gap-6 xl:grid-cols-[1fr_420px]">
          <MainTerakhir />
          <PeringkatMingguan userId={user.id} />
        </div>
      )}
    </div>
  );
}
