import { useEffect, useRef } from 'react';
import { Delete } from 'lucide-react';
import { BARIS_KEYBOARD } from '../../lib/keyboardLayar.js';

const TAHAN_MS = 400;
const ULANG_MS = 80;

// Tombol keping: turun dan berlatar accent-soft saat ditekan, atau saat tombol fisiknya ditekan (menyala).
const keping =
  'flex shrink-0 items-center justify-center rounded-[8px] border border-line-strong bg-surface font-head font-extrabold text-ink uppercase shadow-[0_3px_0_var(--color-line-strong)] transition-[transform,box-shadow,background-color] duration-75 select-none touch-manipulation active:translate-y-[3px] active:bg-accent-soft active:shadow-none disabled:opacity-45 disabled:active:translate-y-0 disabled:active:bg-surface disabled:active:shadow-[0_3px_0_var(--color-line-strong)]';
const nyala = 'translate-y-[3px] bg-accent-soft shadow-none';

// Fokus tetap di kolom input tersembunyi, jadi keyboard fisik dan pembaca layar tetap bekerja.
const tahanFokus = (e) => e.preventDefault();

export default function KeyboardLayar({ onHuruf, onHapus, bisaKirim, labelKirim, terkunci, menyala }) {
  const ulang = useRef(null);
  const henti = () => {
    clearTimeout(ulang.current?.tunda);
    clearInterval(ulang.current?.jalan);
    ulang.current = null;
  };
  useEffect(() => henti, []);

  // Tahan hapus: hapus sekali, lalu berulang setelah 400ms sampai jari diangkat atau keluar dari tombol.
  const mulaiHapus = (e) => {
    e.preventDefault();
    if (terkunci) return;
    onHapus();
    henti();
    ulang.current = { tunda: setTimeout(() => (ulang.current.jalan = setInterval(onHapus, ULANG_MS)), TAHAN_MS) };
  };

  const ukuran = 'h-[42px] w-[calc((100%-9*var(--celah))/10)] text-[17px] sm:h-12 sm:text-lg';
  return (
    <div className="flex flex-col gap-2 [--celah:4px] sm:gap-2.5 sm:[--celah:6px]" aria-label="Keyboard" role="group">
      {BARIS_KEYBOARD.map((baris, r) => (
        <div key={baris} className="flex justify-center gap-[var(--celah)]">
          {[...baris].map((h) => (
            <button
              key={h}
              type="button"
              disabled={Boolean(terkunci)}
              onPointerDown={tahanFokus}
              onClick={() => onHuruf(h)}
              className={`${keping} ${ukuran} ${menyala === h ? nyala : ''}`}
            >
              {h}
            </button>
          ))}
          {r === 2 && (
            <button
              type="button"
              aria-label="Hapus huruf terakhir"
              disabled={Boolean(terkunci)}
              onPointerDown={mulaiHapus}
              onPointerUp={henti}
              onPointerLeave={henti}
              onPointerCancel={henti}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onHapus())}
              className={`${keping} h-[42px] w-[calc((100%-9*var(--celah))/10*1.5)] sm:h-12 ${menyala === 'backspace' ? nyala : ''}`}
            >
              <Delete size={22} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={!bisaKirim}
        onPointerDown={tahanFokus}
        className={`flex h-12 w-full items-center justify-center rounded-[12px] bg-accent font-head text-base font-bold text-white shadow-[0_4px_0_var(--color-accent-shadow)] transition-[transform,box-shadow] duration-75 select-none touch-manipulation hover:brightness-110 active:translate-y-1 active:shadow-none disabled:bg-line-strong disabled:shadow-none disabled:hover:brightness-100 ${menyala === 'enter' && bisaKirim ? 'translate-y-1 shadow-none' : ''}`}
      >
        {labelKirim}
      </button>
    </div>
  );
}
