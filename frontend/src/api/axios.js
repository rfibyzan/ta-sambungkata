import axios from 'axios';

const KUNCI_SESI = 'sambungkata.sesi';

export const sesi = {
  ambil() {
    try {
      return JSON.parse(localStorage.getItem(KUNCI_SESI)) ?? null;
    } catch {
      return null;
    }
  },
  simpan(data) {
    try {
      localStorage.setItem(
        KUNCI_SESI,
        JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at }),
      );
    } catch {
      // Penyimpanan diblokir (mode privat): sesi hanya bertahan selama tab terbuka.
    }
  },
  hapus() {
    try {
      localStorage.removeItem(KUNCI_SESI);
    } catch {
      // abaikan
    }
  },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = sesi.ambil()?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token Supabase berlaku 1 jam. Saat 401, coba refresh sekali lalu ulangi request.
let refreshBerjalan = null;

async function refreshToken() {
  const refresh = sesi.ambil()?.refresh_token;
  if (!refresh) throw new Error('Tidak ada refresh token');
  const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refresh_token: refresh });
  sesi.simpan(data);
  return data.access_token;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const asli = error.config;
    const status = error.response?.status;
    const endpointAuth = asli?.url?.startsWith('/auth/login') || asli?.url?.startsWith('/auth/register');
    if (status === 401 && asli && !asli._diulang && !endpointAuth && sesi.ambil()) {
      asli._diulang = true;
      try {
        refreshBerjalan ??= refreshToken().finally(() => {
          refreshBerjalan = null;
        });
        const token = await refreshBerjalan;
        asli.headers.Authorization = `Bearer ${token}`;
        return api(asli);
      } catch {
        sesi.hapus();
        window.dispatchEvent(new Event('sambungkata:keluar'));
      }
    }
    return Promise.reject(error);
  },
);

// Pesan error dari API ({ error: "..." }) atau pesan umum yang bisa dipahami pengguna.
export function pesanError(err) {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === 'ECONNABORTED') return 'Server terlalu lama merespons. Coba lagi.';
  if (!err?.response) return 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.';
  return 'Terjadi kesalahan. Coba lagi.';
}

export default api;
