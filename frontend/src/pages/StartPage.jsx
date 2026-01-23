import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, School, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const StartPage = () => {
    const navigate = useNavigate();
    const { login, register } = useAuth(); // Use AuthContext
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
                if (userRole === 'teacher') {
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

    // Dual Pathway Pre-selection
    if (!role) {
        return (
            <div className="flex h-screen w-full overflow-hidden">
                {/* Student Side */}
                <div
                    className="w-1/2 bg-gradient-to-br from-orange-400 to-yellow-300 flex flex-col items-center justify-center p-10 cursor-pointer transition-all hover:w-[55%] duration-500 relative group"
                    onClick={() => setRole('student')}
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="bg-white p-6 rounded-full shadow-lg mb-6 transform group-hover:scale-110 transition-transform">
                        <GraduationCap size={64} className="text-orange-500" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-md">I'm a Student</h1>
                    <p className="text-white text-xl font-medium text-center max-w-md">Connect with your class, track your mastery, and learn in a fun way!</p>
                    <button className="mt-8 px-8 py-3 bg-white text-orange-500 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                        Enter Student Portal
                    </button>
                </div>

                {/* Teacher Side */}
                <div
                    className="w-1/2 bg-gradient-to-br from-teal-600 to-emerald-500 flex flex-col items-center justify-center p-10 cursor-pointer transition-all hover:w-[55%] duration-500 relative group"
                    onClick={() => setRole('teacher')}
                >
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="bg-white p-6 rounded-full shadow-lg mb-6 transform group-hover:scale-110 transition-transform">
                        <School size={64} className="text-teal-600" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-md">I'm a Teacher</h1>
                    <p className="text-white text-xl font-medium text-center max-w-md">Manage classrooms, monitor analytics, and empower your students.</p>
                    <button className="mt-8 px-8 py-3 bg-white text-teal-600 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                        Access Dashboard
                    </button>
                </div>

                {/* Branding Overlay */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-sm">
                    <span className="font-bold text-gray-800 text-lg tracking-wider">AMEP PLATFORM</span>
                </div>
            </div>
        );
    }

    // Login/Register Form
    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${role === 'student' ? 'bg-orange-50' : 'bg-teal-50'}`}>

            {/* Background Shapes */}
            <div className={`absolute top-0 left-0 w-full h-full overflow-hidden -z-10`}>
                <div className={`absolute -top-20 -left-20 w-96 h-96 rounded-full filter blur-3xl opacity-30 ${role === 'student' ? 'bg-orange-300' : 'bg-teal-300'}`} />
                <div className={`absolute top-40 -right-20 w-72 h-72 rounded-full filter blur-3xl opacity-30 ${role === 'student' ? 'bg-yellow-300' : 'bg-emerald-300'}`} />
                <div className={`absolute -bottom-20 left-1/3 w-96 h-96 rounded-full filter blur-3xl opacity-30 ${role === 'student' ? 'bg-red-200' : 'bg-blue-200'}`} />
            </div>

            <div className="bg-white/80 backdrop-blur-lg border border-white/50 shadow-2xl rounded-2xl p-8 w-full max-w-md relative animate-fade-in-up">

                {/* Back Button */}
                <button
                    onClick={() => setRole(null)}
                    className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium flex items-center gap-1"
                >
                    ← Back
                </button>

                <div className="text-center mb-8 mt-4">
                    <div className={`mx-auto p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-inner ${role === 'student' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'}`}>
                        {role === 'student' ? <GraduationCap size={40} /> : <School size={40} />}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">{isRegistering ? 'Create Account' : `Welcome Back, ${role === 'student' ? 'Student' : 'Teacher'}!`}</h2>
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
                                    style={{ borderColor: role === 'student' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(13, 148, 136, 0.3)' }}
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
                                    style={{ borderColor: role === 'student' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(13, 148, 136, 0.3)' }}
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
                                style={{ borderColor: role === 'student' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(13, 148, 136, 0.3)' }}
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
                            style={{ borderColor: role === 'student' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(13, 148, 136, 0.3)' }}
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
                            style={{ borderColor: role === 'student' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(13, 148, 136, 0.3)' }}
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
                            <a href="#" className={`text-sm font-medium hover:underline ${role === 'student' ? 'text-orange-600' : 'text-teal-600'}`}>Forgot Password?</a>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all active:scale-95 flex items-center justify-center gap-2
              ${role === 'student'
                                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:brightness-110'
                                : 'bg-gradient-to-r from-teal-600 to-emerald-500 hover:brightness-110'
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
                        className={`font-bold hover:underline ${role === 'student' ? 'text-orange-600' : 'text-teal-600'}`}
                    >
                        {isRegistering ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartPage;
