import { useCallback, useEffect, useRef, useState } from 'react';
import { pesanError } from '../api/axios.js';

// Memuat data dengan state memuat, error, dan fungsi ulang.
export function useMuat(fungsi, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const urutan = useRef(0);

  const muat = useCallback(async () => {
    const ke = ++urutan.current;
    setMemuat(true);
    setError(null);
    try {
      const hasil = await fungsi();
      if (ke === urutan.current) setData(hasil);
    } catch (err) {
      if (ke === urutan.current) setError({ pesan: pesanError(err), status: err?.response?.status });
    } finally {
      if (ke === urutan.current) setMemuat(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    muat();
  }, [muat]);

  return { data, setData, error, memuat, ulang: muat };
}
