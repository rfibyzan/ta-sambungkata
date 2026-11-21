import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jepitHalaman } from './paginasi.js';

// Nomor halaman disimpan di ?page= supaya tombol kembali dari halaman detail
// mendarat di halaman yang sama. Halaman 1 tidak ditulis ke URL.
export function useHalamanUrl(totalHalaman) {
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
      window.scrollTo({ top: 0 });
    },
    [tulis],
  );

  // Halaman di luar batas (link lama, data berkurang) dijepit ke halaman terakhir.
  useEffect(() => {
    if (totalHalaman && halaman > totalHalaman) tulis(jepitHalaman(halaman, totalHalaman), { replace: true });
  }, [halaman, totalHalaman, tulis]);

  return [halaman, pindah];
}
