import * as questService from '../services/questService.js';
import { notFound } from '../utils/httpError.js';

function bacaId(req) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) throw notFound('Quest tidak ditemukan');
  return id;
}

export async function hariIni(req, res) {
  res.json(await questService.hariIni(req.user.id));
}

export async function detail(req, res) {
  res.json(await questService.detail(req.user.id, bacaId(req)));
}

export async function klaim(req, res) {
  res.json(await questService.klaim(req.user.id, bacaId(req)));
}
