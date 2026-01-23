import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI } from '../services/api';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    GraduationCap,
    Calendar,
    ArrowRight,
    Loader,
    X,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClassCard = ({ cls, onDelete }) => (
    <motion.div
        whileHover={{ y: -5, rotate: 1 }}
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col h-full transition-shadow hover:shadow-lg"
    >
        <div className={`${cls.theme_color || 'bg-teal-600'} h-32 relative p-6 text-white`}>
            <div className="absolute top-4 right-4">
                <button className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
            <div className="absolute top-4 right-14">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete && onDelete(cls);
                    }}
                    className="text-white/80 hover:text-red-200 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            </div>
            <div className="absolute bottom-6 left-6">
                <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2 py-1 rounded mb-2 inline-block">
                    {cls.section}
                </span>
                <h3 className="font-bold text-xl leading-tight">{cls.class_name}</h3>
            </div>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <GraduationCap size={16} className="text-gray-400" />
                    <span>{cls.student_count || 0} Students Enrolled</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{cls.schedule?.days?.join('/')} {cls.schedule?.time}</span>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex gap-2">
                <button className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    Gradebook
                </button>
                <NavLink
                    to={`/classroom/${cls.classroom_id}`}
                    className="flex-1 py-2 text-sm font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    Open <ArrowRight size={14} />
                </NavLink>
            </div>
        </div>
    </motion.div >
);

const CreateClassModal = ({ isOpen, onClose, onClassCreated, userId }) => {
    const [formData, setFormData] = useState({
        class_name: '',
        section: '',
        subject: '',
        room: '',
        grade_level: '',
        theme_color: '#0d9488' // teal-600
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { ...formData, teacher_id: userId };
            const response = await classroomAPI.createClass(data);
            if (response.data) {
                // Construct a new class object similar to what GET returns
                // or just refresh. For now, let's pass the basic info back
                // to optimize UX without full reload if possible, but 
                // refreshing list via parent is safer.
                onClassCreated();
                onClose();
            }
        } catch (error) {
            console.error("Failed to create class", error);
            alert("Failed to create class. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Create New Class</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Class Name <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                            placeholder="e.g. Introduction to Computer Science"
                            value={formData.class_name}
                            onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                                placeholder="e.g. Period 1"
                                value={formData.section}
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Room</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                                placeholder="e.g. 304"
                                value={formData.room}
                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                            placeholder="e.g. Architecture"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <Loader size={16} className="animate-spin" />}
                            Create Class
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const TeacherClasses = () => {
    const { user, getUserId } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchClasses = async () => {
        try {
            const userId = getUserId();
            if (userId) {
                const response = await classroomAPI.getTeacherClasses(userId);
                setClasses(response.data);
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, [getUserId]);

    const filteredClasses = classes.filter(cls =>
        cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <TeacherLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader className="animate-spin text-teal-600" size={40} />
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Classes</h1>
                        <p className="text-gray-500 mt-1">Manage your courses, students, and curriculum.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200"
                    >
                        <Plus size={18} /> Create New Class
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search classes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
                            <Filter size={16} /> Filter
                        </button>
                        <button className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
                            Archived
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClasses.map(cls => (
                        <ClassCard key={cls.classroom_id} cls={cls} onDelete={handleDeleteClick} />
                    ))}

                    {/* Add New Placeholder - now clickable */}
                    <motion.button
                        onClick={() => setIsCreateModalOpen(true)}
                        whileHover={{ scale: 1.02, backgroundColor: "#f0fdf9", borderColor: "#2dd4bf" }}
                        whileTap={{ scale: 0.98 }}
                        className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 text-gray-400 transition-all duration-300 min-h-[300px] group cursor-pointer"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-teal-100 flex items-center justify-center text-gray-400 group-hover:text-teal-600 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold group-hover:text-teal-700">Add Another Class</span>
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateClassModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onClassCreated={() => {
                            fetchClasses();
                        }}
                        userId={getUserId()}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-xl text-gray-800">Delete Class?</h3>
                                <button onClick={() => setDeleteModalOpen(false)}><div className="bg-gray-100 p-1 rounded-full"><X size={16} className="text-gray-500" /></div></button>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <span className="font-bold text-gray-800">{classToDelete?.class_name}</span>?
                                This action cannot be undone and will archive all associated data.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="flex-1 py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-50 bg-white border border-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </TeacherLayout>
    );
};

export default TeacherClasses;
