import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'https://tic-tac-toe-nwbp.onrender.com';

// Extend AxiosRequestConfig to include retry property
interface RetryConfig extends InternalAxiosRequestConfig {
  retry?: number;
  retryCount?: number;
  retryDelay?: number;
}

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
  async (error) => {
    const config = error.config as RetryConfig;
    if (!config || !config.retry) return Promise.reject(error);
    
    config.retryCount = config.retryCount || 0;
    
    if (config.retryCount >= config.retry) {
        return Promise.reject(error);
    }
    
    config.retryCount += 1;
    const backoff = new Promise((resolve) => {
        setTimeout(() => resolve(null), config.retryDelay || 1000);
    });
    
    await backoff;
    return api(config);
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

export const makeMove = async (position: number, sessionCode?: string) => {
  const response = await api.post('/api/game/move', { position, session_code: sessionCode }, { retry: 3 } as any);
  return response.data;
};

export const recordGameResult = async (result: 'win' | 'lose' | 'draw', timeTaken: number, sessionCode?: string) => {
  const response = await api.post('/api/game/result', { 
      result, 
      time_taken: timeTaken, 
      session_code: sessionCode 
  }, { retry: 2 } as any);
  return response.data;
};

export const submitQuizAnswer = async (questionId: number, answerText: string, timeTaken: number, sessionCode?: string) => {
  const response = await api.post('/api/game/quiz_answer', {
      question_id: questionId,
      answer_text: answerText,
      time_taken: timeTaken,
      session_code: sessionCode
  }, { retry: 3 } as any);
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

export const createQuestion = async (question: { question_text: string, image_data?: string, options: any[], correct_answer_index: number }) => {
    const response = await api.post('/api/questions/', question);
    return response.data;
};

export const updateQuestion = async (id: number, question: { question_text: string, image_data?: string, options: any[], correct_answer_index: number }) => {
    const response = await api.put(`/api/questions/${id}`, question);
    return response.data;
};

export const deleteQuestion = async (id: number) => {
    const response = await api.delete(`/api/questions/${id}`);
    return response.data;
};

// Question Set Management
export const fetchQuestionSets = async () => {
    const response = await api.get('/api/question-sets/');
    return response.data;
};

export const createQuestionSet = async (questionSet: { name: string, description?: string, question_ids: number[] }) => {
    const response = await api.post('/api/question-sets/', questionSet);
    return response.data;
};

export const updateQuestionSet = async (id: number, questionSet: { name: string, description?: string, question_ids: number[] }) => {
    const response = await api.put(`/api/question-sets/${id}`, questionSet);
    return response.data;
};

export const deleteQuestionSet = async (id: number) => {
    const response = await api.delete(`/api/question-sets/${id}`);
    return response.data;
};

// Session Management
export const createSession = async (sessionData: { name?: string, time_limit_minutes: number, question_ids?: number[], question_set_id?: number }) => {
    const response = await api.post('/api/sessions', sessionData);
    return response.data;
};

export const getSessionHistory = async () => {
    const response = await api.get('/api/sessions/history');
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

export const updateAvatar = async (code: string, _userId: number, avatarConfig: string) => {
    const response = await api.put(`/api/sessions/${code}/avatar`, { avatar_config: JSON.parse(avatarConfig) });
    return response.data;
};

export const getWebSocket = (code: string) => {
    const wsUrl = API_BASE_URL.replace('http', 'ws') + `/api/ws/${code}`;
    return new WebSocket(wsUrl);
};