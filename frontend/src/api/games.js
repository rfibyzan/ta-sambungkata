import api from './axios.js';

export const mulai = (body) => api.post('/games', body).then((r) => r.data);
export const kirimKata = (id, kata) => api.post(`/games/${id}/moves`, { kata }).then((r) => r.data);
export const selesaikan = (id, aksi) => api.put(`/games/${id}`, { aksi }).then((r) => r.data);
export const riwayat = (page) => api.get('/games', { params: { page } }).then((r) => r.data);
export const detail = (id) => api.get(`/games/${id}`).then((r) => r.data);
export const hapus = (id) => api.delete(`/games/${id}`).then((r) => r.data);
