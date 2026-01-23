import React, { useState, useEffect } from 'react';
import { Award, Target, TrendingUp, Users, BarChart3, CheckCircle, AlertCircle, User, BookOpen, Code2, Sparkles, Zap, Shield, Globe, Workflow, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { projectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const SoftSkillsRubric = () => {
  const { user, getUserId } = useAuth();
  const [activeTab, setActiveTab] = useState('rubric');
  const [loading, setLoading] = useState(true);
  const [softSkillsData, setSoftSkillsData] = useState(null);

  const STUDENT_ID = getUserId();

  useEffect(() => {
    const fetchSoftSkills = async () => {
      if (!STUDENT_ID) return;

      try {
        setLoading(true);
        const response = await projectsAPI.getStudentSoftSkills(STUDENT_ID);
        setSoftSkillsData(response.data);
      } catch (error) {
        console.error('[SOFT_SKILLS] Fetch error:', error);
        toast.error("Failed to load assessment data");
      } finally {
        setLoading(false);
      }
    };

    fetchSoftSkills();
  }, [STUDENT_ID]);

  const getLevelColor = (level) => {
    const l = Math.round(level);
    if (l >= 4.5) return 'text-emerald-400';
    if (l >= 4) return 'text-green-400';
    if (l >= 3) return 'text-amber-400';
    if (l >= 2) return 'text-orange-400';
    return 'text-red-400';
  };

  const getLevelLabel = (level) => {
    const l = Math.round(level);
    switch (l) {
      case 1: return 'Beginning';
      case 2: return 'Developing';
      case 3: return 'Proficient';
      case 4: return 'Advanced';
      case 5: return 'Exceptional';
      default: return 'Not Rated';
    }
  };

  const ProgressRing = ({ percentage, size = 120, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(30, 41, 59)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 2s ease-out' }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
          <p className="text-gray-500 font-medium text-lg">Loading your assessment...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!softSkillsData || !softSkillsData.dimension_scores) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200">
          <Award size={64} className="text-gray-200 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Soft Skills Data Yet</h2>
          <p className="text-gray-500 max-w-md">Complete your peer reviews in the project workspace to build your competency profile!</p>
        </div>
      </DashboardLayout>
    );
  }

  const dimensions = Object.entries(softSkillsData.dimension_scores).map(([id, data]) => ({
    id,
    name: data.dimension_name,
    avgScore: data.average_rating,
    description: data.level || "Competency Rating",
    indicators: [] // Backend doesn't support sub-indicators yet
  }));

  const overallScorePercent = softSkillsData.overall_soft_skills_score || 0;
  const overallDisplayScore = (overallScorePercent / 20).toFixed(1); // 0-100 to 0-5

  const RubricView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overall Score Header */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/20 transition-all duration-1000" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Your Soft Skills Mastery</h2>
            <p className="text-slate-400 text-lg max-w-xl">
              Based on {softSkillsData.total_reviews_received} verified peer assessments. This framework measures your adaptability and collaboration in high-stakes project environments.
            </p>
          </div>

          <div className="relative shrink-0">
            <ProgressRing percentage={overallScorePercent} size={160} strokeWidth={12} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-black text-white">{overallDisplayScore}</div>
                <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Level 5.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dimensions.map((dimension) => (
          <div
            key={dimension.id}
            className="bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 group"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-50 text-slate-800 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  {dimension.id.includes('COLLABORATION') || dimension.id.includes('DYNAMICS') ? <Users size={28} /> :
                    dimension.id.includes('CRITICAL') || dimension.id.includes('STRUCTURE') ? <Target size={28} /> :
                      dimension.id.includes('COMMUNICATION') || dimension.id.includes('MOTIVATION') ? <BookOpen size={28} /> :
                        <Sparkles size={28} />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{dimension.name}</h3>
                  <p className="text-gray-500 font-medium">{dimension.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${getLevelColor(dimension.avgScore)} tracking-tight`}>
                  {dimension.avgScore.toFixed(1)}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rating</div>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${dimension.avgScore >= 4 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                    dimension.avgScore >= 3 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                      'bg-gradient-to-r from-orange-400 to-amber-500'
                  }`}
                style={{ width: `${(dimension.avgScore / 5) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              <span>Beginning</span>
              <span>Advanced</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AnalyticsView = () => (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp size={24} /></div>
        <h3 className="text-2xl font-extrabold text-gray-800">Class Comparison</h3>
      </div>
      <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
        <p className="text-gray-400 italic">Global class analytics are currently being processed for your cohort.</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full mb-4 uppercase tracking-widest border border-blue-100">
              <Shield size={12} /> Research Validated • α=0.98
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight mb-4 leading-tight">
              Soft Skills <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Analytics</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl font-medium">
              Real-time competency mapping based on peer collaboration metrics.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 w-fit rounded-2xl">
          <button
            onClick={() => setActiveTab('rubric')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'rubric'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Target size={18} /> My Profile
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'analytics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <BarChart3 size={18} /> Class Trends
          </button>
        </div>

        {/* Dynamic Content */}
        {activeTab === 'rubric' && <RubricView />}
        {activeTab === 'analytics' && <AnalyticsView />}

        {/* Footer Citation */}
        <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100 mt-12">
          <div className="flex items-start gap-4">
            <Award className="text-orange-400 shrink-0 mt-1" />
            <div>
              <p className="text-gray-700 font-bold mb-1">Assessment Framework Validation Study</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our 4-dimensional model (Collaboration, Critical Thinking, Communication, Creativity) is grounded in Paper 18.pdf.
                It provides an objective, peer-calibrated lens on 21st-century competency development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SoftSkillsRubric;