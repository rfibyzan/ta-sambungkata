// Membangun backend/data/kata.json dari dataset KBBI dan daftar frekuensi kata.
//
// Sumber:
// - KBBI: https://github.com/bachors/KBBI.sql (TBLKAMUS.sql). Hak cipta isi KBBI milik
//   Badan Pengembangan dan Pembinaan Bahasa. Dipakai untuk keperluan akademik nonkomersial.
// - Frekuensi: https://github.com/hermitdave/FrequencyWords (id_full.txt, lisensi MIT),
//   dipakai untuk memilih kata dasar yang umum.
//
// Pemakaian: node scripts/build-kata.js [jumlah]   (default 10000)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '.cache');
const OUT_FILE = path.join(__dirname, '..', 'data', 'kata.json');
const TARGET = Number(process.argv[2]) || 10000;

const SOURCES = {
  kbbi: 'https://raw.githubusercontent.com/bachors/KBBI.sql/master/TBLKAMUS.sql',
  freq: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/id/id_full.txt',
};

const JENIS = {
  Nomina: 'nomina',
  Verba: 'verba',
  Adjektiva: 'adjektiva',
  Adverbia: 'adverbia',
  Numeralia: 'numeralia',
  Pronomina: 'pronomina',
};

// Label makna yang tidak cocok untuk game umum.
const LABEL_DIHINDARI = ['Arkais', 'Klasik', 'Cakapan', 'Kasar', 'Hormat', 'Singkatan', 'Akronim'];

// Kata kasar atau sensitif yang tetap lolos filter label.
const BLOKIR = new Set([
  'anjing', 'babi', 'bangsat', 'tai', 'kontol', 'memek', 'ngentot', 'jancuk', 'bajingan', 'setan', 'goblok', 'tolol',
  'bego', 'kafir', 'pelacur', 'lonte', 'perek', 'banci', 'bencong',
  'onani', 'masturbasi', 'seks', 'seksual', 'porno', 'pornografi', 'sundal', 'germo', 'bugil', 'kelamin', 'penis',
  'vagina', 'payudara', 'kondom', 'perkosa', 'cabul', 'mesum', 'homo', 'tetek', 'pelir', 'orgasme', 'ereksi', 'sperma',
  'anus', 'jahanam', 'keparat', 'kampret', 'idiot', 'sinting', 'cina', 'ganja', 'teroris',
]);

async function ambil(nama, url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, path.basename(url));
  if (!fs.existsSync(file)) {
    console.log(`Mengunduh ${nama}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gagal mengunduh ${url}: ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return fs.readFileSync(file, 'utf8');
}

function bacaKbbi(sql) {
  const re = /\('((?:[^'\\]|\\.|'')*)','((?:[^'\\]|\\.|'')*)',(\d)\)/g;
  const akar = new Map();
  const detail = new Map();
  let m;
  while ((m = re.exec(sql))) {
    const kata = m[1].trim().toLowerCase();
    if (m[3] === '1') {
      if (!akar.has(kata)) akar.set(kata, jenisDariTipe1(m[2]));
    } else if (!detail.has(kata)) {
      detail.set(kata, m[2].replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/''/g, "'"));
    }
  }
  return { akar, detail };
}

// Entri tipe 1 berformat KBBI cetak: "<b>ja·rum</b> <i>n</i> ...". Label ragam (ark, cak, kas, dll.)
// muncul di tag miring yang sama. Kembalikan null jika ragamnya tidak cocok untuk game.
const SINGKATAN_JENIS = { n: 'nomina', v: 'verba', a: 'adjektiva', adv: 'adverbia', num: 'numeralia', pron: 'pronomina' };
const RAGAM_DIHINDARI = ['ark', 'cak', 'kas', 'hor', 'kl', 'akr', 'singk'];

function jenisDariTipe1(html) {
  const teks = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const m = teks.match(/<\/b>\s*<i>([^<]+)<\/i>/);
  if (!m) return null;
  const tag = m[1].replace(/[,.]/g, ' ').trim().split(/\s+/);
  if (tag.some((t) => RAGAM_DIHINDARI.includes(t))) return null;
  for (const t of tag) if (SINGKATAN_JENIS[t]) return SINGKATAN_JENIS[t];
  return null;
}

const POLA_JENIS = new RegExp(`^(?:\\(\\d+\\)\\s*)?((?:[A-Z][a-z]+\\s+)*)(${Object.keys(JENIS).join('|')}) \\(kata [^)]*\\)\\s*(.*)$`);

function bersihkan(teks) {
  return teks
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;:.])/g, '$1')
    .replace(/(\p{L}) (nya|lah|kah)\b/gu, '$1$2')
    .replace(/[;,\s]+$/, '')
    .trim();
}

// Makna yang sebenarnya rujukan ke bentuk lain, bukan definisi.
function maknaRujukan(makna) {
  return /^[,;.]/.test(makna) || /\(kata [a-z]+\)/.test(makna) || /tidak baku|^lihat\b|^varian\b|^bentuk\b/i.test(makna);
}

function pecahMakna(kata, isi) {
  isi = isi.replace(/^(Kiasan|Biologi|Kimia|Fisika|Hukum|Ekonomi|Olahraga|Agama Islam|Kedokteran|Teknik)\s+/, '');
  const titikDua = isi.indexOf(':');
  const makna = bersihkan(titikDua >= 0 ? isi.slice(0, titikDua) : isi);
  let contoh = null;
  if (titikDua >= 0) {
    const c = bersihkan(isi.slice(titikDua + 1).split(';')[0]);
    if (c.toLowerCase().includes(kata) && c.length <= 140) contoh = c;
  }
  if (makna.length < 3 || makna.length > 220 || maknaRujukan(makna)) return null;
  return { makna, contoh };
}

// Label bidang seperti "Istilah kimia". Setelah jenis kata, label dipisah dua spasi dari
// definisinya, atau berdiri sendiri jika definisinya ada di baris bernomor berikutnya.
// Di baris bernomor, pemisahnya hanya satu spasi, jadi dicocokkan dengan daftar bidang
// yang dikumpulkan dari pola dua spasi di seluruh KBBI (yang terpanjang lebih dulu).
let POLA_BIDANG = null;

function kumpulkanBidang(sql) {
  const bidang = new Set();
  for (const m of sql.matchAll(/[Ii]stilah ([A-Za-z ]{3,40}?) {2}/g)) bidang.add(m[1].toLowerCase());
  const daftar = [...bidang].sort((a, b) => b.length - a.length);
  POLA_BIDANG = new RegExp(`^istilah (?:${daftar.join('|')})(?:\\s+|$)`, 'i');
}

function buangLabelIstilah(isi) {
  return isi.replace(/^istilah\s.*?\s{2,}/i, '').replace(POLA_BIDANG, '');
}

// Ambil makna pertama yang layak dari entri tipe 2. Jenis kata diutamakan dari teks tipe 2,
// dan memakai jenis dari tipe 1 jika tipe 2 tidak mencantumkannya.
function uraikan(kata, teks, jenisTipe1) {
  const baris = teks.split('\n').map((b) => b.trim()).filter(Boolean);
  for (let i = 0; i < baris.length; i++) {
    if (i === 0 && /^[a-z.]+$/.test(baris[i])) continue; // baris suku kata, mis. "ja.rum"
    const m = baris[i].match(POLA_JENIS);
    let jenis = jenisTipe1;
    let isi;
    if (m) {
      if (LABEL_DIHINDARI.some((l) => m[1].includes(l))) continue;
      jenis = JENIS[m[2]];
      isi = buangLabelIstilah(m[3]);
      if (!isi && baris[i + 1]) isi = baris[++i];
    } else {
      isi = baris[i];
    }
    isi = buangLabelIstilah(isi.replace(/^\(\d+\)\s*/, ''));
    if (!jenis || !isi || LABEL_DIHINDARI.some((l) => isi.startsWith(l))) continue;
    const hasil = pecahMakna(kata, isi);
    if (hasil) return { jenis, ...hasil };
  }
  return null;
}

async function main() {
  const [sql, freqTeks] = await Promise.all([ambil('KBBI', SOURCES.kbbi), ambil('frekuensi', SOURCES.freq)]);
  const { akar, detail } = bacaKbbi(sql);
  kumpulkanBidang(sql);
  const urutan = freqTeks.split('\n').map((l) => l.split(' ')[0]).filter(Boolean);

  const hasil = [];
  const sudah = new Set();
  for (const kata of urutan) {
    if (hasil.length >= TARGET) break;
    if (sudah.has(kata) || !/^[a-z]{3,12}$/.test(kata) || BLOKIR.has(kata)) continue;
    if (!akar.has(kata) || !detail.has(kata)) continue;
    const info = uraikan(kata, detail.get(kata), akar.get(kata));
    if (!info) continue;
    sudah.add(kata);
    hasil.push({ kata, ...info, huruf_awal: kata[0], panjang: kata.length });
  }

  hasil.sort((a, b) => a.kata.localeCompare(b.kata));
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(hasil, null, 0).replace(/},{/g, '},\n{'));

  const denganContoh = hasil.filter((k) => k.contoh).length;
  console.log(`Selesai: ${hasil.length} kata ditulis ke data/kata.json (${denganContoh} punya contoh).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
