-- Template Daily Quest. Setiap hari backend memilih 3 template secara acak (lazy, zona waktu WIB).
-- Jalankan setelah schema.sql.

insert into quest_templates (judul, deskripsi, tipe, target, parameter, hadiah_xp) values
  ('Mainkan 3 game',                 'Selesaikan 3 game mode apa saja.',                          'main_game',    3,  '{}',                        50),
  ('Mainkan 5 game',                 'Selesaikan 5 game mode apa saja.',                          'main_game',    5,  '{}',                        80),
  ('Unlock 5 kata baru',             'Temukan 5 kata yang belum ada di Kamusku.',                 'unlock_kata',  5,  '{}',                        50),
  ('Unlock 10 kata baru',            'Temukan 10 kata yang belum ada di Kamusku.',                'unlock_kata',  10, '{}',                        80),
  ('5 kata berawalan "ka"',          'Pakai 5 kata yang diawali huruf ka.',                       'huruf_awal',   5,  '{"awalan": "ka"}',          60),
  ('5 kata berawalan "se"',          'Pakai 5 kata yang diawali huruf se.',                       'huruf_awal',   5,  '{"awalan": "se"}',          60),
  ('5 kata berawalan "ma"',          'Pakai 5 kata yang diawali huruf ma.',                       'huruf_awal',   5,  '{"awalan": "ma"}',          60),
  ('5 kata berawalan "ba"',          'Pakai 5 kata yang diawali huruf ba.',                       'huruf_awal',   5,  '{"awalan": "ba"}',          60),
  ('3 kata panjang',                 'Pakai 3 kata yang panjangnya minimal 7 huruf.',             'panjang_kata', 3,  '{"min_panjang": 7}',        70),
  ('5 kata panjang',                 'Pakai 5 kata yang panjangnya minimal 7 huruf.',             'panjang_kata', 5,  '{"min_panjang": 7}',        100),
  ('Skor 100 dalam satu game',       'Raih skor minimal 100 dalam satu game.',                    'skor',         1,  '{"min_skor": 100}',         70),
  ('Skor 150 dalam satu game',       'Raih skor minimal 150 dalam satu game.',                    'skor',         1,  '{"min_skor": 150}',         100),
  ('Kalahkan bot',                   'Menangkan 1 game melawan bot tingkat apa saja.',            'kalahkan_bot', 1,  '{}',                        70),
  ('Kalahkan Bot Sulit',             'Menangkan 1 game melawan Bot Sulit.',                       'kalahkan_bot', 1,  '{"tingkat": "sulit"}',      120),
  ('Rantai 10 kata',                 'Jawab 10 kata dalam satu game.',                            'rantai',       10, '{}',                        70),
  ('Rantai 20 kata',                 'Jawab 20 kata dalam satu game.',                            'rantai',       20, '{}',                        120);
