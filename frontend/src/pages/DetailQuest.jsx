import { Link, useParams } from 'react-router-dom';
import { Lightbulb, Play } from 'lucide-react';
import { detailQuest } from '../api/quests.js';
import { useMuat } from '../lib/useMuat.js';
import { IKON_QUEST } from '../components/QuestCard.jsx';
import StateView from '../components/StateView.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { HeaderDetail, Pil } from '../components/ui.jsx';

const TIPS = {
  main_game: 'Game Solo hanya butuh 60 detik. Cara tercepat menyelesaikan quest ini.',
  unlock_kata: 'Coba kata panjang yang jarang dipakai. Setiap kata baru juga memberi +5 poin.',
  huruf_awal: 'Saat awalan cocok, langsung pakai. Kata yang berakhiran huruf itu juga membantu lawan atau dirimu sendiri.',
  panjang_kata: 'Kata turunan sering lebih panjang, tapi hanya kata dasar yang ada di kamus. Coba kata serapan.',
  skor: 'Jawab dalam 5 detik untuk bonus +3 dan buat kunci mati untuk +10.',
  kalahkan_bot: 'Pilih kata yang akhirannya jarang, supaya bot kehabisan sambungan.',
  rantai: 'Jangan terburu-buru. Jawaban salah di Solo memotong waktu 3 detik.',
};

function Cincin({ nilai, total }) {
  const r = 62;
  const keliling = 2 * Math.PI * r;
  const rasio = total ? Math.min(1, nilai / total) : 0;
  return (
    <div className="relative size-[140px]" role="img" aria-label={`Progres ${nilai} dari ${total}`}>
      <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="9" className="stroke-line" />
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="9" strokeLinecap="round" strokeDasharray={keliling} strokeDashoffset={keliling * (1 - rasio)} className={rasio >= 1 ? 'stroke-teal' : 'stroke-ink'} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-head text-[34px] font-extrabold" aria-hidden="true">
        {nilai}/{total}
      </span>
    </div>
  );
}

export default function DetailQuest() {
  const { id } = useParams();
  const { data, error, memuat, ulang } = useMuat(() => detailQuest(id), [id]);

  if (memuat) {
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-5" aria-busy="true" aria-label="Memuat quest">
        <HeaderDetail judul="Detail Quest" kembaliKe="/quest" />
        <Skeleton className="size-[140px] rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-[560px]">
        <HeaderDetail judul="Detail Quest" kembaliKe="/quest" />
        {error.status === 404 ? (
          <StateView keping="404" hot={0} judul="Quest tidak ditemukan" pesan="Quest ini mungkin dari hari lain yang sudah tidak tersedia." aksi={{ label: 'Quest hari ini', ke: '/quest', gelap: true }} />
        ) : (
          <StateView keping="OFF" hot={1} judul="Quest belum bisa dimuat" pesan={error.pesan} aksi={{ label: 'Coba lagi', onClick: ulang, gelap: true, error: true }} />
        )}
      </div>
    );
  }

  const Ikon = IKON_QUEST[data.tipe];
  const sisa = data.target - data.progres;
  const kotakKosong = Math.max(0, Math.min(sisa, 3));

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-6">
      <HeaderDetail judul="Detail Quest" kembaliKe="/quest" />

      <section className="flex flex-col items-center gap-3.5 text-center">
        <Cincin nilai={data.progres} total={data.target} />
        <div className="flex gap-1.5">
          {Ikon && (
            <Pil className="bg-surface text-muted">
              <Ikon size={12} aria-hidden="true" /> Quest harian
            </Pil>
          )}
          <Pil className="bg-gold/20 text-gold-ink">+{data.hadiah_xp} XP</Pil>
        </div>
        <h1 className="text-2xl">{data.judul}</h1>
        <p className="text-sm leading-relaxed text-muted">{data.deskripsi}</p>
        {data.selesai && (
          <p className="text-[13px] font-semibold text-teal">{data.diklaim ? 'Selesai, hadiah sudah diklaim.' : 'Selesai! Klaim hadiahnya di halaman Quest.'}</p>
        )}
      </section>

      {['unlock_kata', 'huruf_awal', 'panjang_kata'].includes(data.tipe) && (
        <section aria-labelledby="judul-terhitung" className="flex flex-col gap-2.5">
          <h2 id="judul-terhitung" className="font-body text-sm font-bold">
            Kata yang sudah terhitung
          </h2>
          {data.kata_terhitung.length === 0 && !kotakKosong ? null : (
            <ul className="grid grid-cols-3 gap-2">
              {data.kata_terhitung.map((k) => (
                <li key={k.id}>
                  <Link to={`/kamus/${k.id}`} className="flex h-11 items-center justify-center rounded-[10px] border border-line-strong bg-surface font-head text-sm font-bold hover:border-ink">
                    {k.kata}
                  </Link>
                </li>
              ))}
              {Array.from({ length: kotakKosong }, (_, i) => (
                <li key={`k${i}`} className="flex h-11 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-line-strong font-head text-sm font-bold text-muted" aria-hidden="true">
                  ?
                </li>
              ))}
            </ul>
          )}
          {sisa > 0 && <p className="text-xs font-semibold text-muted">{sisa} kata lagi untuk menyelesaikan quest ini</p>}
        </section>
      )}

      <p className="flex gap-2.5 rounded-[14px] bg-teal-soft p-3.5 text-[13px] leading-relaxed text-teal">
        <Lightbulb size={18} className="shrink-0" aria-hidden="true" />
        <span>Tips: {TIPS[data.tipe]}</span>
      </p>

      {data.hari_ini && !data.selesai && (
        <Link
          to="/main"
          className="flex h-13 items-center justify-center gap-2 rounded-[14px] bg-accent font-head text-[15px] font-bold text-white shadow-[0_4px_0_var(--color-accent-shadow)] hover:brightness-110 active:translate-y-1 active:shadow-none"
        >
          <Play size={16} aria-hidden="true" /> Main sekarang
        </Link>
      )}
    </div>
  );
}
