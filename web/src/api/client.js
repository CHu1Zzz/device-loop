import axios from 'axios';

const API_BASE = 'http://localhost:3456/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export async function fetchItems(params = {}) {
  const { data } = await api.get('/items', { params });
  return data;
}

export async function fetchStats() {
  const { data } = await api.get('/stats');
  return data;
}

export async function subscribe(email, filters) {
  const { data } = await api.post('/subscribe', { email, filters });
  return data;
}

export async function unsubscribe(email) {
  const { data } = await api.delete('/subscribe', { data: { email } });
  return data;
}

export default api;