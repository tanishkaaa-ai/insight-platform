import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Brain, TrendingUp, Users, Target, Zap,
  CheckCircle, BarChart3, Clock, BookOpen, Sparkles,
  ChevronRight, Play, Award, Shield, Globe, Layers,
  TrendingDown, LineChart, PieChart, Activity, Lightbulb,
  Workflow, MessageSquare, Code2, Gauge
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activePillar, setActivePillar] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [statsInView, setStatsInView] = useState(false);
  const [hoveredTab, setHoveredTab] = useState('mastery');

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY / docHeight;
      setScrollProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Stats animation trigger
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

  // Auto-rotate pillars
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePillar(prev => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

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

  const pillars = [
    {
      id: 'mastery',
      icon: Brain,
      number: '01',
      title: 'Adaptive Mastery Engine',
      tagline: 'Deep Learning Intelligence',
      description: 'Hybrid AI model combining Bayesian Knowledge Tracing (BKT), Deep Knowledge Tracing (DKT), and Deep Knowledge Variable Memory Network (DKVMN) for precise 0-100 mastery scoring.',
      features: [
        { icon: Gauge, label: 'Dynamic Mastery Tracking', desc: 'Real-time 0-100 scoring' },
        { icon: Target, label: 'ZPD Targeting', desc: 'Zone of Proximal Development' },
        { icon: Zap, label: 'Efficient Learning', desc: '20% practice reduction' },
        { icon: LineChart, label: 'Predictive Analytics', desc: 'Concept mastery forecasting' }
      ],
      color: 'from-blue-500 to-cyan-500',
      lightColor: 'from-blue-500/20 to-cyan-500/20',
      stats: { value: 12.4, label: 'Outcome improvement', suffix: '%' },
      metrics: { accuracy: 97, adoption: 94, growth: 78 }
    },
    {
      id: 'engagement',
      icon: TrendingUp,
      number: '02',
      title: 'Inclusive Engagement System',
      tagline: '100% Student Visibility',
      description: 'Anonymous polling combined with sensorless behavior analytics. Ensures every student voice is heard, detected, and acted upon in real-time.',
      features: [
        { icon: MessageSquare, label: 'Live Anonymous Polling', desc: '100% participation rate' },
        { icon: Activity, label: 'Implicit Behavior Detection', desc: 'Sensorless analytics' },
        { icon: Zap, label: 'Real-time Alerts', desc: 'Teacher notifications' },
        { icon: BarChart3, label: 'Multi-dimensional Scoring', desc: 'Comprehensive metrics' }
      ],
      color: 'from-emerald-500 to-teal-500',
      lightColor: 'from-emerald-500/20 to-teal-500/20',
      stats: { value: 100, label: 'Participation achieved', suffix: '%' },
      metrics: { visibility: 100, detection: 94, response: 89 }
    },
    {
      id: 'pbl',
      icon: Layers,
      number: '03',
      title: 'PBL & Analytics Hub',
      tagline: 'Project Excellence',
      description: '5-stage structured workflow with validated 4-dimensional soft-skill rubric. Automate project management while objectively assess 21st-century competencies.',
      features: [
        { icon: Workflow, label: '5-Stage Workflow', desc: 'Question→Present flow' },
        { icon: Award, label: 'Skill Assessment', desc: '4-dimensional rubric (α=0.98)' },
        { icon: Clock, label: 'Time Savings', desc: '3 hours/week planning saved' },
        { icon: Code2, label: 'Milestone Tracking', desc: 'Automated progress monitoring' }
      ],
      color: 'from-violet-500 to-purple-500',
      lightColor: 'from-violet-500/20 to-purple-500/20',
      stats: { value: 3, label: 'Hours saved weekly', suffix: 'hrs' },
      metrics: { completion: 96, quality: 92, efficiency: 88 }
    }
  ];

  const problemSolutions = [
    {
      problem: 'Static assessments miss evolving knowledge',
      solution: 'Dynamic 0-100 mastery scoring with Deep Knowledge Tracing',
      icon: Brain,
      impact: '+12.4% outcomes'
    },
    {
      problem: 'One-size-fits-all homework ignores gaps',
      solution: 'AI targets Zone of Proximal Development for each student',
      icon: Target,
      impact: '20% practice reduction'
    },
    {
      problem: '30% of students invisible in class',
      solution: 'Anonymous polling ensures 100% participation visibility',
      icon: MessageSquare,
      impact: '100% visibility'
    },
    {
      problem: 'Subjective soft-skill assessment',
      solution: 'Validated 4-dimension framework with 0.98 reliability',
      icon: Award,
      impact: '0.98 α score'
    },
    {
      problem: 'Teachers spend 3+ hours/week planning',
      solution: 'Curriculum-aligned template library reduces workload',
      icon: Clock,
      impact: '50% time saved'
    },
    {
      problem: 'Data scattered across 5-10 tools',
      solution: 'Single unified dashboard with real-time analytics',
      icon: BarChart3,
      impact: 'Unified platform'
    }
  ];

  const researchStats = [
    { value: 12.4, suffix: '%', label: 'Learning Outcome Improvement', metric: 'Learning gains' },
    { value: 20, suffix: '%', label: 'Practice Time Reduction', metric: 'Efficiency boost' },
    { value: 25, suffix: '%', label: 'Faster Task Completion', metric: 'Speed increase' },
    { value: 3, suffix: 'hrs', label: 'Weekly Planning Time Saved', metric: 'Teacher relief' }
  ];

  const workflow = [
    { stage: 'Question', number: 1, description: 'Guided brainstorming to generate project ideas', icon: Lightbulb },
    { stage: 'Define', number: 2, description: 'SMART goals and team role assignment', icon: Target },
    { stage: 'Research', number: 3, description: 'Collaborative knowledge gathering', icon: BookOpen },
    { stage: 'Create', number: 4, description: 'Prototype building with milestones', icon: Layers },
    { stage: 'Present', number: 5, description: 'Results sharing and reflection', icon: Play }
  ];

  const currentPillar = pillars[activePillar];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-500 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-slate-900/60 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">AMEP</div>
                <div className="text-xs text-cyan-400">AI Education Intelligence</div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#vision" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Vision</a>
              <a href="#pillars" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Product</a>
              <a href="#workflow" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Workflow</a>
              <a href="#impact" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Impact</a>
            </div>


          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-full mb-8 animate-fade-in">
              <Sparkles size={16} className="text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">Powered by Hybrid AI Models</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight animate-slide-up">
              Transform Classroom Data
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">Into Intelligence</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto animation-delay-200">
              AMEP combines adaptive learning, real-time engagement analytics, and project-based assessment into one unified platform. Every student supported. Every teacher empowered.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animation-delay-400">
              
              <button className="group px-8 py-4 bg-slate-800/50 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition-all duration-300 flex items-center gap-3">
                <Play size={20} />
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-slate-400 animation-delay-600">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-emerald-400" />
                <span className="text-sm font-medium">Research-Backed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-400" />
                <span className="text-sm font-medium">12%+ Improvement</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={20} className="text-emerald-400" />
                <span className="text-sm font-medium">Enterprise-Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem-Solution Vision */}
      <section id="vision" className="py-24 px-6 bg-gradient-to-b from-slate-900/0 to-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              The Challenge of Modern Education
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Traditional tools are fragmented. AMEP brings AI-powered intelligence to every decision.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problemSolutions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-7 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden"
                >
                  {/* Hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    {/* Icon */}
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:from-red-500/30 group-hover:to-orange-500/30 transition-all duration-300">
                      <Icon className="text-red-400" size={28} />
                    </div>

                    {/* Problem */}
                    <div className="mb-4">
                      <div className="text-xs text-red-400 font-bold tracking-wider mb-2">CHALLENGE</div>
                      <p className="text-slate-300 text-sm font-medium leading-relaxed">{item.problem}</p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-5" />

                    {/* Solution */}
                    <div className="mb-4">
                      <div className="text-xs text-emerald-400 font-bold tracking-wider mb-2">AMEP SOLUTION</div>
                      <p className="text-white text-sm font-medium leading-relaxed">{item.solution}</p>
                    </div>

                    {/* Impact Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <span className="text-xs text-emerald-300 font-semibold">{item.impact}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Three Pillars - Interactive */}
      <section id="pillars" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Three Pillars of Intelligence
            </h2>
            <p className="text-xl text-slate-300">
              Each pillar is backed by peer-reviewed research and real classroom validation
            </p>
          </div>

          {/* Pillar Selector Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            {pillars.map((pillar, idx) => (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(idx)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm md:text-base ${
                  activePillar === idx
                    ? `bg-gradient-to-r ${pillar.color} text-white shadow-lg`
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {pillar.number}. {pillar.title.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Active Pillar Content */}
          <div className="relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="animate-fade-in">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 bg-gradient-to-r ${currentPillar.color} rounded-full`} />
                  <span className="text-cyan-400 text-sm font-bold uppercase tracking-wider">
                    Pillar {currentPillar.number}
                  </span>
                </div>

                <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {currentPillar.title}
                </h3>
                <p className="text-lg text-cyan-400 font-semibold mb-6">{currentPillar.tagline}</p>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  {currentPillar.description}
                </p>

                {/* Features Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {currentPillar.features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentPillar.color} flex items-center justify-center flex-shrink-0 mt-1`}>
                          <Icon className="text-white" size={20} />
                        </div>
                        <div>
                          <div className="text-white font-semibold text-sm">{feature.label}</div>
                          <div className="text-slate-400 text-xs">{feature.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-2">
                  Learn More
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Right: Metrics and Visual */}
              <div className="relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                  {/* Key Stat */}
                  <div className="mb-12">
                    <div className="text-sm text-slate-400 mb-2">Key Impact Metric</div>
                    <div className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${currentPillar.color} bg-clip-text text-transparent mb-2`}>
                      <AnimatedCounter end={currentPillar.stats.value} suffix={currentPillar.stats.suffix} decimals={currentPillar.stats.value % 1 !== 0 ? 1 : 0} />
                    </div>
                    <p className="text-slate-400 text-sm">{currentPillar.stats.label}</p>
                  </div>

                  {/* Performance Rings */}
                  <div className="grid grid-cols-3 gap-6">
                    {Object.entries(currentPillar.metrics).map(([key, value]) => (
                      <div key={key} className="flex flex-col items-center">
                        <div className="relative mb-3">
                          <ProgressRing percentage={value} size={100} strokeWidth={6} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{value}%</div>
                              <div className="text-xs text-slate-400 capitalize">{key}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Timeline */}
      <section id="workflow" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              5-Stage PBL Workflow
            </h2>
            <p className="text-xl text-slate-300">
              Structured project-based learning from ideation to reflection
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 via-violet-500 to-blue-500 -translate-y-1/2 hidden lg:block opacity-30" />

            <div className="grid md:grid-cols-5 gap-6 relative">
              {workflow.map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <div key={idx} className="relative group">
                    {/* Card */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 h-full flex flex-col">
                      {/* Number Badge */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-5 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                        {stage.number}
                      </div>

                      {/* Icon */}
                      <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-gradient-to-br group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
                        <Icon className="text-cyan-400 group-hover:text-blue-300 transition-colors" size={32} />
                      </div>

                      {/* Content */}
                      <h3 className="text-white font-bold text-lg mb-2">{stage.stage}</h3>
                      <p className="text-slate-400 text-sm flex-grow">{stage.description}</p>

                      {/* Arrow */}
                      {idx < workflow.length - 1 && (
                        <div className="hidden lg:block absolute -right-12 top-1/2 -translate-y-1/2 text-slate-700 group-hover:text-blue-500 transition-colors text-2xl">
                          →
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="py-24 px-6 bg-gradient-to-b from-slate-900/0 to-slate-900/50">
        <div className="max-w-7xl mx-auto" id="stats-section">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Proven Impact
            </h2>
            <p className="text-xl text-slate-300">
              Real results from peer-reviewed academic research
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {researchStats.map((stat, idx) => (
              <div
                key={idx}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  {/* Metric Value */}
                  <div className="mb-3">
                    <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} decimals={1} />
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="text-white font-semibold text-sm mb-1">{stat.label}</div>
                  <div className="text-slate-500 text-xs">{stat.metric}</div>

                  {/* Progress bar */}
                  <div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      style={{
                        width: `${stat.value}%`,
                        animation: statsInView ? `slideLeft 1s ease-out 0.5s forwards` : 'none',
                        opacity: 0,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Live Analytics Dashboard
            </h2>
            <p className="text-xl text-slate-300">
              Real-time intelligence at your fingertips
            </p>
          </div>

          <div className="relative">
            {/* Dashboard Container */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-700/30">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Teacher Control Center</h3>
                  <p className="text-slate-400 text-sm">Real-time classroom intelligence</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-lg">
                    <div className="text-emerald-400 text-sm font-bold">Engagement 87%</div>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg">
                    <div className="text-blue-400 text-sm font-bold">Mastery 78%</div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Active Students', value: 28, icon: Users },
                  { label: 'Avg. Mastery Score', value: 78, icon: Gauge },
                  { label: 'Projects On Track', value: 9, icon: CheckCircle },
                  { label: 'System Alerts', value: 2, icon: Zap }
                ].map((metric, idx) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="text-cyan-400" size={20} />
                        <div className="text-slate-400 text-xs font-semibold">{metric.label}</div>
                      </div>
                      <div className="text-3xl font-bold text-white">{metric.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Area */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-white font-semibold">Engagement Trend (Last 7 days)</h4>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                    <div className="w-3 h-3 bg-violet-500 rounded-full" />
                  </div>
                </div>

                {/* Animated Chart Bars */}
                <div className="h-56 flex items-end gap-2 justify-between">
                  {[65, 72, 78, 85, 87, 90, 88].map((height, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-lg transition-all duration-500 hover:opacity-80 hover:scale-y-110 cursor-pointer relative group"
                      style={{
                        height: `${height}%`,
                        animation: statsInView ? `barRise 0.6s ease-out forwards` : 'none',
                        animationDelay: `${idx * 0.1}s`,
                        opacity: statsInView ? 1 : 0,
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {height}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Status Cards */}
            <div className="absolute -right-4 top-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/50 rounded-xl p-4 shadow-xl hidden xl:block animate-float">
              <div className="flex items-center gap-2 text-emerald-300">
                <Activity size={18} />
                <span className="text-sm font-semibold">Live Poll Active</span>
              </div>
              <div className="text-xs text-emerald-400 mt-1">28 responses received</div>
            </div>

            <div className="absolute -left-4 bottom-20 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-violet-500/50 rounded-xl p-4 shadow-xl hidden xl:block" style={{ animation: 'float 3s ease-in-out infinite 1s' }}>
              <div className="flex items-center gap-2 text-violet-300">
                <Zap size={18} />
                <span className="text-sm font-semibold">AI Insights Ready</span>
              </div>
              <div className="text-xs text-violet-400 mt-1">3 actionable recommendations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Research & Proof */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-900/50 to-slate-900/0">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Built on Science
            </h2>
            <p className="text-xl text-slate-300">
              Every feature validated through peer-reviewed academic research
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { papers: 12, focus: 'Knowledge Tracing Models', alpha: '0.97+', papers_list: '3 peer-reviewed studies' },
              { papers: 15, focus: 'Engagement Detection', alpha: '0.94+', papers_list: '5 validated frameworks' },
              { papers: 18, focus: 'Soft Skills Assessment', alpha: '0.98+', papers_list: '4 rubric validations' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text mb-3">
                    {item.papers}+
                  </div>
                  <div className="text-white font-bold text-lg mb-2">{item.focus}</div>
                  <p className="text-slate-400 text-sm mb-6">{item.papers_list}</p>

                  <div className="pt-6 border-t border-slate-700/50">
                    <div className="text-slate-500 text-xs mb-1">Cronbach's Alpha</div>
                    <div className="text-2xl font-bold text-emerald-400">{item.alpha}</div>
                    <div className="text-xs text-slate-500 mt-1">Reliability score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-violet-600/10 border-y border-slate-700/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Transform Your Classroom Today
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Join forward-thinking educators revolutionizing learning with AI-powered intelligence.
            Start free. Scale as you grow. Full support included.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button
              onClick={() => navigate('/dashboard')}
              className="group px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              Start Free Trial
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-4 bg-slate-800/50 backdrop-blur-sm text-white rounded-xl font-bold text-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition-all duration-300">
              Schedule Demo
            </button>
          </div>

          <p className="text-slate-500 text-sm mt-8">
            No credit card required. 30-day free trial. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Brain className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold text-white">AMEP</span>
              </div>
              <p className="text-slate-500 text-sm">
                AI-powered education intelligence platform transforming modern classrooms.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#pillars" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#impact" className="hover:text-white transition-colors">Impact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-600 text-sm">
              2025 AMEP. All rights reserved.
            </p>
            <div className="flex items-center gap-8 text-slate-600 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes slideLeft {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes barRise {
          from {
            opacity: 0;
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
