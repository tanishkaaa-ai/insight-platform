import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Socket.IO connection
export const socket = io(API_BASE_URL, {
  autoConnect: false,
});

// API methods
// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const masteryAPI = {
  calculateMastery: (data) => api.post('/mastery/calculate', data),
  getStudentMastery: (studentId) => api.get(`/mastery/student/${studentId}`),
  getRecommendations: (studentId) => api.get(`/mastery/recommendations/${studentId}`),
  getHistory: (studentId, conceptId) => api.get(`/mastery/history/${studentId}/${conceptId}`),
  submitResponse: (data) => api.post('/mastery/response/submit', data),
};

export const practiceAPI = {
  generateSession: (data) => api.post('/mastery/practice/generate', data),
};

export const classroomAPI = {
  getStudentClasses: (studentId) => api.get(`/classroom/classrooms/student/${studentId}`),
  getTeacherClasses: (teacherId) => api.get(`/classroom/classrooms/teacher/${teacherId}`),
  joinClass: (data) => api.post('/classroom/classrooms/join', data),
  getClassStream: (classId) => api.get(`/classroom/classrooms/${classId}/stream`),
  getAssignment: (assignmentId) => api.get(`/classroom/assignments/${assignmentId}`),
  submitAssignment: (assignmentId, data) => api.post(`/classroom/assignments/${assignmentId}/submit`, data),
  getStudentAssignments: (studentId, status) => api.get(`/classroom/students/${studentId}/assignments`, { params: { status } }),
};

export const engagementAPI = {
  analyzeEngagement: (data) => api.post('/engagement/analyze', data),
  getClassEngagement: (classId) => api.get(`/engagement/class/${classId}`),
  getAlerts: (params) => api.get('/engagement/alerts', { params }),
  getAlert: (alertId) => api.get(`/engagement/alerts/${alertId}`),
  updateAlert: (alertId, data) => api.put(`/engagement/alerts/${alertId}`, data),
  dismissAlert: (alertId) => api.delete(`/engagement/alerts/${alertId}`),
  acknowledgeAlert: (alertId) => api.post(`/engagement/alerts/${alertId}/acknowledge`),
  getStudentEngagementHistory: (studentId, days) => api.get(`/engagement/student/${studentId}/history`, { params: { days } }),
};

export const pollsAPI = {
  createPoll: (data) => api.post('/polling/polls', data),
  getPoll: (pollId) => api.get(`/polling/polls/${pollId}`),
  respondToPoll: (pollId, data) => api.post(`/polling/polls/${pollId}/respond`, data),
  getPollResults: (pollId) => api.get(`/polling/polls/${pollId}/results`),
  closePoll: (pollId) => api.post(`/polling/polls/${pollId}/close`),
  getClassPolls: (classId) => api.get(`/polling/classrooms/${classId}/polls`),
};

export const projectsAPI = {
  listProjects: (params) => api.get('/pbl/projects', { params }),
  getProjectDetails: (projectId) => api.get(`/pbl/projects/${projectId}`),
  createProject: (data) => api.post('/pbl/projects', data),
  updateProjectStage: (projectId, data) => api.put(`/pbl/projects/${projectId}/stage`, data),
  submitDeliverable: (projectId, data) => api.post(`/pbl/projects/${projectId}/deliverable`, data),
  gradeProject: (projectId, data) => api.post(`/pbl/projects/${projectId}/grade`, data),
  getStudentProjects: (studentId) => api.get(`/pbl/students/${studentId}/projects`),
  getStudentTeams: (studentId) => api.get(`/pbl/students/${studentId}/teams`),
  getClassroomProjects: (classroomId) => api.get(`/pbl/projects/classroom/${classroomId}`),
  createTeam: (projectId, data) => api.post(`/pbl/projects/${projectId}/teams`, data),
  getTeam: (teamId) => api.get(`/pbl/teams/${teamId}`),
  updateTeam: (teamId, data) => api.put(`/pbl/teams/${teamId}`, data),
  addTeamMember: (teamId, data) => api.post(`/pbl/teams/${teamId}/members`, data),
  removeTeamMember: (teamId, studentId) => api.delete(`/pbl/teams/${teamId}/members/${studentId}`),
  createMilestone: (projectId, data) => api.post(`/pbl/projects/${projectId}/milestones`, data),
  completeMilestone: (milestoneId) => api.put(`/pbl/milestones/${milestoneId}/complete`),
  createTask: (teamId, data) => api.post(`/pbl/teams/${teamId}/tasks`, data),
  getTeamTasks: (teamId) => api.get(`/pbl/teams/${teamId}/tasks`),
  updateTaskStatus: (taskId, data) => api.put(`/pbl/tasks/${taskId}/status`, data),
  updateTask: (taskId, data) => api.put(`/pbl/tasks/${taskId}`, data),
  submitPeerReview: (teamId, data) => api.post(`/pbl/teams/${teamId}/peer-reviews`, data),
  getTeamPeerReviews: (teamId) => api.get(`/pbl/teams/${teamId}/peer-reviews`),
  getStudentSoftSkills: (studentId, teamId) => api.get(`/pbl/students/${studentId}/soft-skills`, { params: { team_id: teamId } }),
  getTeamSoftSkillsSummary: (teamId) => api.get(`/pbl/teams/${teamId}/soft-skills-summary`),
  getStages: () => api.get('/pbl/stages'),
  getDimensions: () => api.get('/pbl/dimensions'),
};

export const templatesAPI = {
  searchTemplates: (params) => api.get('/templates/templates/search', { params }),
  createTemplate: (data) => api.post('/templates/templates', data),
  getTemplate: (templateId) => api.get(`/templates/templates/${templateId}`),
  rateTemplate: (templateId, data) => api.post(`/templates/templates/${templateId}/rate`, data),
  getPopular: (limit) => api.get('/templates/templates/popular', { params: { limit } }),
};

export const dashboardAPI = {
  getClassEngagement: (classId) => api.get(`/dashboard/class-engagement/${classId}`),
  getAttentionMap: (classId) => api.get(`/dashboard/attention-map/${classId}`),
  getMasteryHeatmap: (classId) => api.get(`/dashboard/mastery-heatmap/${classId}`),
  getEngagementTrends: (classId, days) => api.get(`/dashboard/engagement-trends/${classId}`, { params: { days } }),
  createIntervention: (data) => api.post('/dashboard/interventions', data),
  updateInterventionOutcome: (interventionId, data) => api.put(`/dashboard/interventions/${interventionId}/outcome`, data),
  getStudentInterventions: (studentId) => api.get(`/dashboard/interventions/student/${studentId}`),
  trackIntervention: (data) => api.post('/dashboard/interventions/track', data),
  measureIntervention: (interventionId) => api.post(`/dashboard/interventions/${interventionId}/measure`),
  getTeacherInterventions: (teacherId) => api.get(`/dashboard/interventions/teacher/${teacherId}`),
  getInterventionRecommendations: (teacherId) => api.get(`/dashboard/interventions/recommendations/${teacherId}`),
  getInstitutionalMetrics: () => api.get('/dashboard/institutional-metrics'),
  getUnifiedMetrics: (date) => api.get('/dashboard/unified', { params: { date } }),
  getUnifiedTrends: (days) => api.get('/dashboard/unified/trends', { params: { days } }),
};

export default api;