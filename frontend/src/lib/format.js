const OFFSET_WIB = 7 * 60 * 60 * 1000;
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const tanggalWib = (d) => new Date(new Date(d).getTime() + OFFSET_WIB).toISOString().slice(0, 10);

// "Hari ini", "Kemarin", atau "12 Nov" (zona WIB).
export function labelHari(waktu) {
  const t = tanggalWib(waktu);
  const hariIni = tanggalWib(Date.now());
  const kemarin = tanggalWib(Date.now() - 86400000);
  if (t === hariIni) return 'Hari ini';
  if (t === kemarin) return 'Kemarin';
  const [y, m, d] = t.split('-').map(Number);
  return `${d} ${BULAN[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ''}`;
}

export function jamWib(waktu) {
  return new Date(new Date(waktu).getTime() + OFFSET_WIB).toISOString().slice(11, 16);
}

export function tanggalPendek(waktu) {
  const [y, m, d] = tanggalWib(waktu).split('-').map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

export function bulanTahun(waktu) {
  const [y, m] = tanggalWib(waktu).split('-').map(Number);
  return `${BULAN[m - 1]} ${y}`;
}

export function durasi(ms) {
  if (ms == null) return '';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m ? `${m} mnt ${s} dtk` : `${s} dtk`;
}

export function hitungMundur(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const j = String(Math.floor(t / 3600)).padStart(2, '0');
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return `${j}:${m}:${s}`;
}

export const angka = (n) => new Intl.NumberFormat('id-ID').format(n ?? 0);

export const labelMode = (mode, tingkat) =>
  mode === 'solo' ? 'Solo' : `Bot ${tingkat === 'sulit' ? 'Sulit' : 'Mudah'}`;

export const inisial = (nama = '') => nama.replace(/[^a-z0-9]/gi, ' ').trim().slice(0, 2).toUpperCase() || '?';

export function sapaan() {
  const jam = new Date(Date.now() + OFFSET_WIB).getUTCHours();
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 18) return 'Selamat sore';
  return 'Selamat malam';
}
