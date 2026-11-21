import { Bot, Heart, HeartCrack } from 'lucide-react';
import { Avatar } from '../ui.jsx';

const NYAWA_AWAL = 3;

// Hati yang baru hilang diberi animasi pecah. key={pukulan} memutar ulang animasinya.
function HatiNyawa({ jumlah, pukulan }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`Nyawamu: ${jumlah} dari ${NYAWA_AWAL}`}>
      {Array.from({ length: NYAWA_AWAL }, (_, i) =>
        i < jumlah ? (
          <Heart key={i} size={14} className="fill-accent text-accent" aria-hidden="true" />
        ) : (
          <HeartCrack key={i === jumlah ? `pecah-${pukulan}` : i} size={14} className={`text-accent ${i === jumlah && pukulan ? 'animate-hati-pecah' : 'opacity-60'}`} aria-hidden="true" />
        ),
      )}
    </span>
  );
}

function TitikBerpikir({ kurangiGerak }) {
  if (kurangiGerak) return <span className="text-xs font-semibold text-muted">Bot sedang berpikir</span>;
  return (
    <span className="flex gap-1" role="img" aria-label="Bot sedang berpikir">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-titik rounded-full bg-ink" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  );
}

// giliran: 'kamu' | 'bot'. statusBot: null | { fase: 'berpikir' | 'keping' | 'alasan' | 'kalah', teks? }.
// tandaMerah: kartu Kamu berbingkai accent dengan lencana -1 setelah nyawa berkurang.
export default function KartuLawan({ user, nyawa, tingkat, giliran, statusBot, pukulan, tandaMerah, kurangiGerak }) {
  const bingkaiKamu = tandaMerah ? 'border-2 border-accent bg-accent-soft' : giliran === 'kamu' ? 'border-2 border-ink bg-surface' : 'border border-line bg-transparent';
  const bingkaiBot = giliran === 'bot' ? 'border-2 border-ink bg-surface' : 'border border-line bg-transparent';
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <div
          key={`kamu-${pukulan}`}
          className={`flex min-h-[52px] items-center gap-2 rounded-[12px] px-2.5 py-2 transition-colors ${bingkaiKamu} ${pukulan && tandaMerah && !kurangiGerak ? 'animate-getar' : ''}`}
        >
          <Avatar user={user} ukuran={28} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] leading-tight font-bold">Kamu</span>
            <HatiNyawa jumlah={nyawa} pukulan={pukulan} />
          </div>
        </div>
        {tandaMerah && (
          <span className="absolute -top-2 right-2 rounded-[6px] bg-accent px-1.5 py-0.5 font-head text-xs font-bold text-white" aria-hidden="true">
            -1
          </span>
        )}
        {nyawa === 1 && (
          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
            Nyawa terakhir
          </span>
        )}
      </div>
      <span className="font-head text-xs font-extrabold text-muted">VS</span>
      <div className={`flex min-h-[52px] flex-1 items-center gap-2 rounded-[12px] px-2.5 py-2 transition-colors ${bingkaiBot}`}>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
          <Bot size={15} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px] leading-tight font-bold">Bot {tingkat === 'sulit' ? 'Sulit' : 'Mudah'}</span>
          {statusBot?.fase === 'berpikir' && <TitikBerpikir kurangiGerak={kurangiGerak} />}
          {statusBot?.teks && <span className="text-xs leading-snug font-semibold text-accent">{statusBot.teks}</span>}
        </div>
      </div>
    </div>
  );
}
