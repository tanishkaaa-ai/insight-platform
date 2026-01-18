import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const socket = io(API_BASE_URL, {
  autoConnect: false,
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const masteryAPI = {
  calculateMastery: (data) => api.post('/mastery/calculate', data),
  getStudentMastery: (studentId) => api.get(`/mastery/student/${studentId}`),
};

export const practiceAPI = {
  generateSession: (data) => api.post('/mastery/practice/generate', data),
};

export const engagementAPI = {
  analyzeEngagement: (data) => api.post('/engagement/analyze', data),
  getClassEngagement: (classId) => api.get(`/engagement/class/${classId}`),
};

export const pollsAPI = {
  createPoll: (data) => api.post('/engagement/polls/create', data),
  respondToPoll: (pollId, data) => api.post(`/engagement/polls/${pollId}/respond`, data),
  getPollResults: (pollId) => api.get(`/engagement/polls/${pollId}`),
};

export const projectsAPI = {
  listProjects: (params) => api.get('/pbl/projects', { params }),
  getProjectDetails: (projectId) => api.get(`/pbl/projects/${projectId}`),
};

export const softSkillsAPI = {
  submitAssessment: (data) => api.post('/pbl/soft-skills/assess', data),
  getTeamScores: (teamId) => api.get(`/pbl/soft-skills/team/${teamId}`),
};

export const templatesAPI = {
  listTemplates: (params) => api.get('/analytics/templates', { params }),
};

export const analyticsAPI = {
  getUnifiedMetrics: (date) => api.get('/analytics/unified', { params: { date } }),
};

export default api;