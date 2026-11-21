// Semua error dikembalikan dengan format { "error": "pesan" }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Format JSON tidak valid' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Ukuran data terlalu besar' });
  }
  const status = err.status ?? 500;
  if (status >= 500) console.error(err.detail ?? err);
  res.status(status).json({ error: status >= 500 && !err.status ? 'Terjadi kesalahan pada server' : err.message });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
}
