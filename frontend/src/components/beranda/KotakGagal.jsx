import { RotateCcw } from 'lucide-react';

// State error untuk bagian di Beranda: sebut apa yang gagal dan beri tombol coba lagi.
export default function KotakGagal({ pesan, onUlang }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-line-strong bg-surface p-4">
      <p className="text-sm text-muted">{pesan}</p>
      <button
        type="button"
        onClick={onUlang}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] bg-ink px-4 text-sm font-bold text-white hover:bg-ink/90"
      >
        <RotateCcw size={14} aria-hidden="true" /> Coba lagi
      </button>
    </div>
  );
}
