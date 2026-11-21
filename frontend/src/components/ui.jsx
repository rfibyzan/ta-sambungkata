import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { inisial } from '../lib/format.js';

export function TombolIkon({ ikon: Ikon, label, onClick, ke, className = '' }) {
  const kelas = `inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:bg-bg active:translate-y-px ${className}`;
  if (ke) {
    return (
      <Link to={ke} aria-label={label} className={kelas}>
        <Ikon size={18} aria-hidden="true" />
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={kelas}>
      <Ikon size={18} aria-hidden="true" />
    </button>
  );
}

// Header halaman detail: tombol kembali, judul di tengah, aksi opsional di kanan.
export function HeaderDetail({ judul, kanan, kembaliKe }) {
  const navigate = useNavigate();
  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <TombolIkon ikon={ArrowLeft} label="Kembali" onClick={() => (kembaliKe ? navigate(kembaliKe) : navigate(-1))} />
      <h1 className="truncate font-head text-base font-bold">{judul}</h1>
      {kanan ?? <span className="size-11" aria-hidden="true" />}
    </header>
  );
}

export function JudulHalaman({ children, className = '' }) {
  return <h1 className={`font-head text-[28px] leading-tight font-bold ${className}`}>{children}</h1>;
}

const WARNA_AVATAR = ['bg-teal', 'bg-accent', 'bg-purple', 'bg-ink'];

// dekorasi = false jika foto bukan hiasan (tidak ada nama di sebelahnya), supaya alt berisi username.
// Foto yang gagal dimuat (file dihapus, offline) kembali ke inisial.
export function Avatar({ user, ukuran = 44, className = '', dekorasi = true }) {
  const [urlGagal, setUrlGagal] = useState(null);
  const nama = user?.username ?? '';
  let h = 0;
  for (const c of nama) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const warna = WARNA_AVATAR[h % WARNA_AVATAR.length];
  if (user?.avatar_url && user.avatar_url !== urlGagal) {
    return (
      <img
        src={user.avatar_url}
        alt={dekorasi ? '' : nama}
        onError={() => setUrlGagal(user.avatar_url)}
        width={ukuran}
        height={ukuran}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: ukuran, height: ukuran }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-head font-bold text-white ${warna} ${className}`}
      style={{ width: ukuran, height: ukuran, fontSize: Math.round(ukuran * 0.36) }}
    >
      {inisial(nama)}
    </span>
  );
}

export function Progres({ nilai, total, warna = 'bg-ink', track = 'bg-line', tinggi = 'h-2', label }) {
  const persen = total ? Math.min(100, Math.round((nilai / total) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={nilai}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full ${track} ${tinggi}`}
    >
      <div className={`h-full origin-left animate-isi rounded-full transition-[width] duration-500 ${warna}`} style={{ width: `${Math.max(persen, nilai ? 3 : 0)}%` }} />
    </div>
  );
}

// Lencana "+N XP" yang naik lalu memudar setelah klaim. Pesan klaim (aria-live) yang diumumkan, bukan lencana ini.
export function LencanaXp({ hadiah, className = '' }) {
  if (!hadiah) return null;
  return (
    <span key={hadiah.kunci} aria-hidden="true" className={`pointer-events-none absolute animate-naik-hilang font-head text-sm font-extrabold whitespace-nowrap ${className}`}>
      +{hadiah.xp} XP
    </span>
  );
}

export function Pil({ children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-bold ${className}`}>{children}</span>;
}

// Tombol utama. varian: accent | gelap | garis | teal
export function Tombol({ varian = 'gelap', className = '', children, ...props }) {
  const gaya = {
    accent: 'bg-accent text-white shadow-[0_4px_0_var(--color-accent-shadow)] hover:brightness-110 active:translate-y-1 active:shadow-none',
    gelap: 'bg-ink text-white hover:bg-ink/90 active:translate-y-px',
    teal: 'bg-teal text-white hover:brightness-110 active:translate-y-px',
    garis: 'border-[1.5px] border-ink text-ink hover:bg-surface active:translate-y-px',
    garisBahaya: 'border-[1.5px] border-accent text-accent hover:bg-accent-soft active:translate-y-px',
    bahaya: 'bg-accent text-white hover:brightness-110 active:translate-y-px',
  }[varian];
  return (
    <button
      type="button"
      className={`inline-flex h-13 items-center justify-center gap-2 rounded-[14px] px-5 font-head text-[15px] font-bold transition disabled:opacity-50 ${gaya} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Bottom sheet konfirmasi. Escape menutup, fokus awal di tombol aman.
export function Sheet({ terbuka, onTutup, ikon: Ikon, judul, pesan, children }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!terbuka) return undefined;
    const sebelum = document.activeElement;
    panel.current?.querySelector('button')?.focus();
    const tekan = (e) => e.key === 'Escape' && onTutup();
    document.addEventListener('keydown', tekan);
    return () => {
      document.removeEventListener('keydown', tekan);
      sebelum?.focus?.();
    };
  }, [terbuka, onTutup]);
  if (!terbuka) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/65 sm:items-center" onClick={onTutup}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-sheet"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[440px] animate-muncul flex-col items-center gap-4 rounded-t-[20px] bg-surface px-5 pt-3 pb-[max(28px,env(safe-area-inset-bottom))] text-center sm:rounded-[20px] sm:pt-6"
      >
        <span className="h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
        {Ikon && (
          <span className="flex size-13 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Ikon size={24} aria-hidden="true" />
          </span>
        )}
        <h2 id="judul-sheet" className="text-xl">
          {judul}
        </h2>
        {pesan && <p className="text-sm leading-relaxed text-muted">{pesan}</p>}
        <div className="flex w-full flex-col gap-2.5">{children}</div>
      </div>
    </div>
  );
}
