import api from './axios.js';

export const peringkat = (params) => api.get('/leaderboard', { params }).then((r) => r.data);
