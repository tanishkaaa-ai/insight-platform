import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import {
  Users,
  Activity,
  Clock,
  AlertTriangle,
  Plus,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
const mockTeacherStats = {
  totalStudents: 142,
  avgAttendance: 94,
  activeProjects: 8,
  engagementScore: 78
};

const mockClasses = [
  { id: 1, name: 'Forensic Science 101', period: '1st (10:00 AM)', students: 32, engagement: 'High', alert: false },
  { id: 2, name: 'Digital Investigation', period: '2nd (11:30 AM)', students: 28, engagement: 'Medium', alert: true },
  { id: 3, name: 'Cyber Ethics', period: '3rd (02:00 PM)', students: 30, engagement: 'High', alert: false },
];

const atRiskStudents = [
  { id: 101, name: 'Jordan Smith', class: 'Digital Investigation', reason: 'Absent 3 days', riskLevel: 'High' },
  { id: 105, name: 'Casey Lee', class: 'Forensic Science 101', reason: 'Low Mastery Score', riskLevel: 'Medium' },
];

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
  return (
    <TeacherLayout>
      <div className="space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Administrator Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, Prof. Anderson. Here's what's happening today.</p>
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
            icon={Users}
            label="Total Students"
            value={mockTeacherStats.totalStudents}
            trend="+5%"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Activity}
            label="Avg. Engagement"
            value={`${mockTeacherStats.engagementScore}%`}
            trend="+12%"
            color="bg-purple-50 text-purple-600"
            subtext="Based on last 7 days"
          />
          <StatCard
            icon={BrainCircuit}
            label="Mastery Index"
            value="8.4/10"
            color="bg-teal-50 text-teal-600"
            subtext="Class average across modules"
          />
          <StatCard
            icon={AlertTriangle}
            label="Attention Needed"
            value={atRiskStudents.length}
            color="bg-red-50 text-red-600"
            subtext="Students flagged by AI"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content: Class Schedule / Overview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800">Today's Classes</h2>
                <NavLink to="/teacher/classes" className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  View All <ChevronRight size={16} />
                </NavLink>
              </div>
              <div className="divide-y divide-gray-50">
                {mockClasses.map((cls) => (
                  <div key={cls.id} className="p-5 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                          {cls.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-teal-600 transition-colors">{cls.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Clock size={14} /> {cls.period} • {cls.students} Students
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Engagement</p>
                          <span className={`font-bold ${cls.engagement === 'High' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {cls.engagement}
                          </span>
                        </div>
                        {cls.alert && (
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse" title="Needs Attention">
                            <AlertTriangle size={16} />
                          </div>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <MoreHorizontal size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights Concept */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <BrainCircuit size={24} className="text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">AI Teaching Assistant Suggestion</h3>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                    Engagement analysis shows that student participation drops by 15% during "Evidence Collection" lectures. Consider adding a 5-minute interactive poll halfway through the session to re-engage the class.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-sm transition-colors">
                    Create Poll Now
                  </button>
                </div>
              </div>
            </div>
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
                {atRiskStudents.map((student) => (
                  <div key={student.id} className="p-3 transition-colors hover:bg-red-50/50 rounded-xl cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 text-sm">{student.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full uppercase">
                        {student.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{student.class}</p>
                    <p className="text-xs text-red-600 font-medium">Reason: {student.reason}</p>
                  </div>
                ))}
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
    </TeacherLayout>
  );
};

export default TeacherDashboard;