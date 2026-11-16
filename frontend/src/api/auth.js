import api from './axios.js';

export const register = (body) => api.post('/auth/register', body).then((r) => r.data);
export const login = (body) => api.post('/auth/login', body).then((r) => r.data);
export const me = () => api.get('/auth/me').then((r) => r.data);
export const cekUsername = (username) => api.get('/auth/cek-username', { params: { username } }).then((r) => r.data);
