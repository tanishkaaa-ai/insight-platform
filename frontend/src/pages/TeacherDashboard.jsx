import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI, dashboardAPI } from '../services/api';
import {
  GraduationCap,
  LineChart,
  Clock,
  AlertTriangle,
  Plus,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  Megaphone,
  Loader,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import CreateInterventionModal from '../components/CreateInterventionModal';

const StatCard = ({ icon: Icon, label, value, trend, color, subtext }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <h3 className="text-3xl font-extrabold text-gray-800 mb-1">{value}</h3>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
  </motion.div>
);

const TeacherDashboard = () => {
  const { user, getUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgEngagement: 0,
    activeProjects: 0, // Placeholder as projects API isn't primary focus yet
    masteryIndex: 0
  });
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [interventionStudent, setInterventionStudent] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userId = getUserId();
        console.log("TeacherDashboard: Fetching data for user:", userId);

        if (!userId) {
          console.warn("TeacherDashboard: No user ID found");
          return;
        }

        // 1. Fetch Teacher's Classes
        const classesRes = await classroomAPI.getTeacherClasses(userId);
        console.log("TeacherDashboard: Classes fetched:", classesRes.data);
        const classes = classesRes.data || [];

        // Filter for "Today's Classes"
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];
        const todayClasses = classes.filter(c =>
          c.schedule?.days?.some(d => d.toLowerCase().includes(todayName.toLowerCase().substring(0, 3)))
        );

        // Fallback: show all active classes if no specific match (or just first 3)
        // Check if classes array is empty first
        setTodaysClasses(todayClasses.length > 0 ? todayClasses : classes.slice(0, 3));

        // 2. Fetch Alerts
        try {
          const alertsRes = await dashboardAPI.getAlerts({
            teacher_id: userId
          });
          console.log("TeacherDashboard: Alerts fetched:", alertsRes.data);
          setAtRiskStudents(Array.isArray(alertsRes.data) ? alertsRes.data.slice(0, 5) : []);
        } catch (err) {
          console.error("TeacherDashboard: Error fetching alerts:", err);
          setAtRiskStudents([]);
        }

        // 3. Calculate Stats
        let totalStudents = 0;
        let totalEngagement = 0;
        let classCountWithEngagement = 0;

        const engagementPromises = classes.map(c => dashboardAPI.getClassEngagement(c.classroom_id));
        const engagementResults = await Promise.allSettled(engagementPromises);

        classes.forEach((cls, index) => {
          totalStudents += (cls.student_count || 0);

          const res = engagementResults[index];
          if (res.status === 'fulfilled' && res.value.data) {
            totalEngagement += res.value.data.class_engagement_index || 0;
            classCountWithEngagement++;
          }
        });

        const avgEngagement = classCountWithEngagement > 0 ? Math.round(totalEngagement / classCountWithEngagement) : 0;
        console.log("TeacherDashboard: Calculated stats:", { totalStudents, avgEngagement });

        setStats({
          totalStudents,
          avgEngagement,
          activeProjects: 8,
          masteryIndex: 8.4
        });

        // 4. Institutional Metrics (School-Wide)
        try {
          const instRes = await dashboardAPI.getInstitutionalMetrics();
          setInstitutionalStats(instRes.data?.institution_summary);
        } catch (e) {
          console.warn("Failed to load institutional metrics", e);
        }

        // AI Suggestion
        if (avgEngagement > 0 && avgEngagement < 60) {
          setAiSuggestion({
            title: "Low Engagement Detected",
            text: "Overall class engagement is below 60%. Consider introducing a live poll or interactive breakout session to boost participation."
          });
        } else {
          setAiSuggestion({
            title: "AI Teaching Assistant Suggestion",
            text: "Student participation tends to drop during mid-session lectures. Consider adding a quick interactive poll to re-engage the class."
          });
        }

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getUserId]);

  const [institutionalStats, setInstitutionalStats] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const handleDeleteClick = (e, cls) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    setClassToDelete(cls);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await classroomAPI.deleteClassroom(classToDelete.classroom_id);

      // Update state
      setTodaysClasses(prev => prev.filter(c => c.classroom_id !== classToDelete.classroom_id));

      // Close modal
      setDeleteModalOpen(false);
      setClassToDelete(null);

      // Show success (using simple alert for now if toast not imported, or just console)
      // If toast available use it, otherwise console
      console.log('Class deleted successfully');
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class");
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader className="animate-spin text-teal-600" size={40} />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Administrator Dashboard</h1>
            <p className="text-gray-500 mt-1">{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {user?.first_name || 'Professor'}. Here's what's happening today.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
              <Plus size={18} /> New Assignment
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200">
              <Plus size={18} /> Start Live Session
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={stats.totalStudents}
            trend="+5%"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={LineChart}
            label="Avg. Engagement"
            value={`${stats.avgEngagement}%`}
            trend="+12%"
            color="bg-purple-50 text-purple-600"
            subtext="Based on real-time analysis"
          />
          <StatCard
            icon={Lightbulb}
            label="Mastery Index"
            value={`${stats.masteryIndex}/10`}
            color="bg-teal-50 text-teal-600"
            subtext="Class average across modules"
          />
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-red-50 p-6 rounded-2xl border-2 border-red-200 shadow-md transform rotate-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-white text-red-600 shadow-sm">
                <Megaphone size={24} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-gray-800 mb-1">{atRiskStudents.length}</h3>
            <p className="text-sm font-medium text-red-600">Attention Needed</p>
            <p className="text-xs text-red-400 mt-2">Students flagged by AI</p>
          </motion.div>
        </div>

        {/* School-Wide Performance Section (New) */}
        {institutionalStats && (
          <div className="bg-indigo-900 rounded-2xl p-6 shadow-md text-white overflow-hidden relative border border-indigo-800">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <GraduationCap className="text-indigo-300" /> School-Wide Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-xs text-indigo-200 uppercase font-bold">Total Students</p>
                  <p className="text-2xl font-bold mt-1">{institutionalStats.total_students}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-xs text-indigo-200 uppercase font-bold">Avg Mastery</p>
                  <p className="text-2xl font-bold mt-1 text-green-300">{institutionalStats.average_mastery?.toFixed(1)}%</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-xs text-indigo-200 uppercase font-bold">Avg Engagement</p>
                  <p className="text-2xl font-bold mt-1 text-blue-300">{institutionalStats.average_engagement?.toFixed(1)}%</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-xs text-indigo-200 uppercase font-bold">Total Classrooms</p>
                  <p className="text-2xl font-bold mt-1">{institutionalStats.total_classrooms}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content: Class Schedule / Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* ... (Existing Today's Classes code) ... */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800">Today's Classes</h2>
                <NavLink to="/teacher/classes" className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  View All <ChevronRight size={16} />
                </NavLink>
              </div>
              <div className="divide-y divide-gray-50">
                {todaysClasses.length > 0 ? (
                  todaysClasses.map((cls) => (
                    <div key={cls.classroom_id} className="p-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                            {cls.class_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 group-hover:text-teal-600 transition-colors">{cls.class_name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Clock size={14} /> {cls.schedule?.time || 'TBA'} • {cls.student_count || 0} Students
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={(e) => handleDeleteClick(e, cls)}
                            title="Delete Class"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No classes scheduled for today.
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights Concept */}
            {aiSuggestion && (
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <Lightbulb size={24} className="text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{aiSuggestion.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                      {aiSuggestion.text}
                    </p>
                    <button className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-sm transition-colors">
                      Create Poll Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: At Risk & Upcoming */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
              <div className="p-5 border-b border-red-50 bg-red-50/30">
                <h2 className="font-bold text-lg text-red-800 flex items-center gap-2">
                  <AlertTriangle size={20} /> Attention Needed
                </h2>
              </div>
              <div className="p-2">
                {atRiskStudents.length > 0 ? (atRiskStudents.map((alert) => (
                  <div
                    key={alert.alert_id}
                    onClick={() => setInterventionStudent({ student_id: alert.student_id, name: alert.student_name })}
                    className="p-3 transition-colors hover:bg-red-50/50 rounded-xl cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 text-sm">{alert.student_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full uppercase">
                        {alert.severity} Risk
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {alert.behaviors?.map((b, i) => (
                        <span key={i} className="text-[10px] text-red-500 bg-white border border-red-100 px-1 rounded">
                          {typeof b === 'string' ? b : b.description || b.type}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-red-600 font-medium mt-1">Rec: {alert.recommendations?.[0] || 'Monitor'}</p>
                  </div>
                ))) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No critical alerts at this time.
                  </div>
                )}
                <button className="w-full text-center py-3 text-xs font-bold text-gray-400 hover:text-gray-600 border-t border-gray-50 mt-1">
                  View All Alerts
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm font-medium transition-colors">
                  📝 Grade Pending Submissions (5)
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm font-medium transition-colors">
                  📊 View Weekly Report
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm font-medium transition-colors">
                  ⚙️ Update Class Settings
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
      {
        interventionStudent && (
          <CreateInterventionModal
            studentId={interventionStudent.student_id}
            teacherId={getUserId()}
            initialData={{}}
            onClose={() => setInterventionStudent(null)}
            triggerRefresh={() => { }} // Optional: refresh alerts
          />
        )
      }
      {/* Delete Confirmation Modal */}
      {
        deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-gray-800">Delete Class?</h3>
                <button onClick={() => setDeleteModalOpen(false)}><div className="bg-gray-100 p-1 rounded-full"><AlertTriangle size={16} className="text-gray-500" /></div></button>
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
        )
      }
    </TeacherLayout >
  );
};

export default TeacherDashboard;