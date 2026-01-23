import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Target, Lock, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const StudentProjectMilestones = () => {
    const { getUserId } = useAuth();
    const [team, setTeam] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeamAndMilestones = async () => {
            try {
                const userId = getUserId();
                console.info('[STUDENT_MILESTONES] Fetching team data for user:', userId);

                const teamsRes = await projectsAPI.getStudentTeams(userId);
                const teams = teamsRes.data.teams || [];

                if (teams.length === 0) {
                    setLoading(false);
                    return;
                }

                const currentTeam = teams[0];
                setTeam(currentTeam);

                // Fetch team progress to get milestones status
                const progressRes = await projectsAPI.getTeamProgress(currentTeam.team_id || currentTeam._id);
                const progress = progressRes.data;

                // Merge unlocked/locked milestones if API returns them directly, 
                // OR fetch milestones separately and map progress
                // Let's assume progress endpoint returns full milestone info as per backend route logic
                const allMilestones = [
                    ...(progress.unlocked_milestones || []),
                    ...(progress.locked_milestones || [])
                ].sort((a, b) => a.order - b.order);

                setMilestones(allMilestones);

                console.info('[STUDENT_MILESTONES] Data loaded:', {
                    team_id: currentTeam.team_id,
                    milestone_count: allMilestones.length
                });

            } catch (err) {
                console.error("Failed to load project milestones", err);
                setError("Failed to load project milestones");
            } finally {
                setLoading(false);
            }
        };

        fetchTeamAndMilestones();
    }, [getUserId]);

    const handleSubmitMilestone = async (milestoneId) => {
        // Simple prompt for now, could be a modal
        const notes = window.prompt('Enter completion notes (e.g. "Completed research phase with 5 sources"):');
        if (!notes) return;

        try {
            console.info('[STUDENT_MILESTONES] Submitting milestone:', {
                milestone_id: milestoneId,
                team_id: team.team_id || team._id
            });

            await projectsAPI.submitMilestone(team.project_id, milestoneId, {
                team_id: team.team_id || team._id,
                notes
            });

            toast.success('Milestone submitted for approval!');
            console.info('[STUDENT_MILESTONES] Milestone submitted successfully');

            // Refresh milestones by reloading the page logic or re-fetching
            // For now, optimistic update or just reload would work
            // Let's reload data
            const progressRes = await projectsAPI.getTeamProgress(team.team_id || team._id);
            const progress = progressRes.data;
            const allMilestones = [
                ...(progress.unlocked_milestones || []),
                ...(progress.locked_milestones || [])
            ].sort((a, b) => a.order - b.order);
            setMilestones(allMilestones);

        } catch (error) {
            console.error('[STUDENT_MILESTONES] Submit failed:', error);
            toast.error('Failed to submit milestone');
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        </DashboardLayout>
    );

    if (!team) return (
        <DashboardLayout>
            <div className="p-8 text-center bg-gray-50 rounded-2xl mx-auto mt-10 max-w-2xl">
                <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Project Team</h2>
                <p className="text-gray-600">You must be assigned to a team to view milestones.</p>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <Target className="text-blue-600" size={32} />
                        Project Milestones
                    </h1>
                    <p className="text-gray-500 mt-2">Track your team's progress and submit milestones for approval to earn XP.</p>
                </div>

                <div className="space-y-6 max-w-4xl mx-auto">
                    {milestones.length === 0 ? (
                        <p className="text-gray-500 text-center">No milestones found for this project.</p>
                    ) : (
                        milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.milestone_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`border rounded-2xl p-6 shadow-sm transition-all
                                    ${milestone.is_completed ? 'bg-green-50 border-green-200' :
                                        milestone.pending_approval ? 'bg-yellow-50 border-yellow-200' :
                                            'bg-white border-gray-100 opacity-90'}`}
                            >
                                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2
                                                ${milestone.is_completed ? 'bg-green-100 border-green-500 text-green-700' :
                                                    milestone.pending_approval ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
                                                        'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                                {index + 1}
                                            </span>
                                            <h3 className="font-bold text-xl text-gray-800">{milestone.title}</h3>

                                            {milestone.is_completed && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Completed</span>}
                                            {milestone.pending_approval && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Pending Approval</span>}
                                            {!milestone.is_completed && !milestone.pending_approval && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><Lock size={12} /> In Progress</span>}
                                        </div>

                                        <div className="pl-11">
                                            {milestone.due_date && <p className="text-sm text-gray-500 flex items-center gap-2 mb-2"><Clock size={14} /> Due: {new Date(milestone.due_date).toLocaleDateString()}</p>}
                                            {milestone.description && <p className="text-gray-600 mb-2">{milestone.description}</p>}
                                        </div>
                                    </div>

                                    <div className="pl-11 md:pl-0">
                                        {!milestone.is_completed && !milestone.pending_approval && (
                                            <button
                                                onClick={() => handleSubmitMilestone(milestone.milestone_id)}
                                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                                            >
                                                <Send size={16} /> Submit for Approval
                                            </button>
                                        )}
                                        {milestone.pending_approval && (
                                            <span className="text-sm font-medium text-yellow-600 italic">Waiting for teacher review...</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProjectMilestones;
