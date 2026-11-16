// Kata dalam rantai. 2 huruf awal (huruf yang "dipindahkan" dari kata sebelumnya)
// diberi keping kecil accent, sesuai aturan di DESIGN.md. Kata pembuka tanpa kepala.
export default function KataSambung({ kata, kepala = true, className = '', warna = 'text-ink' }) {
  if (!kata) return null;
  const awal = kepala ? kata.slice(0, 2) : '';
  const sisa = kepala ? kata.slice(2) : kata;
  return (
    <span className={`inline-flex items-center font-head font-bold ${warna} ${className}`}>
      {awal && <span className="rounded-[3px] bg-accent-soft px-px text-accent">{awal}</span>}
      {sisa}
    </span>
  );
}

// Keping sambungan yang duduk di antara dua kata (timeline Detail Game).
export function KepingSambungan({ pasangan, mati = false }) {
  return (
    <span
      className={`inline-flex rounded-[4px] px-1.5 py-0.5 font-head text-xs font-bold ${
        mati ? 'border border-line-strong bg-surface text-muted line-through' : 'bg-accent-soft text-accent'
      }`}
    >
      {pasangan}
    </span>
  );
}
