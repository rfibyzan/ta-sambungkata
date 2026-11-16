import api from './axios.js';

export const questHariIni = () => api.get('/quests/today').then((r) => r.data);
export const detailQuest = (id) => api.get(`/quests/${id}`).then((r) => r.data);
export const klaimQuest = (id) => api.post(`/quests/${id}/claim`).then((r) => r.data);
