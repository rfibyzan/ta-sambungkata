import { Link, useParams } from 'react-router-dom';
import { Lock, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { kataKamus } from '../api/users.js';
import { useMuat } from '../lib/useMuat.js';
import { tanggalPendek } from '../lib/format.js';
import { DeretKeping } from '../components/LetterTile.jsx';
import StateView from '../components/StateView.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { HeaderDetail, Pil, TombolIkon } from '../components/ui.jsx';

function TombolBagikan({ kata }) {
  const [status, setStatus] = useState(null);
  async function bagikan() {
    const teks = `${kata.kata} (${kata.jenis}): ${kata.makna}. Main SambungKata dan kumpulkan kosakatamu!`;
    try {
      if (navigator.share) await navigator.share({ title: `Kata "${kata.kata}"`, text: teks, url: window.location.origin });
      else {
        await navigator.clipboard.writeText(`${teks} ${window.location.origin}`);
        setStatus('Disalin ke clipboard');
        setTimeout(() => setStatus(null), 2000);
      }
    } catch {
      // Pengguna membatalkan dialog bagikan.
    }
  }
  return (
    <div className="relative">
      <TombolIkon ikon={Share2} label="Bagikan kata ini" onClick={bagikan} />
      {status && (
        <span role="status" className="absolute top-12 right-0 rounded-[6px] bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white">
          {status}
        </span>
      )}
    </div>
  );
}

export default function DetailKata() {
  const { kataId } = useParams();
  const { user } = useAuth();
  const { data, error, memuat, ulang } = useMuat(() => kataKamus(user.id, kataId), [user.id, kataId]);

  if (memuat) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true" aria-label="Memuat kata">
        <HeaderDetail judul="" kembaliKe="/kamus" />
        <Skeleton className="h-14 w-60" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full rounded-[14px]" />
      </div>
    );
  }
  if (error) {
    return (
      <>
        <HeaderDetail judul="" kembaliKe="/kamus" />
        {error.status === 404 ? (
          <StateView keping="404" hot={0} judul="Kata tidak ditemukan" pesan="Tautan ini mungkin salah atau kata ini sudah dihapus dari kamus." aksi={{ label: 'Kembali ke Kamusku', ke: '/kamus', gelap: true }} />
        ) : (
          <StateView keping="OFF" hot={1} judul="Kata belum bisa dimuat" pesan={error.pesan} aksi={{ label: 'Coba lagi', onClick: ulang, gelap: true, error: true }} />
        )}
      </>
    );
  }

  if (data.terkunci) {
    return (
      <>
        <HeaderDetail judul="" kembaliKe="/kamus" />
        <StateView
          keping={`${data.huruf_awal}${'?'.repeat(Math.min(data.panjang - 1, 5))}`}
          judul="Kata ini masih terkunci"
          pesan={`Kata berawalan "${data.huruf_awal}" dengan ${data.panjang} huruf. Mainkan kata ini di game untuk membukanya.`}
          aksi={{ label: 'Main sekarang', ke: '/main' }}
        />
      </>
    );
  }

  const panjang = data.kata.length;
  return (
    <article className="flex max-w-[640px] flex-col gap-6">
      <HeaderDetail judul="" kembaliKe="/kamus" kanan={<TombolBagikan kata={data} />} />

      <header className="flex flex-col gap-3">
        <h1 className="sr-only">{data.kata}</h1>
        <DeretKeping teks={data.kata} hot={[panjang - 2, panjang - 1]} label={data.kata} className="[&>span]:h-14 [&>span]:w-12 [&>span]:text-[26px]" />
        <div className="flex items-center gap-2">
          <Pil className="bg-accent-soft text-xs text-accent">{data.jenis}</Pil>
          <span className="text-[13px] text-muted">{panjang} huruf</span>
        </div>
      </header>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-body text-xs font-bold text-muted">Makna</h2>
        <p className="font-head text-lg leading-snug font-semibold">{data.makna}.</p>
      </section>

      {data.contoh && (
        <section className="flex flex-col gap-1 rounded-[14px] bg-surface p-4">
          <h2 className="font-body text-xs font-bold text-muted">Contoh</h2>
          <p className="text-sm leading-relaxed italic">"{data.contoh}"</p>
        </section>
      )}

      <dl className="grid grid-cols-2 rounded-[14px] border border-line bg-surface p-4 text-center">
        <div className="flex flex-col gap-0.5 border-r border-line">
          <dd className="font-head text-lg font-bold">{tanggalPendek(data.pertama_unlock)}</dd>
          <dt className="text-[11px] text-muted">pertama unlock</dt>
        </div>
        <div className="flex flex-col gap-0.5">
          <dd className="font-head text-lg font-bold">{data.jumlah_dipakai}x</dd>
          <dt className="text-[11px] text-muted">dipakai</dt>
        </div>
      </dl>

      <section aria-labelledby="judul-sambungan" className="flex flex-col gap-2.5">
        <h2 id="judul-sambungan" className="flex items-center gap-1.5 font-body text-sm font-bold">
          Bisa disambung dengan
          <Pil className="bg-accent font-head text-xs text-white">{data.sambungan.awalan}-</Pil>
        </h2>
        {data.sambungan.kata.length === 0 ? (
          <p className="text-[13px] text-muted">Tidak ada kata berawalan "{data.sambungan.awalan}". Kata ini membuat kunci mati!</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.sambungan.kata.map((k) =>
              k.terkunci ? (
                <li
                  key={k.id}
                  className="flex h-11 items-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-line-strong px-3.5 text-muted"
                  aria-label={`Kata terkunci, ${k.panjang} huruf`}
                >
                  <Lock size={12} aria-hidden="true" />
                  <span className="font-head text-sm font-semibold" aria-hidden="true">
                    {data.sambungan.awalan}
                    {'?'.repeat(Math.max(1, Math.min(k.panjang - 2, 5)))}
                  </span>
                </li>
              ) : (
                <li key={k.id}>
                  <Link to={`/kamus/${k.id}`} className="flex h-11 items-center rounded-[10px] border border-line-strong bg-surface px-3.5 font-head text-sm font-semibold hover:border-ink">
                    {k.kata}
                  </Link>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </article>
  );
}
