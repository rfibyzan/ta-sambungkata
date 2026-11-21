import { Link } from 'react-router-dom';
import { daftarSkorMode } from '../lib/skorMode.js';

export default function SkorPerMode({ skor, tautanPeringkat = false }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-3">
      {daftarSkorMode(skor).map(({ mode, label, nilai, teks }) => (
        <li key={mode} className="flex min-w-0 flex-col gap-1 rounded-[12px] bg-bg p-3 sm:p-3.5">
          <span className="text-xs font-semibold text-muted">{label}</span>
          {nilai > 0 ? (
            <span className={`font-head text-2xl leading-tight font-extrabold sm:text-[28px] ${mode === 'solo' ? 'text-accent' : 'text-ink'}`}>{teks}</span>
          ) : (
            <span className="font-head text-sm leading-tight font-bold text-muted sm:text-base">{teks}</span>
          )}
          {tautanPeringkat && (
            <Link to={`/peringkat?mode=${mode}`} className="-mx-1 mt-auto flex min-h-11 items-center px-1 text-[11px] font-semibold text-teal hover:underline">
              Lihat peringkat
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
