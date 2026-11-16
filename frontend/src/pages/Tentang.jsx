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

const INFO = [
  ['Sumber kamus', 'Dataset KBBI (Badan Pengembangan dan Pembinaan Bahasa)'],
  ['Dibuat untuk', 'Tugas Akhir Praktikum PPB 2026, Teknik Komputer UNDIP'],
  ['Pembuat', '[Nama dan NIM]'],
  ['Kode sumber', '[Link repo GitHub]'],
  ['Versi', '1.0.0'],
];

export default function Tentang() {
  return (
    <article className="mx-auto flex max-w-[640px] flex-col gap-6">
      <HeaderDetail judul="Tentang Aplikasi" kembaliKe="/profil" />

      <header className="flex flex-col gap-2">
        <h1 className="font-head text-[28px] font-extrabold">SambungKata</h1>
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
              <LetterTile huruf={String(i + 1)} ukuran="sm" className="h-8 w-7 text-[15px]" />
              <span className="pt-1 text-sm leading-relaxed">{a}</span>
            </li>
          ))}
        </ol>
      </section>

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

      <dl>
        {INFO.map(([l, v], i) => (
          <div key={l} className={`flex justify-between gap-4 py-3 ${i < INFO.length - 1 ? 'border-b border-line' : ''}`}>
            <dt className="shrink-0 text-[13px] text-muted">{l}</dt>
            <dd className="text-right text-[13px] font-bold">{v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
