// Hiasan Beranda di layar sangat lebar: rantai keping KATA → TAMU di ruang kosong kiri dan kanan.
// Hanya hiasan: di belakang konten, tidak bisa diklik, disembunyikan dari pembaca layar,
// dan selalu berjarak minimal 24px dari tepi kolom konten (lebar 1100px, sidebar 232px).

// Semua ukuran memakai cqw (lebar lapisan fixed ini), bukan vw: vw ikut menghitung scrollbar
// klasik Windows (±17px) sehingga keping bisa masuk ke belakang sidebar atau terpotong di kanan.
// Lebar ruang kosong per sisi = (100cqw - 232px - 1100px) / 2. Keping (lebar u, digeser sampai
// 0.35u) harus muat di ruang itu setelah jarak 32px dari konten (24px + sudut keping yang miring)
// dan sisa ruang di sisi luar.
const UKURAN = 'clamp(44px, calc(((100cqw - 1332px) / 2 - 48px) / 1.4), 84px)';

const KIRI = { kata: 'kata', sambungan: 0 };
const KANAN = { kata: 'tamu', sambungan: 2 };
const MIRING = [-6, 4, -3, 5];

function Kolom({ kata, sambungan, sisi }) {
  return (
    <div
      className={`absolute top-[16vh] flex flex-col gap-[2.4vh] ${sisi === 'kiri' ? 'items-end' : 'items-start'}`}
      style={sisi === 'kiri' ? { right: 'calc(50cqw + 466px)' } : { left: 'calc(50cqw + 698px)' }}
    >
      {[...kata].map((h, i) => {
        const sambung = i < sambungan;
        // Geser bergantian menjauhi konten, tidak pernah mendekat.
        const geser = i % 2 ? 'calc(var(--u) * 0.35)' : '0px';
        return (
          <span
            key={i}
            className={`flex items-center justify-center rounded-[14px] border-[1.5px] font-head font-extrabold uppercase ${
              sambung ? 'border-accent/30 bg-accent-soft text-accent' : 'border-line bg-surface text-ink/45'
            }`}
            style={{
              width: 'var(--u)',
              height: 'calc(var(--u) * 1.16)',
              fontSize: 'calc(var(--u) * 0.5)',
              transform: `rotate(${MIRING[i % MIRING.length]}deg)`,
              boxShadow: `0 4px 0 var(--color-${sambung ? 'accent-soft' : 'line'})`,
              [sisi === 'kiri' ? 'marginRight' : 'marginLeft']: geser,
            }}
          >
            {h}
          </span>
        );
      })}
    </div>
  );
}

// Catatan: lapisan ini fixed terhadap layar. Jika kelak ada transform/animasi pada <main> atau
// pembungkus Beranda, posisi fixed akan ikut elemen itu dan perhitungan di atas tidak berlaku lagi.
// Muncul mulai 1560px (bukan 1536px) supaya tetap muat walau scrollbar memakan ±17px.
export default function KepingLatar() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden min-[1560px]:block"
      style={{ '--u': UKURAN, containerType: 'inline-size' }}
    >
      <Kolom {...KIRI} sisi="kiri" />
      <Kolom {...KANAN} sisi="kanan" />
    </div>
  );
}
