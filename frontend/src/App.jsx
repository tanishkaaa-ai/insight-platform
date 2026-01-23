import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { socket } from './services/api';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Import components
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherClasses from './pages/TeacherClasses';
import TeacherAnalytics from './pages/TeacherAnalytics';
import LivePolling from './pages/LivePolling';
import PBLWorkspace from './pages/PBLWorkspace';
import SoftSkillsRubric from './pages/SoftSkillsRubric';
import TemplateLibrary from './pages/TemplateLibrary';
import StartPage from './pages/StartPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentClasses from './pages/StudentClasses';
import StudentAssignment from './pages/StudentAssignment';
import StudentPractice from './pages/StudentPractice';
import StudentProjects from './pages/StudentProjects';
import StudentPolls from './pages/StudentPolls';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherClassDetails from './pages/TeacherClassDetails';
import TeacherCurriculum from './pages/TeacherCurriculum';
import TeacherAssignment from './pages/TeacherAssignment';

function MainLayout({ isConnected }) {
  const location = useLocation();
  const isStartPage = location.pathname === '/';

  return (
    <>
      <Toaster position="top-right" />
      {/* Navigation - Hidden on StartPage, Student Portal, AND Teacher Portal (which has its own layout) */}
      {!isStartPage && !location.pathname.startsWith('/student') && !location.pathname.startsWith('/teacher') && !location.pathname.startsWith('/classroom') && (
        <nav className="navbar">
          <h2>AMEP Platform</h2>

          <ul className="nav-links">
            <li><Link to="/teacher">Dashboard</Link></li>
            <li><Link to="/polling">Live Polling</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/soft-skills">Soft Skills</Link></li>
            <li><Link to="/templates">Templates</Link></li>
          </ul>

          <span className="connection-status">
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </nav>
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<StartPage />} />

        {/* Teacher Routes */}
        <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/classes" element={<ProtectedRoute requiredRole="teacher"><TeacherClasses /></ProtectedRoute>} />
        <Route path="/classroom/:classroomId" element={<ProtectedRoute requiredRole="teacher"><TeacherClassDetails /></ProtectedRoute>} />
        <Route path="/teacher/assignment/:assignmentId" element={<ProtectedRoute requiredRole="teacher"><TeacherAssignment /></ProtectedRoute>} />
        <Route path="/teacher/analytics" element={<ProtectedRoute requiredRole="teacher"><TeacherAnalytics /></ProtectedRoute>} />
        <Route path="/teacher/polls" element={<ProtectedRoute requiredRole="teacher"><LivePolling /></ProtectedRoute>} />
        <Route path="/teacher/projects" element={<ProtectedRoute requiredRole="teacher"><PBLWorkspace /></ProtectedRoute>} />
        <Route path="/teacher/curriculum" element={<ProtectedRoute requiredRole="teacher"><TeacherCurriculum /></ProtectedRoute>} />
        <Route path="/teacher/templates" element={<ProtectedRoute requiredRole="teacher"><TemplateLibrary /></ProtectedRoute>} />

        <Route path="/polling" element={<ProtectedRoute requiredRole="teacher"><LivePolling /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute requiredRole="teacher"><PBLWorkspace /></ProtectedRoute>} />
        <Route path="/soft-skills" element={<ProtectedRoute requiredRole="teacher"><SoftSkillsRubric /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute requiredRole="teacher"><TemplateLibrary /></ProtectedRoute>} />

        {/* Student Portal Routes */}
        <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/classes" element={<ProtectedRoute requiredRole="student"><StudentClasses /></ProtectedRoute>} />
        <Route path="/student/assignment/:assignmentId" element={<ProtectedRoute requiredRole="student"><StudentAssignment /></ProtectedRoute>} />
        <Route path="/student/practice" element={<ProtectedRoute requiredRole="student"><StudentPractice /></ProtectedRoute>} />
        <Route path="/student/projects" element={<ProtectedRoute requiredRole="student"><StudentProjects /></ProtectedRoute>} />
        <Route path="/student/polls" element={<ProtectedRoute requiredRole="student"><StudentPolls /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to AMEP server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <MainLayout isConnected={isConnected} />
      </Router>
    </AuthProvider>
  );
}

export default App;
