import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Flame, History, Info, LogOut, Pencil, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { profil } from '../api/users.js';
import { useMuat } from '../lib/useMuat.js';
import { angka, bulanTahun } from '../lib/format.js';
import { progresLevel } from '../lib/level.js';
import { persenMenang } from '../lib/skorMode.js';
import SkorPerMode from '../components/SkorPerMode.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { Avatar, JudulHalaman, Pil, Progres, Sheet, Tombol } from '../components/ui.jsx';

export default function Profil() {
  const { user, keluar } = useAuth();
  const navigate = useNavigate();
  const { data, error, memuat, ulang } = useMuat(() => profil(user.id), [user.id]);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const s = data?.statistik;
  const lv = progresLevel(user.xp, user.level);

  const menu = [
    { ke: '/riwayat', ikon: History, label: 'Riwayat Permainan', nilai: s ? `${s.jumlah_game} game` : '' },
    { ke: '/quest', ikon: Target, label: 'Daily Quest', nilai: '' },
    { ke: '/tentang', ikon: Info, label: 'Tentang Aplikasi', nilai: 'v1.0' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <JudulHalaman>Profil</JudulHalaman>
        <Link to="/profil/edit" className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[13px] font-semibold hover:border-ink">
          <Pencil size={14} aria-hidden="true" /> Edit
        </Link>
      </header>

      {/* ≥ 1024px: kiri identitas dan statistik, kanan menu. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="flex flex-col gap-6">
      <section className="flex items-center gap-4">
        <Avatar user={user} ukuran={76} />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate text-[22px]">{user.username}</h2>
          <p className="text-xs text-muted">
            {user.email} · bergabung {bulanTahun(user.created_at)}
          </p>
          <div className="flex gap-1.5 pt-1">
            <Pil className="bg-ink font-head text-white">LV {user.level}</Pil>
            <Pil className="bg-accent-soft text-accent">
              <Flame size={12} aria-hidden="true" /> {user.streak} hari
            </Pil>
          </div>
        </div>
      </section>

      {memuat ? (
        <Skeleton className="h-48 rounded-[20px]" />
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-[14px] border border-line-strong bg-surface p-4">
          <p className="text-sm text-muted">Statistik belum bisa dimuat.</p>
          <button type="button" onClick={ulang} className="h-11 rounded-[10px] bg-ink px-4 text-sm font-bold text-white">
            Coba lagi
          </button>
        </div>
      ) : (
        <section aria-label="Statistik" className="flex flex-col gap-3.5">
          <Link to="/kamus" className="flex flex-col gap-2.5 rounded-[20px] bg-ink p-4.5 text-white hover:bg-ink/90">
            <p className="flex items-end gap-1.5">
              <span className="font-head text-[40px] leading-none font-extrabold">{angka(s.kata_terkumpul)}</span>
              <span className="text-sm text-white/75">kata di Kamusku</span>
            </p>
            <Progres nilai={s.kata_terkumpul} total={s.total_kata} warna="bg-gold" track="bg-white/15" label="Progres koleksi" />
            <span className="text-xs text-white/75">
              {String(Math.round((s.kata_terkumpul / s.total_kata) * 1000) / 10).replace('.', ',')}% dari seluruh kamus
            </span>
          </Link>
          <dl className="flex flex-col">
            {[
              ['Game dimainkan', s.jumlah_game],
              ['Game lawan bot', s.game_bot],
              ['Menang lawan bot', persenMenang(s.menang_bot, s.game_bot)],
            ].map(([l, v], i) => (
              <div key={l} className={`flex items-center justify-between px-1 py-3 ${i < 2 ? 'border-b border-line' : ''}`}>
                <dt className="text-sm text-muted">{l}</dt>
                <dd className="font-head text-base font-bold">{typeof v === 'number' ? angka(v) : v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {s?.kata_favorit?.length > 0 && (
        <section aria-labelledby="judul-favorit" className="flex flex-col gap-3">
          <h2 id="judul-favorit" className="text-[17px]">
            Kata paling sering kamu pakai
          </h2>
          <ol className="grid grid-cols-3 gap-2 sm:gap-3">
            {s.kata_favorit.slice(0, 3).map((k, i) => (
              <li key={k.kata_id} className="min-w-0">
                <Link
                  to={`/kamus/${k.kata_id}`}
                  className="flex flex-col gap-1 rounded-[14px] keping-tekan border border-line-strong bg-surface p-3 hover:border-ink"
                >
                  <span className="text-xs font-bold text-muted">{i + 1}</span>
                  <span className="truncate font-head text-lg font-extrabold sm:text-[22px]">{k.kata}</span>
                  <span className="text-xs text-muted">dipakai {angka(k.jumlah_dipakai)} kali</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
      </div>

      <div className="flex flex-col gap-6">
      <section aria-labelledby="judul-level" className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="judul-level" className="text-[17px]">
            Level {user.level}
          </h2>
          <span className="text-[13px] font-bold">
            {angka(lv.didapat)} / {angka(lv.butuh)} XP
          </span>
        </div>
        <Progres nilai={lv.didapat} total={lv.butuh} warna="bg-accent" tinggi="h-2.5" label="Progres XP menuju level berikutnya" />
        <p className="text-xs text-muted">
          {angka(lv.sisa)} XP lagi menuju Level {user.level + 1}. Klaim Daily Quest untuk dapat XP.
        </p>
      </section>

      {s && (
        <section aria-labelledby="judul-skor-mode" className="flex flex-col gap-3.5 rounded-[14px] border border-line bg-surface p-5">
          <h2 id="judul-skor-mode" className="text-[17px]">
            Skor tertinggi per mode
          </h2>
          <SkorPerMode skor={s.skor_tertinggi} tautanPeringkat />
        </section>
      )}

      <nav aria-label="Menu profil" className="overflow-hidden rounded-[14px] border border-line bg-surface">
        <ul className="[&>li+li]:border-t [&>li+li]:border-line">
          {menu.map(({ ke, ikon: Ikon, label, nilai }) => (
            <li key={ke}>
              <Link to={ke} className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg/60">
                <Ikon size={18} aria-hidden="true" />
                <span className="flex-1 text-sm font-semibold">{label}</span>
                {nilai && <span className="text-xs text-muted">{nilai}</span>}
                <ChevronRight size={16} className="text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setKonfirmasi(true)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-accent hover:bg-bg/60">
              <LogOut size={18} aria-hidden="true" />
              <span className="text-sm font-semibold">Keluar</span>
            </button>
          </li>
        </ul>
      </nav>

      <p className="text-center text-[11px] text-muted">SambungKata · Tugas Akhir PPB 2026</p>
      </div>
      </div>

      <Sheet terbuka={konfirmasi} onTutup={() => setKonfirmasi(false)} ikon={LogOut} judul="Keluar dari akun?" pesan="Progres dan Kamusku tetap tersimpan. Masuk lagi kapan saja dengan email yang sama.">
        <Tombol onClick={() => setKonfirmasi(false)} className="w-full">
          Batal
        </Tombol>
        <Tombol
          varian="garisBahaya"
          onClick={() => {
            keluar();
            navigate('/masuk', { replace: true });
          }}
          className="w-full"
        >
          Keluar
        </Tombol>
      </Sheet>
    </div>
  );
}
