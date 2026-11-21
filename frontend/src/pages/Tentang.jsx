import LetterTile from '../components/LetterTile.jsx';
import { HeaderDetail } from '../components/ui.jsx';

const ATURAN = [
  'Kata harus ada di kamus, satu kata, minimal 3 huruf.',
  'Kata berikutnya diawali 2 huruf terakhir kata sebelumnya: buku, kursi, siang.',
  'Kata yang sudah dipakai di game yang sama tidak boleh dipakai lagi.',
  'Kalau tidak ada lagi kata yang bisa menyambung, itu kunci mati dan rantai mulai lagi dengan kata acak.',
];

const SKOR = [
  ['Setiap huruf', '+1'],
  ['Kata baru ter-unlock', '+5'],
  ['Jawab kurang dari 5 detik', '+3'],
  ['Membuat kunci mati', '+10'],
  ['Menang lawan bot', '+20'],
  ['Salah jawab (Solo)', '-3 detik'],
];

// Isi baris boleh teks biasa atau daftar { teks, tautan?, ket? }. Sumber sama dengan backend/scripts/build-kata.js.
const INFO = [
  [
    'Sumber kamus',
    [
      { teks: 'KBBI, Badan Pengembangan dan Pembinaan Bahasa', ket: 'makna dan contoh, untuk keperluan akademik nonkomersial' },
      { teks: 'github.com/bachors/KBBI.sql', tautan: 'https://github.com/bachors/KBBI.sql' },
      { teks: 'FrequencyWords (lisensi MIT)', ket: 'daftar frekuensi untuk memilih kata yang umum' },
      { teks: 'github.com/hermitdave/FrequencyWords', tautan: 'https://github.com/hermitdave/FrequencyWords' },
    ],
  ],
  ['Pembuat', 'Muhammad Rafi Byzanorva Ramadhan (21120124130070)'],
  ['Kode sumber', [{ teks: 'github.com/rfibyzan/ta-sambungkata', tautan: 'https://github.com/rfibyzan/ta-sambungkata' }]],
  ['Versi', '1.0.0'],
];

function IsiInfo({ isi }) {
  if (typeof isi === 'string') return isi;
  return (
    <span className="flex flex-col items-end">
      {isi.map(({ teks, tautan, ket }) =>
        tautan ? (
          <a key={teks} href={tautan} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-teal underline-offset-2 hover:underline">
            {teks}
          </a>
        ) : (
          <span key={teks} className="pt-1">
            {teks}
            {ket && <span className="block text-xs font-medium text-muted">{ket}</span>}
          </span>
        ),
      )}
    </span>
  );
}

const MODE = [
  ['Solo', '60 detik total, salah jawab -3 detik.', 'text-accent'],
  ['Lawan Bot', '15 detik per giliran, 3 nyawa. Bot kalah kalau buntu.', 'text-ink'],
];

export default function Tentang() {
  return (
    <article className="flex flex-col gap-6">
      <HeaderDetail judul="Tentang Aplikasi" kembaliKe="/profil" />

      {/* >= 1024px: kiri pengenalan dan cara main, kanan skor dan info. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="font-head text-[28px] font-extrabold lg:text-[32px]">SambungKata</h1>
            <p className="text-sm leading-relaxed text-muted">
              Game rantai kata bahasa Indonesia. Sambung kata dari 2 huruf terakhir kata sebelumnya, dan setiap kata baru yang kamu temukan masuk ke Kamusku.
            </p>
          </header>

          <section aria-labelledby="judul-cara" className="flex flex-col gap-3">
            <h2 id="judul-cara" className="text-lg">
              Cara main
            </h2>
            <ol className="flex flex-col gap-3">
              {ATURAN.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <LetterTile huruf={String(i + 1)} ukuran="sm" className="h-8 w-7 shrink-0 text-[15px]" />
                  <span className="pt-1 text-sm leading-relaxed">{a}</span>
                </li>
              ))}
            </ol>
          </section>

          <dl className="grid gap-4 rounded-[14px] border border-line bg-surface p-5 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-line">
            {MODE.map(([mode, ket, warna], i) => (
              <div key={mode} className={`flex flex-col gap-1 ${i ? 'sm:pl-5' : 'sm:pr-5'}`}>
                <dt className={`font-head text-[15px] font-bold ${warna}`}>{mode}</dt>
                <dd className="text-[13px] leading-relaxed">{ket}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="judul-skor" className="flex flex-col gap-2.5">
            <h2 id="judul-skor" className="text-lg">
              Cara menghitung skor
            </h2>
            <dl className="rounded-[14px] border border-line bg-surface px-4">
              {SKOR.map(([l, v], i) => (
                <div key={l} className={`flex justify-between py-2.5 ${i < SKOR.length - 1 ? 'border-b border-line' : ''}`}>
                  <dt className="text-[13px] text-muted">{l}</dt>
                  <dd className="font-head text-sm font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="judul-info" className="flex flex-col gap-1">
            <h2 id="judul-info" className="text-lg">
              Info aplikasi
            </h2>
            <dl>
              {INFO.map(([l, isi], i) => (
                <div key={l} className={`flex justify-between gap-4 py-3 ${i < INFO.length - 1 ? 'border-b border-line' : ''}`}>
                  <dt className="shrink-0 text-[13px] text-muted">{l}</dt>
                  <dd className="min-w-0 text-right text-[13px] font-bold break-words">
                    <IsiInfo isi={isi} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </article>
  );
}
