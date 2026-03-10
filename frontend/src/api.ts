import axios from 'axios';

const API_BASE_URL = 'https://tic-tac-toe-nwbp.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      // Ignore 401 for /api/users/me to avoid loop, let App.tsx handle it (show login)
      if (error.config.url.includes('/api/users/me')) {
          return Promise.reject(error);
      }
      
      const basePath = import.meta.env.BASE_URL || '/';
      // Normalize paths to avoid mismatch (e.g. trailing slashes)
      const currentPath = window.location.pathname.replace(/\/+$/, "");
      const targetPath = basePath.replace(/\/+$/, "");

      if (currentPath !== targetPath) {
          window.location.href = basePath; 
      }
    }
    return Promise.reject(error);
  }
);

export const loginWithGitHub = () => {
  window.location.href = `${API_BASE_URL}/auth/login/github`;
};

export const loginWithGoogle = () => {
  window.location.href = `${API_BASE_URL}/auth/login/google`;
};

export const loginWithEmployee = async (employeeId: string) => {
    const response = await api.post('/auth/login/employee', { employee_id: employeeId });
    return response.data;
};

export const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
};

export const fetchUser = async () => {
  try {
    const response = await api.get('/api/users/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const recordGameResult = async (result: 'win' | 'lose' | 'draw', timeTaken: number, sessionCode?: string) => {
  const response = await api.post('/api/game/result', { 
      result, 
      time_taken: timeTaken, 
      session_code: sessionCode 
  });
  return response.data;
};

export const submitQuizAnswer = async (questionId: number, answerText: string, timeTaken: number, sessionCode?: string) => {
  const response = await api.post('/api/game/quiz_answer', {
      question_id: questionId,
      answer_text: answerText,
      time_taken: timeTaken,
      session_code: sessionCode
  });
  return response.data;
};

export const resetGameStats = async () => {
    const response = await api.post('/api/admin/reset');
    return response.data;
};

export const fetchLeaderboard = async () => {
  const response = await api.get('/api/leaderboard');
  return response.data;
};

// Question Management
export const fetchQuestions = async () => {
    const response = await api.get('/api/questions/');
    return response.data;
};

export const createQuestion = async (question: { question_text: string, options: string[], correct_answer_index: number }) => {
    const response = await api.post('/api/questions/', question);
    return response.data;
};

export const deleteQuestion = async (id: number) => {
    const response = await api.delete(`/api/questions/${id}`);
    return response.data;
};

// Session Management
export const createSession = async (sessionData: { time_limit_minutes: number, question_ids: number[] }) => {
    const response = await api.post('/api/sessions', sessionData);
    return response.data;
};

export const getSession = async (code: string) => {
    const response = await api.get(`/api/sessions/${code}`);
    return response.data;
};

export const joinSession = async (code: string) => {
    const response = await api.post(`/api/sessions/${code}/join`);
    return response.data;
};

export const getSessionPlayers = async (code: string) => {
    const response = await api.get(`/api/sessions/${code}/players`);
    return response.data;
};

export const startSession = async (code: string) => {
    const response = await api.post(`/api/sessions/${code}/start`);
    return response.data;
};

export const endSession = async (code: string) => {
    const response = await api.post(`/api/sessions/${code}/end`);
    return response.data;
};

export const updateAvatar = async (gameId: string, playerId: string, avatar: string) => {
  // TODO: Add your actual API endpoint logic here
  const response = await fetch(`/api/games/${gameId}/players/${playerId}/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ avatar }),
  });

  if (!response.ok) {
    throw new Error('Failed to update avatar');
  }

  return response.json();
};