import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan SUPABASE_ANON_KEY wajib diisi.');
}

const opsi = { auth: { persistSession: false, autoRefreshToken: false } };

// Akses database penuh (melewati RLS). Hanya dipakai di backend.
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, opsi);

// Client untuk login dengan email dan kata sandi (Supabase Auth).
export const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opsi);
