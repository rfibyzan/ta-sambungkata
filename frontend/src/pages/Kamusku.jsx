import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { kamus } from '../api/users.js';
import { pesanError } from '../api/axios.js';
import { angka } from '../lib/format.js';
import StateView from '../components/StateView.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { JudulHalaman, Progres } from '../components/ui.jsx';

const HURUF = 'abcdefghijklmnopqrstuvwxyz'.split('');
const LIMIT = 30;

function KartuKata({ kata }) {
  if (kata.terkunci) {
    return (
      <li
        className="flex h-[116px] flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] border-dashed border-line-strong text-muted"
        aria-label={`Kata terkunci, diawali huruf ${kata.huruf_awal}, ${kata.panjang} huruf`}
      >
        <Lock size={16} aria-hidden="true" />
        <span className="font-head text-lg font-bold tracking-widest" aria-hidden="true">
          {kata.huruf_awal}
          {'?'.repeat(Math.min(kata.panjang - 1, 6))}
        </span>
        <span className="text-[11px]" aria-hidden="true">
          {kata.panjang} huruf
        </span>
      </li>
    );
  }
  return (
    <li>
      <Link
        to={`/kamus/${kata.id}`}
        className="flex h-[116px] flex-col gap-1 overflow-hidden rounded-[14px] border border-line-strong bg-surface p-3.5 transition-colors hover:border-ink"
      >
        <span className="font-head text-xl font-bold">{kata.kata}</span>
        <span className="text-[11px] text-accent italic">{kata.jenis}</span>
        <span className="line-clamp-2 text-xs leading-snug text-muted">{kata.makna}</span>
      </Link>
    </li>
  );
}

export default function Kamusku() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const huruf = params.get('huruf') ?? 'semua';
  const cari = params.get('cari') ?? '';
  const [ketik, setKetik] = useState(cari);
  const [hasil, setHasil] = useState({ data: [], meta: null, progres: null });
  // Halaman selalu kembali ke 1 saat filter berubah (dihitung saat render, bukan lewat effect).
  const kunciFilter = `${huruf}|${cari}`;
  const [posisi, setPosisi] = useState({ kunci: kunciFilter, halaman: 1 });
  const halaman = posisi.kunci === kunciFilter ? posisi.halaman : 1;
  const setHalaman = (fn) => setPosisi({ kunci: kunciFilter, halaman: fn(halaman) });
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState(null);
  const [percobaan, setPercobaan] = useState(0);

  // Debounce pencarian supaya tidak mengirim request setiap ketukan.
  useEffect(() => {
    const t = setTimeout(() => {
      const nilai = ketik.trim().toLowerCase().replace(/[^a-z]/g, '');
      if (nilai === cari) return;
      setParams((p) => {
        const baru = new URLSearchParams(p);
        if (nilai) baru.set('cari', nilai);
        else baru.delete('cari');
        return baru;
      }, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [ketik, cari, setParams]);

  useEffect(() => {
    let batal = false;
    setMemuat(true);
    setError(null);
    kamus(user.id, { huruf: huruf === 'semua' ? undefined : huruf, search: cari || undefined, page: halaman, limit: LIMIT })
      .then((r) => {
        if (batal) return;
        setHasil((lama) => ({ ...r, data: halaman === 1 ? r.data : [...lama.data, ...r.data] }));
      })
      .catch((err) => !batal && setError(pesanError(err)))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [user.id, huruf, cari, halaman, percobaan]);

  const pilihHuruf = (h) =>
    setParams((p) => {
      const baru = new URLSearchParams(p);
      if (h === 'semua') baru.delete('huruf');
      else baru.set('huruf', h);
      return baru;
    });

  const { progres, meta, data } = hasil;
  const awal = memuat && halaman === 1;
  const kosongTotal = !awal && !error && progres?.terkumpul === 0 && !cari;

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman>Kamusku</JudulHalaman>

      <section aria-label="Progres koleksi" className="flex flex-col gap-2">
        {progres ? (
          <>
            <div className="flex items-end justify-between">
              <p className="flex items-end gap-1">
                <span className="font-head text-[22px] leading-none font-bold">{angka(progres.terkumpul)}</span>
                <span className="text-[13px] text-muted">/ {angka(progres.total)} kata</span>
              </p>
              <span className="text-[13px] font-bold text-teal">{String(progres.persen).replace('.', ',')}%</span>
            </div>
            <Progres nilai={progres.terkumpul} total={progres.total} warna="bg-teal" label="Progres koleksi kata" />
          </>
        ) : (
          <Skeleton className="h-9 w-full" />
        )}
      </section>

      {kosongTotal ? (
        <StateView
          keping="????"
          judul="Kamusmu masih kosong"
          pesan="Setiap kata valid yang kamu mainkan akan ter-unlock dan tersimpan di sini."
          aksi={{ label: 'Main game pertama', ke: '/main' }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="cari-kamus" className="text-[13px] font-bold">
              Cari di koleksimu
            </label>
            <div className="flex h-12 items-center gap-2.5 rounded-[14px] border border-line-strong bg-surface px-3.5 focus-within:outline-3 focus-within:outline-ink">
              <Search size={18} className="text-muted" aria-hidden="true" />
              <input
                id="cari-kamus"
                type="search"
                value={ketik}
                onChange={(e) => setKetik(e.target.value)}
                placeholder="Ketik kata, mis. buku"
                autoComplete="off"
                autoCapitalize="none"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {ketik && (
                <button type="button" onClick={() => setKetik('')} aria-label="Hapus pencarian" className="-mr-2 flex size-11 items-center justify-center text-muted hover:text-ink">
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {!cari && (
            <div role="group" aria-label="Filter huruf awal" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {['semua', ...HURUF].map((h) => {
                const aktif = huruf === h;
                return (
                  <button
                    key={h}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => pilihHuruf(h)}
                    className={`flex h-11 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold transition-colors ${
                      h === 'semua' ? 'px-3.5' : 'w-11 uppercase'
                    } ${aktif ? 'bg-ink text-white' : 'border border-line-strong bg-surface hover:border-ink'}`}
                  >
                    {h === 'semua' ? 'Semua' : h}
                  </button>
                );
              })}
            </div>
          )}

          {progres && (
            <div className="flex justify-between text-[13px]">
              <span className="font-bold">{cari ? `Hasil untuk "${cari}"` : huruf === 'semua' ? 'Semua kata' : `Huruf ${huruf.toUpperCase()}`}</span>
              <span className="text-muted">
                {cari
                  ? `${meta?.total ?? 0} kata`
                  : huruf === 'semua'
                    ? `${angka(progres.terkumpul)} dari ${angka(progres.total)}`
                    : `${angka(progres.terkumpul_huruf)} dari ${angka(progres.total_huruf)}`}
              </span>
            </div>
          )}

          {error && halaman === 1 ? (
            <StateView
              keping="OFF"
              hot={1}
              judul="Gagal memuat Kamusku"
              pesan={`${error} Kata yang sudah ter-unlock tetap aman.`}
              aksi={{ label: 'Coba lagi', onClick: () => setPercobaan((n) => n + 1), gelap: true, error: true }}
            />
          ) : awal ? (
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Memuat kata">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-[116px] rounded-[14px]" />
                </li>
              ))}
            </ul>
          ) : cari && data.length === 0 ? (
            <StateView
              keping={`${cari.slice(0, 2)}??`}
              judul={`"${cari}" tidak ada di koleksimu`}
              pesan="Kata ini belum ter-unlock atau tidak ada di kamus. Mainkan game untuk menemukannya."
              aksi={{ label: 'Hapus pencarian', onClick: () => setKetik(''), gelap: true }}
            />
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {data.map((k) => (
                  <KartuKata key={k.id} kata={k} />
                ))}
              </ul>
              {error && <p role="alert" className="text-center text-[13px] font-semibold text-accent">{error}</p>}
              {meta && halaman < meta.total_halaman && (
                <button
                  type="button"
                  onClick={() => setHalaman((h) => h + 1)}
                  disabled={memuat}
                  className="mx-auto flex h-11 items-center rounded-[10px] border border-line-strong bg-surface px-5 text-sm font-bold hover:border-ink disabled:opacity-60"
                >
                  {memuat ? 'Memuat...' : 'Muat lebih banyak'}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
