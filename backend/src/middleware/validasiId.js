import { notFound } from '../utils/httpError.js';

const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Id user dan game berupa UUID. Id yang formatnya salah langsung dijawab 404.
export function uuidParam(nama, pesan) {
  return (req, res, next) => {
    if (!POLA_UUID.test(req.params[nama] ?? '')) throw notFound(pesan);
    next();
  };
}
