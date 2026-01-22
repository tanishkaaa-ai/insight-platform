import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Book, User, Clock, MessageSquare, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
const mockClasses = [
    { id: 1, name: 'Forensic Science 101', teacher: 'Dr. Watson', time: 'Mon/Wed 10:00 AM', color: 'bg-teal-100 text-teal-700', icon: 'microscope' },
    { id: 2, name: 'Digital Investigation', teacher: 'Ms. Holmes', time: 'Tue/Thu 2:00 PM', color: 'bg-blue-100 text-blue-700', icon: 'laptop' },
    { id: 3, name: 'Cyber Ethics', teacher: 'Mr. Poirot', time: 'Fri 11:00 AM', color: 'bg-purple-100 text-purple-700', icon: 'scale' },
];

const mockStream = [
    { id: 1, classId: 1, type: 'announcement', author: 'Dr. Watson', content: 'Remember to bring your lab coats for tomorrow\'s crime scene simulation!', date: '2 hours ago', comments: 12 },
    { id: 2, classId: 1, type: 'assignment', author: 'Dr. Watson', content: 'New Assignment Posted: Case Study #5 - The Silent Witness', date: 'Yesterday', due: 'Friday, 5 PM', comments: 3 },
    { id: 3, classId: 2, type: 'announcement', author: 'Ms. Holmes', content: 'Guest lecture on digital forensics tools this Thursday.', date: '1 day ago', comments: 5 },
    { id: 4, classId: 2, type: 'assignment', author: 'Ms. Holmes', content: 'Assignment: Recover deleted files from the provided image.', date: '2 days ago', due: 'Next Monday', comments: 8 },
    { id: 5, classId: 3, type: 'announcement', author: 'Mr. Poirot', content: 'Review the ethical guidelines for standard procedure.', date: '3 hours ago', comments: 2 },
];

const StudentClasses = () => {
    const [selectedClass, setSelectedClass] = useState(mockClasses[0]);

    const classStream = mockStream.filter(post => post.classId === selectedClass.id);

    const handleStartAssignment = () => {
        alert("Assignment submission interface coming soon!");
    };

    const handleViewDetails = () => {
        alert("Assignment details opening...");
    };

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">

                {/* Class List (Sidebar-ish) */}
                <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Book className="text-orange-500" /> My Classes
                    </h2>
                    {mockClasses.map((cls) => (
                        <motion.div
                            key={cls.id}
                            onClick={() => setSelectedClass(cls)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedClass.id === cls.id
                                ? 'border-orange-400 bg-white shadow-md'
                                : 'border-transparent bg-white/60 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className={`p-2 rounded-lg ${cls.color} font-bold text-xs uppercase tracking-wider`}>
                                    {cls.name.split(' ')[0]}
                                </div>
                                <ChevronRight className={`transition-transform ${selectedClass.id === cls.id ? 'rotate-90 text-orange-500' : 'text-gray-300'}`} size={20} />
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">{cls.name}</h3>
                            <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><User size={14} /> {cls.teacher}</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> {cls.time}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Class Stream (Main Content) */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-slate-50 to-orange-50 border-b border-orange-100">
                        <h1 className="text-2xl font-extrabold text-gray-800">{selectedClass.name}</h1>
                        <p className="text-gray-500 flex items-center gap-2 mt-1">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Active</span>
                            • Instructor: {selectedClass.teacher}
                        </p>
                    </div>

                    {/* Feed */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                        {classStream.length > 0 ? (
                            classStream.map((post) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 group hover:border-orange-200 transition-colors"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                            {post.author[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{post.author}</p>
                                            <p className="text-xs text-gray-400">{post.date}</p>
                                        </div>
                                        {post.type === 'assignment' && (
                                            <span className="ml-auto bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-lg uppercase">
                                                Assignment
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

                                    {post.type === 'assignment' && (
                                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between mb-4">
                                            <span className="text-sm text-blue-800 font-medium flex items-center gap-2">
                                                <Clock size={16} /> Due: {post.due}
                                            </span>
                                            <button
                                                onClick={handleStartAssignment}
                                                className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Start Now
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 pt-3 border-t border-gray-50 text-gray-400 text-sm">
                                        <button className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                                            <MessageSquare size={16} /> {post.comments} Comments
                                        </button>
                                        {post.type === 'assignment' && (
                                            <button
                                                onClick={handleViewDetails}
                                                className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer"
                                            >
                                                <FileText size={16} /> View Details
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <p>No posts yet for this class.</p>
                            </div>
                        )}

                        <div className="text-center py-8 text-gray-400 text-sm">
                            — You're all caught up! —
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default StudentClasses;
