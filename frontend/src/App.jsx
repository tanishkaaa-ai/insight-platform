import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { socket } from './services/api';

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
import StudentPractice from './pages/StudentPractice';
import StudentProjects from './pages/StudentProjects';
import StudentPolls from './pages/StudentPolls';

function MainLayout({ isConnected }) {
  const location = useLocation();
  const isStartPage = location.pathname === '/';

  return (
    <>
      {/* Navigation - Hidden on StartPage, Student Portal, AND Teacher Portal (which has its own layout) */}
      {!isStartPage && !location.pathname.startsWith('/student') && !location.pathname.startsWith('/teacher') && (
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
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
        <Route path="/teacher/polls" element={<LivePolling />} /> {/* Aliased for now */}
        <Route path="/teacher/projects" element={<PBLWorkspace />} /> {/* Aliased for now */}
        <Route path="/teacher/templates" element={<TemplateLibrary />} /> {/* Aliased for now */}

        <Route path="/polling" element={<LivePolling />} />
        <Route path="/projects" element={<PBLWorkspace />} />
        <Route path="/soft-skills" element={<SoftSkillsRubric />} />
        <Route path="/templates" element={<TemplateLibrary />} />

        {/* Student Portal Routes */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/classes" element={<StudentClasses />} />
        <Route path="/student/practice" element={<StudentPractice />} />
        <Route path="/student/projects" element={<StudentProjects />} />
        <Route path="/student/polls" element={<StudentPolls />} />
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
    <Router>
      <MainLayout isConnected={isConnected} />
    </Router>
  );
}

export default App;
