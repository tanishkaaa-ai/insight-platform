import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { dashboardAPI, achievementsAPI } from '../services/api';
import {
    Users,
    School,
    Activity,
    BarChart2,
    CheckCircle,
    AlertTriangle,
    Clock,
    TrendingUp,
    Shield,
    Trophy,
    Calendar,
    Link as LinkIcon,
    XCircle,
    Loader
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, subtext, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
        purple: 'bg-purple-100 text-purple-600',
        slate: 'bg-slate-100 text-slate-600'
    };

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium">{label}</h3>
                    <div className="mt-2 text-3xl font-bold text-gray-800">{value}</div>
                    {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </motion.div>
    );
};

const AdminAchievementsModal = ({ isOpen, onClose }) => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchAchievements = async () => {
                try {
                    const res = await achievementsAPI.getAllStudentAchievements();
                    setAchievements(res.data);
                } catch (error) {
                    console.error("Failed to load achievements", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchAchievements();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl max-h-[85vh] flex flex-col"
            >
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> All Student Achievements
                        </h3>
                        <p className="text-gray-500 text-sm">Global view of external awards across the institution</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader className="animate-spin text-blue-600" size={40} />
                        </div>
                    ) : achievements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {achievements.map((achievement) => (
                                <div key={achievement._id} className="bg-gray-50 p-5 rounded-xl border border-gray-100 relative group hover:border-blue-200 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-yellow-500 shadow-sm shrink-0 border border-gray-100">
                                            <Trophy size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-800 text-lg leading-tight">{achievement.title}</h4>
                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2 whitespace-nowrap">
                                                    {achievement.category}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-1 mb-2">
                                                <span className="font-bold text-gray-700 text-sm">{achievement.student_name}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                    {achievement.classes && achievement.classes.length > 0 ? achievement.classes.join(', ') : 'No Class'}
                                                </span>
                                            </div>

                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{achievement.description || 'No description provided.'}</p>

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="px-2 py-1 bg-white border border-gray-200 text-gray-500 rounded flex items-center gap-1">
                                                    <Calendar size={12} /> {achievement.date ? new Date(achievement.date).toLocaleDateString() : 'No Date'}
                                                </span>
                                                {achievement.proof_link && (
                                                    <a href={achievement.proof_link} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-blue-50 text-blue-600 rounded flex items-center gap-1 hover:underline">
                                                        <LinkIcon size={12} /> View Proof
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Trophy className="mx-auto text-gray-300 mb-4 opacity-50" size={48} />
                            <p className="text-gray-500 font-bold text-lg">No achievements found</p>
                            <p className="text-gray-400 text-sm">Students haven't added any external achievements yet.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const AdminDashboard = () => {
    const location = useLocation();
    const [metrics, setMetrics] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

    const isView = (path) => location.pathname.includes(path);
    const activeView = isView('/teachers') ? 'teachers' : isView('/health') ? 'health' : 'overview';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, teachersRes] = await Promise.all([
                    dashboardAPI.getInstitutionalMetrics(),
                    dashboardAPI.getAdminTeacherStats()
                ]);
                setMetrics(metricsRes.data);
                setTeachers(teachersRes.data.teachers || []);
            } catch (error) {
                console.error("Failed to load admin data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading Dashboard...</div>;

    const interventionStats = metrics?.intervention_analytics || {
        total: 0,
        active: 0,
        resolved: 0,
        success_rate: 0,
        recent: []
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {activeView === 'teachers' ? 'Teacher Management' : activeView === 'health' ? 'System Health' : 'Institutional Overview'}
                        </h1>
                        <p className="text-gray-500">
                            {activeView === 'teachers' ? 'Monitor and manage teaching staff performance.' : activeView === 'health' ? 'Critical system alerts and academic risk factors.' : 'Monitor system health, engagement, and teacher effectiveness.'}
                        </p>
                    </div>
                    {activeView === 'overview' && (
                        <button
                            onClick={() => setAchievementsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 font-bold rounded-xl hover:bg-yellow-100 transition-colors shadow-sm border border-yellow-200"
                        >
                            <Trophy size={18} /> Student Achievements
                        </button>
                    )}
                </div>

                {/* Overview View */}
                {activeView === 'overview' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={Users}
                                label="Total Students"
                                value={metrics?.total_students || 0}
                                subtext="Active enrollments"
                                color="blue"
                            />
                            <StatCard
                                icon={School}
                                label="Active Classrooms"
                                value={metrics?.active_classrooms || 0}
                                subtext={`${metrics?.total_teachers || 0} Teachers`}
                                color="purple"
                            />
                            <StatCard
                                icon={Activity}
                                label="Avg Engagement"
                                value={`${metrics?.average_engagement || 0}%`}
                                subtext="Last 7 days"
                                color="green"
                            />
                            <StatCard
                                icon={Shield}
                                label="Intervention Rate"
                                value={`${interventionStats.intervention_rate || 0}%`}
                                subtext={`${metrics?.active_alerts?.CRITICAL || 0} Critical / ${interventionStats.active} Active`}
                                color="orange"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* Intervention Analytics */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-orange-500" />
                                        Intervention Effectiveness
                                    </h2>
                                    <div className="flex gap-2">
                                        <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">Real-time</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="text-sm font-medium text-blue-600 mb-1">Active Cases</div>
                                        <div className="text-2xl font-bold text-blue-800">{interventionStats.active}</div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                        <div className="text-sm font-medium text-green-600 mb-1">Resolved</div>
                                        <div className="text-2xl font-bold text-green-800">{interventionStats.resolved}</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <div className="text-sm font-medium text-purple-600 mb-1">Success Rate</div>
                                        <div className="text-2xl font-bold text-purple-800">{interventionStats.success_rate}%</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Recent High-Priority Interventions</h3>
                                    <div className="space-y-3">
                                        {interventionStats.recent && interventionStats.recent.length > 0 ? (
                                            interventionStats.recent.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold 
                                                            ${item.type?.includes('academic') ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                            {item.type?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">{item.student_name}</div>
                                                            <div className="text-xs text-gray-500">By {item.teacher_name} • {item.type}</div>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-sm">No recent interventions recorded</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Alert Summary (Mini) */}
                            <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-blue-500" />
                                    System Health
                                </h2>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-red-700">Critical Alerts</span>
                                            <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-xs font-bold">Action Req</span>
                                        </div>
                                        <div className="text-3xl font-bold text-red-800">{metrics?.active_alerts?.CRITICAL || 0}</div>
                                        <div className="text-xs text-red-600 mt-1">Students at immediate drop-out risk</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-slate-700">System Stability</span>
                                        </div>
                                        <div className="text-3xl font-bold text-slate-800">{metrics?.system_health?.stability || 99.8}%</div>
                                        <div className="text-xs text-slate-600 mt-1">Latency: {metrics?.system_health?.latency || 12}ms</div>
                                    </div>

                                    <div className="pt-2">
                                        <button onClick={() => window.location.href = '/admin/health'} className="w-full py-2 text-sm text-blue-600 font-bold hover:bg-blue-50 rounded-lg transition-colors">
                                            View Detailed Health Report →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Teachers View */}
                {activeView === 'teachers' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex gap-4">
                                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm">
                                    Total Teachers: {teachers.length}
                                </div>
                                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold text-sm">
                                    Active Today: {teachers.filter(t => new Date(t.last_login).toDateString() === new Date().toDateString()).length}
                                </div>
                            </div>
                            <button className="text-blue-600 text-sm font-bold hover:underline">Export Report</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Teacher Name</th>
                                        <th className="px-6 py-4">Last Active</th>
                                        <th className="px-6 py-4 text-center">Classrooms</th>
                                        <th className="px-6 py-4 text-center">Students</th>
                                        <th className="px-6 py-4 text-center">Interventions Logged</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {teachers.map((teacher) => (
                                        <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-800">
                                                {teacher.name}
                                                <div className="text-xs text-gray-400 font-normal">{teacher.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} className="text-gray-300" />
                                                    {new Date(teacher.last_login).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-700">{teacher.class_count}</td>
                                            <td className="px-6 py-4 text-center text-gray-600">{teacher.student_count}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${teacher.intervention_count > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {teacher.intervention_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {teachers.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No teachers found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Health View */}
                {activeView === 'health' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fade-in-up">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <TrendingUp size={24} className="text-blue-500" />
                            Detailed System Health Status
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-red-800 text-lg">Critical Alerts</span>
                                    <AlertTriangle size={24} className="text-red-500" />
                                </div>
                                <div className="text-5xl font-extrabold text-red-900 mb-2">{metrics?.active_alerts?.CRITICAL || 0}</div>
                                <p className="text-sm text-red-700">Students requiring immediate intervention due to severe disengagement or drop in mastery.</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-orange-50 border border-orange-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-orange-800 text-lg">At Risk</span>
                                    <Activity size={24} className="text-orange-500" />
                                </div>
                                <div className="text-5xl font-extrabold text-orange-900 mb-2">{metrics?.active_alerts?.AT_RISK || 0}</div>
                                <p className="text-sm text-orange-700">Students showing early signs of disengagement or mastery plateau.</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-slate-800 text-lg">System Stability</span>
                                    <CheckCircle size={24} className="text-slate-500" />
                                </div>
                                <div className="text-5xl font-extrabold text-slate-900 mb-2">{metrics?.system_health?.stability || 0}%</div>
                                <p className="text-sm text-slate-600">All services operational. Database latency: {metrics?.system_health?.latency || 0}ms.</p>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-4">Maintenance Logs</h3>
                            <div className="space-y-2">
                                {metrics?.maintenance_logs && metrics.maintenance_logs.length > 0 ? (
                                    metrics.maintenance_logs.map((log, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className={`w-2 h-2 rounded-full ${log.status === 'Success' || log.status === 'Operational' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                            <span className="font-mono text-xs opacity-70">{log.date}</span>
                                            <span>{log.action} - {log.status}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-400 text-sm">No maintenance logs available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
            {/* Achievements Modal */}
            <AdminAchievementsModal
                isOpen={achievementsModalOpen}
                onClose={() => setAchievementsModalOpen(false)}
            />
        </AdminLayout>
    );
};

export default AdminDashboard;
