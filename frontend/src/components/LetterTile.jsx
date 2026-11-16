const UKURAN = {
  sm: 'h-9 w-8 text-lg rounded-[8px]',
  md: 'h-12 w-10 text-2xl rounded-[10px]',
  lg: 'h-16 w-14 text-[32px] rounded-[10px]',
};

// Keping huruf: motif utama SambungKata.
// hot = keping sambungan (accent), kosong = keping bertanda tanya (terkunci).
export default function LetterTile({ huruf, ukuran = 'md', hot = false, kosong = false, miring = 0, className = '' }) {
  const gaya = kosong
    ? 'border-2 border-dashed border-line-strong text-muted bg-transparent'
    : hot
      ? 'border-[1.5px] border-accent-shadow bg-accent text-white shadow-[0_3px_0_var(--color-accent-shadow)]'
      : 'border-[1.5px] border-line bg-surface text-ink shadow-[0_3px_0_var(--color-line)]';
  return (
    <span
      aria-hidden="true"
      style={miring ? { transform: `rotate(${miring}deg)` } : undefined}
      className={`inline-flex shrink-0 items-center justify-center font-head font-bold uppercase ${UKURAN[ukuran]} ${gaya} ${className}`}
    >
      {huruf}
    </span>
  );
}

export function DeretKeping({ teks, ukuran = 'md', hot = [], className = '', label }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="img" aria-label={label ?? teks}>
      {[...teks].map((h, i) => (
        <LetterTile key={i} huruf={h} ukuran={ukuran} hot={hot.includes(i)} />
      ))}
    </div>
  );
}
