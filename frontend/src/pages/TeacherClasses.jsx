import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Users,
    Calendar,
    ArrowRight,
    BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
const mockClasses = [
    { id: 1, name: 'Forensic Science 101', code: 'SCI-302', students: 32, schedule: 'Mon/Wed 10:00 AM', color: 'bg-teal-600' },
    { id: 2, name: 'Digital Investigation', code: 'CS-450', students: 28, schedule: 'Tue/Thu 11:30 AM', color: 'bg-indigo-600' },
    { id: 3, name: 'Cyber Ethics', code: 'HUM-205', students: 30, schedule: 'Fri 02:00 PM', color: 'bg-rose-600' },
    { id: 4, name: 'Network Security', code: 'CS-320', students: 25, schedule: 'Mon/Wed 01:00 PM', color: 'bg-blue-600' },
];

const ClassCard = ({ cls }) => (
    <motion.div
        whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col h-full"
    >
        <div className={`${cls.color} h-32 relative p-6 text-white`}>
            <div className="absolute top-4 right-4">
                <button className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
            <div className="absolute bottom-6 left-6">
                <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2 py-1 rounded mb-2 inline-block">
                    {cls.code}
                </span>
                <h3 className="font-bold text-xl leading-tight">{cls.name}</h3>
            </div>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <Users size={16} className="text-gray-400" />
                    <span>{cls.students} Students Enrolled</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{cls.schedule}</span>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex gap-2">
                <button className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    Gradebook
                </button>
                <button className="flex-1 py-2 text-sm font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center justify-center gap-1">
                    Open <ArrowRight size={14} />
                </button>
            </div>
        </div>
    </motion.div>
);

const TeacherClasses = () => {
    return (
        <TeacherLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Classes</h1>
                        <p className="text-gray-500 mt-1">Manage your courses, students, and curriculum.</p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200">
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

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockClasses.map(cls => (
                        <ClassCard key={cls.id} cls={cls} />
                    ))}

                    {/* Add New Placeholder */}
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "#f0fdf9" }}
                        whileTap={{ scale: 0.98 }}
                        className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 text-gray-400 hover:text-teal-600 hover:border-teal-200 transition-colors min-h-[300px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold">Add Another Class</span>
                    </motion.button>
                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherClasses;
