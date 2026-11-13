export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (pesan) => new HttpError(400, pesan);
export const unauthorized = (pesan = 'Silakan masuk terlebih dahulu') => new HttpError(401, pesan);
export const forbidden = (pesan = 'Kamu tidak punya akses ke data ini') => new HttpError(403, pesan);
export const notFound = (pesan = 'Data tidak ditemukan') => new HttpError(404, pesan);

// Lempar error 500 dengan pesan umum jika query Supabase gagal.
export function cekSupabase({ data, error }, pesan = 'Terjadi kesalahan pada database') {
  if (error) {
    const err = new HttpError(500, pesan);
    err.detail = error.message;
    throw err;
  }
  return data;
}
