import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasilHalaman } from '../src/utils/paginasi.js';

test('hasilHalaman: halaman di luar batas (PGRST103) menjadi data kosong dengan total asli', () => {
  const hasil = hasilHalaman({
    data: null,
    count: null,
    error: { code: 'PGRST103', details: 'An offset of 999990 was requested, but there are only 10000 rows.', message: 'Requested range not satisfiable' },
  });
  assert.deepEqual(hasil, { data: [], total: 10000 });
});

test('hasilHalaman: hasil normal diteruskan', () => {
  assert.deepEqual(hasilHalaman({ data: [{ id: 1 }], count: 41, error: null }), { data: [{ id: 1 }], total: 41 });
});

test('hasilHalaman: error lain tetap dilempar sebagai 500', () => {
  assert.throws(() => hasilHalaman({ data: null, count: null, error: { code: '42P01', message: 'x' } }), (e) => e.status === 500);
});
