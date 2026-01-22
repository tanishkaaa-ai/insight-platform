import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GamificationBadge from '../components/GamificationBadge';
import ProgressBar from '../components/ProgressBar';
import { BookOpen, Clock, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data (Simulating API response)
const mockStudentData = {
    name: 'Alex',
    level: 5,
    xp: 2450,
    nextLevelXp: 3000,
    streak: 5,
    masteryScore: 78,
    pendingAssignments: 3,
    nextClass: {
        subject: 'Forensic Science',
        time: '10:00 AM',
        topic: 'Crime Scene Analysis'
    },
    recentActivity: [
        { type: 'mastery', title: 'Mastered "DNA Profiling"', date: '2 hours ago', icon: 'trophy', color: 'purple' },
        { type: 'assignment', title: 'Submitted "Case Study #4"', date: 'Yesterday', icon: 'award', color: 'blue' },
        { type: 'badge', title: 'Earned "Fast Learner"', date: '2 days ago', icon: 'zap', color: 'yellow' }
    ]
};

const StudentDashboard = () => {
    const [data, setData] = useState(mockStudentData);

    // In production, fetch this data from /api/mastery/student/:id and /api/classroom/students/:id/assignments

    return (
        <DashboardLayout>
            <div className="space-y-8">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-orange-400 to-yellow-400 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                            Start your adventure, {data.name}! 🚀
                        </h1>
                        <p className="text-orange-50 font-medium text-lg mb-6 max-w-xl">
                            You're on a <span className="font-bold bg-white/20 px-2 py-1 rounded-lg">{data.streak}-day streak</span>! Keep it up to unlock the "Time Traveler" badge.
                        </p>

                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl max-w-sm border border-white/20">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-sm uppercase tracking-wider opacity-90">Level {data.level}</span>
                                <span className="text-xs font-mono">{data.xp} / {data.nextLevelXp} XP</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(data.xp / data.nextLevelXp) * 100}%` }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="bg-white h-full rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Background Decorations */}
                    <Sparkles className="absolute top-4 right-8 text-yellow-200 opacity-50" size={64} />
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                </motion.div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mastery Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-green-100 p-3 rounded-xl text-green-600">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="font-bold text-gray-700">Mastery Score</h3>
                        </div>
                        <div className="mb-2">
                            <span className="text-4xl font-extrabold text-gray-800">{data.masteryScore}%</span>
                        </div>
                        <ProgressBar value={data.masteryScore} color="bg-green-500" height="h-2" showLabel={false} />
                        <p className="text-xs text-gray-500 mt-3">Top 15% of your class</p>
                    </motion.div>

                    {/* Assignments Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                                <Clock size={24} />
                            </div>
                            <h3 className="font-bold text-gray-700">Pending Tasks</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-gray-800">{data.pendingAssignments}</span>
                            <span className="text-gray-500 font-medium">due this week</span>
                        </div>
                        <Link to="/student/classes" className="w-full mt-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors text-sm flex justify-center items-center">
                            View Assignments
                        </Link>
                    </motion.div>

                    {/* Next Class Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                                <Calendar size={24} />
                            </div>
                            <h3 className="font-bold text-gray-700">Next Class</h3>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-800">{data.nextClass.subject}</p>
                            <p className="text-purple-600 font-medium">{data.nextClass.time}</p>
                            <p className="text-sm text-gray-500 mt-1">{data.nextClass.topic}</p>
                        </div>
                        <Link to="/student/classes" className="w-full mt-4 py-2 border border-purple-200 text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors text-sm flex justify-center items-center">
                            Join Class
                        </Link>
                    </motion.div>
                </div>

                {/* Lower Section: Recent Activity & Badges */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Activity Feed */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
                        <div className="p-6 border-b border-orange-50 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-800">Recent Adventures</h3>
                            <Link to="/student/practice" className="text-orange-500 font-bold text-sm hover:underline">View All</Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {data.recentActivity.map((activity, idx) => (
                                <div key={idx} className="p-4 hover:bg-orange-50/30 transition-colors flex items-center gap-4">
                                    <GamificationBadge icon={activity.icon} color={activity.color} label="" />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{activity.title}</p>
                                        <p className="text-sm text-gray-500">{activity.date}</p>
                                    </div>
                                    <ChevronRight className="text-gray-300" size={20} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Badges / Motivation */}
                    <div className="bg-gradient-to-b from-white to-orange-50 rounded-2xl shadow-sm border border-orange-100 p-6">
                        <h3 className="font-bold text-xl text-gray-800 mb-4">Your Badges</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <GamificationBadge icon="star" color="yellow" label="Rising Star" subtext="Top 10%" />
                            <GamificationBadge icon="zap" color="orange" label="Streaker" subtext="5 Day Active" />
                            <GamificationBadge icon="shield" color="blue" label="Guardian" subtext="Helper" />
                            <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center p-3 text-gray-400 font-medium text-xs text-center">
                                Next: <br /> Speedster
                            </div>
                        </div>
                        <Link to="/student/practice" className="w-full mt-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-all flex justify-center items-center">
                            View Trophy Case
                        </Link>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
