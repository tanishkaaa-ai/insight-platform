import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, Users, FileText, Upload, Calendar, AlertTriangle, Workflow, Target, Check, User, Briefcase, Layers, Play, BookOpen, Sparkles, TrendingUp, TrendingDown, Award, Shield, Globe, Code2, Gauge } from 'lucide-react';

// Mock project data
const mockProject = {
  id: 'proj_001',
  title: 'Sustainable Energy Solutions for Local Community',
  description: 'Design and propose renewable energy solutions for our school district',
  currentStage: 'research',
  startDate: '2025-01-06',
  endDate: '2025-02-14',
  team: {
    id: 'team_alpha',
    name: 'Team Alpha',
    members: [
      { id: 's1', name: 'Alice Johnson', role: 'Team Leader' },
      { id: 's2', name: 'Bob Smith', role: 'Researcher' },
      { id: 's3', name: 'Carol Davis', role: 'Designer' },
      { id: 's4', name: 'David Lee', role: 'Technical Lead' }
    ]
  },
  stages: [
    { id: 'questioning', name: 'Questioning', status: 'completed' },
    { id: 'define', name: 'Define', status: 'completed' },
    { id: 'research', name: 'Research', status: 'in_progress' },
    { id: 'create', name: 'Create', status: 'pending' },
    { id: 'present', name: 'Present', status: 'pending' }
  ],
  milestones: [
    { id: 'm1', title: 'Problem Statement', dueDate: '2025-01-10', status: 'completed' },
    { id: 'm2', title: 'Research Report', dueDate: '2025-01-20', status: 'in_progress' },
    { id: 'm3', title: 'Prototype Design', dueDate: '2025-01-30', status: 'pending' },
    { id: 'm4', title: 'Final Presentation', dueDate: '2025-02-14', status: 'pending' }
  ],
  artifacts: [
    { id: 'a1', name: 'SWOT Analysis.pdf', type: 'document', uploadedBy: 'Alice Johnson', date: '2025-01-08' },
    { id: 'a2', name: 'Consumer Insights.docx', type: 'document', uploadedBy: 'Bob Smith', date: '2025-01-09' }
  ],
  metrics: {
    completion: 78,
    quality: 85,
    efficiency: 72,
    collaboration: 92
  }
};

const PBLWorkspace = () => {
  const [project, setProject] = useState(mockProject);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const getStageIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="text-green-400" size={24} />;
      case 'in_progress': return <Clock className="text-cyan-400 animate-pulse" size={24} />;
      default: return <Circle className="text-slate-500" size={24} />;
    }
  };

  const getMilestoneStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'from-green-500 to-emerald-500';
      case 'in_progress': return 'from-cyan-500 to-blue-500';
      case 'overdue': return 'from-red-500 to-rose-500';
      default: return 'from-slate-500 to-slate-600';
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

  const StageProgress = () => (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Workflow className="text-cyan-400" />
        5-Stage PBL Process
      </h3>
      <div className="space-y-6">
        {project.stages.map((stage, idx) => (
          <div key={stage.id}>
            <div className="flex items-center gap-5">
              <div className="p-3 bg-slate-700/50 rounded-xl">
                {getStageIcon(stage.status)}
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${
                  stage.status === 'completed' ? 'text-green-400' :
                  stage.status === 'in_progress' ? 'text-cyan-400' :
                  'text-slate-400'
                }`}>
                  Stage {idx + 1}: {stage.name}
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  {stage.status === 'completed' && '✓ Completed'}
                  {stage.status === 'in_progress' && '→ Currently working on this stage'}
                  {stage.status === 'pending' && '○ Not started yet'}
                </p>
              </div>
            </div>
            {idx < project.stages.length - 1 && (
              <div className={`ml-11 w-0.5 h-12 ${
                stage.status === 'completed' ? 'bg-gradient-to-b from-green-500 to-emerald-500' : 'bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Stage Details */}
      <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl">
        <h4 className="font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <Target className="text-cyan-400" />
          Current Stage: Research
        </h4>
        <p className="text-slate-300 mb-4">
          Gather information from multiple sources, conduct interviews, and collect data
          to support your solution design.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-slate-300">Resource library integration</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-slate-300">Citation management</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-cyan-400" />
            <span className="text-slate-300">Knowledge sharing space (in progress)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-slate-300">Data analysis tools</span>
          </div>
        </div>
      </div>
    </div>
  );

  const TeamManagement = () => (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Users className="text-cyan-400" />
        {project.team.name}
      </h3>
      
      <div className="space-y-4">
        {project.team.members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white text-lg">{member.name}</p>
                <p className="text-slate-400">{member.role}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
              View Profile
            </button>
          </div>
        ))}
      </div>

      {/* Role Distribution */}
      <div className="mt-8 p-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl">
        <h4 className="font-bold text-violet-400 mb-3 flex items-center gap-2">
          <Briefcase className="text-violet-400" />
          Role Assignment
        </h4>
        <p className="text-slate-300">
          Clear roles and responsibilities ensure effective collaboration. Each team member
          has a defined role aligned with their strengths and project needs.
        </p>
      </div>
    </div>
  );

  const MilestoneTracking = () => {
    // Calculate Gantt chart data
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const totalDays = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24));
    
    const getMilestonePosition = (dueDate) => {
      const milestoneDate = new Date(dueDate);
      const daysFromStart = Math.ceil((milestoneDate - projectStart) / (1000 * 60 * 60 * 24));
      return (daysFromStart / totalDays) * 100;
    };

    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Calendar className="text-cyan-400" />
          Milestones & Timeline
        </h3>

        {/* Gantt Chart Visualization */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
            <span>{new Date(project.startDate).toLocaleDateString()}</span>
            <span>Project Timeline</span>
            <span>{new Date(project.endDate).toLocaleDateString()}</span>
          </div>
          
          <div className="relative h-20 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
            {/* Progress bar */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 transition-all"
              style={{ width: '40%' }}
            />
            
            {/* Current date marker */}
            <div 
              className="absolute top-0 h-full w-0.5 bg-gradient-to-b from-red-500 to-rose-500"
              style={{ left: '35%' }}
            >
              <div className="absolute -top-8 -left-8 text-xs text-red-400 font-bold whitespace-nowrap">
                Today
              </div>
            </div>

            {/* Milestone markers */}
            {project.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${getMilestonePosition(milestone.dueDate)}%` }}
              >
                <div className={`w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br ${getMilestoneStatusColor(milestone.status)}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Milestone List */}
        <div className="space-y-4">
          {project.milestones.map((milestone) => (
            <div 
              key={milestone.id} 
              className={`p-6 rounded-2xl border-2 transition-all ${
                milestone.status === 'completed' ? 'border-gradient-to-r from-green-500/30 to-emerald-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10' :
                milestone.status === 'in_progress' ? 'border-gradient-to-r from-cyan-500/30 to-blue-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10' :
                'border-slate-600/50 bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-700/50 rounded-lg">
                    {getStageIcon(milestone.status)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{milestone.title}</h4>
                    <p className="text-slate-400">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {milestone.status === 'pending' && (
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                    Start Work
                  </button>
                )}
                {milestone.status === 'in_progress' && (
                  <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all">
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ArtifactSubmission = () => (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <FileText className="text-cyan-400" />
        Project Artifacts
      </h3>

      {/* Upload Area */}
      <div className="mb-8 border-2 border-dashed border-slate-600 rounded-2xl p-12 text-center hover:border-cyan-500 transition-colors cursor-pointer bg-slate-800/30">
        <Upload className="mx-auto text-slate-500 mb-4" size={64} />
        <p className="text-slate-300 font-medium text-lg mb-2">Upload Project Files</p>
        <p className="text-slate-500 mb-4">
          Drag and drop or click to browse
        </p>
        <input 
          type="file" 
          className="hidden" 
          id="file-upload"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <label 
          htmlFor="file-upload"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl cursor-pointer hover:shadow-lg hover:shadow-blue-500/50 transition-all"
        >
          Select File
        </label>
        <p className="text-slate-600 mt-4">
          Supported: PDF, DOCX, PPTX, Images, Videos
        </p>
      </div>

      {/* Artifact List */}
      <div className="space-y-4">
        <h4 className="font-bold text-white text-lg">Uploaded Files ({project.artifacts.length})</h4>
        {project.artifacts.map((artifact) => (
          <div key={artifact.id} className="flex items-center justify-between p-5 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-600/50 rounded-lg">
                <FileText className="text-cyan-400" size={24} />
              </div>
              <div>
                <p className="font-bold text-white">{artifact.name}</p>
                <p className="text-slate-500 text-sm">
                  Uploaded by {artifact.uploadedBy} • {artifact.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-lg transition-colors">
                View
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Version Control Note */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
        <p className="text-green-400 flex items-center gap-2">
          <Check className="text-green-400" />
          ✓ All files are version-controlled. Previous versions are saved automatically.
        </p>
      </div>
    </div>
  );
  
  const MetricsOverview = () => (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
      <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
        <Gauge className="text-cyan-400" />
        Project Metrics
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <ProgressRing percentage={project.metrics.completion} size={100} strokeWidth={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{project.metrics.completion}%</div>
                <div className="text-xs text-slate-400">Complete</div>
              </div>
            </div>
          </div>
          <h4 className="font-bold text-white">Completion</h4>
        </div>
        
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <ProgressRing percentage={project.metrics.quality} size={100} strokeWidth={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{project.metrics.quality}%</div>
                <div className="text-xs text-slate-400">Quality</div>
              </div>
            </div>
          </div>
          <h4 className="font-bold text-white">Quality</h4>
        </div>
        
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <ProgressRing percentage={project.metrics.efficiency} size={100} strokeWidth={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{project.metrics.efficiency}%</div>
                <div className="text-xs text-slate-400">Efficiency</div>
              </div>
            </div>
          </div>
          <h4 className="font-bold text-white">Efficiency</h4>
        </div>
        
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <ProgressRing percentage={project.metrics.collaboration} size={100} strokeWidth={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{project.metrics.collaboration}%</div>
                <div className="text-xs text-slate-400">Teamwork</div>
              </div>
            </div>
          </div>
          <h4 className="font-bold text-white">Teamwork</h4>
        </div>
      </div>
    </div>
  );

  const ProjectOverview = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
        <h2 className="text-4xl font-bold text-white mb-4">{project.title}</h2>
        <p className="text-slate-300 text-lg mb-8">{project.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl">
            <p className="text-sm text-blue-400 font-bold mb-2">Start Date</p>
            <p className="text-2xl font-bold text-white">
              {new Date(project.startDate).toLocaleDateString()}
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl">
            <p className="text-sm text-violet-400 font-bold mb-2">End Date</p>
            <p className="text-2xl font-bold text-white">
              {new Date(project.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl">
            <p className="text-sm text-green-400 font-bold mb-2">Days Remaining</p>
            <p className="text-2xl font-bold text-white">31 days</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl">
          <AlertTriangle className="text-amber-400" size={32} />
          <p className="text-amber-400 font-medium text-lg">
            Research milestone due in 7 days. Make sure to submit your research report!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StageProgress />
        <TeamManagement />
      </div>

      <MetricsOverview />
      <MilestoneTracking />
      <ArtifactSubmission />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-3">📋 PBL Workspace</h1>
        <p className="text-slate-400 text-xl">BR9: Centralized Project Management • 5-Stage Workflow</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {['overview', 'stages', 'team', 'milestones', 'artifacts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && <ProjectOverview />}
      {activeTab === 'stages' && <StageProgress />}
      {activeTab === 'team' && <TeamManagement />}
      {activeTab === 'milestones' && <MilestoneTracking />}
      {activeTab === 'artifacts' && <ArtifactSubmission />}

      {/* Research Citation */}
      <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 p-6 rounded-2xl">
        <p className="text-slate-300 font-medium mb-2 flex items-center gap-2">
          <Sparkles className="text-purple-400" />
          Research-Backed Design
        </p>
        <p className="text-slate-300">
          The 5-stage PBL workflow (Questioning → Define → Research → Create → Present) is based
          on evidence-based practices for inquiry-based learning. This structured approach includes
          SWOT analysis tools, consumer insight templates, and role assignment frameworks to tackle
          common PBL implementation challenges.
        </p>
        <p className="text-slate-500 mt-3 flex items-center gap-2">
          <Award className="text-purple-400" />
          — Paper 17.pdf: Tackle Implementation Challenges in PBL
        </p>
      </div>
    </div>
  );
};

export default PBLWorkspace;