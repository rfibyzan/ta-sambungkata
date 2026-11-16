import { Link } from 'react-router-dom';
import LetterTile from './LetterTile.jsx';

const MIRING = [4, -3, 5, -4];

// State kosong dan error: keping huruf, judul, penyebab, dan satu aksi.
export default function StateView({ keping = '???', hot = -1, judul, pesan, aksi, className = '' }) {
  const AksiTag = aksi?.ke ? Link : 'button';
  const Ikon = aksi?.ikon;
  return (
    <section className={`flex flex-col items-center gap-3.5 px-5 py-10 text-center ${className}`} role={aksi?.error ? 'alert' : undefined}>
      <div className="flex gap-1.5 pb-2">
        {[...keping].map((h, i) => (
          <LetterTile key={i} huruf={h} kosong={h === '?'} hot={i === hot} miring={MIRING[i % 4]} />
        ))}
      </div>
      <h2 className="text-xl">{judul}</h2>
      {pesan && <p className="max-w-xs text-sm leading-relaxed text-muted">{pesan}</p>}
      {aksi && (
        <AksiTag
          {...(aksi.ke ? { to: aksi.ke } : { type: 'button', onClick: aksi.onClick })}
          className={`mt-1 inline-flex h-11 items-center gap-2 rounded-[14px] px-5 font-head text-sm font-bold text-white transition-transform active:translate-y-0.5 ${
            aksi.gelap ? 'bg-ink hover:bg-ink/90' : 'bg-accent shadow-[0_3px_0_var(--color-accent-shadow)] hover:brightness-110'
          }`}
        >
          {Ikon && <Ikon size={16} aria-hidden="true" />}
          {aksi.label}
        </AksiTag>
      )}
    </section>
  );
}
