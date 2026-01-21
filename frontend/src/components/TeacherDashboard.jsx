import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, Activity, CheckCircle, Clock, AlertCircle, Target, BarChart3, PieChart as PieChartIcon, TrendingDown, LineChart as LineChartIcon, Workflow, MessageSquare, Code2, Gauge } from 'lucide-react';

// Mock data - in production, this would come from the backend API
const generateMockData = () => ({
  classMetrics: {
    masteryRate: 78,
    adoptionRate: 92,
    confidenceScore: 94,
    engagementIndex: 87
  },
  conceptMastery: [
    { topic: 'Algebra Fundamentals', mastery: 92, students: 28 },
    { topic: 'Geometry Principles', mastery: 80, students: 28 },
    { topic: 'Calculus Basics', mastery: 55, students: 28 },
    { topic: 'Statistics', mastery: 95, students: 28 },
    { topic: 'Trigonometry', mastery: 73, students: 28 },
    { topic: 'Probability', mastery: 68, students: 28 }
  ],
  engagementTrends: [
    { week: 'W1', engagement: 72 },
    { week: 'W2', engagement: 78 },
    { week: 'W3', engagement: 85 },
    { week: 'W4', engagement: 87 },
    { week: 'W5', engagement: 82 },
    { week: 'W6', engagement: 89 }
  ],
  livePolling: {
    question: "Do you understand today's concept?",
    responses: [
      { option: 'Yes', count: 20, percentage: 72 },
      { option: 'Partially', count: 6, percentage: 20 },
      { option: 'No', count: 2, percentage: 8 }
    ],
    totalResponses: 28
  },
  studentAttention: Array(30).fill(0).map((_, i) => ({
    id: `student_${i}`,
    status: i === 13 || i === 29 ? 'at-risk' : i % 5 === 0 ? 'passive' : 'engaged'
  })),
  atRiskStudents: [
    { name: 'Student A', concepts: ['Calculus Basics'], engagement: 45, lastActive: '2 hours ago' },
    { name: 'Student B', concepts: ['Geometry Principles', 'Calculus Basics'], engagement: 52, lastActive: '1 day ago' }
  ],
  interventionTracking: {
    topic: 'Calculus Basics',
    before: 55,
    after: 78,
    improvement: 23,
    date: 'Yesterday'
  },
  pblProjects: {
    active: 12,
    onTrack: 9,
    atRisk: 3
  }
});

const TeacherDashboard = () => {
  const [data, setData] = useState(generateMockData());
  const [selectedView, setSelectedView] = useState('overview');
  
  // Stats animation trigger
  const [statsInView, setStatsInView] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setStatsInView(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) observer.observe(statsSection);

    return () => observer.disconnect();
  }, []);

  // Simulate real-time updates (BR6: Real-time feedback)
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateMockData());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);
  
  // Animated counter component
  const AnimatedCounter = ({ end, suffix = '', duration = 2000, decimals = 0 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!statsInView) return;

      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = progress * end;

        if (decimals > 0) {
          setCount(parseFloat(value.toFixed(decimals)));
        } else {
          setCount(Math.floor(value));
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [statsInView, end, duration, decimals]);

    return <span>{count}{suffix}</span>;
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
          style={{
            transition: 'stroke-dashoffset 2s ease-out',
          }}
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

  const MetricCard = ({ title, value, icon: Icon, trend, color }) => {
    const [IconComponent] = useState(Icon);
    return (
      <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-700/50 rounded-xl group-hover:bg-gradient-to-br group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
              <IconComponent className="text-cyan-400" size={24} />
            </div>
            {trend && (
              <div className="flex items-center text-green-400 text-sm bg-green-500/10 px-2 py-1 rounded-full">
                <TrendingUp size={14} />
                <span className="ml-1">+{trend}%</span>
              </div>
            )}
          </div>
          
          <div className="mb-2">
            <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
          </div>
          
          <div className="text-3xl font-bold text-white">
            <AnimatedCounter end={value} suffix="%" />
          </div>
        </div>
      </div>
    );
  };

  const AttentionDot = ({ status }) => {
    const colors = {
      engaged: 'bg-gradient-to-br from-green-500 to-emerald-500',
      passive: 'bg-gradient-to-br from-yellow-500 to-amber-500',
      'at-risk': 'bg-gradient-to-br from-red-500 to-rose-500'
    };
    return <div className={`w-4 h-4 rounded-full ${colors[status]} shadow-lg shadow-current/30`} />;
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">AMEP Analytics Hub</h1>
        <p className="text-slate-400 text-lg">Real-time insights • Unified reporting • Actionable intelligence</p>
      </div>

      {/* Core Metrics - Eliminating Fragmented Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Mastery Rate"
          value={data.classMetrics.masteryRate}
          icon={BookOpen}
          trend={5}
        />
        <MetricCard
          title="Teacher Adoption"
          value={data.classMetrics.adoptionRate}
          icon={Users}
          trend={2}
        />
        <MetricCard
          title="Confidence Score"
          value={data.classMetrics.confidenceScore}
          icon={CheckCircle}
          trend={4}
        />
        <MetricCard
          title="Engagement Index"
          value={data.classMetrics.engagementIndex}
          icon={Activity}
          trend={3}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Live Polling & Real-Time Feedback */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="text-cyan-400" />
              Live Poll Results
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          </div>
          <p className="text-slate-300 mb-6">"{data.livePolling.question}"</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.livePolling.responses}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="percentage"
                  >
                    {data.livePolling.responses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {data.livePolling.responses.map((response, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-medium">{response.option}</span>
                    <span className="text-slate-400">{response.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${response.percentage}%`,
                        background: `linear-gradient(to right, ${COLORS[idx]}, ${COLORS[idx]})`
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 text-right">{response.count} students</div>
                </div>
              ))}
            </div>
          </div>

          {data.livePolling.responses[2].percentage >= 8 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-500 mt-0.5" size={20} />
                <div>
                  <p className="text-amber-400 font-medium mb-1">Action Recommended</p>
                  <p className="text-slate-300 text-sm">
                    {data.livePolling.responses[2].percentage}% of students need clarification. 
                    Consider re-explaining the concept or providing additional examples.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Student Attention Map */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-cyan-400" />
            Student Attention Map
          </h2>
          
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
              <span className="text-slate-400">Engaged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500" />
              <span className="text-slate-400">Passive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-rose-500" />
              <span className="text-slate-400">At-Risk</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {data.studentAttention.map((student, idx) => (
              <AttentionDot key={idx} status={student.status} />
            ))}
          </div>

          <div className="p-4 bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <div>
                <p className="text-red-400 font-medium mb-1">{data.atRiskStudents.length} Students Need Attention</p>
                <div className="space-y-2">
                  {data.atRiskStudents.map((student, idx) => (
                    <div key={idx} className="text-slate-300 text-sm">
                      <span className="font-medium text-red-300">{student.name}</span>: 
                      <span className="text-slate-400 ml-2">{student.engagement}% engagement • Last active {student.lastActive}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Concept Mastery Heatmap & Engagement Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Concept Mastery Heatmap */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="text-cyan-400" />
            Concept Mastery Heatmap
          </h2>
          
          <div className="space-y-4">
            {data.conceptMastery.map((concept, idx) => {
              let colorClass = '';
              if (concept.mastery >= 85) colorClass = 'from-green-500/30 to-emerald-500/30';
              else if (concept.mastery >= 60) colorClass = 'from-yellow-500/30 to-amber-500/30';
              else colorClass = 'from-red-500/30 to-rose-500/30';
              
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">{concept.topic}</span>
                    <span className={`text-sm font-bold ${
                      concept.mastery >= 85 ? 'text-green-400' :
                      concept.mastery >= 60 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {concept.mastery}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
                      style={{ width: `${concept.mastery}%` }}
                    />
                  </div>
                  {concept.mastery < 60 && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Needs Review
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Trends */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-cyan-400" />
            Engagement Trends
          </h2>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.engagementTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis domain={[0, 100]} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '0.5rem',
                  backdropFilter: 'blur(10px)'
                }}
                itemStyle={{ color: '#f1f5f9' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke="url(#colorGradient)" 
                strokeWidth={3}
                dot={{ r: 6, fill: '#06b6d4', strokeWidth: 2, stroke: '#0ea5e9' }}
                activeDot={{ r: 8, fill: '#0ea5e9' }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-400" />
              <p className="text-green-400 font-medium">
                Improving: +{(data.engagementTrends[data.engagementTrends.length - 1].engagement - data.engagementTrends[0].engagement).toFixed(1)}% since Week 1
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post-Intervention Tracking */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="text-cyan-400" />
            Post-Intervention Tracking
          </h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-4">
                {data.interventionTracking.date}'s intervention on <span className="text-cyan-400">{data.interventionTracking.topic}</span>:
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-slate-500 text-sm">Before</p>
                  <p className="text-3xl font-bold text-red-400">{data.interventionTracking.before}%</p>
                </div>
                
                <div className="flex-1 mx-4">
                  <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                      style={{ width: '100%' }}
                    />
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-green-500"
                      style={{ width: '100%', opacity: 0.7 }}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-slate-500 text-sm">After</p>
                  <p className="text-3xl font-bold text-green-400">{data.interventionTracking.after}%</p>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                <p className="text-green-400 font-medium text-center">
                  ✅ Improvement: +{data.interventionTracking.improvement}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PBL Project Status */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Workflow className="text-cyan-400" />
            PBL Project Status
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-3xl font-bold text-white mb-1"><AnimatedCounter end={data.pblProjects.active} /></p>
              <p className="text-slate-400 text-sm">Active Projects</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
              <p className="text-3xl font-bold text-white mb-1"><AnimatedCounter end={data.pblProjects.onTrack} /></p>
              <p className="text-slate-400 text-sm">On Track</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-xl">
              <p className="text-3xl font-bold text-white mb-1"><AnimatedCounter end={data.pblProjects.atRisk} /></p>
              <p className="text-slate-400 text-sm">At Risk</p>
            </div>
          </div>

          {data.pblProjects.atRisk > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-500 mt-0.5" size={20} />
                <div>
                  <p className="text-amber-400 font-medium mb-1">Action Required</p>
                  <p className="text-slate-300 text-sm">
                    {data.pblProjects.atRisk} projects need attention. Consider providing additional support.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div id="stats-section" className="mt-8 bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Code2 className="text-cyan-400" />
          Actionable Recommendations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Users className="text-blue-400 mt-1" size={20} />
              <div>
                <p className="font-medium text-blue-300 mb-1">Student Support Needed</p>
                <p className="text-slate-300 text-sm">{data.atRiskStudents.length} students may need 1-on-1 support</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <BookOpen className="text-amber-400 mt-1" size={20} />
              <div>
                <p className="font-medium text-amber-300 mb-1">Topic Review Suggested</p>
                <p className="text-slate-300 text-sm">Calculus Basics average mastery at 55% - consider revisiting</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Clock className="text-purple-400 mt-1" size={20} />
              <div>
                <p className="font-medium text-purple-300 mb-1">Pacing Adjustment</p>
                <p className="text-slate-300 text-sm">Consider more student interaction time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;