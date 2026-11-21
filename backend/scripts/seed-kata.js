// Memasukkan backend/data/kata.json ke tabel `kata` di Supabase.
// Aman dijalankan ulang: memakai upsert berdasarkan kolom `kata`.
//
// Pemakaian: node scripts/seed-kata.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'kata.json');
const BATCH = 1000;

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const daftar = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
console.log(`Memasukkan ${daftar.length} kata dalam batch ${BATCH}...`);

for (let i = 0; i < daftar.length; i += BATCH) {
  const batch = daftar.slice(i, i + BATCH);
  const { error } = await supabase.from('kata').upsert(batch, { onConflict: 'kata' });
  if (error) {
    console.error(`Gagal di batch ${i / BATCH + 1}:`, error.message);
    process.exit(1);
  }
  console.log(`  ${Math.min(i + BATCH, daftar.length)} / ${daftar.length}`);
}

const { count } = await supabase.from('kata').select('*', { count: 'exact', head: true });
console.log(`Selesai. Total kata di database: ${count}`);
