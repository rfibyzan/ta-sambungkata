// WIB (Asia/Jakarta) selalu UTC+7, tanpa daylight saving.
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000;
const SEHARI_MS = 24 * 60 * 60 * 1000;

// Tanggal WIB dalam format YYYY-MM-DD.
export function tanggalWib(waktu = new Date()) {
  return new Date(waktu.getTime() + OFFSET_WIB_MS).toISOString().slice(0, 10);
}

export function tambahHari(tanggal, hari) {
  const d = new Date(`${tanggal}T00:00:00Z`);
  return new Date(d.getTime() + hari * SEHARI_MS).toISOString().slice(0, 10);
}

// Awal hari WIB (00.00 WIB) dari tanggal YYYY-MM-DD, sebagai Date UTC.
export function awalHariWib(tanggal = tanggalWib()) {
  return new Date(new Date(`${tanggal}T00:00:00Z`).getTime() - OFFSET_WIB_MS);
}

// Senin 00.00 WIB minggu ini, sebagai Date UTC.
export function awalMingguWib(waktu = new Date()) {
  const hariIni = tanggalWib(waktu);
  const hari = new Date(`${hariIni}T00:00:00Z`).getUTCDay(); // 0 = Minggu
  const mundur = (hari + 6) % 7;
  return awalHariWib(tambahHari(hariIni, -mundur));
}

// Sisa waktu sampai 00.00 WIB berikutnya, dalam milidetik.
export function sisaHariIniMs(waktu = new Date()) {
  return awalHariWib(tambahHari(tanggalWib(waktu), 1)).getTime() - waktu.getTime();
}
