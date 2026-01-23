import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GamificationBadge from '../components/GamificationBadge';
import ProgressBar from '../components/ProgressBar';
import { BookOpen, Clock, Calendar, ChevronRight, Compass, Flame, ClipboardList, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { masteryAPI, classroomAPI, engagementAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard = () => {
    const { user, getUserId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        name: user?.profile?.first_name || 'Student',
        level: 1,
        xp: 0,
        nextLevelXp: 1000,
        streak: 0,
        masteryScore: 0,
        pendingAssignments: 0,
        nextClass: {
            subject: 'No Upcoming Classes',
            time: '--:--',
            topic: 'Enjoy your break!'
        },
        recentActivity: []
    });

    const STUDENT_ID = getUserId();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Parallel data fetching
                const [engagementRes, masteryRes, assignmentsRes, classesRes, gamificationRes] = await Promise.allSettled([
                    engagementAPI.getStudentEngagementHistory(STUDENT_ID, 30),
                    masteryAPI.getStudentMastery(STUDENT_ID),
                    classroomAPI.getStudentAssignments(STUDENT_ID, 'assigned'),
                    classroomAPI.getStudentClasses(STUDENT_ID),
                    engagementAPI.getGamificationProfile(STUDENT_ID)
                ]);

                // Process Engagement/Gamification Data
                let engagementData = { level: 1, xp: 0, streak: 0, nextLevelXp: 1000 };
                if (gamificationRes.status === 'fulfilled') {
                    engagementData = gamificationRes.value.data;
                }

                // Process Mastery Data
                let masteryScore = 0;
                let recentMasteryActivity = [];
                if (masteryRes.status === 'fulfilled') {
                    masteryScore = masteryRes.value.data.overall_mastery || 0;
                    // Extract recent mastered concepts for activity feed
                    recentMasteryActivity = (masteryRes.value.data.concepts || [])
                        .sort((a, b) => new Date(b.last_assessed) - new Date(a.last_assessed))
                        .slice(0, 2)
                        .map(c => ({
                            type: 'mastery',
                            title: `Mastered "${c.concept_name}"`,
                            date: new Date(c.last_assessed).toLocaleDateString(),
                            icon: 'medal',
                            color: 'purple'
                        }));
                }

                // Process Assignments (Pending count & activity)
                let pendingCount = 0;
                let recentAssignmentActivity = [];
                if (assignmentsRes.status === 'fulfilled') {
                    const assignments = assignmentsRes.value.data || [];
                    pendingCount = assignments.length;

                    recentAssignmentActivity = assignments.slice(0, 1).map(a => ({
                        type: 'assignment',
                        title: `New Assignment: ${a.title}`,
                        date: new Date(a.created_at).toLocaleDateString(),
                        icon: 'scroll',
                        color: 'blue'
                    }));
                }

                // Process Next Class (Real Schedule)
                let nextClass = { subject: 'No Upcoming Classes', time: '--:--', topic: 'Relax!' };
                if (classesRes.status === 'fulfilled' && classesRes.value.data.length > 0) {
                    // Simple logic: Find the first class with a schedule for "Today" -> In a real app, this would check weekday
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'Short' }); // Mon, Tue...

                    const upcomingClasses = classesRes.value.data.filter(c => {
                        // Check if schedule exists and today is in days list
                        return c.schedule && c.schedule.days && c.schedule.days.includes(today);
                    });

                    if (upcomingClasses.length > 0) {
                        // Sort by time (simplified)
                        const firstClass = upcomingClasses[0];
                        nextClass = {
                            subject: firstClass.class_name,
                            time: firstClass.schedule.time || 'TBD',
                            topic: firstClass.subject
                        };
                    } else if (classesRes.value.data.length > 0) {
                        // Fallback to just showing the first class if no schedule match
                        const firstClass = classesRes.value.data[0];
                        nextClass = {
                            subject: firstClass.class_name,
                            time: (firstClass.schedule && firstClass.schedule.time) || '--:--',
                            topic: firstClass.subject
                        };
                    }
                }

                setData(prev => ({
                    ...prev,
                    name: user?.profile?.first_name || prev.name,
                    level: engagementData.level,
                    xp: engagementData.xp,
                    nextLevelXp: engagementData.nextLevelXp || 1000,
                    streak: engagementData.streak,
                    masteryScore: Math.round(masteryScore),
                    pendingAssignments: pendingCount,
                    nextClass: nextClass,
                    recentActivity: [...recentMasteryActivity, ...recentAssignmentActivity]
                }));

            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("Failed to load dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (STUDENT_ID) {
            fetchDashboardData();
        } else {
            setLoading(false);
            setError("Please log in to view your dashboard.");
        }
    }, [STUDENT_ID, user]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading your adventure...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Connection Error</h3>
                    <p className="text-gray-500 mb-6 max-w-md">{error}</p>
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
            <div className="space-y-8">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-orange-400 to-yellow-400 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {data.name}! 🚀
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
                    <Compass className="absolute top-4 right-8 text-yellow-200 opacity-50 rotate-12" size={64} />
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
                                <GraduationCap size={24} />
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
                                <ClipboardList size={24} />
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

                    {/* Next Class Card - Asymmetric Emphasis */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-purple-50 p-6 rounded-2xl shadow-sm border-2 border-purple-100 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 rounded-bl-full -mr-8 -mt-8 opacity-50" />
                        <div className="flex items-center gap-3 mb-4 relative z-10">
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
                            {data.recentActivity.length > 0 ? (
                                data.recentActivity.map((activity, idx) => (
                                    <div key={idx} className="p-4 hover:bg-orange-50/30 transition-colors flex items-center gap-4">
                                        <GamificationBadge icon={activity.icon} color={activity.color} label="" />
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800">{activity.title}</p>
                                            <p className="text-sm text-gray-500">{activity.date}</p>
                                        </div>
                                        <ChevronRight className="text-gray-300" size={20} />
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400 italic">No recent activity yet. Go explore!</div>
                            )}
                        </div>
                    </div>

                    {/* Badges / Motivation */}
                    <div className="bg-gradient-to-b from-white to-orange-50 rounded-2xl shadow-sm border border-orange-100 p-6">
                        <h3 className="font-bold text-xl text-gray-800 mb-4">Your Badges</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <GamificationBadge icon="star" color="yellow" label="Rising Star" subtext="Top 10%" />
                            <GamificationBadge icon="flame" color="orange" label="Streaker" subtext="5 Day Active" />
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
