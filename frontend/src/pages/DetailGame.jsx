import { Fragment, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bot, Trash2 } from 'lucide-react';
import { detail, hapus } from '../api/games.js';
import { pesanError } from '../api/axios.js';
import { useMuat } from '../lib/useMuat.js';
import { durasi, jamWib, labelHari, labelMode } from '../lib/format.js';
import KataSambung, { KepingSambungan } from '../components/KataSambung.jsx';
import StateView from '../components/StateView.jsx';
import RincianSkor from '../components/RincianSkor.jsx';
import Skeleton, { SkeletonBaris } from '../components/Skeleton.jsx';
import { HeaderDetail, Pil, Sheet, TombolIkon, Tombol } from '../components/ui.jsx';

function Titik({ w, nomor }) {
  if (w.pemain === 'user') {
    return (
      <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-teal font-head text-[11px] font-bold text-white" aria-label="Kamu">
        {nomor}
      </span>
    );
  }
  return (
    <span
      className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong bg-surface text-muted"
      aria-label={w.pemain === 'bot' ? 'Bot' : 'Kata dari sistem'}
    >
      <Bot size={14} aria-hidden="true" />
    </span>
  );
}

// Rantai kata gaya timeline: keping sambungan duduk di atas garis di antara dua kata.
function Timeline({ rantai }) {
  const nomor = rantai.map((_, i) => rantai.slice(0, i + 1).filter((w) => w.pemain === 'user').length);
  return (
    <ol className="relative flex flex-col">
      <span className="absolute top-3.5 bottom-3.5 left-[13px] w-0.5 bg-line-strong" aria-hidden="true" />
      {rantai.map((w, i) => {
        const sebelumnya = rantai[i - 1];
        const menyambung = sebelumnya && w.pemain !== 'sistem' && !sebelumnya.kunci_mati;
        const putus = sebelumnya?.kunci_mati;
        return (
          <Fragment key={w.urutan}>
            {menyambung && (
              <li className="flex h-[30px] items-center gap-3" aria-hidden="true">
                <span className="relative z-10 flex w-7 justify-center">
                  <KepingSambungan pasangan={w.kata.kata.slice(0, 2)} />
                </span>
              </li>
            )}
            {putus && (
              <li className="flex h-[30px] items-center gap-3">
                <span className="relative z-10 flex w-7 justify-center">
                  <KepingSambungan pasangan={sebelumnya.kata.kata.slice(-2)} mati />
                </span>
                <span className="text-xs font-semibold text-muted">
                  Tidak ada kata berawalan "{sebelumnya.kata.kata.slice(-2)}", rantai diulang
                </span>
              </li>
            )}
            <li className="flex items-start gap-3 py-1">
              <Titik w={w} nomor={nomor[i]} />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-0.5">
                <div className="flex flex-col gap-1">
                  <KataSambung kata={w.kata.kata} kepala={Boolean(menyambung)} warna={w.pemain === 'user' ? 'text-ink' : 'text-muted'} className="text-[17px]" />
                  {w.pemain === 'sistem' && <span className="text-[11px] text-muted">{i === 0 ? 'Kata pembuka' : 'Kata acak baru'}</span>}
                  {w.baru && <Pil className="w-fit bg-gold/20 text-gold-ink">Kata baru</Pil>}
                  {w.kunci_mati && <Pil className="w-fit bg-accent-soft text-accent">Kunci mati!</Pil>}
                </div>
                {w.pemain === 'user' && <span className="font-head text-sm font-bold text-teal">+{w.poin}</span>}
              </div>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

export default function DetailGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { data, error, memuat, ulang } = useMuat(() => detail(gameId), [gameId]);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [errorHapus, setErrorHapus] = useState(null);

  async function hapusGame() {
    setMenghapus(true);
    setErrorHapus(null);
    try {
      await hapus(gameId);
      navigate('/riwayat', { replace: true });
    } catch (err) {
      setErrorHapus(pesanError(err));
      setMenghapus(false);
    }
  }

  if (memuat) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true" aria-label="Memuat detail game">
        <HeaderDetail judul="Detail Game" kembaliKe="/riwayat" />
        <Skeleton className="h-24 rounded-[20px]" />
        <SkeletonBaris jumlah={5} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <HeaderDetail judul="Detail Game" kembaliKe="/riwayat" />
        {error.status === 404 || error.status === 403 ? (
          <StateView keping="404" hot={0} judul="Game tidak ditemukan" pesan="Tautan ini mungkin salah atau riwayat game ini sudah dihapus." aksi={{ label: 'Ke riwayat', ke: '/riwayat', gelap: true }} />
        ) : (
          <StateView keping="OFF" hot={1} judul="Detail game belum bisa dimuat" pesan={error.pesan} aksi={{ label: 'Coba lagi', onClick: ulang, gelap: true, error: true }} />
        )}
      </div>
    );
  }

  const { game, rincian_skor: rincian, rantai } = data;
  const berjalan = game.status === 'berjalan';
  const kataBaru = rantai.filter((w) => w.pemain === 'user' && w.baru);

  return (
    <div className="flex flex-col gap-5">
      <HeaderDetail
        judul="Detail Game"
        kembaliKe="/riwayat"
        kanan={!berjalan ? <TombolIkon ikon={Trash2} label="Hapus riwayat game ini" onClick={() => setKonfirmasi(true)} /> : undefined}
      />

      {/* >= 1024px: kiri ringkasan, rincian skor, dan kata baru (menempel saat digulir); kanan rantai kata. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,520fr)_minmax(0,640fr)] lg:items-start lg:gap-12">
      <div className="flex flex-col gap-5 lg:sticky lg:top-8 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto">
      <section className="flex items-center justify-between gap-3 rounded-[20px] border border-line bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <Pil className={game.mode === 'solo' ? 'bg-accent-soft text-accent' : 'bg-teal-soft text-teal'}>{labelMode(game.mode, game.tingkat)}</Pil>
            {game.status === 'menang' && <Pil className="bg-ink text-white">Menang</Pil>}
            {game.status === 'kalah' && <Pil className="bg-accent text-white">Kalah</Pil>}
            {berjalan && <Pil className="bg-gold/20 text-gold-ink">Berjalan</Pil>}
          </div>
          <p className="text-xs text-muted">
            {labelHari(game.started_at)}, {jamWib(game.started_at)}
            {data.durasi_ms ? ` · ${durasi(data.durasi_ms)}` : ''}
          </p>
        </div>
        <p className="flex flex-col items-end">
          <span className="font-head text-[32px] leading-none font-extrabold">{game.skor}</span>
          <span className="text-[11px] text-muted">poin</span>
        </p>
      </section>

      <dl className="grid grid-cols-3 gap-2">
        {[
          [game.jumlah_kata, 'kata'],
          [rincian.kata_baru.jumlah, 'unlock baru'],
          [rincian.kunci_mati.jumlah, 'kunci mati'],
        ].map(([v, l]) => (
          <div key={l} className="flex flex-col rounded-[10px] border border-line px-3 py-2.5">
            <dd className="font-head text-lg font-bold">{v}</dd>
            <dt className="text-[11px] text-muted">{l}</dt>
          </div>
        ))}
      </dl>

      <section aria-labelledby="judul-rincian" className="flex flex-col gap-2.5">
        <h2 id="judul-rincian" className="text-base">
          Rincian skor
        </h2>
        <RincianSkor rincian={rincian} mode={game.mode} />
      </section>

      {kataBaru.length > 0 && (
        <section aria-labelledby="judul-kata-baru" className="flex flex-col gap-2.5">
          <h2 id="judul-kata-baru" className="text-base">
            {kataBaru.length} kata baru masuk Kamusku
          </h2>
          <ul className="grid grid-cols-3 gap-2">
            {kataBaru.map((w) => (
              <li key={w.kata.id}>
                <Link
                  to={`/kamus/${w.kata.id}`}
                  className="keping-tekan flex h-11 items-center justify-center truncate rounded-[10px] border-[1.5px] border-gold bg-surface px-2 font-head text-sm font-bold hover:bg-bg"
                >
                  {w.kata.kata}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      </div>

      <section aria-labelledby="judul-rantai" className="flex flex-col gap-3">
        <h2 id="judul-rantai" className="text-base">
          Rantai kata
        </h2>
        <Timeline rantai={rantai} />
      </section>
      </div>

      <Sheet
        terbuka={konfirmasi}
        onTutup={() => setKonfirmasi(false)}
        ikon={Trash2}
        judul="Hapus game ini dari riwayat?"
        pesan={`Skor ${game.skor} tidak dihitung lagi di peringkat. Kata yang sudah ter-unlock tetap ada di Kamusku. Tindakan ini tidak bisa dibatalkan.`}
      >
        {errorHapus && (
          <p role="alert" className="text-[13px] font-semibold text-accent">
            {errorHapus}
          </p>
        )}
        <Tombol onClick={() => setKonfirmasi(false)} className="w-full">
          Batal
        </Tombol>
        <Tombol varian="bahaya" onClick={hapusGame} disabled={menghapus} className="w-full">
          {menghapus ? 'Menghapus...' : 'Hapus'}
        </Tombol>
      </Sheet>
    </div>
  );
}
