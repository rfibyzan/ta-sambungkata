import { useEffect, useState } from 'react';
import { Check, Clock3, Flame } from 'lucide-react';
import { questHariIni } from '../api/quests.js';
import { useMuat } from '../lib/useMuat.js';
import { useKlaim } from '../lib/useKlaim.js';
import { progresLevel } from '../lib/level.js';
import { hitungMundur } from '../lib/format.js';
import { QuestCard } from '../components/QuestCard.jsx';
import StateView from '../components/StateView.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { HeaderDetail, Progres } from '../components/ui.jsx';

const HARI = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

function HitungMundur({ ms }) {
  const [sisa, setSisa] = useState(ms);
  useEffect(() => {
    const mulai = Date.now();
    const t = setInterval(() => setSisa(ms - (Date.now() - mulai)), 1000);
    return () => clearInterval(t);
  }, [ms]);
  return (
    <span className="flex items-center gap-1 text-xs text-muted">
      <Clock3 size={13} aria-hidden="true" /> Reset {hitungMundur(sisa)}
    </span>
  );
}

export default function Quest() {
  const { data, setData, error, memuat, ulang } = useMuat(questHariIni);
  const { klaim, mengklaim, pesan } = useKlaim(setData);

  if (memuat) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-5" aria-busy="true" aria-label="Memuat quest">
        <HeaderDetail judul="Daily Quest" kembaliKe="/" />
        <Skeleton className="h-40 rounded-[20px]" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-[20px]" />
        ))}
        <p className="text-center text-[13px] text-muted">Menyiapkan quest hari ini...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-[640px]">
        <HeaderDetail judul="Daily Quest" kembaliKe="/" />
        <StateView keping="OFF" hot={1} judul="Quest hari ini belum bisa dimuat" pesan={`${error.pesan} Progres quest tetap dihitung saat kamu main.`} aksi={{ label: 'Coba lagi', onClick: ulang, gelap: true, error: true }} />
      </div>
    );
  }

  const lv = progresLevel(data.xp, data.level);
  // Hari dalam minggu (Senin = 0) untuk deret streak.
  const hariIni = (new Date(`${data.tanggal}T00:00:00Z`).getUTCDay() + 6) % 7;
  // Hari yang terisi: streak hari terakhir, berakhir hari ini jika semua quest hari ini sudah diklaim.
  const semuaDiklaim = data.quests.every((q) => q.diklaim);
  const isiAkhir = semuaDiklaim ? hariIni : hariIni - 1;
  const isiAwal = isiAkhir - data.streak + 1;

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <HeaderDetail judul="Daily Quest" kembaliKe="/" />

      <section aria-label="Level dan streak" className="flex flex-col gap-3.5 rounded-[20px] bg-ink p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="font-head text-[26px] font-bold">Level {data.level}</p>
            <p className="text-xs text-white/70">{lv.sisa} XP lagi ke Level {data.level + 1}</p>
          </div>
          <div className="flex flex-col items-center rounded-[14px] bg-white/10 px-3 py-2">
            <span className="flex items-center gap-1 font-head text-xl font-bold">
              <Flame size={18} className="text-accent-soft" aria-hidden="true" /> {data.streak}
            </span>
            <span className="text-[10px] text-white/70">hari streak</span>
          </div>
        </div>
        <Progres nilai={lv.didapat} total={lv.butuh} warna="bg-gold" track="bg-white/15" tinggi="h-2.5" label="Progres XP" />
        <ol className="flex justify-between" aria-label="Streak minggu ini">
          {HARI.map((h, i) => {
            const isi = data.streak > 0 && i >= isiAwal && i <= isiAkhir;
            const sekarang = i === hariIni;
            return (
              <li key={i} className="flex flex-col items-center gap-1">
                <span
                  className={`flex size-7 items-center justify-center rounded-full ${isi ? 'bg-accent' : 'bg-white/10'} ${sekarang && !isi ? 'border-[1.5px] border-gold' : ''}`}
                  aria-label={isi ? 'Selesai' : sekarang ? 'Hari ini' : 'Belum'}
                >
                  {isi && <Check size={14} aria-hidden="true" />}
                </span>
                <span className={`text-[10px] font-bold ${sekarang ? 'text-gold' : 'text-white/70'}`}>{h}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex items-center justify-between">
        <h1 className="text-lg">Quest hari ini</h1>
        <HitungMundur ms={data.reset_dalam_ms} />
      </div>

      <ul className="flex flex-col gap-3">
        {data.quests.map((q) => (
          <QuestCard key={q.id} quest={q} onKlaim={klaim} mengklaim={mengklaim === q.id} />
        ))}
      </ul>
      {pesan && (
        <p role="status" className={`text-center text-[13px] font-semibold ${pesan.jenis === 'sukses' ? 'text-teal' : 'text-accent'}`}>
          {pesan.teks}
        </p>
      )}
      <p className="text-center text-xs text-muted">Klaim ketiga quest untuk menambah streak.</p>
    </div>
  );
}
