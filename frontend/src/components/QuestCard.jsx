import { Link } from 'react-router-dom';
import { BookPlus, Check, Gamepad2, Ruler, Swords, Trophy, Type, Link2 } from 'lucide-react';
import { Progres } from './ui.jsx';

export const IKON_QUEST = {
  main_game: Gamepad2,
  unlock_kata: BookPlus,
  huruf_awal: Type,
  panjang_kata: Ruler,
  skor: Trophy,
  kalahkan_bot: Swords,
  rantai: Link2,
};

// Kartu quest. ringkas = versi Beranda (satu baris).
export function QuestCard({ quest, onKlaim, mengklaim, ringkas = false }) {
  const Ikon = IKON_QUEST[quest.tipe] ?? Gamepad2;
  const bisaKlaim = quest.selesai && !quest.diklaim;
  const tombolKlaim = bisaKlaim && (
    <button
      type="button"
      onClick={() => onKlaim(quest)}
      disabled={mengklaim}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-teal px-3.5 font-head text-[13px] font-bold text-white hover:brightness-110 active:translate-y-px disabled:opacity-60"
    >
      {mengklaim ? 'Mengklaim...' : `Klaim +${quest.hadiah_xp} XP`}
    </button>
  );

  if (ringkas) {
    return (
      <li className={`flex items-center gap-3 rounded-[14px] border bg-surface p-3.5 ${bisaKlaim ? 'border-teal' : 'border-line-strong'}`}>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${quest.selesai ? 'bg-teal text-white' : 'border-[1.5px] border-line-strong'}`}
          aria-hidden="true"
        >
          {quest.selesai && <Check size={16} />}
        </span>
        <Link to={`/quest/${quest.id}`} className="flex min-w-0 flex-1 flex-col gap-1.5 hover:underline">
          <span className="text-sm font-semibold">{quest.judul}</span>
          <Progres nilai={quest.progres} total={quest.target} warna={quest.selesai ? 'bg-teal' : 'bg-ink'} tinggi="h-1.5" label={`Progres ${quest.judul}`} />
        </Link>
        {tombolKlaim || (
          <span className="flex shrink-0 flex-col items-end">
            <span className="font-head text-[13px] font-bold">{quest.diklaim ? 'Diklaim' : `+${quest.hadiah_xp} XP`}</span>
            {!quest.diklaim && (
              <span className="text-[11px] text-muted">
                {quest.progres}/{quest.target}
              </span>
            )}
          </span>
        )}
      </li>
    );
  }

  return (
    <li className={`flex flex-col gap-3 rounded-[20px] border bg-surface p-4 ${bisaKlaim ? 'border-2 border-teal' : 'border-line-strong'}`}>
      <div className="flex items-center gap-3">
        <span className={`flex size-[42px] shrink-0 items-center justify-center rounded-[10px] ${quest.selesai ? 'bg-teal text-white' : 'bg-bg text-ink'}`}>
          <Ikon size={20} aria-hidden="true" />
        </span>
        <Link to={`/quest/${quest.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5 hover:underline">
          <span className="font-head text-[15px] font-bold">{quest.judul}</span>
          <span className="text-xs text-muted">{quest.deskripsi}</span>
        </Link>
        <span className="shrink-0 rounded-[10px] bg-gold/20 px-2 py-1 font-head text-xs font-bold text-gold-ink">+{quest.hadiah_xp}</span>
      </div>
      <div className="flex items-center gap-3">
        <Progres nilai={quest.progres} total={quest.target} warna={quest.selesai ? 'bg-teal' : 'bg-ink'} label={`Progres ${quest.judul}`} />
        <span className="shrink-0 text-xs font-bold text-muted">
          {quest.progres}/{quest.target}
        </span>
      </div>
      {tombolKlaim}
      {quest.diklaim && <p className="text-xs font-semibold text-teal">Hadiah sudah diklaim</p>}
    </li>
  );
}
