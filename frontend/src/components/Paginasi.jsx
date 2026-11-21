import { useId, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bacaHalaman } from '../lib/halamanKetik.js';

const panah = 'flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-line-strong bg-surface hover:border-ink disabled:opacity-45 disabled:hover:border-line-strong';

// Paginasi Kamusku dan Riwayat: "‹ Halaman [n] dari N ›". Angka di kolom bisa diketik lalu Enter;
// Esc atau keluar kolom mengembalikan angka halaman sekarang. Menempel di bawah layar (di HP tepat
// di atas bottom nav), jadi bisa dipakai tanpa menggulir ke akhir daftar.
export default function Paginasi({ halaman, totalHalaman, onPindah, label, ringkasan }) {
  const id = useId();
  const [draf, setDraf] = useState(null);
  const [salah, setSalah] = useState(false);

  if (totalHalaman <= 1) return ringkasan ? <p className="text-[13px] text-muted">{ringkasan}</p> : null;

  const mengedit = draf !== null;
  const batal = () => {
    setDraf(null);
    setSalah(false);
  };
  const kirim = () => {
    const n = bacaHalaman(draf ?? '', totalHalaman);
    if (n === null) {
      setSalah(true);
      return;
    }
    batal();
    if (n !== halaman) onPindah(n);
  };

  return (
    <nav
      aria-label={label}
      className="sticky bottom-[calc(max(12px,env(safe-area-inset-bottom))+68px)] z-20 -mx-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line bg-bg/95 px-4 py-2.5 backdrop-blur sm:bottom-0 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"
    >
      {/* Di HP jumlah data sudah tampil di atas daftar; bilah cukup satu baris. */}
      {ringkasan && <p className="hidden text-[13px] text-muted sm:block">{ringkasan}</p>}
      <div className="mx-auto flex items-center gap-3 sm:mr-0 sm:ml-auto">
        <button type="button" onClick={() => onPindah(halaman - 1)} disabled={halaman <= 1} aria-label="Halaman sebelumnya" className={panah}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <span className="flex items-center gap-2.5 text-sm font-semibold">
          <label htmlFor={id}>Halaman</label>
          <span className="relative flex">
            <input
              id={id}
              type="text"
              inputMode="numeric"
              enterKeyHint="go"
              autoComplete="off"
              aria-invalid={salah || undefined}
              aria-describedby={mengedit ? `${id}-total ${id}-pesan` : `${id}-total`}
              value={mengedit ? draf : String(halaman)}
              onFocus={(e) => {
                setDraf(String(halaman));
                e.target.select();
              }}
              onChange={(e) => {
                setDraf(e.target.value);
                setSalah(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  kirim();
                } else if (e.key === 'Escape') {
                  batal();
                  e.currentTarget.blur();
                }
              }}
              onBlur={batal}
              style={{ width: `${Math.max(64, String(totalHalaman).length * 12 + 28)}px` }}
              className={`h-11 rounded-[10px] border-[1.5px] bg-surface text-center font-head text-[15px] font-bold outline-none focus:ring-4 focus:ring-line ${
                salah ? 'border-accent' : 'border-ink'
              }`}
            />
            {mengedit && (
              <span
                id={`${id}-pesan`}
                role={salah ? 'alert' : undefined}
                className={`absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-[6px] bg-surface px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-[0_1px_0_var(--color-line)] ${salah ? 'text-accent' : 'text-muted'}`}
              >
                {salah ? `Pilih halaman 1 sampai ${totalHalaman}` : 'Tekan Enter untuk pindah'}
              </span>
            )}
          </span>
          <span id={`${id}-total`}>dari {totalHalaman}</span>
        </span>
        <button type="button" onClick={() => onPindah(halaman + 1)} disabled={halaman >= totalHalaman} aria-label="Halaman berikutnya" className={panah}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
