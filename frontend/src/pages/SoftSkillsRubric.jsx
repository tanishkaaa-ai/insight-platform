import React, { useState } from 'react';
import { Award, Target, TrendingUp, Users, BarChart3, CheckCircle, AlertCircle, User, BookOpen, Code2, Sparkles, Zap, Shield, Globe, Workflow } from 'lucide-react';

// Mock data for soft skills rubric
const mockSkillsData = {
  dimensions: [
    {
      id: 'collaboration',
      name: 'Collaboration',
      description: 'Working effectively with peers',
      indicators: [
        { id: 'c1', skill: 'Contributes ideas during group discussions', level: 4 },
        { id: 'c2', skill: 'Listens actively to others', level: 4 },
        { id: 'c3', skill: 'Resolves conflicts constructively', level: 3 },
        { id: 'c4', skill: 'Shares responsibilities fairly', level: 4 }
      ],
      avgScore: 3.8
    },
    {
      id: 'critical_thinking',
      name: 'Critical Thinking',
      description: 'Analyzing and evaluating information',
      indicators: [
        { id: 'ct1', skill: 'Asks probing questions', level: 4 },
        { id: 'ct2', skill: 'Analyzes cause-effect relationships', level: 3 },
        { id: 'ct3', skill: 'Draws evidence-based conclusions', level: 4 },
        { id: 'ct4', skill: 'Identifies assumptions and biases', level: 3 }
      ],
      avgScore: 3.5
    },
    {
      id: 'communication',
      name: 'Communication',
      description: 'Expressing ideas clearly',
      indicators: [
        { id: 'com1', skill: 'Uses clear and concise language', level: 4 },
        { id: 'com2', skill: 'Presents ideas confidently', level: 4 },
        { id: 'com3', skill: 'Adapts communication to audience', level: 3 },
        { id: 'com4', skill: 'Provides constructive feedback', level: 4 }
      ],
      avgScore: 3.8
    },
    {
      id: 'creativity',
      name: 'Creativity',
      description: 'Generating innovative solutions',
      indicators: [
        { id: 'cr1', skill: 'Generates multiple solutions', level: 4 },
        { id: 'cr2', skill: 'Makes novel connections', level: 3 },
        { id: 'cr3', skill: 'Takes creative risks', level: 4 },
        { id: 'cr4', skill: 'Implements innovative approaches', level: 3 }
      ],
      avgScore: 3.5
    }
  ],
  students: [
    { id: 's1', name: 'Alice Johnson', scores: { collaboration: 4, critical_thinking: 3, communication: 4, creativity: 3 } },
    { id: 's2', name: 'Bob Smith', scores: { collaboration: 3, critical_thinking: 4, communication: 3, creativity: 4 } },
    { id: 's3', name: 'Carol Davis', scores: { collaboration: 4, critical_thinking: 4, communication: 4, creativity: 4 } },
    { id: 's4', name: 'David Lee', scores: { collaboration: 3, critical_thinking: 3, communication: 3, creativity: 3 } }
  ],
  overallScore: 3.7
};

const SoftSkillsRubric = () => {
  const [activeTab, setActiveTab] = useState('rubric');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [expandedDimension, setExpandedDimension] = useState(null);

  const getLevelColor = (level) => {
    switch(level) {
      case 1: return 'text-red-400';
      case 2: return 'text-orange-400';
      case 3: return 'text-amber-400';
      case 4: return 'text-green-400';
      case 5: return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  const getLevelLabel = (level) => {
    switch(level) {
      case 1: return 'Beginning';
      case 2: return 'Developing';
      case 3: return 'Proficient';
      case 4: return 'Advanced';
      case 5: return 'Exceptional';
      default: return 'Unknown';
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

  const RubricView = () => (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Overall Soft Skills Assessment</h2>
            <p className="text-slate-400">4-Dimensional Framework with α=0.98 Reliability</p>
          </div>
          <div className="text-center">
            <div className="relative inline-block">
              <ProgressRing percentage={mockSkillsData.overallScore * 20} size={140} strokeWidth={10} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{mockSkillsData.overallScore.toFixed(1)}</div>
                  <div className="text-sm text-slate-400">Out of 4.0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      {mockSkillsData.dimensions.map((dimension) => (
        <div 
          key={dimension.id} 
          className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-700/50 rounded-xl">
                {dimension.id === 'collaboration' && <Users className="text-cyan-400" size={28} />}
                {dimension.id === 'critical_thinking' && <Target className="text-cyan-400" size={28} />}
                {dimension.id === 'communication' && <BookOpen className="text-cyan-400" size={28} />}
                {dimension.id === 'creativity' && <Sparkles className="text-cyan-400" size={28} />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{dimension.name}</h3>
                <p className="text-slate-400">{dimension.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">{dimension.avgScore.toFixed(1)}</div>
              <div className="text-sm text-slate-400">Average Score</div>
            </div>
          </div>

          <div className="space-y-4">
            {dimension.indicators.map((indicator) => (
              <div key={indicator.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <div className="flex-1">
                  <p className="text-slate-300 font-medium">{indicator.skill}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${getLevelColor(indicator.level)}`}>
                    {indicator.level}
                  </div>
                  <div className="text-sm text-slate-500 min-w-[100px] text-right">
                    {getLevelLabel(indicator.level)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const StudentsView = () => (
    <div className="space-y-6">
      {mockSkillsData.students.map((student) => (
        <div 
          key={student.id} 
          className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{student.name}</h3>
                <p className="text-slate-400">Individual Assessment</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {(Object.values(student.scores).reduce((a, b) => a + b, 0) / 4).toFixed(1)}
              </div>
              <div className="text-sm text-slate-400">Overall Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(student.scores).map(([skill, score]) => (
              <div key={skill} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 capitalize">{skill.replace('_', ' ')}</span>
                  <span className={`text-lg font-bold ${getLevelColor(score)}`}>{score}</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${score === 1 ? 'from-red-500 to-red-600' : score === 2 ? 'from-orange-500 to-amber-500' : score === 3 ? 'from-amber-500 to-yellow-500' : score === 4 ? 'from-green-500 to-emerald-500' : 'from-emerald-500 to-teal-500'}`}
                    style={{ width: `${score * 20}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <BarChart3 className="text-cyan-400" />
          Skill Distribution Analysis
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Class Average by Dimension</h4>
            <div className="space-y-4">
              {mockSkillsData.dimensions.map((dimension) => (
                <div key={dimension.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">{dimension.name}</span>
                    <span className="text-white font-bold">{dimension.avgScore.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${(dimension.avgScore / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Skill Level Distribution</h4>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">{getLevelLabel(level)}</span>
                    <span className="text-white font-bold">{level}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${level === 1 ? 'bg-red-500' : level === 2 ? 'bg-orange-500' : level === 3 ? 'bg-amber-500' : level === 4 ? 'bg-green-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.floor(Math.random() * 30) + 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-cyan-400" />
            Improvement Areas
          </h4>
          <div className="space-y-3">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">Critical Thinking (3.5)</p>
              <p className="text-sm text-slate-400">Focus on analytical reasoning</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400">Creativity (3.5)</p>
              <p className="text-sm text-slate-400">Encourage innovative approaches</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-cyan-400" />
            Strength Areas
          </h4>
          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400">Collaboration (3.8)</p>
              <p className="text-sm text-slate-400">Excellent teamwork skills</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-emerald-400">Communication (3.8)</p>
              <p className="text-sm text-slate-400">Strong presentation abilities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-3">🏆 Soft Skills Assessment</h1>
        <p className="text-slate-400 text-xl">BR5: Validated 4-Dimension Framework • α=0.98 Reliability</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('rubric')}
          className={`px-6 py-4 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
            activeTab === 'rubric'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="text-cyan-400" />
            Rubric
          </div>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-4 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="text-cyan-400" />
            Students
          </div>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-4 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="text-cyan-400" />
            Analytics
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rubric' && <RubricView />}
      {activeTab === 'students' && <StudentsView />}
      {activeTab === 'analytics' && <AnalyticsView />}

      {/* Research Citation */}
      <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 p-6 rounded-2xl">
        <p className="text-slate-300 font-medium mb-2 flex items-center gap-2">
          <Shield className="text-purple-400" />
          Research-Backed Design
        </p>
        <p className="text-slate-300">
          The 4-dimensional soft skills framework incorporates collaboration, critical thinking, communication, 
          and creativity dimensions. Validated with α=0.98 Cronbach's reliability coefficient, this assessment 
          tool provides objective measurement of 21st-century competencies essential for student success.
        </p>
        <p className="text-slate-500 mt-3 flex items-center gap-2">
          <Award className="text-purple-400" />
          — Paper 18.pdf: Assessment Framework Validation Study
        </p>
      </div>
    </div>
  );
};

export default SoftSkillsRubric;