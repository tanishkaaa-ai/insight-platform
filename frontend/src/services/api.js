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
    const userStr = localStorage.getItem('user');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Prioritize user_id (from normalized response) or _id (raw mongo)
        const userId = user.user_id || user._id || user.id;
        if (userId) {
          config.headers['X-User-Id'] = userId;
        }
      } catch (e) {
        // Ignore parsing error
      }
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
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isRegisterRequest = error.config?.url?.includes('/auth/register');
      const isVerifyRequest = error.config?.url?.includes('/auth/verify');

      if (!isLoginRequest && !isRegisterRequest && !isVerifyRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
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
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

export const masteryAPI = {
  calculateMastery: (data) => api.post('/mastery/calculate', data),
  getStudentMastery: (studentId, params) => api.get(`/mastery/student/${studentId}`, { params }),
  getRecommendations: (studentId) => api.get(`/mastery/recommendations/${studentId}`),
  getHistory: (studentId, conceptId) => api.get(`/mastery/history/${studentId}/${conceptId}`),
  submitResponse: (data) => api.post('/mastery/response/submit', data),
};

export const practiceAPI = {
  generateSession: (data) => api.post('/mastery/practice/generate', data),
};

export const classroomAPI = {
  getStudentClasses: (studentId) => api.get(`/classroom/classrooms/student/${studentId}`),
  getTeacherClasses: (teacherId) => api.get(`/classroom/teacher/${teacherId}/classrooms`),
  joinClass: (data) => api.post('/classroom/classrooms/join', data),
  getClassStream: (classId) => api.get(`/classroom/classrooms/${classId}/stream`),
  getAssignment: (assignmentId) => api.get(`/classroom/assignments/${assignmentId}`),
  submitAssignment: (assignmentId, data) => api.post(`/classroom/assignments/${assignmentId}/submit`, data),
  getStudentAssignments: (studentId, status) => api.get(`/classroom/students/${studentId}/assignments`, { params: { status } }),
  getClassroom: (classroomId) => api.get(`/classroom/classrooms/${classroomId}`),
  getClassroomStudents: (classroomId) => api.get(`/classroom/classrooms/${classroomId}/students`),
  createClass: (data) => api.post('/classroom/classrooms', data),
  createPost: (classroomId, data) => api.post(`/classroom/classrooms/${classroomId}/posts`, data),
  getAssignmentSubmissions: (assignmentId, status) => api.get(`/classroom/assignments/${assignmentId}/submissions`, { params: { status } }),
  gradeSubmission: (submissionId, data) => api.post(`/classroom/submissions/${submissionId}/grade`, data),
  deleteClassroom: (classroomId) => api.delete(`/classroom/classrooms/${classroomId}`),
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
  getGamificationProfile: (studentId) => api.get(`/engagement/student/${studentId}/gamification`),
  reportViolation: (data) => api.post('/engagement/violation', data),
};

export const pollsAPI = {
  createPoll: (data) => api.post('/polling/polls', data),
  getPoll: (pollId) => api.get(`/polling/polls/${pollId}`),
  respondToPoll: (pollId, data) => api.post(`/polling/polls/${pollId}/respond`, data),
  getPollResults: (pollId, params) => api.get(`/polling/polls/${pollId}/results`, { params }),
  closePoll: (pollId) => api.post(`/polling/polls/${pollId}/close`),
  getClassPolls: (classId, params) => api.get(`/polling/classrooms/${classId}/polls`, { params }),
  getStudentActivePolls: (studentId) => api.get(`/polling/student/${studentId}/active`),
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
  getClassroomSoftSkills: (classroomId) => api.get(`/pbl/classrooms/${classroomId}/soft-skills-summary`),
  getStages: () => api.get('/pbl/stages'),
  getDimensions: () => api.get('/pbl/dimensions'),
  // CRUD Extensions
  deleteMilestone: (milestoneId) => api.delete(`/pbl/milestones/${milestoneId}`),
  updateMilestone: (milestoneId, data) => api.put(`/pbl/milestones/${milestoneId}`, data),
  getProjectMilestones: (projectId) => api.get(`/pbl/projects/${projectId}/milestones`),
  getProjectDeliverables: (projectId) => api.get(`/pbl/projects/${projectId}/deliverables`),
  updateDeliverableGrade: (deliverableId, data) => api.put(`/pbl/deliverables/${deliverableId}/grade`, data),
  // Milestone Workflow
  submitMilestone: (projectId, milestoneId, data) => api.post(`/pbl/projects/${projectId}/milestones/${milestoneId}/submit`, data),
  approveMilestone: (projectId, milestoneId, data) => api.post(`/pbl/projects/${projectId}/milestones/${milestoneId}/approve`, data),
  rejectMilestone: (projectId, milestoneId, data) => api.post(`/pbl/projects/${projectId}/milestones/${milestoneId}/reject`, data),
  getTeamProgress: (teamId) => api.get(`/pbl/teams/${teamId}/progress`),
  getTeamAchievements: (teamId) => api.get(`/pbl/teams/${teamId}/achievements`),
};

export const templatesAPI = {
  searchTemplates: (params) => api.get('/templates/templates/search', { params }),
  createTemplate: (data) => api.post('/templates/templates', data),
  getTemplate: (templateId) => api.get(`/templates/templates/${templateId}`),
  rateTemplate: (templateId, data) => api.post(`/templates/templates/${templateId}/rate`, data),
  getPopular: (limit) => api.get('/templates/templates/popular', { params: { limit } }),
};

export const conceptsAPI = {
  getConcepts: (params) => api.get('/mastery/concepts', { params }),
  createConcept: (data) => api.post('/mastery/concepts', data),
  getConcept: (conceptId) => api.get(`/mastery/concepts/${conceptId}`),
  updateConcept: (conceptId, data) => api.put(`/mastery/concepts/${conceptId}`, data),
  deleteConcept: (conceptId) => api.delete(`/mastery/concepts/${conceptId}`),
  getItems: (params) => api.get('/mastery/items', { params }),
  createItem: (data) => api.post('/mastery/items', data),
  getItem: (itemId) => api.get(`/mastery/items/${itemId}`),
  updateItem: (itemId, data) => api.put(`/mastery/items/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/mastery/items/${itemId}`),
};

export const dashboardAPI = {
  getAlerts: (params) => api.get('/engagement/alerts', { params }),
  getClassEngagement: (classId) => api.get(`/dashboard/class-engagement/${classId}`),
  getAttentionMap: (classId) => api.get(`/dashboard/attention-map/${classId}`),
  getMasteryHeatmap: (classId) => api.get(`/dashboard/mastery-heatmap/${classId}`),
  getEngagementTrends: (classId, days) => api.get(`/dashboard/engagement-trends/${classId}`, { params: { days } }),
  createIntervention: (data) => api.post('/dashboard/interventions', data),
  getInterventionEffectiveness: (interventionId) => api.get(`/dashboard/interventions/${interventionId}/effectiveness`),
  updateInterventionOutcome: (interventionId, data) => api.put(`/dashboard/interventions/${interventionId}/outcome`, data),
  getStudentInterventions: (studentId) => api.get(`/dashboard/interventions/student/${studentId}`),
  trackIntervention: (data) => api.post('/dashboard/interventions/track', data),
  measureIntervention: (interventionId) => api.post(`/dashboard/interventions/${interventionId}/measure`),
  getTeacherInterventions: (teacherId) => api.get(`/dashboard/interventions/teacher/${teacherId}`),
  getInterventionRecommendations: (teacherId) => api.get(`/dashboard/interventions/recommendations/${teacherId}`),
  getInstitutionalMetrics: () => api.get('/dashboard/institutional-metrics'),
  getUnifiedMetrics: (date) => api.get('/dashboard/unified', { params: { date } }),
  getUnifiedTrends: (days) => api.get('/dashboard/unified/trends', { params: { days } }),
  dismissStudentAlerts: (studentId) => api.post(`/engagement/alerts/student/${studentId}/dismiss`),
  deleteIntervention: (interventionId) => api.delete(`/dashboard/interventions/${interventionId}`),
  getAdminTeacherStats: () => api.get('/dashboard/admin/teachers'),
  getBulkReports: (teacherId, classroomId) => api.get('/dashboard/reports/teacher/preview-all', {
    params: { teacher_id: teacherId, classroom_id: classroomId }
  }),
  sendBatchReports: (data) => api.post('/dashboard/reports/send-batch', data),
};

export const attendanceAPI = {
  // Student endpoints
  bindIP: () => api.post('/attendance/bind-ip'),
  checkSession: (classroomId) => api.get(`/attendance/check-session/${classroomId}`),
  getStudentActiveSessions: () => api.get('/attendance/student/sessions/active'),
  markAttendance: (data) => api.post('/attendance/mark', data),

  // Teacher endpoints
  openSession: (data) => api.post('/attendance/sessions/open', data),
  closeSession: (sessionId) => api.post(`/attendance/sessions/${sessionId}/close`),
  getSessionRecords: (sessionId) => api.get(`/attendance/sessions/${sessionId}/records`),
  getClassroomSessions: (classroomId, params) => api.get(`/attendance/classrooms/${classroomId}/sessions`, { params }),
  getStudentStatus: () => api.get('/attendance/student/status'),
};

export const resourcesAPI = {
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  generateQuestions: (data) => api.post('/resources/generate-questions', data),
  getQuestionBanks: (params) => api.get('/resources/question-banks', { params }),
  getQuestionBankDetail: (id) => api.get(`/resources/question-banks/${id}`)
};

export default api;