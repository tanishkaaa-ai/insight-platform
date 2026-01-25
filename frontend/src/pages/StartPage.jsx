import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, School, User, Lock, Eye, EyeOff, ArrowRight, Shield, BarChart3, Clock, CheckCircle, ChevronRight, PenTool } from 'lucide-react';

const StartPage = () => {
    const navigate = useNavigate();
    const { login, register } = useAuth(); // Use AuthContext

    // View State: 'landing' | 'role_selection' | 'auth'
    const [view, setView] = useState('landing');
    const [role, setRole] = useState(null); // 'student' | 'teacher' | null
    const [isRegistering, setIsRegistering] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '', // for registration
        first_name: '', // for registration
        last_name: '', // for registration
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (selectedRole) => {
        if (selectedRole === 'admin') {
            setRole('admin');
            setView('auth');
        } else {
            setRole(selectedRole);
            setView('auth');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const payload = isRegistering
                ? { ...formData, role }
                : { email: formData.email, password: formData.password };

            const result = await (isRegistering ? register(payload) : login(payload));

            if (result.success) {
                // Redirect based on backend user role
                const userRole = result.user?.role || role;
                if (userRole === 'admin') {
                    navigate('/admin');
                } else if (userRole === 'teacher') {
                    navigate('/teacher');
                } else {
                    navigate('/student');
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error("Auth Unexpected Error:", err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- LANDING VIEW ---
    if (view === 'landing') {
        return (
            <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full filter blur-3xl opacity-20 bg-orange-300 animate-pulse" />
                    <div className="absolute top-40 -right-20 w-[500px] h-[500px] rounded-full filter blur-3xl opacity-20 bg-teal-300 animate-pulse delay-700" />
                    <div className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] rounded-full filter blur-3xl opacity-20 bg-blue-300 animate-pulse delay-1000" />
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col min-h-screen">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-orange-500 to-yellow-400 p-2 rounded-lg shadow-md">
                                <School className="text-white" size={24} />
                            </div>
                            <span className="font-bold text-xl text-gray-800 tracking-tight">AMEP<span className="text-orange-500">Platform</span></span>
                        </div>
                        <nav className="hidden md:flex items-center gap-8 text-gray-600 font-medium text-sm">
                            {/* Placeholders removed as per user request */}
                        </nav>
                        <button
                            onClick={() => setView('role_selection')}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Log In
                        </button>
                    </header>

                    {/* Hero Section */}
                    <main className="flex-1 flex flex-col md:flex-row items-center gap-12 mb-20">
                        <div className="md:w-1/2 space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider border border-orange-100 mb-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                New: Digital Correction
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight">
                                Empowering <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Next-Gen</span> Education
                            </h1>
                            <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
                                Experience the future of learning with effortless attendance, digital corrections, and insight-driven analytics.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    onClick={() => setView('role_selection')}
                                    className="px-8 py-4 bg-gradient-to-r from-[#78A5C7] to-[#5383a8] text-white rounded-full font-bold text-lg shadow-blue-200 shadow-xl hover:shadow-2xl hover:brightness-110 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
                                >
                                    Get Started Free
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </button>
                            </div>

                            <div className="pt-8 flex items-center gap-4 text-sm text-gray-400 font-medium">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                                            <User size={12} />
                                        </div>
                                    ))}
                                </div>
                                <p>Trusted by 500+ Educators</p>
                            </div>
                        </div>

                        {/* Feature Cards / Visual */}
                        <div className="md:w-1/2 relative">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4 mt-8">
                                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform hover:scale-105 transition-transform duration-300">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                            <BarChart3 size={24} />
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-1">Deep Analytics</h3>
                                        <p className="text-gray-500 text-sm">Real-time insights into student performance.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform hover:scale-105 transition-transform duration-300">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                            <CheckCircle size={24} />
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-1">Smart Attendance</h3>
                                        <p className="text-gray-500 text-sm">Geo-fenced verification for accuracy.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform hover:scale-105 transition-transform duration-300">
                                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                                            <PenTool size={24} />
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-1">Digital Grading</h3>
                                        <p className="text-gray-500 text-sm">Annotate submissions directly on screen.</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform duration-300 flex flex-col justify-between h-48">
                                        <div>
                                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4 backdrop-blur-sm">
                                                <Shield size={24} />
                                            </div>
                                            <h3 className="font-bold text-white text-lg">Secure Platform</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                                            Powered by AI <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // --- ROLE SELECTION VIEW ---
    if (view === 'role_selection') {
        return (
            <div className="flex h-screen w-full overflow-hidden animate-fade-in relative">

                {/* Back to Home Button */}
                <button
                    onClick={() => setView('landing')}
                    className="absolute top-6 left-6 z-50 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-lg font-bold text-gray-600 hover:text-gray-900 transition-all text-sm flex items-center gap-2"
                >
                    <ArrowRight size={16} className="rotate-180" /> Back to Home
                </button>

                {/* Student Side */}
                <div
                    className="w-1/2 bg-gradient-to-br from-[#78A5C7] to-[#5383a8] flex flex-col items-center justify-center p-10 cursor-pointer transition-all hover:w-[55%] duration-500 relative group"
                    onClick={() => handleRoleSelect('student')}
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="bg-white p-6 rounded-full shadow-lg mb-6 transform group-hover:scale-110 transition-transform">
                        <GraduationCap size={64} className="text-[#78A5C7]" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-md">I'm a Student</h1>
                    <p className="text-white text-xl font-medium text-center max-w-md">Connect with your class, track your mastery, and learn in a fun way!</p>
                    <button className="mt-8 px-8 py-3 bg-white text-[#78A5C7] rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                        Enter Student Portal
                    </button>
                </div>

                {/* Teacher Side */}
                <div
                    className="w-1/2 bg-gradient-to-br from-[#89CCBB] to-[#6aa898] flex flex-col items-center justify-center p-10 cursor-pointer transition-all hover:w-[55%] duration-500 relative group"
                    onClick={() => handleRoleSelect('teacher')}
                >
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="bg-white p-6 rounded-full shadow-lg mb-6 transform group-hover:scale-110 transition-transform">
                        <School size={64} className="text-[#89CCBB]" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-md">I'm a Teacher</h1>
                    <p className="text-white text-xl font-medium text-center max-w-md">Manage classrooms, monitor analytics, and empower your students.</p>
                    <button className="mt-8 px-8 py-3 bg-white text-[#89CCBB] rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                        Access Dashboard
                    </button>
                </div>

                {/* Branding Overlay */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-sm">
                    <span className="font-bold text-gray-800 text-lg tracking-wider">AMEP PLATFORM</span>
                </div>

                {/* Admin Access Link */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20">
                    <button
                        onClick={() => handleRoleSelect('admin')}
                        className="group flex items-center gap-2 px-6 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/60 shadow-lg hover:shadow-xl rounded-full text-slate-600 hover:text-slate-800 font-semibold text-sm transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        <Shield size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                        <span>Admin Portal</span>
                    </button>
                </div>
            </div>
        );
    }

    // --- AUTH FORM VIEW ---
    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${role === 'student' ? 'bg-gradient-to-br from-[#78A5C7] to-[#5383a8]' : role === 'admin' ? 'bg-gradient-to-br from-slate-200 to-slate-400' : 'bg-gradient-to-br from-[#89CCBB] to-[#6aa898]'}`}>

            {/* Background Shapes */}
            <div className={`absolute top-0 left-0 w-full h-full overflow-hidden -z-10`}>
                <div className={`absolute -top-20 -left-20 w-96 h-96 rounded-full filter blur-3xl opacity-20 ${role === 'student' ? 'bg-white' : role === 'admin' ? 'bg-slate-300' : 'bg-emerald-300'}`} />
                <div className={`absolute top-40 -right-20 w-72 h-72 rounded-full filter blur-3xl opacity-20 ${role === 'student' ? 'bg-sky-400' : role === 'admin' ? 'bg-gray-300' : 'bg-emerald-200'}`} />
                <div className={`absolute -bottom-20 left-1/3 w-96 h-96 rounded-full filter blur-3xl opacity-20 ${role === 'student' ? 'bg-white' : role === 'admin' ? 'bg-slate-400' : 'bg-green-200'}`} />
            </div>

            <div className="bg-white/80 backdrop-blur-lg border border-white/50 shadow-2xl rounded-2xl p-8 w-full max-w-md relative animate-fade-in-up">

                {/* Back Button */}
                <button
                    onClick={() => setView('role_selection')}
                    className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium flex items-center gap-1"
                >
                    ← Back
                </button>

                <div className="text-center mb-8 mt-4">
                    <div className={`mx-auto p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-inner ${role === 'student' ? 'bg-[#78A5C7]/10 text-[#78A5C7]' : role === 'admin' ? 'bg-slate-100 text-slate-700' : 'bg-[#89CCBB]/10 text-[#89CCBB]'}`}>
                        {role === 'student' ? <GraduationCap size={40} /> : role === 'admin' ? <Lock size={40} /> : <School size={40} />}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">{isRegistering ? 'Create Account' : `Welcome Back, ${role === 'student' ? 'Student' : role === 'admin' ? 'Administrator' : 'Teacher'}!`}</h2>
                    <p className="text-gray-500 mt-2">{isRegistering ? 'Sign up to get started' : 'Please sign in to continue'}</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {isRegistering && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder="First Name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium placeholder-gray-400 text-gray-700 focus:bg-white"
                                    required
                                    style={{ borderColor: role === 'student' ? '#78A5C7' : '#89CCBB' }}
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium placeholder-gray-400 text-gray-700 focus:bg-white"
                                    required
                                    style={{ borderColor: role === 'student' ? '#78A5C7' : '#89CCBB' }}
                                />
                            </div>
                        </div>
                    )}

                    {isRegistering && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                name="username"
                                placeholder="Choose a Username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium placeholder-gray-400 text-gray-700 focus:bg-white"
                                required
                                style={{ borderColor: role === 'student' ? '#78A5C7' : '#89CCBB' }}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <User size={20} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium placeholder-gray-400 text-gray-700 focus:bg-white"
                            required
                            style={{ borderColor: role === 'student' ? '#78A5C7' : '#89CCBB' }}
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Lock size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium placeholder-gray-400 text-gray-700 focus:bg-white"
                            required
                            style={{ borderColor: role === 'student' ? '#78A5C7' : '#89CCBB' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {!isRegistering && (
                        <div className="flex justify-end">
                            <a href="#" className={`text-sm font-medium hover:underline ${role === 'student' ? 'text-[#5383a8]' : 'text-[#6aa898]'}`}>Forgot Password?</a>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all active:scale-95 flex items-center justify-center gap-2
              ${role === 'student'
                                ? 'bg-gradient-to-r from-[#78A5C7] to-[#5383a8] hover:brightness-110'
                                : 'bg-gradient-to-r from-[#89CCBB] to-[#6aa898] hover:brightness-110'
                            }
              ${loading ? 'opacity-70 cursor-not-allowed' : ''}
            `}
                    >
                        {loading ? 'Processing...' : (
                            <>
                                {isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    {isRegistering ? "Already have an account?" : "Don't have an account yet?"}{' '}
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className={`font-bold hover:underline ${role === 'student' ? 'text-[#5383a8]' : 'text-[#6aa898]'}`}
                    >
                        {isRegistering ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartPage;