// Rincian skor satu game, dipakai di layar hasil dan Detail Game.
const BARIS_RINCIAN = [
  ['huruf', (n) => `Huruf (${n} huruf)`],
  ['kata_baru', (n) => `Kata baru ter-unlock (${n})`],
  ['jawab_cepat', (n) => `Jawab cepat (${n})`],
  ['kunci_mati', (n) => `Kunci mati (${n})`],
  ['menang_bot', () => 'Menang lawan bot'],
];

export default function RincianSkor({ rincian, mode }) {
  const baris = BARIS_RINCIAN.filter(([k]) => rincian[k] && (k !== 'menang_bot' || mode === 'bot'));
  return (
    <dl className="flex flex-col rounded-[14px] border border-line bg-surface px-4">
      {baris.map(([k, label], i) => (
        <div key={k} className={`flex justify-between py-3 ${i < baris.length - 1 ? 'border-b border-line' : ''}`}>
          <dt className="text-[13px] text-muted">{label(rincian[k].jumlah)}</dt>
          <dd className="font-head text-sm font-bold">+{rincian[k].poin}</dd>
        </div>
      ))}
    </dl>
  );
}
