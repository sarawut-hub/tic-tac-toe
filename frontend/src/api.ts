import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

export const loginWithGitHub = () => {
  window.location.href = 'http://localhost:8000/auth/login/github';
};

export const fetchUser = async () => {
  try {
    const response = await api.get('/api/users/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const recordGameResult = async (result: 'win' | 'lose' | 'draw') => {
  const response = await api.post('/api/game/result', { result });
  return response.data;
};

export const fetchLeaderboard = async () => {
  const response = await api.get('/api/leaderboard');
  return response.data;
};
