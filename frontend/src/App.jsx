import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { socket } from './services/api';

// Import components
import LandingPage from './components/LandingPage';
import TeacherDashboard from './components/TeacherDashboard';
import LivePolling from './components/LivePolling';
import PBLWorkspace from './components/PBLWorkspace';
import SoftSkillsRubric from './components/SoftSkillsRubric';
import TemplateLibrary from './components/TemplateLibrary';

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/90 backdrop-blur-lg border-b border-slate-800/50 py-2' : 'bg-slate-900/60 backdrop-blur-lg border-b border-slate-800/30 py-4'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-white">AMEP</div>
              <div className="text-[10px] text-cyan-400">AI Education Intelligence</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            <Link 
              to="/"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm ${isActive('/') ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
            >
              Home
            </Link>
            <Link 
              to="/dashboard"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm ${isActive('/dashboard') ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/polling"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm ${isActive('/polling') ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
            >
              Live Polling
            </Link>
            <Link 
              to="/projects"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm ${isActive('/projects') ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
            >
              Projects
            </Link>
            <Link 
              to="/soft-skills"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm ${isActive('/soft-skills') ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
            >
              Soft Skills
            </Link>
            <Link 
              to="/templates"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm ${isActive('/templates') ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}
            >
              Templates
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden lg:block text-xs text-slate-400">
              {socket.connected ? '● Connected' : '○ Disconnected'}
            </span>
            <button className="lg:hidden p-1.5 rounded-lg bg-slate-800/50 text-white hover:bg-slate-700/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

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
      <Navigation />
      {/* Add padding to account for fixed navbar */}
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<TeacherDashboard />} />
          <Route path="/polling" element={<LivePolling />} />
          <Route path="/projects" element={<PBLWorkspace />} />
          <Route path="/soft-skills" element={<SoftSkillsRubric />} />
          <Route path="/templates" element={<TemplateLibrary />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
