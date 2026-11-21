import api from './axios.js';

export const profil = (id) => api.get(`/users/${id}`).then((r) => r.data);
export const ubahProfil = (id, body) => api.put(`/users/${id}`, body).then((r) => r.data);
export const ubahAvatar = (id, gambar) => api.put(`/users/${id}/avatar`, { gambar }).then((r) => r.data);
export const hapusAvatar = (id) => api.delete(`/users/${id}/avatar`).then((r) => r.data);
export const kamus = (id, params) => api.get(`/users/${id}/kamus`, { params }).then((r) => r.data);
export const kataKamus = (id, kataId) => api.get(`/users/${id}/kamus/${kataId}`).then((r) => r.data);
