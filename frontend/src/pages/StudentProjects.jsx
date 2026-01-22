import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Map, Plus, MoreHorizontal, CheckCircle, Clock, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Tasks Data
const mockTasks = [
    { id: 1, title: 'Research Case Background', status: 'done', assignee: 'Alex', priority: 'high' },
    { id: 2, title: 'Analyze Fingerprint Data', status: 'doing', assignee: 'Alex', priority: 'high' },
    { id: 3, title: 'Interview Witnesses (Simulated)', status: 'todo', assignee: 'Team', priority: 'medium' },
    { id: 4, title: 'Compile Final Report', status: 'todo', assignee: 'Sam', priority: 'high' },
];

const StatusColumn = ({ title, status, tasks, icon: Icon, color }) => {
    const columnTasks = tasks.filter(t => t.status === status);

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Icon size={18} className={color} /> {title}
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs border border-gray-200">{columnTasks.length}</span>
                </h3>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {columnTasks.map((task) => (
                    <motion.div
                        key={task.id}
                        layoutId={task.id}
                        whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-opacity-20 
                ${task.priority === 'high' ? 'bg-red-500 text-red-700' : 'bg-blue-500 text-blue-700'}`}>
                                {task.priority}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-3">{task.title}</h4>
                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-orange-600">
                                    {task.assignee[0]}
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">#PBL-{task.id}</span>
                        </div>
                    </motion.div>
                ))}
                {columnTasks.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm italic">
                        No tasks here
                    </div>
                )}
            </div>

            <button className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all text-sm font-bold">
                <Plus size={16} /> Add Task
            </button>
        </div>
    );
};

const StudentProjects = () => {
    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                {/* Header */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                            <Map className="text-blue-500" /> Project Workspace
                        </h1>
                        <p className="text-gray-500 mt-1">Collaborate with your team to solve the mystery.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" />
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                +2
                            </div>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                            Share Artifacts
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-2">
                    <StatusColumn
                        title="To Do"
                        status="todo"
                        tasks={mockTasks}
                        icon={Circle}
                        color="text-gray-400"
                    />
                    <StatusColumn
                        title="In Progress"
                        status="doing"
                        tasks={mockTasks}
                        icon={Clock}
                        color="text-blue-500"
                    />
                    <StatusColumn
                        title="Completed"
                        status="done"
                        tasks={mockTasks}
                        icon={CheckCircle}
                        color="text-green-500"
                    />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProjects;
