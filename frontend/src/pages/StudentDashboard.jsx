import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GamificationBadge from '../components/GamificationBadge';
import ProgressBar from '../components/ProgressBar';
import StudentSoftSkillsProfile from '../components/StudentSoftSkillsProfile';
import { BookOpen, Clock, Calendar, ChevronRight, Compass, Flame, ClipboardList, GraduationCap, AlertCircle, Loader2, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { masteryAPI, classroomAPI, engagementAPI, projectsAPI } from '../services/api';
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
        activeProject: null,
        nextClass: { subject: 'No Upcoming Classes', time: '--:--', topic: 'Enjoy your break!' },
        recentActivity: [],
        badges: []
    });

    const STUDENT_ID = getUserId();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [engagementRes, masteryRes, assignmentsRes, classesRes, gamificationRes, projectsRes] = await Promise.allSettled([
                    engagementAPI.getStudentEngagementHistory(STUDENT_ID, 30),
                    masteryAPI.getStudentMastery(STUDENT_ID),
                    classroomAPI.getStudentAssignments(STUDENT_ID, 'assigned'),
                    classroomAPI.getStudentClasses(STUDENT_ID),
                    engagementAPI.getGamificationProfile(STUDENT_ID),
                    projectsAPI.getStudentProjects(STUDENT_ID)
                ]);

                let engagementData = { level: 1, xp: 0, streak: 0, nextLevelXp: 1000, badges: [] };
                if (gamificationRes.status === 'fulfilled') engagementData = { ...engagementData, ...gamificationRes.value.data };

                let masteryScore = 0, recentMasteryActivity = [];
                if (masteryRes.status === 'fulfilled') {
                    masteryScore = masteryRes.value.data.overall_mastery || 0;
                    recentMasteryActivity = (masteryRes.value.data.concepts || [])
                        .sort((a, b) => new Date(b.last_assessed) - new Date(a.last_assessed))
                        .slice(0, 2)
                        .map(c => ({ type: 'mastery', title: `Mastered "${c.concept_name}"`, date: new Date(c.last_assessed).toLocaleDateString(), icon: 'medal', color: 'purple' }));
                }

                let pendingCount = 0, recentAssignmentActivity = [];
                if (assignmentsRes.status === 'fulfilled') {
                    const assignments = assignmentsRes.value.data || [];
                    pendingCount = assignments.length;
                    recentAssignmentActivity = assignments.slice(0, 1).map(a => ({ type: 'assignment', title: `New Assignment: ${a.title}`, date: new Date(a.created_at).toLocaleDateString(), icon: 'scroll', color: 'blue' }));
                }

                let nextClass = { subject: 'No Upcoming Classes', time: '--:--', topic: 'Relax!' };
                if (classesRes.status === 'fulfilled' && classesRes.value.data.length > 0) {
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                    const upcomingClasses = classesRes.value.data.filter(c => c.schedule?.days?.includes(today));
                    if (upcomingClasses.length > 0) {
                        const firstClass = upcomingClasses[0];
                        nextClass = { subject: firstClass.class_name, time: firstClass.schedule.time || 'TBD', topic: firstClass.subject };
                    } else if (classesRes.value.data.length > 0) {
                        const firstClass = classesRes.value.data[0];
                        nextClass = { subject: firstClass.class_name, time: firstClass.schedule?.time || '--:--', topic: firstClass.subject };
                    }
                }

                setData(prev => ({
                    ...prev,
                    name: user?.profile?.first_name || prev.name,
                    level: engagementData.level,
                    xp: engagementData.xp,
                    nextLevelXp: engagementData.nextLevelXp || 1000,
                    streak: engagementData.streak,
                    badges: engagementData.badges || [],
                    masteryScore: Math.round(masteryScore),
                    pendingAssignments: pendingCount,
                    nextClass,
                    recentActivity: [...recentMasteryActivity, ...recentAssignmentActivity]
                }));
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(`Error: ${err.message || String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        if (STUDENT_ID) fetchDashboardData();
        else {
            setLoading(false);
            setError("Please log in to view your dashboard.");
        }
    }, [STUDENT_ID, user]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading your adventure...</p>
                </motion.div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Connection Error</h3>
                    <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-sm">
                        Retry
                    </button>
                </motion.div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-orange-400 to-yellow-400 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{getGreeting()}, {data.name}!</h1>
                        <p className="text-orange-50 font-medium text-lg mb-6 max-w-xl">
                            You're on a <span className="font-bold bg-white/20 px-3 py-1 rounded-lg inline-flex items-center gap-1.5"><Flame size={16} />{data.streak}-day streak</span> Keep it up to unlock the "Time Traveler" badge.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl max-w-sm border border-white/20">
                            <div className="flex justify-between items-end mb-2.5">
                                <span className="font-bold text-sm uppercase tracking-wider opacity-90">Level {data.level}</span>
                                <span className="text-xs font-mono bg-black/10 px-2 py-1 rounded">{data.xp} / {data.nextLevelXp} XP</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(data.xp / data.nextLevelXp) * 100}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="bg-white h-full rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>
                    <Compass className="absolute top-4 right-8 text-yellow-200 opacity-50 rotate-12" size={64} />
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                                <Flame size={24} />
                            </div>
                            <h3 className="font-bold text-gray-700">Active Project</h3>
                        </div>
                        {data.activeProject ? (
                            <>
                                <h4 className="text-xl font-extrabold text-gray-800 mb-1 truncate">{data.activeProject.title}</h4>
                                <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                    <Clock size={12} /> {data.activeProject.stage} Phase
                                </p>
                                <Link to="/student/projects" className="w-full mt-2 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all text-sm flex justify-center items-center shadow-md shadow-orange-200">
                                    Continue Mission
                                </Link>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-400 italic text-sm mb-2">No active mission</p>
                                <Link to="/student/classes" className="text-orange-500 text-xs font-bold hover:underline">Browse Classes</Link>
                            </div>
                        )}
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-green-100 p-3 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                                <GraduationCap size={24} />
                            </div>
                            <h3 className="font-bold text-gray-700">Mastery Score</h3>
                        </div>
                        <div className="mb-3">
                            <span className="text-4xl font-extrabold text-gray-800">{data.masteryScore}%</span>
                        </div>
                        <ProgressBar value={data.masteryScore} color="bg-green-500" height="h-2.5" showLabel={false} />
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1"><TrendingUp size={12} />Top 15% of your class</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                <ClipboardList size={24} />
                            </div>
                            <h3 className="font-bold text-gray-700">Pending Tasks</h3>
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-extrabold text-gray-800">{data.pendingAssignments}</span>
                            <span className="text-gray-500 font-medium text-sm">due this week</span>
                        </div>
                        <Link to="/student/classes" className="w-full py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 active:scale-95 transition-all text-sm flex justify-center items-center">
                            View Assignments
                        </Link>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="bg-purple-50 p-6 rounded-2xl shadow-sm border-2 border-purple-100 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 rounded-bl-full -mr-8 -mt-8 opacity-50" />
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="bg-purple-100 p-3 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                                <Calendar size={24} />
                            </div>
                            <h3 className="font-bold text-gray-700">Next Class</h3>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-800 mb-1">{data.nextClass.subject}</p>
                            <p className="text-purple-600 font-medium mb-1">{data.nextClass.time}</p>
                            <p className="text-sm text-gray-500">{data.nextClass.topic}</p>
                        </div>
                        <Link to="/student/classes" className="w-full mt-4 py-2.5 border-2 border-purple-200 text-purple-600 font-bold rounded-xl hover:bg-purple-50 active:scale-95 transition-all text-sm flex justify-center items-center">
                            Join Class
                        </Link>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <StudentSoftSkillsProfile studentId={STUDENT_ID} />
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
                        <div className="p-6 border-b border-orange-50 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-800">Recent Adventures</h3>
                            <Link to="/student/practice" className="text-orange-500 font-bold text-sm hover:underline">View All</Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            <AnimatePresence>
                                {data.recentActivity.length > 0 ? (
                                    data.recentActivity.map((activity, idx) => (
                                        <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-4 hover:bg-orange-50/30 transition-all flex items-center gap-4 group cursor-pointer">
                                            <GamificationBadge icon={activity.icon} color={activity.color} label="" />
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{activity.title}</p>
                                                <p className="text-sm text-gray-500">{activity.date}</p>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-orange-400 transition-colors" size={20} />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400 italic">No recent activity yet. Go explore!</div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-white to-orange-50 rounded-2xl shadow-sm border border-orange-100 p-6">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2"><Zap className="text-orange-500" size={20} />Your Badges</h3>
                        {data.badges?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {data.badges.map((badge, idx) => (
                                    <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                                        <GamificationBadge icon={badge.icon} color={badge.color || 'blue'} label={badge.name} subtext={badge.description} />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 mb-4 opacity-50 grayscale">
                                <GamificationBadge icon="star" color="gray" label="Locked" subtext="Keep working!" />
                                <GamificationBadge icon="shield" color="gray" label="Locked" subtext="Help others" />
                            </div>
                        )}
                        <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center p-3 text-gray-400 font-medium text-xs text-center mb-4">
                            Next: <br /> Speedster
                        </div>
                        <Link to="/student/achievements" className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95 shadow-sm transition-all flex justify-center items-center">
                            View Trophy Case
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
