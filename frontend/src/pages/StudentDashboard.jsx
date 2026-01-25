import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GamificationBadge from '../components/GamificationBadge';
import ProgressBar from '../components/ProgressBar';
import StudentSoftSkillsProfile from '../components/StudentSoftSkillsProfile';
import { BookOpen, Clock, Calendar, ChevronRight, Compass, Flame, ClipboardList, GraduationCap, AlertCircle, Loader2, Mail, Save, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { masteryAPI, classroomAPI, engagementAPI, projectsAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
        nextClass: {
            subject: 'No Upcoming Classes',
            time: '--:--',
            topic: 'Enjoy your break!'
        },
        recentActivity: [],
        badges: []
    });
    const [parentEmail, setParentEmail] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);
    const [showEmailPrompt, setShowEmailPrompt] = useState(false);

    const STUDENT_ID = getUserId();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Parallel data fetching
                // Parallel data fetching
                const [masteryRes, assignmentsRes, classesRes, gamificationRes, projectsRes, historyRes] = await Promise.allSettled([
                    masteryAPI.getStudentMastery(STUDENT_ID),
                    classroomAPI.getStudentAssignments(STUDENT_ID, 'assigned'),
                    classroomAPI.getStudentClasses(STUDENT_ID),
                    engagementAPI.getGamificationProfile(STUDENT_ID),
                    projectsAPI.getStudentProjects(STUDENT_ID),
                    engagementAPI.getStudentEngagementHistory(STUDENT_ID, 7)
                ]);

                // Process Engagement/Gamification Data
                let engagementData = { level: 1, xp: 0, streak: 0, nextLevelXp: 1000, badges: [] };
                if (gamificationRes.status === 'fulfilled') {
                    const gData = gamificationRes.value.data;
                    engagementData = {
                        level: gData.level || 1,
                        xp: gData.current_level_xp || 0,
                        streak: gData.streak || 0,
                        nextLevelXp: gData.next_level_xp || 1000,
                        badges: gData.badges || []
                    };
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

                // Process Projects Data
                let activeProject = null;
                if (projectsRes.status === 'fulfilled') {
                    // The backend returns { projects: [...] }
                    const projects = projectsRes.value.data.projects || [];
                    // Find the most relevant active project (status 'active' or 'in_progress')
                    activeProject = projects.find(p => p.status === 'active' || p.status === 'in_progress');

                    // If we found a project, ensure it has the necessary fields for the UI
                    if (activeProject) {
                        // The backend returns 'stage' (e.g., 'DEFINE'). The UI might want to show this nicely.
                        // The backend also returns 'title'.
                        // We might want to ensure 'stage' is formatted or just use it as is.
                        // The UI currently expects: { title, stage }
                    }
                }


                // Process Engagement History
                let engagementHistory = [];
                if (historyRes.status === 'fulfilled') {
                    const historyData = historyRes.value.data.history || [];

                    // Helper to get day name
                    const getDayName = (isoDate) => {
                        if (!isoDate) return '';
                        return new Date(isoDate).toLocaleDateString('en-US', { weekday: 'short' });
                    };

                    engagementHistory = historyData.map(item => ({
                        day: getDayName(item.date),
                        score: Math.round(item.engagement_score || 0),
                        fullDate: new Date(item.date).toLocaleDateString()
                    }));
                }

                // Process Next Class (Real Schedule)
                let nextClass = { subject: 'No Upcoming Classes', time: '--:--', topic: 'Relax!' };
                if (classesRes.status === 'fulfilled' && classesRes.value.data.length > 0) {
                    // Simple logic: Find the first class with a schedule for "Today" -> In a real app, this would check weekday
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

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
                    badges: engagementData.badges || [],
                    masteryScore: Math.round(masteryScore),
                    pendingAssignments: pendingCount,
                    activeProject: activeProject,
                    engagementHistory: engagementHistory,
                    nextClass: nextClass,
                    recentActivity: [...recentMasteryActivity, ...recentAssignmentActivity]
                }));

                // Check for parent email
                if (!user.parent_email && !localStorage.getItem('dismissedEmailPrompt')) {
                    setShowEmailPrompt(true);
                }

            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(`Error: ${err.message || String(err)}`);
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
                    className="bg-[#213448] rounded-3xl p-8 text-[#EAE0CF] shadow-lg relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-white">
                            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {data.name}! 🚀
                        </h1>
                        <p className="text-[#EAE0CF] font-medium text-lg mb-6 max-w-xl">
                            You're on a <span className="font-bold bg-white/20 px-2 py-1 rounded-lg text-white">{data.streak}-day streak</span>! Keep it up to unlock the "Time Traveler" badge.
                        </p>

                        <div className="bg-[#213448]/30 backdrop-blur-sm p-4 rounded-xl max-w-sm border border-[#EAE0CF]/20">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-sm uppercase tracking-wider opacity-90">Level {data.level}</span>
                                <span className="text-xs font-mono">{data.xp} / {data.nextLevelXp} XP</span>
                            </div>
                            <div className="w-full bg-[#213448]/50 rounded-full h-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(data.xp / data.nextLevelXp) * 100}%` }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="bg-[#EAE0CF] h-full rounded-full"
                                />
                            </div>
                        </div>

                        <Link to="/student/interest-path" className="absolute bottom-8 right-8 bg-[#EAE0CF] hover:bg-white text-[#213448] font-bold py-3 px-6 rounded-2xl transition-all flex items-center gap-2 shadow-lg hover:scale-105">
                            <Compass size={20} />
                            <span>Discover Your Path</span>
                        </Link>
                    </div>

                    {/* Background Decorations */}
                    <Compass className="absolute top-4 right-8 text-[#EAE0CF] opacity-20 rotate-12" size={64} />
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#EAE0CF]/5 rounded-full blur-3xl" />
                </motion.div>

                {/* Parent Email Prompt */}
                <AnimatePresence>
                    {showEmailPrompt && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-[#547792] border-2 border-[#EAE0CF]/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 text-center md:text-left">
                                    <div className="bg-[#EAE0CF] p-3 rounded-xl text-[#213448]">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">Stay Connected!</h3>
                                        <p className="text-[#EAE0CF]/80 text-sm">Add your parent's email to share your progress.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <input
                                        type="email"
                                        placeholder="parent@example.com"
                                        value={parentEmail}
                                        onChange={(e) => setParentEmail(e.target.value)}
                                        className="flex-1 md:w-64 px-4 py-2 rounded-xl border border-[#EAE0CF]/30 bg-[#213448]/30 text-white placeholder-[#EAE0CF]/50 outline-none focus:ring-2 focus:ring-[#EAE0CF] text-sm"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!parentEmail || !parentEmail.includes('@')) {
                                                toast.error("Please enter a valid email");
                                                return;
                                            }
                                            try {
                                                setSavingEmail(true);
                                                await authAPI.updateProfile({ parent_email: parentEmail });
                                                toast.success("Parent contact saved!");
                                                setShowEmailPrompt(false);
                                            } catch (e) {
                                                toast.error("Failed to save email");
                                            } finally {
                                                setSavingEmail(false);
                                            }
                                        }}
                                        disabled={savingEmail}
                                        className="bg-[#EAE0CF] text-[#213448] px-4 py-2 rounded-xl font-bold text-sm hover:bg-white transition"
                                    >
                                        {savingEmail ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowEmailPrompt(false);
                                            localStorage.setItem('dismissedEmailPrompt', 'true');
                                        }}
                                        className="text-[#EAE0CF] hover:text-white text-xs font-bold"
                                    >
                                        Later
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Active Project Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#547792] p-6 rounded-2xl shadow-sm border border-[#EAE0CF]/10 relative group text-[#EAE0CF]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#213448] p-3 rounded-xl text-[#EAE0CF]">
                                <Flame size={24} />
                            </div>
                            <h3 className="font-bold text-[#EAE0CF]">Active Project</h3>
                        </div>
                        {data.activeProject ? (
                            <>
                                <h4 className="text-xl font-extrabold text-white mb-1 truncate">{data.activeProject.title}</h4>
                                <p className="text-xs text-[#EAE0CF]/70 font-bold uppercase tracking-wider mb-4 flex items-center gap-1">
                                    <Clock size={12} /> {data.activeProject.stage} Phase
                                </p>
                                <Link to="/student/projects" className="w-full mt-2 py-2 bg-[#EAE0CF] text-[#213448] font-bold rounded-lg hover:bg-white transition-colors text-sm flex justify-center items-center shadow-md">
                                    Continue Mission
                                </Link>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-[#EAE0CF]/60 italic text-sm">No active mission.</p>
                                <Link to="/student/classes" className="text-[#EAE0CF] text-xs font-bold hover:underline mt-2 block">Browse Classes</Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Mastery Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#547792] p-6 rounded-2xl shadow-sm border border-[#EAE0CF]/10 text-[#EAE0CF]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#213448] p-3 rounded-xl text-[#EAE0CF]">
                                <GraduationCap size={24} />
                            </div>
                            <h3 className="font-bold text-[#EAE0CF]">Mastery Score</h3>
                        </div>
                        <div className="mb-2">
                            <span className="text-4xl font-extrabold text-white">{data.masteryScore}%</span>
                        </div>
                        <ProgressBar value={data.masteryScore} color="bg-[#EAE0CF]" height="h-2" showLabel={false} />
                        <p className="text-xs text-[#EAE0CF]/70 mt-3">Top 15% of your class</p>
                    </motion.div>

                    {/* Assignments Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#547792] p-6 rounded-2xl shadow-sm border border-[#EAE0CF]/10 text-[#EAE0CF]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#213448] p-3 rounded-xl text-[#EAE0CF]">
                                <ClipboardList size={24} />
                            </div>
                            <h3 className="font-bold text-[#EAE0CF]">Pending Tasks</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-white">{data.pendingAssignments}</span>
                            <span className="text-[#EAE0CF]/70 font-medium">due this week</span>
                        </div>
                        <Link to="/student/classes" className="w-full mt-4 py-2 bg-[#213448] text-[#EAE0CF] font-bold rounded-lg hover:bg-[#213448]/80 transition-colors text-sm flex justify-center items-center border border-[#EAE0CF]/20">
                            View Assignments
                        </Link>
                    </motion.div>

                    {/* Next Class Card - Asymmetric Emphasis - Full Width on Mobile, Span 3 on larger if needed, or keep grid */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#91ADC8] p-6 rounded-2xl shadow-sm border border-[#EAE0CF]/20 relative overflow-hidden col-span-1 md:col-span-3"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#EAE0CF]/10 rounded-bl-full -mr-8 -mt-8 opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#213448] p-4 rounded-2xl text-[#EAE0CF]">
                                    <Calendar size={28} />
                                </div>
                                <div>
                                    <p className="text-[#EAE0CF]/70 text-xs font-bold uppercase tracking-wider mb-1">Up Next</p>
                                    <p className="text-xl font-bold text-white">{data.nextClass.subject}</p>
                                    <p className="text-[#213448] font-bold text-sm flex items-center gap-1">
                                        <Clock size={12} /> {data.nextClass.time}
                                        <span className="mx-1">•</span>
                                        <span className="font-normal opacity-80">{data.nextClass.topic}</span>
                                    </p>
                                </div>
                            </div>
                            <Link to="/student/classes" className="bg-[#EAE0CF] text-[#213448] px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors text-sm shadow-lg">
                                Join Class Now &gt;
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;