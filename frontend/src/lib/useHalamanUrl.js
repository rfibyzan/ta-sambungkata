import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jepitHalaman } from './paginasi.js';

// Nomor halaman disimpan di ?page= supaya tombol kembali dari halaman detail
// mendarat di halaman yang sama. Halaman 1 tidak ditulis ke URL.
// jangkar (opsional): elemen awal daftar; setelah pindah halaman, layar digulir ke sana
// supaya kata pertama halaman baru langsung terlihat. Tanpa jangkar, ke atas halaman.
export function useHalamanUrl(totalHalaman, jangkar) {
  const [params, setParams] = useSearchParams();
  const halaman = jepitHalaman(Number.parseInt(params.get('page') ?? '1', 10), Number.POSITIVE_INFINITY);

  const tulis = useCallback(
    (n, opsi) =>
      setParams((p) => {
        const baru = new URLSearchParams(p);
        if (n > 1) baru.set('page', String(n));
        else baru.delete('page');
        return baru;
      }, opsi),
    [setParams],
  );

  const pindah = useCallback(
    (n) => {
      tulis(n);
      const el = jangkar?.current;
      window.scrollTo({ top: el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 16) : 0 });
    },
    [tulis, jangkar],
  );

  // Halaman di luar batas (link lama, data berkurang) dijepit ke halaman terakhir.
  useEffect(() => {
    if (totalHalaman && halaman > totalHalaman) tulis(jepitHalaman(halaman, totalHalaman), { replace: true });
  }, [halaman, totalHalaman, tulis]);

  return [halaman, pindah];
}
