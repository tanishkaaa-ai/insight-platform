import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskTransitionModal from '../components/TaskTransitionModal';
import { Map, Plus, MoreHorizontal, CheckCircle, Clock, Circle, Loader2, AlertCircle, Target, ChevronDown, Trophy, Star, Award, Zap, ArrowRightCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { projectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const StatusColumn = ({ title, status, tasks, icon: Icon, color, onAddTask, onMoveTask, onDropTask }) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const columnTasks = safeTasks.filter(t => t.status === status);

    const handleDragStart = (e, task) => {
        e.dataTransfer.setData('taskId', task.task_id || task._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onDropTask(taskId, status);
        }
    };

    return (
        <div
            className="flex flex-col h-full bg-slate-50 rounded-2xl p-4 border border-slate-200 transition-colors hover:bg-slate-100"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Icon size={18} className={color} /> {title}
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs border border-gray-200">{columnTasks.length}</span>
                </h3>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10">
                {columnTasks.map((task) => (
                    <motion.div
                        key={task.task_id || task._id}
                        layoutId={task.task_id || task._id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, task)}
                        whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group relative cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors"
                    >
                        {/* Always Visible Move Button */}
                        {status !== 'completed' && (
                            <div className="absolute top-3 right-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveTask(task, status === 'todo' ? 'in_progress' : 'completed');
                                    }}
                                    className={`p-1.5 rounded-full text-white shadow-md transition-transform hover:scale-110 flex items-center justify-center
                                        ${status === 'todo' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}`}
                                    title={status === 'todo' ? "Start Task" : "Complete Task"}
                                >
                                    {status === 'todo' ? <ArrowRightCircle size={16} /> : <CheckCircle2 size={16} />}
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2 pr-8">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-opacity-20 
                ${task.priority === 'high' ? 'bg-red-500 text-red-700' : 'bg-blue-500 text-blue-700'}`}>
                                {task.priority || 'medium'}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-2">{task.title}</h4>

                        {/* Description / Summary Preview */}
                        {(task.description || task.completion_summary) && (
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                                {status === 'completed'
                                    ? (task.completion_summary || task.description || 'No summary provided')
                                    : (task.description || 'No description provided')}
                            </p>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-orange-600">
                                    {(task.assignee_name && task.assignee_name[0]) || '?'}
                                </div>
                                <span className="text-xs font-bold text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px]">
                                    {task.assignee_name || 'Unassigned'}
                                </span>
                            </div>
                            {task.tentative_completion_date && status === 'in_progress' && (
                                <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    <Clock size={10} />
                                    {new Date(task.tentative_completion_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
                {columnTasks.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm italic">
                        Drop tasks here
                    </div>
                )}
            </div>

            {status === 'todo' && (
                <button
                    onClick={() => onAddTask(status)}
                    className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all text-sm font-bold"
                >
                    <Plus size={16} /> Add Task
                </button>
            )}
        </div>
    );
};



const UploadModal = ({ onClose, projectId, teamId, studentId }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deliverableType, setDeliverableType] = useState('final_report');
    const [description, setDescription] = useState('');

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        try {
            // In a real app, we would upload to S3/Cloudinary here.
            // For this MVP, we'll pretend we got a URL back.
            const fakeFileUrl = `https://storage.googleapis.com/amep-projects/${projectId}/${file.name}`;

            await projectsAPI.submitDeliverable(projectId, {
                team_id: teamId,
                submitted_by: studentId,
                deliverable_type: deliverableType,
                file_url: fakeFileUrl,
                title: file.name,
                description: description || 'Student uploaded deliverable'
            });

            toast.success("Deliverable uploaded successfully!");
            onClose();
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload deliverable");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6"
            >
                <h3 className="font-bold text-xl text-gray-800 mb-4">Upload Project Deliverable</h3>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Deliverable Type</label>
                        <select
                            value={deliverableType}
                            onChange={(e) => setDeliverableType(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="final_report">Final Report</option>
                            <option value="prototype">Prototype / Demo</option>
                            <option value="presentation">Presentation Slides</option>
                            <option value="research">Research Findings</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe what you are uploading..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer block">
                            {file ? (
                                <div className="text-blue-600 font-bold flex items-center justify-center gap-2">
                                    <CheckCircle size={20} /> {file.name}
                                </div>
                            ) : (
                                <>
                                    <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                                        <Plus size={20} />
                                    </div>
                                    <span className="text-gray-500 font-medium text-sm">Click to select file</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {uploading ? <Loader2 className="animate-spin" /> : 'Upload'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const AchievementsModal = ({ onClose, achievements = [] }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-yellow-50 to-orange-50">
                    <h3 className="font-bold text-xl text-yellow-800 flex items-center gap-2">
                        <Trophy className="text-yellow-600" /> Team Achievements
                    </h3>
                    <button onClick={onClose}><AlertCircle className="rotate-45" size={24} /></button>
                </div>
                <div className="p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {achievements.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-gray-400">
                            <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No achievements unlocked yet. Keep working!</p>
                        </div>
                    ) : (
                        achievements.map((achievement) => (
                            <motion.div
                                key={achievement.achievement_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border-2 border-yellow-100 rounded-xl p-4 flex items-center gap-4 shadow-sm"
                            >
                                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">
                                    {achievement.icon || '🏆'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{achievement.name}</h4>
                                    <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-1">
                                        <Zap size={10} /> {achievement.xp} XP
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Unlocked {new Date(achievement.earned_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600">Close</button>
                </div>
            </motion.div>
        </div>
    );
};

const StudentProjects = () => {
    const { getUserId } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [activeTeam, setActiveTeam] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showUpload, setShowUpload] = useState(false);
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);

    // Gamification State
    const [teamProgress, setTeamProgress] = useState(null);
    const [achievements, setAchievements] = useState([]);

    // Task Creation
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTaskStatus, setNewTaskStatus] = useState('todo');

    // Task Transition
    const [transitionTask, setTransitionTask] = useState(null);
    const [targetStatus, setTargetStatus] = useState(null);

    const STUDENT_ID = getUserId();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.info('[STUDENT_PROJECTS] Fetching student teams:', { student_id: STUDENT_ID });

                const teamsRes = await projectsAPI.getStudentTeams(STUDENT_ID);
                const teamsData = teamsRes.data.teams || [];
                console.info('[STUDENT_PROJECTS] Teams retrieved:', { count: teamsData.length, teams: teamsData });

                setTeams(teamsData);

                if (teamsData.length > 0) {
                    const firstTeam = teamsData[0];
                    // We'll fetch full details in a separate effect or function when activeTeam (firstTeam) is set
                    setActiveTeam(firstTeam);
                } else {
                    console.warn('[STUDENT_PROJECTS] No teams found for student:', { student_id: STUDENT_ID });
                    setTasks([]);
                }

            } catch (err) {
                console.error("[STUDENT_PROJECTS] Error fetching projects:", {
                    error: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    student_id: STUDENT_ID
                });
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

    useEffect(() => {
        const fetchTeamData = async () => {
            if (!activeTeam) {
                setTasks([]);
                return;
            }

            try {
                // Fetch full team details to get members if not already populated
                if (!activeTeam.members) {
                    const fullTeamRes = await projectsAPI.getTeam(activeTeam.team_id || activeTeam._id);
                    if (fullTeamRes.data) {
                        setActiveTeam(prev => ({ ...prev, ...fullTeamRes.data }));
                    }
                }

                const tasksRes = await projectsAPI.getTeamTasks(activeTeam.team_id || activeTeam._id);
                setTasks(Array.isArray(tasksRes.data?.tasks) ? tasksRes.data.tasks : (Array.isArray(tasksRes.data) ? tasksRes.data : []));

                // Fetch Gamification Data
                const [progressRes, achievementsRes] = await Promise.allSettled([
                    projectsAPI.getTeamProgress(activeTeam.team_id || activeTeam._id),
                    projectsAPI.getTeamAchievements(activeTeam.team_id || activeTeam._id)
                ]);

                if (progressRes.status === 'fulfilled') setTeamProgress(progressRes.value.data);
                if (achievementsRes.status === 'fulfilled') setAchievements(achievementsRes.value.data.achievements || []);

            } catch (err) {
                console.error('[STUDENT_PROJECTS] Error fetching team data:', err);
                setTasks([]);
            }
        };

        fetchTeamData();
    }, [activeTeam?.team_id, activeTeam?._id]);

    const handleAddTask = (status = 'todo') => {
        if (!activeTeam) return;
        setNewTaskStatus(status);
        setShowTaskModal(true);
    };

    const handleTaskCreated = async () => {
        // Refresh tasks
        if (activeTeam) {
            const tasksRes = await projectsAPI.getTeamTasks(activeTeam.team_id || activeTeam._id);
            setTasks(Array.isArray(tasksRes.data?.tasks) ? tasksRes.data.tasks : (Array.isArray(tasksRes.data) ? tasksRes.data : []));
        }
    };

    const handleMoveTask = (task, nextStatus) => {
        setTransitionTask(task);
        setTargetStatus(nextStatus);
    };

    const handleConfirmTransition = async (taskId, updateData) => {
        try {
            await projectsAPI.updateTask(taskId, updateData);

            // Optimistic Update
            setTasks(prev => prev.map(t =>
                (t.task_id === taskId || t._id === taskId)
                    ? { ...t, ...updateData }
                    : t
            ));

            toast.success(`Task moved to ${updateData.status === 'in_progress' ? 'In Action' : 'Completed'}`);

            // Check for achievements/gamification updates (could refresh team data here)
            handleTaskCreated(); // Reuse refresh logic

        } catch (error) {
            console.error("Failed to update task", error);
            toast.error("Failed to move task");
        }
    };

    const handleDropTask = (taskId, newStatus) => {
        const task = tasks.find(t => (t.task_id === taskId || t._id === taskId));
        if (task && task.status !== newStatus) {
            handleMoveTask(task, newStatus);
        }
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
                    <div className="flex-1 mr-8">
                        {teams.length > 1 ? (
                            <div className="relative">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Switch Project</label>
                                <button
                                    onClick={() => setShowProjectMenu(!showProjectMenu)}
                                    className="group flex items-center gap-2 text-3xl font-extrabold text-gray-800 hover:text-blue-600 transition-colors focus:outline-none"
                                >
                                    <Map className="text-blue-500" />
                                    {activeTeam.project_title || activeTeam.project_name || 'Project Workspace'}
                                    <ChevronDown size={24} className={`text-gray-400 transition-transform duration-200 ${showProjectMenu ? 'rotate-180' : ''} group-hover:text-blue-500`} />
                                </button>

                                {showProjectMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowProjectMenu(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20"
                                        >
                                            <div className="text-xs font-bold text-gray-400 px-3 py-2 uppercase tracking-wider border-b border-gray-50 mb-1">Select Project</div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {teams.map(t => (
                                                    <button
                                                        key={t.team_id || t._id}
                                                        onClick={() => {
                                                            setActiveTeam(t);
                                                            setShowProjectMenu(false);
                                                        }}
                                                        className={`w-full text-left p-3 rounded-xl transition-colors flex flex-col mb-1 ${(activeTeam.team_id || activeTeam._id) === (t.team_id || t._id)
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'hover:bg-gray-50 text-gray-700'
                                                            }`}
                                                    >
                                                        <span className="font-bold text-sm block truncate">{t.project_title || t.project_name || 'Project'}</span>
                                                        <span className="text-xs opacity-70 block truncate">Team: {t.team_name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                                <Map className="text-blue-500" /> {activeTeam.project_title || activeTeam.project_name || 'Project Workspace'}
                            </h1>
                        )}

                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-500">CURRENT TEAM</span>
                            <span className="font-bold text-gray-700">{activeTeam.team_name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {/* Mock Avatars for Team Members */}
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">?</div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowAchievements(true)}
                            className="bg-white border-2 border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl font-bold hover:bg-yellow-50 transition-colors flex items-center gap-2"
                        >
                            <Trophy size={18} />
                            {teamProgress ? `Lvl ${teamProgress.current_level}` : 'Achievements'}
                        </button>
                        <button
                            onClick={() => navigate('/student/milestones', {
                                state: {
                                    selectedTeamId: activeTeam.team_id || activeTeam._id,
                                    selectedProjectId: activeTeam.project_id
                                }
                            })}
                            className="bg-white border-2 border-blue-200 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                            <Target size={18} /> Milestones
                        </button>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="bg-white border-2 border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                        >
                            Upload
                        </button>
                        <button
                            onClick={() => navigate('/student/peer-review')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Review
                        </button>
                    </div>
                </div>

                {/* Team XP Progress Bar */}
                {teamProgress && (
                    <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl border-4 border-white shadow-sm">
                            {teamProgress.current_level}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                                <span className="text-gray-500">Team Experience</span>
                                <span className="text-yellow-600">{teamProgress.total_xp} XP</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((teamProgress.completion_percentage || 0), 100)}%` }} // Using completion % as proxy for level progress for MVP
                                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                                />
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next Level</div>
                            <div className="font-bold text-gray-700">1000 XP</div>
                        </div>
                    </div>
                )}

                {/* Kanban Board */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-2">
                    <StatusColumn
                        title="To Do"
                        status="todo"
                        tasks={tasks}
                        icon={Circle}
                        color="text-gray-400"
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                        onDropTask={handleDropTask}
                    />
                    <StatusColumn
                        title="In Progress"
                        status="in_progress" // Backend likely uses 'in_progress' or 'doing'
                        tasks={tasks}
                        icon={Clock}
                        color="text-blue-500"
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                        onDropTask={handleDropTask}
                    />
                    <StatusColumn
                        title="Completed"
                        status="completed" // Backend likely uses 'completed' or 'done'
                        tasks={tasks}
                        icon={CheckCircle}
                        color="text-green-500"
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                        onDropTask={handleDropTask}
                    />
                </div>
            </div>

            {/* {showPeerReview && <PeerReviewModal team={activeTeam} onClose={() => setShowPeerReview(false)} currentUserId={STUDENT_ID} />} - Removed in favor of dedicated page */}
            {showAchievements && <AchievementsModal achievements={achievements} onClose={() => setShowAchievements(false)} />}
            {
                showUpload && <UploadModal
                    onClose={() => setShowUpload(false)}
                    projectId={activeTeam.project_id}
                    teamId={activeTeam.team_id || activeTeam._id}
                    studentId={STUDENT_ID}
                />
            }

            <CreateTaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onTaskCreated={handleTaskCreated}
                teamId={activeTeam?.team_id || activeTeam?._id}
                initialStatus={newTaskStatus}
                members={activeTeam?.members || []}
            />

            <TaskTransitionModal
                isOpen={!!transitionTask}
                onClose={() => { setTransitionTask(null); setTargetStatus(null); }}
                task={transitionTask}
                targetStatus={targetStatus}
                onConfirm={handleConfirmTransition}
            />

        </DashboardLayout >
    );
};

export default StudentProjects;
