import * as kataModel from '../models/kataModel.js';
import { bacaPaginasi, metaPaginasi } from '../utils/paginasi.js';
import { tanggalWib } from '../utils/waktu.js';
import { badRequest, notFound } from '../utils/httpError.js';

export function bacaFilter(query) {
  const search = String(query.search ?? '').trim().toLowerCase();
  const huruf = String(query.huruf ?? '').trim().toLowerCase();
  if (search && !/^[a-z]+$/.test(search)) throw badRequest('Pencarian hanya boleh berisi huruf');
  if (huruf && !/^[a-z]$/.test(huruf)) throw badRequest('Filter huruf harus satu huruf a sampai z');
  return { search: search || null, huruf: huruf || null };
}

export async function daftar(req, res) {
  const filter = bacaFilter(req.query);
  const paginasi = bacaPaginasi(req.query);
  const { data, total } = await kataModel.daftar({ ...filter, ...paginasi });
  res.json({ data, meta: metaPaginasi(paginasi, total) });
}

// Kata hari ini: sama untuk semua pemain, berganti setiap 00.00 WIB.
export async function acak(req, res) {
  const tanggal = tanggalWib();
  let n = 0;
  for (const c of tanggal) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  const kata = await kataModel.kataBercontohKe(n);
  if (!kata) throw notFound('Kamus masih kosong');
  res.json({ tanggal, kata });
}

export async function detail(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  const kata = Number.isInteger(id) ? await kataModel.cariId(id) : null;
  if (!kata) throw notFound('Kata tidak ditemukan');
  res.json(kata);
}
