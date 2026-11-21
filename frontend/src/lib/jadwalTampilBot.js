// Sama dengan BOT.PER_HURUF_MS di backend/src/config/gameRules.js.
export const PER_HURUF_MS = 150;

// Urutan tampilan giliran bot dari angka server. Semua fase dijepit ke jeda_ms, karena
// setelah jeda habis server sudah menerima jawaban pemain.
// kurangiGerak tidak mengubah waktu: fase 'keping' berarti kata tampil utuh, bukan per huruf.
export function jadwalTampilBot({ berpikir_ms, jeda_ms, panjang, kunci_mati }) {
  const jepit = (n) => Math.min(n, jeda_ms);
  const fase = [
    { fase: 'berpikir', mulai: 0 },
    { fase: 'keping', mulai: jepit(berpikir_ms) },
  ];
  if (kunci_mati) fase.push({ fase: 'alasan', mulai: jepit(berpikir_ms + panjang * PER_HURUF_MS) });
  fase.push({ fase: 'selesai', mulai: jeda_ms });
  return fase;
}
