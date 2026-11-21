import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Gamepad2, Timer } from 'lucide-react';
import { riwayat } from '../api/games.js';
import { pesanError } from '../api/axios.js';
import { angka, jamWib, labelHari, labelMode } from '../lib/format.js';
import { useHalamanUrl } from '../lib/useHalamanUrl.js';
import Paginasi from '../components/Paginasi.jsx';
import StateView from '../components/StateView.jsx';
import { SkeletonBaris } from '../components/Skeleton.jsx';
import { HeaderDetail, Pil } from '../components/ui.jsx';

function kelompokkan(daftar) {
  const grup = [];
  for (const g of daftar) {
    const label = labelHari(g.started_at);
    const terakhir = grup.at(-1);
    if (terakhir?.label === label) terakhir.isi.push(g);
    else grup.push({ label, isi: [g] });
  }
  return grup;
}

export default function Riwayat() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [halaman, pindahHalaman] = useHalamanUrl(meta?.total_halaman);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState(null);
  const [percobaan, setPercobaan] = useState(0);

  useEffect(() => {
    let batal = false;
    setMemuat(true);
    setError(null);
    riwayat(halaman)
      .then((r) => {
        if (batal) return;
        setData(r.data);
        setMeta(r.meta);
      })
      .catch((err) => !batal && setError(pesanError(err)))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [halaman, percobaan]);

  return (
    <div className="flex flex-col gap-5">
      <HeaderDetail judul="Riwayat Permainan" kembaliKe="/profil" />

      {memuat ? (
        <SkeletonBaris jumlah={5} />
      ) : error ? (
        <StateView keping="OFF" hot={1} judul="Gagal memuat riwayat" pesan={`${error} Riwayatmu tidak hilang.`} aksi={{ label: 'Coba lagi', onClick: () => setPercobaan((n) => n + 1), gelap: true, error: true }} />
      ) : data.length === 0 ? (
        <StateView
          keping="BEL?"
          hot={0}
          judul="Belum ada permainan"
          pesan="Riwayat game Solo dan Lawan Bot akan muncul di sini setelah kamu selesai bermain."
          aksi={{ label: 'Mulai main', ke: '/main', ikon: Gamepad2 }}
        />
      ) : (
        <>
          {kelompokkan(data).map((grup) => (
            <section key={grup.label} aria-label={grup.label} className="flex flex-col gap-2">
              <h2 className="font-body text-[13px] font-bold text-muted">{grup.label}</h2>
              <ul className="grid gap-2 lg:grid-cols-2 lg:gap-4 min-[1600px]:grid-cols-3">
                {grup.isi.map((g) => {
                  const solo = g.mode === 'solo';
                  const Ikon = solo ? Timer : Bot;
                  return (
                    <li key={g.id}>
                      <Link to={`/riwayat/${g.id}`} className="keping-tekan flex items-center gap-3 rounded-[14px] border border-line-strong bg-surface p-3.5 hover:border-ink">
                        <span className={`flex size-[42px] shrink-0 items-center justify-center rounded-[10px] ${solo ? 'bg-accent-soft text-accent' : 'bg-teal-soft text-teal'}`}>
                          <Ikon size={20} aria-hidden="true" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex items-center gap-1.5">
                            <span className="font-head text-[15px] font-bold">{labelMode(g.mode, g.tingkat)}</span>
                            {g.status === 'menang' && <Pil className="bg-teal-soft text-teal">Menang</Pil>}
                            {g.status === 'kalah' && <Pil className="bg-accent-soft text-accent">Kalah</Pil>}
                          </span>
                          <span className="text-xs text-muted">
                            {jamWib(g.started_at)} · {g.jumlah_kata} kata
                          </span>
                        </span>
                        <span className="flex flex-col items-end">
                          <span className="font-head text-xl font-bold">{g.skor}</span>
                          <span className="text-[11px] text-muted">poin</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {meta && (
            <Paginasi
              halaman={halaman}
              totalHalaman={meta.total_halaman}
              onPindah={pindahHalaman}
              label="Halaman riwayat"
              ringkasan={`${angka(meta.total)} game`}
            />
          )}
          <p className="text-center text-xs text-muted">Buka detail game untuk menghapus riwayat.</p>
        </>
      )}
    </div>
  );
}
