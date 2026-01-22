import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Map, Plus, MoreHorizontal, CheckCircle, Clock, Circle, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { projectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StatusColumn = ({ title, status, tasks, icon: Icon, color, onAddTask }) => {
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
                        key={task.task_id || task._id}
                        layoutId={task.task_id || task._id}
                        whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-opacity-20 
                ${task.priority === 'high' ? 'bg-red-500 text-red-700' : 'bg-blue-500 text-blue-700'}`}>
                                {task.priority || 'medium'}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-3">{task.title}</h4>
                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-orange-600">
                                    {(task.assignee_name && task.assignee_name[0]) || '?'}
                                </div>
                            </div>
                            {/* <span className="text-xs text-gray-400">#PBL-{task.task_id ? task.task_id.slice(-4) : '...'}</span> */}
                        </div>
                    </motion.div>
                ))}
                {columnTasks.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm italic">
                        No tasks here
                    </div>
                )}
            </div>

            <button
                onClick={onAddTask}
                className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all text-sm font-bold"
            >
                <Plus size={16} /> Add Task
            </button>
        </div>
    );
};

const StudentProjects = () => {
    const { getUserId } = useAuth();
    const [activeTeam, setActiveTeam] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const STUDENT_ID = getUserId();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Get Student Teams
                const teamsRes = await projectsAPI.getStudentTeams(STUDENT_ID);
                const teams = teamsRes.data || [];

                if (teams.length > 0) {
                    const team = teams[0]; // Pick first team for now
                    setActiveTeam(team);

                    // 2. Get Team Tasks
                    // Assuming getTeamTasks expects team_id
                    const tasksRes = await projectsAPI.getTeamTasks(team.team_id || team._id);
                    setTasks(tasksRes.data || []);
                } else {
                    // No teams found
                    setTasks([]);
                }

            } catch (err) {
                console.error("Error fetching projects:", err);
                setError("Failed to load project workspace. Make sure you are assigned to a team.");
            } finally {
                setLoading(false);
            }
        };

        if (STUDENT_ID) {
            fetchData();
        } else {
            setLoading(false);
            setError("Please log in to view your projects.");
        }
    }, [STUDENT_ID]);

    const handleAddTask = () => {
        if (!activeTeam) return;
        alert(`Adding task for team ${activeTeam.team_name}... (Feature coming soon)`);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
                    <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading project workspace...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <p className="text-gray-500 max-w-md">{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!activeTeam) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                    <div className="bg-blue-100 p-4 rounded-full text-blue-500 mb-4">
                        <Map size={32} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">No Active Projects</h3>
                    <p className="text-gray-500 max-w-md mt-2">You haven't been assigned to any project teams yet.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                {/* Header */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                            <Map className="text-blue-500" /> {activeTeam.project_name || 'Project Workspace'}
                        </h1>
                        <p className="text-gray-500 mt-1">Team: <span className="font-bold text-gray-700">{activeTeam.team_name}</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {/* Mock Avatars for Team Members */}
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">?</div>
                            ))}
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
                        tasks={tasks}
                        icon={Circle}
                        color="text-gray-400"
                        onAddTask={handleAddTask}
                    />
                    <StatusColumn
                        title="In Progress"
                        status="in_progress" // Backend likely uses 'in_progress' or 'doing'
                        tasks={tasks}
                        icon={Clock}
                        color="text-blue-500"
                        onAddTask={handleAddTask}
                    />
                    <StatusColumn
                        title="Completed"
                        status="completed" // Backend likely uses 'completed' or 'done'
                        tasks={tasks}
                        icon={CheckCircle}
                        color="text-green-500"
                        onAddTask={handleAddTask}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProjects;
