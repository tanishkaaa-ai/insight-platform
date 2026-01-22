import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthCard = ({ isRegister = false }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(!isRegister);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'student',
    first_name: '',
    last_name: '',
    grade_level: null,
    section: '',
    learning_style: '',
    subject_area: '',
    department: '',
    years_experience: 0
  });
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (loginErrors[name]) {
      setLoginErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: name === 'grade_level' || name === 'years_experience' ? (value ? parseInt(value) : name === 'grade_level' ? null : 0) : value
    }));
    // Clear error when user starts typing
    if (registerErrors[name]) {
      setRegisterErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};

    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!loginData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors = {};

    if (!registerData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!registerData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (registerData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!registerData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!registerData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!registerData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (registerData.role === 'student' && (registerData.grade_level === null || registerData.grade_level === '')) {
      newErrors.grade_level = 'Grade level is required for students';
    } else if (registerData.role === 'student' && registerData.grade_level !== null && registerData.grade_level !== '') {
      const grade = parseInt(registerData.grade_level);
      if (isNaN(grade) || grade < 1 || grade > 12) {
        newErrors.grade_level = 'Grade level must be between 1 and 12';
      }
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const response = await authAPI.login(loginData);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Navigate based on user role
      if (response.data.user.role === 'teacher') {
        navigate('/dashboard');
      } else {
        navigate('/'); // Default to home for students
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      // Prepare the payload - only send the required fields based on role
      const payload = {
        email: registerData.email,
        username: registerData.username,
        password: registerData.password,
        role: registerData.role,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
      };

      // Add role-specific fields
      if (registerData.role === 'student') {
        payload.grade_level = parseInt(registerData.grade_level);
        if (registerData.section) payload.section = registerData.section;
        if (registerData.learning_style) payload.learning_style = registerData.learning_style;
      } else if (registerData.role === 'teacher') {
        if (registerData.subject_area) payload.subject_area = registerData.subject_area;
        if (registerData.department) payload.department = registerData.department;
        if (registerData.years_experience) payload.years_experience = parseInt(registerData.years_experience);
      }

      const response = await authAPI.register(payload);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Navigate based on user role
      if (response.data.user.role === 'teacher') {
        navigate('/dashboard');
      } else {
        navigate('/'); // Default to home for students
      }
    } catch (error) {
      console.error('Registration error:', error);
      setApiError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 w-full max-w-2xl border border-white/20 shadow-2xl shadow-black/30">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
            {isLogin ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" x2="3" y1="12" y2="12"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" x2="19" y1="8" y2="14"></line>
                <line x1="22" x2="16" y1="11" y2="11"></line>
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Your Account'}</h1>
          <p className="text-slate-300">{isLogin ? 'Sign in to your AMEP account' : 'Join AMEP and start your educational journey'}</p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm backdrop-blur-sm">
            {apiError}
          </div>
        )}

        {/* Single Toggle Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setApiError('');
            }}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/50 hover:from-blue-700 hover:to-cyan-700"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {/* Form Content */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className={`w-full px-5 py-4 bg-slate-800/60 border ${
                    loginErrors.email ? 'border-red-500' : 'border-slate-600/50'
                  } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12`}
                  placeholder="Enter your email"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </div>
              </div>
              {loginErrors.email && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" x2="12" y1="8" y2="12"></line>
                    <line x1="12" x2="12.01" y1="16" y2="16"></line>
                  </svg>
                  {loginErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className={`w-full px-5 py-4 bg-slate-800/60 border ${
                    loginErrors.password ? 'border-red-500' : 'border-slate-600/50'
                  } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12`}
                  placeholder="Enter your password"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <rect width="18" height="11" x="3" y="11" rx="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              </div>
              {loginErrors.password && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" x2="12" y1="8" y2="12"></line>
                    <line x1="12" x2="12.01" y1="16" y2="16"></line>
                  </svg>
                  {loginErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    className={`w-full px-5 py-4 bg-slate-800/60 border ${
                      registerErrors.email ? 'border-red-500' : 'border-slate-600/50'
                    } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12`}
                    placeholder="Enter your email"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </div>
                </div>
                {registerErrors.email && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" x2="12" y1="8" y2="12"></line>
                      <line x1="12" x2="12.01" y1="16" y2="16"></line>
                    </svg>
                    {registerErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-slate-200">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    className={`w-full px-5 py-4 bg-slate-800/60 border ${
                      registerErrors.username ? 'border-red-500' : 'border-slate-600/50'
                    } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12`}
                    placeholder="Choose a username"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <circle cx="18" cy="15" r="3"></circle>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M10 15H6a4 4 0 0 0-4 4v2"></path>
                      <path d="m21.7 16.4-.9-.9"></path>
                    </svg>
                  </div>
                </div>
                {registerErrors.username && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" x2="12" y1="8" y2="12"></line>
                      <line x1="12" x2="12.01" y1="16" y2="16"></line>
                    </svg>
                    {registerErrors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    className={`w-full px-5 py-4 bg-slate-800/60 border ${
                      registerErrors.password ? 'border-red-500' : 'border-slate-600/50'
                    } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12`}
                    placeholder="Create a password"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <rect width="18" height="11" x="3" y="11" rx="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                </div>
                {registerErrors.password && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" x2="12" y1="8" y2="12"></line>
                      <line x1="12" x2="12.01" y1="16" y2="16"></line>
                    </svg>
                    {registerErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-semibold text-slate-200">
                  Account Type
                </label>
                <select
                  id="role"
                  name="role"
                  value={registerData.role}
                  onChange={handleRegisterChange}
                  className="w-full px-5 py-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-slate-800/60 pr-10"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="first_name" className="block text-sm font-semibold text-slate-200">
                  First Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={registerData.first_name}
                    onChange={handleRegisterChange}
                    className={`w-full px-5 py-4 bg-slate-800/60 border ${
                      registerErrors.first_name ? 'border-red-500' : 'border-slate-600/50'
                    } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12`}
                    placeholder="First name"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                </div>
                {registerErrors.first_name && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" x2="12" y1="8" y2="12"></line>
                      <line x1="12" x2="12.01" y1="16" y2="16"></line>
                    </svg>
                    {registerErrors.first_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="last_name" className="block text-sm font-semibold text-slate-200">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={registerData.last_name}
                    onChange={handleRegisterChange}
                    className={`w-full px-5 py-4 bg-slate-800/60 border ${
                      registerErrors.last_name ? 'border-red-500' : 'border-slate-600/50'
                    } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12`}
                    placeholder="Last name"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                </div>
                {registerErrors.last_name && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" x2="12" y1="8" y2="12"></line>
                      <line x1="12" x2="12.01" y1="16" y2="16"></line>
                    </svg>
                    {registerErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            {registerData.role === 'student' && (
              <div className="space-y-2">
                <label htmlFor="grade_level" className="block text-sm font-semibold text-slate-200">
                  Grade Level
                </label>
                <select
                  id="grade_level"
                  name="grade_level"
                  value={registerData.grade_level || ''}
                  onChange={handleRegisterChange}
                  className={`w-full px-5 py-4 bg-slate-800/60 border ${
                    registerErrors.grade_level ? 'border-red-500' : 'border-slate-600/50'
                  } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-slate-800/60 pr-10`}
                >
                  <option value="">Select Grade</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                {registerErrors.grade_level && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" x2="12" y1="8" y2="12"></line>
                      <line x1="12" x2="12.01" y1="16" y2="16"></line>
                    </svg>
                    {registerErrors.grade_level}
                  </p>
                )}
              </div>
            )}

            {registerData.role === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="section" className="block text-sm font-semibold text-slate-200">
                    Section (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="section"
                      name="section"
                      value={registerData.section}
                      onChange={handleRegisterChange}
                      className="w-full px-5 py-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12"
                      placeholder="Class section"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <path d="M12 2v20M8 22V6.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V22"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="learning_style" className="block text-sm font-semibold text-slate-200">
                    Learning Style (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="learning_style"
                      name="learning_style"
                      value={registerData.learning_style}
                      onChange={handleRegisterChange}
                      className="w-full px-5 py-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12"
                      placeholder="Visual, Auditory, etc."
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5 .7.8 1.2 1.5 1.5 2.5"></path>
                        <path d="M9 18h6M10 22h4"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {registerData.role === 'teacher' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="subject_area" className="block text-sm font-semibold text-slate-200">
                    Subject Area (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="subject_area"
                      name="subject_area"
                      value={registerData.subject_area}
                      onChange={handleRegisterChange}
                      className="w-full px-5 py-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12"
                      placeholder="Math, Science, etc."
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="department" className="block text-sm font-semibold text-slate-200">
                    Department (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={registerData.department}
                      onChange={handleRegisterChange}
                      className="w-full px-5 py-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12"
                      placeholder="Department name"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <path d="M20 16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5l-1-1H15a2 2 0 0 0-2 2v1"></path>
                        <path d="M15 8v8a2 2 0 0 0 2 2h3.5l1 1H20a2 2 0 0 0 2-2v-4"></path>
                        <path d="M17 14V8"></path>
                        <path d="M8 16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating account...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Create Account</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthCard;