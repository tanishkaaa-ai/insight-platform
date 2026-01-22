import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  getStudentClasses: (studentId) => api.get(`/classroom/students/${studentId}/classrooms`), // usage guess check mapping: /classrooms/student/<student_id>
  // Mapping says: /api/classrooms/student/<student_id>. Wait, prefix is /api/classroom. So /classroom/classrooms/student/<id>? 
  // Let's stick to the MAPPING file which I read.
  // Mapping: /api/classrooms/student/<student_id> (Note: it says /api/classrooms... maybe blueprint is /classrooms? No app.py said /api/classroom)
  // Let's assume MAPPING file might have typos or I need to be careful.
  // app.py: app.register_blueprint(classroom_bp, url_prefix="/api/classroom")
  // classroom_routes.py viewed earlier: create_classroom is @bp.route('/classrooms', ...). So /api/classroom/classrooms.
  // join_classroom is @bp.route('/classrooms/join'). So /api/classroom/classrooms/join.
  // list_student_classrooms: @bp.route('/classrooms/student/<student_id>'). So /api/classroom/classrooms/student/...
  // OK, so the path is /classroom/classrooms/...
  getStudentClasses: (studentId) => api.get(`/classroom/classrooms/student/${studentId}`),
  getTeacherClasses: (teacherId) => api.get(`/classroom/classrooms/teacher/${teacherId}`),
  joinClass: (data) => api.post('/classroom/classrooms/join', data),
  getClassStream: (classId) => api.get(`/classroom/classrooms/${classId}/stream`),
};

export const engagementAPI = {
  analyzeEngagement: (data) => api.post('/engagement/analyze', data),
  getClassEngagement: (classId) => api.get(`/engagement/class/${classId}`),
  getAlerts: () => api.get('/engagement/alerts'),
};

export const pollsAPI = {
  createPoll: (data) => api.post('/polling/polls', data),
  respondToPoll: (pollId, data) => api.post(`/polling/polls/${pollId}/respond`, data),
  getPollResults: (pollId) => api.get(`/polling/polls/${pollId}/results`),
  closePoll: (pollId) => api.post(`/polling/polls/${pollId}/close`),
  getClassPolls: (classId) => api.get(`/polling/classrooms/${classId}/polls`),
};

export const projectsAPI = {
  listProjects: (params) => api.get('/pbl/projects', { params }),
  getProjectDetails: (projectId) => api.get(`/pbl/projects/${projectId}`),
  createProject: (data) => api.post('/pbl/projects', data),
};

export const softSkillsAPI = {
  submitAssessment: (data) => api.post('/pbl/soft-skills/assess', data),
  getTeamScores: (teamId) => api.get(`/pbl/soft-skills/team/${teamId}`),
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