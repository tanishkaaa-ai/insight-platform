import React from 'react';
import TeacherLayout from '../components/TeacherLayout';
import {
    BarChart2,
    TrendingUp,
    Users,
    AlertTriangle,
    Download,
    Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const MockChart = ({ height = "h-40", color = "bg-teal-100" }) => (
    <div className={`w-full ${height} flex items-end justify-between gap-2`}>
        {[40, 65, 50, 80, 55, 90, 70, 85].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end group">
                <div
                    className={`${color} rounded-t transition-all duration-500 group-hover:bg-opacity-80`}
                    style={{ height: `${h}%` }}
                />
            </div>
        ))}
    </div>
);

const TeacherAnalytics = () => {
    return (
        <TeacherLayout>
            <div className="space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Analytics Hub</h1>
                        <p className="text-gray-500 mt-1">Deep dive into institutional metrics and student outcomes.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl">
                        <button className="px-4 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm">Last 7 Days</button>
                        <button className="px-4 py-1.5 text-gray-500 font-medium hover:bg-gray-50 rounded-lg text-sm">30 Days</button>
                        <button className="px-4 py-1.5 text-gray-500 font-medium hover:bg-gray-50 rounded-lg text-sm">Semester</button>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg. Mastery</p>
                                <h3 className="text-3xl font-extrabold text-gray-800 mt-1">82%</h3>
                            </div>
                            <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <TrendingUp size={12} /> +4.2%
                            </div>
                        </div>
                        <MockChart height="h-16" color="bg-green-500" />
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Engagement</p>
                                <h3 className="text-3xl font-extrabold text-gray-800 mt-1">High</h3>
                            </div>
                            <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <TrendingUp size={12} /> Stable
                            </div>
                        </div>
                        <MockChart height="h-16" color="bg-blue-500" />
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Intervention Rate</p>
                                <h3 className="text-3xl font-extrabold text-gray-800 mt-1">12%</h3>
                            </div>
                            <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <AlertTriangle size={12} /> -2%
                            </div>
                        </div>
                        <MockChart height="h-16" color="bg-yellow-500" />
                    </div>
                </div>

                {/* Detailed Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 text-lg">Mastery by Concept</h3>
                            <button className="text-gray-400 hover:text-teal-600"><Download size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            {['Introduction to Forensics', 'Evidence Collection', 'Fingerprint Analysis', 'DNA Profiling', 'Digital Evidence'].map((topic, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-600">{topic}</span>
                                        <span className="font-bold text-gray-800">{85 - (i * 5)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${85 - (i * 5)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 text-lg">Student Activity Trends</h3>
                            <button className="text-gray-400 hover:text-teal-600"><Calendar size={20} /></button>
                        </div>
                        <div className="h-64 flex items-end gap-4">
                            {/* Simulated Complex Chart */}
                            <div className="w-full h-full bg-gray-50 rounded-xl relative overflow-hidden flex items-end p-4 gap-2">
                                {[30, 45, 60, 40, 70, 85, 90].map((h, i) => (
                                    <div key={i} className="flex-1 bg-indigo-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                                ))}
                                {/* Overlay Line Graph Simulation with SVG */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none p-4" preserveAspectRatio="none">
                                    <path d="M0 200 L 50 180 L 100 150 L 150 170 L 200 100 L 250 50 L 300 30" stroke="#f43f5e" strokeWidth="3" fill="none" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center gap-6 text-sm">
                            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full" /> Participation</span>
                            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-full" /> Quiz Attempts</span>
                        </div>
                    </div>

                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherAnalytics;
