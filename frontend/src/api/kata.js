import api from './axios.js';

export const kataHariIni = () => api.get('/kata/random').then((r) => r.data);
