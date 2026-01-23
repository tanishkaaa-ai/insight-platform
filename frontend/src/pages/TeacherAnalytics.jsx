import React, { useState, useEffect } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI, dashboardAPI } from '../services/api';
import {
    BarChart2,
    TrendingUp,
    Users,
    AlertTriangle,
    Download,
    Calendar,
    ChevronDown,
    Loader
} from 'lucide-react';
import { motion } from 'framer-motion';

const MockChart = ({ height = "h-40", color = "bg-teal-100", data = [] }) => {
    // Determine heights based on data values relative to max
    const maxVal = Math.max(...data, 100);
    return (
        <div className={`w-full ${height} flex items-end justify-between gap-2`}>
            {data.length > 0 ? data.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group transition-all duration-500 hover:scale-105">
                    <div className="text-[10px] text-center text-gray-400 opacity-0 group-hover:opacity-100 mb-1">{val.toFixed(0)}</div>
                    <div
                        className={`${color} rounded-t transition-all duration-500 group-hover:bg-opacity-80`}
                        style={{ height: `${Math.max(val / maxVal * 100, 5)}%` }}
                    />
                </div>
            )) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No data</div>
            )}
        </div>
    );
};

const TeacherAnalytics = () => {
    const { user, getUserId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(null);

    // Analytics Data
    const [masteryData, setMasteryData] = useState(null);
    const [engagementTrends, setEngagementTrends] = useState(null);
    const [classEngagement, setClassEngagement] = useState(null);
    const [dateRange, setDateRange] = useState(30);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const userId = getUserId();
                if (userId) {
                    const response = await classroomAPI.getTeacherClasses(userId);
                    setClasses(response.data);
                    if (response.data.length > 0) {
                        setSelectedClassId(response.data[0].classroom_id);
                    } else {
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('Error fetching classes:', err);
                setLoading(false);
            }
        };
        fetchClasses();
    }, [getUserId]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!selectedClassId) return;

            setLoading(true);
            try {
                // Parallel fetch for all analytics
                const [masteryRes, trendsRes, engagementRes] = await Promise.allSettled([
                    dashboardAPI.getMasteryHeatmap(selectedClassId),
                    dashboardAPI.getEngagementTrends(selectedClassId, dateRange),
                    dashboardAPI.getClassEngagement(selectedClassId)
                ]);

                // Handle Mastery
                if (masteryRes.status === 'fulfilled') {
                    setMasteryData(masteryRes.value.data);
                } else {
                    console.error("Mastery fetch error", masteryRes.reason);
                }

                // Handle Trends
                if (trendsRes.status === 'fulfilled') {
                    setEngagementTrends(trendsRes.value.data);
                } else {
                    console.error("Trends fetch error", trendsRes.reason);
                }

                // Handle Engagement
                if (engagementRes.status === 'fulfilled') {
                    setClassEngagement(engagementRes.value.data);
                } else {
                    console.error("Engagement fetch error", engagementRes.reason);
                }

            } catch (error) {
                console.error("Overall analytics error", error);
            } finally {
                setLoading(false);
            }
        };

        if (selectedClassId) {
            fetchAnalytics();
        }
    }, [selectedClassId, dateRange]);


    const handleClassChange = (e) => {
        setSelectedClassId(e.target.value);
    };

    if (loading && classes.length === 0) {
        return (
            <TeacherLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loader className="animate-spin text-teal-600" size={40} />
                </div>
            </TeacherLayout>
        );
    }

    // Process data for charts
    const engagementScores = engagementTrends?.trends?.map(t => t.average_engagement) || [];
    const participationScores = engagementTrends?.trends?.map(t => t.average_duration_minutes * 2) || []; // Fake participation scaling

    // Calculate simple stats if not available
    const avgMastery = masteryData?.class_average_mastery || 0;
    const engagementIndex = classEngagement?.class_engagement_index || 0;
    const interventionRate = 12; // Hardcoded for now, or fetch from intervention API

    // Sort concepts top 5 lowest mastery
    const strugglingConcepts = masteryData?.concept_averages
        ?.sort((a, b) => a.average_mastery - b.average_mastery)
        ?.slice(0, 5) || [];

    return (
        <TeacherLayout>
            <div className="space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Analytics Hub</h1>
                        <p className="text-gray-500 mt-1">Deep dive into institutional metrics and student outcomes.</p>
                    </div>

                    {/* Class Selector & Filters */}
                    <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm">
                        <div className="relative border-r border-gray-200 pr-2">
                            <select
                                value={selectedClassId || ''}
                                onChange={handleClassChange}
                                className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
                            >
                                {classes.map(cls => (
                                    <option key={cls.classroom_id} value={cls.classroom_id}>{cls.class_name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                            {[7, 30, 90].map(days => (
                                <button
                                    key={days}
                                    onClick={() => setDateRange(days)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${dateRange === days ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {days} Days
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader className="animate-spin text-teal-600" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg. Mastery</p>
                                        <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{avgMastery}%</h3>
                                    </div>
                                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <TrendingUp size={12} /> +4.2%
                                    </div>
                                </div>
                                <MockChart height="h-16" color="bg-green-500" data={[60, 65, 70, 68, 75, avgMastery]} />
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Engagement</p>
                                        <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{engagementIndex}%</h3>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${engagementIndex >= 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        <TrendingUp size={12} /> {engagementTrends?.trend_direction || 'Stable'}
                                    </div>
                                </div>
                                <MockChart height="h-16" color="bg-blue-500" data={engagementScores.slice(-7)} />
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Intervention Rate</p>
                                        <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{interventionRate}%</h3>
                                    </div>
                                    <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <AlertTriangle size={12} /> -2%
                                    </div>
                                </div>
                                <MockChart height="h-16" color="bg-yellow-500" data={[15, 14, 16, 13, 12, 12]} />
                            </div>
                        </div>

                        {/* Detailed Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-gray-800 text-lg">Concepts Needing Focus</h3>
                                    <button className="text-gray-400 hover:text-teal-600"><Download size={20} /></button>
                                </div>
                                <div className="space-y-4">
                                    {strugglingConcepts.length > 0 ? strugglingConcepts.map((concept, i) => (
                                        <div key={concept.concept_id}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-600">{concept.concept_name}</span>
                                                <span className="font-bold text-gray-800">{concept.average_mastery}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${concept.average_mastery}%` }} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center text-gray-400 py-8">No mastery data available</div>
                                    )}
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
                                        {engagementScores.length > 0 ? engagementScores.slice(-10).map((h, i) => (
                                            <div key={i} className="flex-1 bg-indigo-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                                        )) : (
                                            <div className="w-full text-center self-center text-gray-400">No trend data</div>
                                        )}
                                        {/* Overlay Line Graph Simulation with SVG */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none p-4" preserveAspectRatio="none">
                                            <path d="M0 200 L 50 180 L 100 150 L 150 170 L 200 100 L 250 50 L 300 30" stroke="#f43f5e" strokeWidth="3" fill="none" opacity="0.5" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-center gap-6 text-sm">
                                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full" /> Engagement</span>
                                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-full" /> Quiz Attempts</span>
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </TeacherLayout>
    );
};

export default TeacherAnalytics;
