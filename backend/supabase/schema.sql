-- Skema database SambungKata (Supabase / PostgreSQL)
-- Jalankan di Supabase: SQL Editor > New query > tempel seluruh file ini > Run.
-- RLS aktif di semua tabel tanpa policy publik: hanya backend (service role key) yang bisa mengakses.

-- =====================================================================
-- Tabel
-- =====================================================================

create table if not exists kata (
  id          serial primary key,
  kata        text not null unique check (kata ~ '^[a-z]{3,}$'),
  jenis       text,
  makna       text not null,
  contoh      text,
  huruf_awal  char(1) not null,
  panjang     smallint not null,
  awalan      text generated always as (left(kata, 2)) stored,
  akhiran     text generated always as (right(kata, 2)) stored,
  created_at  timestamptz not null default now()
);

create index if not exists kata_huruf_awal_idx on kata (huruf_awal);
create index if not exists kata_pola_idx on kata (kata text_pattern_ops);
create index if not exists kata_awalan_idx on kata (awalan);

create table if not exists users (
  id                uuid primary key references auth.users (id) on delete cascade,
  username          text not null unique check (username ~ '^[a-z0-9._]{3,20}$'),
  avatar_url        text,
  xp                integer not null default 0,
  level             integer not null default 1,
  streak            integer not null default 0,
  last_streak_date  date,
  created_at        timestamptz not null default now()
);

create table if not exists games (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users (id) on delete cascade,
  mode           text not null check (mode in ('solo', 'bot')),
  tingkat        text check (tingkat in ('mudah', 'sulit')),
  skor           integer not null default 0,
  jumlah_kata    integer not null default 0,
  nyawa          smallint,
  status         text not null default 'berjalan' check (status in ('berjalan', 'selesai', 'menang', 'kalah')),
  kata_terakhir  text,
  started_at     timestamptz not null default now(),
  deadline_at    timestamptz,
  finished_at    timestamptz,
  check ((mode = 'bot') = (tingkat is not null))
);

create index if not exists games_user_idx on games (user_id, started_at desc);
create index if not exists games_peringkat_idx on games (mode, tingkat, skor desc) where status <> 'berjalan';

-- pemain 'sistem' dipakai untuk kata pembuka dan kata acak setelah kunci mati.
create table if not exists game_words (
  id          bigserial primary key,
  game_id     uuid not null references games (id) on delete cascade,
  kata_id     integer not null references kata (id),
  urutan      integer not null,
  pemain      text not null check (pemain in ('user', 'bot', 'sistem')),
  poin        integer not null default 0,
  baru        boolean not null default false,
  kunci_mati  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (game_id, kata_id),
  unique (game_id, urutan)
);

create index if not exists game_words_game_idx on game_words (game_id, urutan);

create table if not exists unlocked_words (
  user_id         uuid not null references users (id) on delete cascade,
  kata_id         integer not null references kata (id),
  pertama_unlock  timestamptz not null default now(),
  jumlah_dipakai  integer not null default 1,
  primary key (user_id, kata_id)
);

create table if not exists quest_templates (
  id         serial primary key,
  judul      text not null,
  deskripsi  text not null,
  tipe       text not null check (tipe in ('main_game', 'unlock_kata', 'huruf_awal', 'panjang_kata', 'skor', 'kalahkan_bot', 'rantai')),
  target     integer not null check (target > 0),
  parameter  jsonb not null default '{}'::jsonb,
  hadiah_xp  integer not null check (hadiah_xp > 0),
  aktif      boolean not null default true
);

create table if not exists daily_quests (
  id           serial primary key,
  tanggal      date not null,
  template_id  integer not null references quest_templates (id),
  unique (tanggal, template_id)
);

create table if not exists user_quests (
  user_id         uuid not null references users (id) on delete cascade,
  daily_quest_id  integer not null references daily_quests (id) on delete cascade,
  progres         integer not null default 0,
  selesai         boolean not null default false,
  diklaim         boolean not null default false,
  diklaim_at      timestamptz,
  primary key (user_id, daily_quest_id)
);

-- =====================================================================
-- Row Level Security: aktif, tanpa policy (akses hanya lewat service role)
-- =====================================================================

alter table kata            enable row level security;
alter table users           enable row level security;
alter table games           enable row level security;
alter table game_words      enable row level security;
alter table unlocked_words  enable row level security;
alter table quest_templates enable row level security;
alter table daily_quests    enable row level security;
alter table user_quests     enable row level security;

-- =====================================================================
-- Fungsi (RPC) untuk query berat
-- =====================================================================

-- Kata acak, opsional dengan awalan tertentu, tidak termasuk id yang sudah dipakai.
-- p_min_sambungan > 0 memastikan kata punya minimal sekian kata lanjutan (untuk kata pembuka).
create or replace function kata_acak(
  p_awalan        text default null,
  p_kecuali       integer[] default '{}',
  p_min_sambungan integer default 0
) returns setof kata
language sql stable as $$
  select k.*
  from kata k
  where (p_awalan is null or k.awalan = p_awalan)
    and not (k.id = any (p_kecuali))
    and (
      p_min_sambungan = 0
      or (
        select count(*) from kata s
        where s.awalan = k.akhiran and s.id <> k.id and not (s.id = any (p_kecuali))
      ) >= p_min_sambungan
    )
  order by random()
  limit 1;
$$;

-- Cek kunci mati: apakah masih ada kata belum terpakai dengan awalan ini.
create or replace function ada_sambungan(
  p_awalan  text,
  p_kecuali integer[] default '{}'
) returns boolean
language sql stable as $$
  select exists (
    select 1 from kata where awalan = p_awalan and not (id = any (p_kecuali))
  );
$$;

-- Kamusku: semua kata dengan status unlock milik user.
-- Kata yang sudah terbuka tampil lebih dulu, lalu yang terkunci, masing-masing urut abjad.
create or replace function kamus_user(
  p_user   uuid,
  p_huruf  text default null,
  p_offset integer default 0,
  p_limit  integer default 30
) returns table (
  id             integer,
  kata           text,
  jenis          text,
  makna          text,
  contoh         text,
  huruf_awal     char(1),
  panjang        smallint,
  pertama_unlock timestamptz,
  jumlah_dipakai integer
)
language sql stable as $$
  select k.id, k.kata, k.jenis, k.makna, k.contoh, k.huruf_awal, k.panjang,
         u.pertama_unlock, u.jumlah_dipakai
  from kata k
  left join unlocked_words u on u.kata_id = k.id and u.user_id = p_user
  where p_huruf is null or k.huruf_awal = p_huruf
  order by (u.kata_id is null), k.kata
  offset p_offset
  limit p_limit;
$$;

-- Pilihan kata bot.
-- Bot hanya "mengenal" sebagian kosakata (p_persen) supaya bisa dikalahkan. p_seed per game
-- membuat kosakata bot konsisten selama satu game.
-- mudah: utamakan kata pendek (<= 6 huruf), acak.
-- sulit: utamakan kata yang akhirannya punya paling sedikit sambungan.
create or replace function bot_pilih_kata(
  p_awalan  text,
  p_kecuali integer[],
  p_tingkat text,
  p_persen  integer,
  p_seed    integer
) returns setof kata
language sql stable as $$
  select k.*
  from kata k
  where k.awalan = p_awalan
    and not (k.id = any (p_kecuali))
    and ((k.id::bigint * 7919 + p_seed) % 100) < p_persen
  order by
    case when p_tingkat = 'mudah' then (k.panjang > 6)::int else 0 end,
    case when p_tingkat = 'sulit' then (
      select count(*) from kata s
      where s.awalan = k.akhiran and s.id <> k.id and not (s.id = any (p_kecuali))
    ) else 0 end,
    random()
  limit 1;
$$;

-- Leaderboard: skor tertinggi per user untuk mode (dan tingkat) tertentu.
-- p_sejak null berarti sepanjang masa.
create or replace function leaderboard(
  p_mode    text,
  p_tingkat text default null,
  p_sejak   timestamptz default null,
  p_limit   integer default 50
) returns table (
  peringkat       bigint,
  user_id         uuid,
  username        text,
  avatar_url      text,
  level           integer,
  skor_tertinggi  integer,
  jumlah_game     bigint
)
language sql stable as $$
  select
    rank() over (order by max(g.skor) desc) as peringkat,
    u.id, u.username, u.avatar_url, u.level,
    max(g.skor)::integer as skor_tertinggi,
    count(*) as jumlah_game
  from games g
  join users u on u.id = g.user_id
  where g.status <> 'berjalan'
    and g.mode = p_mode
    and (p_tingkat is null or g.tingkat = p_tingkat)
    and (p_sejak is null or g.started_at >= p_sejak)
  group by u.id
  order by skor_tertinggi desc, u.username
  limit p_limit;
$$;

-- Statistik publik satu pemain (untuk Profil dan Detail Pemain).
create or replace function statistik_user(p_user uuid)
returns json
language sql stable as $$
  select json_build_object(
    'jumlah_game', (select count(*) from games where user_id = p_user and status <> 'berjalan'),
    'kata_terkumpul', (select count(*) from unlocked_words where user_id = p_user),
    'total_kata', (select count(*) from kata),
    'skor_tertinggi', json_build_object(
      'solo', (select coalesce(max(skor), 0) from games where user_id = p_user and mode = 'solo' and status <> 'berjalan'),
      'bot_mudah', (select coalesce(max(skor), 0) from games where user_id = p_user and mode = 'bot' and tingkat = 'mudah' and status <> 'berjalan'),
      'bot_sulit', (select coalesce(max(skor), 0) from games where user_id = p_user and mode = 'bot' and tingkat = 'sulit' and status <> 'berjalan')
    ),
    'game_bot', (select count(*) from games where user_id = p_user and mode = 'bot' and status in ('menang', 'kalah')),
    'menang_bot', (select count(*) from games where user_id = p_user and mode = 'bot' and status = 'menang'),
    'kata_favorit', coalesce((
      select json_agg(json_build_object('kata_id', k.id, 'kata', k.kata, 'jumlah_dipakai', uw.jumlah_dipakai))
      from (
        select kata_id, jumlah_dipakai from unlocked_words
        where user_id = p_user order by jumlah_dipakai desc, pertama_unlock limit 3
      ) uw join kata k on k.id = uw.kata_id
    ), '[]'::json)
  );
$$;
