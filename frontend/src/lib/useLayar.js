import { useSyncExternalStore } from 'react';

// true jika media query cocok. Dipakai untuk bagian yang hanya dirender (dan dimuat) di layar lebar.
export function useLayar(query) {
  return useSyncExternalStore(
    (ubah) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', ubah);
      return () => mq.removeEventListener('change', ubah);
    },
    () => window.matchMedia(query).matches,
  );
}
