// Kata yang ter-unlock sejak kunjungan Kamusku terakhir, untuk animasi kartu berbalik.
// Tanpa catatan kunjungan (pertama kali), tidak ada yang dianggap baru.
export function idKataBaru(daftar, terakhir, maks = 6) {
  const batas = Date.parse(terakhir ?? '');
  const baru = new Set();
  if (Number.isNaN(batas)) return baru;
  for (const k of daftar) {
    if (baru.size >= maks) break;
    if (!k.terkunci && Date.parse(k.pertama_unlock ?? '') > batas) baru.add(k.id);
  }
  return baru;
}

const kunci = (userId) => `sambungkata.kamus.terakhir.${userId}`;

export function bacaKunjungan(userId) {
  try {
    return localStorage.getItem(kunci(userId));
  } catch {
    return null;
  }
}

export function simpanKunjungan(userId, waktuIso) {
  try {
    localStorage.setItem(kunci(userId), waktuIso);
  } catch {
    // Storage diblokir: animasi kata baru dilewati, halaman tetap jalan.
  }
}
