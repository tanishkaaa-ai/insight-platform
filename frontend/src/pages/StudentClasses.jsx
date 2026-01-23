import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Book, User, Clock, MessageSquare, FileText, ChevronRight, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { classroomAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const StudentClasses = () => {
    const { getUserId } = useAuth();
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [stream, setStream] = useState([]);
    const [loading, setLoading] = useState(true);
    const [streamLoading, setStreamLoading] = useState(false);
    const [error, setError] = useState(null);

    // Join Class State
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState(null);

    const STUDENT_ID = getUserId();

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await classroomAPI.getStudentClasses(STUDENT_ID);
            setClasses(response.data);
            if (response.data.length > 0 && !selectedClass) {
                setSelectedClass(response.data[0]);
            }
        } catch (err) {
            console.error("Error fetching classes:", err);
            setError("Failed to load your classes.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch classes on mount
    useEffect(() => {
        if (STUDENT_ID) {
            fetchClasses();
        } else {
            setLoading(false);
            setError("Please log in to view your classes.");
        }
    }, [STUDENT_ID]);

    // Fetch stream when selected class changes
    useEffect(() => {
        if (!selectedClass) return;

        const fetchStream = async () => {
            try {
                setStreamLoading(true);
                const response = await classroomAPI.getClassStream(selectedClass.classroom_id);
                setStream(response.data);
            } catch (err) {
                console.error("Error fetching stream:", err);
                // Don't set global error, just maybe show empty stream or toast
            } finally {
                setStreamLoading(false);
            }
        };

        fetchStream();
    }, [selectedClass]);

    const handleStartAssignment = (assignmentId) => {
        navigate(`/student/assignment/${assignmentId}`);
    };

    const handleViewDetails = (postId) => {
        navigate(`/student/assignment/${postId}`);
    };

    const handleJoinClass = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoinLoading(true);
        setJoinError(null);

        try {
            await classroomAPI.joinClass({
                student_id: STUDENT_ID,
                join_code: joinCode.trim()
            });

            toast.success("Successfully joined the class!");
            setShowJoinModal(false);
            setJoinCode('');
            // Refresh classes
            fetchClasses();
        } catch (err) {
            console.error("Join class error:", err);
            setJoinError(err.response?.data?.error || "Failed to join class. Please check the code.");
        } finally {
            setJoinLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
                    <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading your classes...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Oops!</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">

                {/* Class List (Sidebar-ish) */}
                <div className="lg:col-span-1 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Book className="text-orange-500" /> My Classes
                        </h2>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors shadow-md"
                            title="Join a Class"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto pr-2 flex-1 space-y-4">
                        {classes.length === 0 ? (
                            <div className="text-gray-400 italic p-8 border-2 border-dashed border-gray-200 rounded-xl text-center flex flex-col items-center">
                                <Book size={48} className="mb-4 opacity-20" />
                                <p>You haven't joined any classes yet.</p>
                                <button
                                    onClick={() => setShowJoinModal(true)}
                                    className="mt-4 text-orange-500 font-bold hover:underline"
                                >
                                    Join your first class
                                </button>
                            </div>
                        ) : (
                            classes.map((cls) => (
                                <motion.div
                                    key={cls.classroom_id}
                                    onClick={() => setSelectedClass(cls)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all duration-300 ease-out hover:-translate-y-1 ${selectedClass?.classroom_id === cls.classroom_id
                                        ? 'border-orange-400 bg-white shadow-md -rotate-1 ring-2 ring-orange-100 ring-offset-2'
                                        : 'border-transparent bg-white/60 hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`p-2 rounded-lg ${cls.theme_color ? '' : 'bg-teal-100 text-teal-700'} font-bold text-xs uppercase tracking-wider`}
                                            style={cls.theme_color ? { backgroundColor: `${cls.theme_color}20`, color: cls.theme_color } : {}}>
                                            {cls.class_name.split(' ')[0]}
                                        </div>
                                        <ChevronRight className={`transition-transform ${selectedClass?.classroom_id === cls.classroom_id ? 'rotate-90 text-orange-500' : 'text-gray-300'}`} size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg">{cls.class_name}</h3>
                                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><User size={14} /> {cls.teacher_name}</span>
                                        {/* <span className="flex items-center gap-1"><Clock size={14} /> {cls.time}</span> */}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Class Stream (Main Content) */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden flex flex-col">
                    {selectedClass ? (
                        <>
                            {/* Header */}
                            <div className="p-6 bg-gradient-to-r from-slate-50 to-orange-50 border-b border-orange-100">
                                <h1 className="text-2xl font-extrabold text-gray-800">{selectedClass.class_name}</h1>
                                <p className="text-gray-500 flex items-center gap-2 mt-1">
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Active</span>
                                    • Instructor: {selectedClass.teacher_name}
                                </p>
                            </div>

                            {/* Feed */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                                {streamLoading ? (
                                    <div className="flex justify-center p-12">
                                        <Loader2 className="animate-spin text-orange-400" size={32} />
                                    </div>
                                ) : stream.length > 0 ? (
                                    stream.map((post) => (
                                        <motion.div
                                            key={post.post_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 group hover:border-orange-200 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold uppercase">
                                                    {post.author.author_name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{post.author.author_name}</p>
                                                    <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                {post.post_type === 'assignment' && (
                                                    <span className="ml-auto bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-lg uppercase">
                                                        Assignment
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{post.content || post.title}</p>
                                            {post.content && post.title && post.title !== post.content && <h4 className='font-bold mb-2'>{post.title}</h4>}


                                            {post.post_type === 'assignment' && post.assignment_details && (
                                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between mb-4">
                                                    <span className="text-sm text-blue-800 font-medium flex items-center gap-2">
                                                        <Clock size={16} /> Due: {post.assignment_details.due_date ? new Date(post.assignment_details.due_date).toLocaleDateString() : 'No Due Date'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleStartAssignment(post.post_id)}
                                                        className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        Start Now
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 pt-3 border-t border-gray-50 text-gray-400 text-sm">
                                                <button className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                                                    <MessageSquare size={16} /> {post.comment_count} Comments
                                                </button>
                                                {post.post_type === 'assignment' && (
                                                    <button
                                                        onClick={() => handleViewDetails(post.post_id)}
                                                        className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer"
                                                    >
                                                        <FileText size={16} /> View Details
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <div className="bg-white p-4 rounded-full shadow-sm mb-4 relative">
                                            <Book size={32} className="text-gray-300" />
                                            <div className="absolute -bottom-1 -right-1 bg-green-100 p-1 rounded-full">
                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg">All caught up in {selectedClass.class_name}!</h3>
                                        <p className="text-gray-500 max-w-xs mt-2">No new assignments or announcements. Enjoy the downtime ☕</p>
                                    </div>
                                )}

                                <div className="text-center py-8 text-gray-400 text-sm">
                                    — You're all caught up! —
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 flex-col">
                            <Book size={48} className="mb-4 opacity-20" />
                            <p>Select a class to view its stream</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Join Class Modal */}
            <AnimatePresence>
                {showJoinModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowJoinModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setShowJoinModal(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Join a Class</h3>
                                <p className="text-gray-500">
                                    Ask your teacher for the class code, then enter it here.
                                </p>
                            </div>

                            <form onSubmit={handleJoinClass}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Class Code
                                        </label>
                                        <input
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                            placeholder="e.g. AB12CD"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-lg font-mono tracking-wider uppercase transition-colors"
                                            maxLength={6}
                                        />
                                    </div>

                                    {joinError && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            {joinError}
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setShowJoinModal(false)}
                                            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!joinCode.trim() || joinLoading}
                                            className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {joinLoading ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                'Join Class'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout >
    );
};

export default StudentClasses;
