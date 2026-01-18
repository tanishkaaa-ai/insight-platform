import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { socket } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';

import TeacherDashboard from './components/TeacherDashboard';
import LivePolling from './components/LivePolling';
import PBLWorkspace from './components/PBLWorkspace';
import SoftSkillsRubric from './components/SoftSkillsRubric';
import TemplateLibrary from './components/TemplateLibrary';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

function Navigation() {
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <h2>AMEP Platform</h2>

      <ul className="nav-links">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/polling">Live Polling</Link></li>
        <li><Link to="/projects">Projects</Link></li>
        <li><Link to="/soft-skills">Soft Skills</Link></li>
        <li><Link to="/templates">Templates</Link></li>
      </ul>

      <div className="nav-right">
        <span className="user-info">
          {user?.first_name || user?.username} ({user?.role})
        </span>
        <button onClick={logout} className="logout-btn">Logout</button>
        <span className="connection-status">
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>
    </nav>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />

      <Route path="/" element={
        <ProtectedRoute>
          <TeacherDashboard />
        </ProtectedRoute>
      } />

      <Route path="/polling" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <LivePolling />
        </ProtectedRoute>
      } />

      <Route path="/projects" element={
        <ProtectedRoute>
          <PBLWorkspace />
        </ProtectedRoute>
      } />

      <Route path="/soft-skills" element={
        <ProtectedRoute>
          <SoftSkillsRubric />
        </ProtectedRoute>
      } />

      <Route path="/templates" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <TemplateLibrary />
        </ProtectedRoute>
      } />

      <Route path="/unauthorized" element={
        <div className="error-page">
          <h1>403</h1>
          <p>You don't have permission to access this page.</p>
          <Link to="/">Go to Dashboard</Link>
        </div>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
