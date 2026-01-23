import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { classroomAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    Users,
    BookOpen,
    Calendar,
    Settings,
    MoreVertical,
    Plus,
    MessageSquare,
    FileText,
    Loader,
    ArrowLeft,
    Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherClassDetails = () => {
    const { classroomId } = useParams();
    const { getUserId } = useAuth();
    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [stream, setStream] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stream');
    const [newPostContent, setNewPostContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // New state for assignment creation
    const [postType, setPostType] = useState('announcement'); // 'announcement' | 'assignment'
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [points, setPoints] = useState(100);

    const fetchData = async () => {
        try {
            const [clsRes, studentsRes, streamRes] = await Promise.all([
                classroomAPI.getClassroom(classroomId),
                classroomAPI.getClassroomStudents(classroomId),
                classroomAPI.getClassStream(classroomId)
            ]);

            setClassroom(clsRes.data);
            setStudents(studentsRes.data);
            setStream(streamRes.data);
        } catch (error) {
            console.error("Error loading class details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (classroomId) {
            fetchData();
        }
    }, [classroomId]);

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        if (postType === 'assignment' && !title.trim()) return;

        setSubmitting(true);
        try {
            let postData = {
                author_id: getUserId(),
                author_role: 'teacher',
                post_type: postType,
                content: newPostContent,
                attachments: []
            };

            if (postType === 'assignment') {
                postData.title = title;
                postData.assignment_details = {
                    assignment_type: 'homework', // Default
                    due_date: dueDate ? new Date(dueDate).toISOString() : null,
                    points: parseInt(points) || 100,
                    attachments: []
                };
            } else {
                postData.title = 'Announcement';
            }

            await classroomAPI.createPost(classroomId, postData);

            // Reset form
            setNewPostContent('');
            setTitle('');
            setDueDate('');
            setPoints(100);
            setPostType('announcement');

            // Refresh stream
            const streamRes = await classroomAPI.getClassStream(classroomId);
            setStream(streamRes.data);
        } catch (error) {
            console.error("Failed to create post", error);
            alert("Failed to create post");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <TeacherLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader className="animate-spin text-teal-600" size={40} />
                </div>
            </TeacherLayout>
        );
    }

    if (!classroom) {
        return (
            <TeacherLayout>
                <div className="text-center py-20">
                    <h2 className="text-xl font-bold text-gray-800">Classroom not found</h2>
                    <NavLink to="/teacher/classes" className="text-teal-600 hover:underline mt-4 inline-block">
                        Return to Classes
                    </NavLink>
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="space-y-6">
                {/* Back Button */}
                <NavLink to="/teacher/classes" className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-medium w-fit">
                    <ArrowLeft size={18} /> Back to Classes
                </NavLink>

                {/* Hero Section */}
                <div className={`rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white`}>
                    <div className={`${classroom.theme_color || 'bg-teal-600'} h-40 p-8 relative text-white`}>
                        <div className="max-w-4xl">
                            <h1 className="text-3xl font-bold mb-2">{classroom.class_name}</h1>
                            <div className="flex items-center gap-4 text-white/90 font-medium">
                                <span>{classroom.section}</span>
                                <span>•</span>
                                <span>{classroom.subject || 'General'}</span>
                            </div>
                        </div>
                        <div className="absolute top-6 right-6 flex gap-2">
                            <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors text-white">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex gap-1">
                            {['stream', 'students', 'grades'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab
                                        ? 'bg-teal-50 text-teal-700'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="text-sm font-bold text-gray-500 flex items-center gap-2">
                            Class Code: <span className="text-teal-600 bg-teal-50 px-2 py-1 rounded select-all">{classroom.join_code}</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === 'stream' && (
                            <>
                                {/* Create Post / Assignment Box */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            onClick={() => setPostType('announcement')}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${postType === 'announcement' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            Announcement
                                        </button>
                                        <button
                                            onClick={() => setPostType('assignment')}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${postType === 'assignment' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            Assignment
                                        </button>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold shrink-0">
                                            T
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            {postType === 'assignment' && (
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="Assignment Title"
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                                />
                                            )}

                                            <textarea
                                                value={newPostContent}
                                                onChange={(e) => setNewPostContent(e.target.value)}
                                                placeholder={postType === 'assignment' ? "Assignment instructions..." : "Announce something to your class..."}
                                                className="w-full resize-none border-none focus:ring-0 text-gray-700 placeholder-gray-400 h-24 p-0 outline-none"
                                            />

                                            {postType === 'assignment' && (
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Due Date</label>
                                                        <input
                                                            type="datetime-local"
                                                            value={dueDate}
                                                            onChange={(e) => setDueDate(e.target.value)}
                                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                                                        />
                                                    </div>
                                                    <div className="w-32">
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Points</label>
                                                        <input
                                                            type="number"
                                                            value={points}
                                                            onChange={(e) => setPoints(e.target.value)}
                                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <div className="flex gap-2 text-gray-400">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg hover:text-teal-600 transition-colors"><FileText size={20} /></button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg hover:text-teal-600 transition-colors"><Plus size={20} /></button>
                                                </div>
                                                <button
                                                    onClick={handleCreatePost}
                                                    className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                    disabled={!newPostContent.trim() || (postType === 'assignment' && !title.trim()) || submitting}
                                                >
                                                    {submitting && <Loader className="animate-spin" size={16} />}
                                                    Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stream Posts */}
                                <div className="space-y-4">
                                    {stream.map(post => (
                                        <div key={post.post_id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${post.post_type === 'assignment' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {post.post_type === 'assignment' ? <FileText size={20} /> : (post.author?.author_name?.charAt(0) || 'U')}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                        {post.author?.author_name || 'Unknown User'}
                                                        {post.post_type === 'assignment' && (
                                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full uppercase tracking-wider">Assignment</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>

                                            {post.post_type === 'assignment' && post.title && (
                                                <h4 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h4>
                                            )}

                                            <div className="text-gray-700 whitespace-pre-wrap mb-4">
                                                {post.content}
                                            </div>

                                            {post.post_type === 'assignment' && post.assignment_details && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex gap-6 text-sm">
                                                    <div>
                                                        <span className="block text-xs font-bold text-blue-400 uppercase">Due Date</span>
                                                        <span className="font-bold text-blue-800">
                                                            {post.assignment_details.due_date ? new Date(post.assignment_details.due_date).toLocaleDateString() : 'No Due Date'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-bold text-blue-400 uppercase">Points</span>
                                                        <span className="font-bold text-blue-800">{post.assignment_details.points || 100} pts</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-4 border-t border-gray-50 flex gap-4 text-sm font-bold text-gray-500">
                                                <button className="hover:text-teal-600 transition-colors flex items-center gap-1">
                                                    <MessageSquare size={16} /> {post.comment_count} Comments
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {stream.length === 0 && (
                                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
                                            <p className="text-gray-400 font-medium">No posts yet. Start the conversation!</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'students' && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-0 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-700">Student Roster ({students.length})</h3>
                                    <button className="text-teal-600 font-bold text-sm hover:underline">+ Invite Students</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {students.map(student => (
                                        <div key={student.student_id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full text-white flex items-center justify-center font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-700">{student.name}</span>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={16} /></button>
                                        </div>
                                    ))}
                                    {students.length === 0 && (
                                        <div className="p-8 text-center text-gray-400">No students enrolled yet.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'grades' && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
                                <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Gradebook Empty</h3>
                                <p className="text-gray-500">Create assignments to start tracking grades.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar size={18} className="text-teal-600" /> Upcoming
                            </h3>
                            <p className="text-gray-400 text-sm">No work due soon</p>
                            <button className="mt-4 w-full py-2 text-sm font-bold text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-right">
                                View All
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherClassDetails;
