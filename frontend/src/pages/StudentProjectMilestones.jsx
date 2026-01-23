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

                // Fetch milestones (Truth) and Progress (State) in parallel
                try {
                    const [milestonesRes, progressRes] = await Promise.allSettled([
                        projectsAPI.getProjectMilestones(currentTeam.project_id),
                        projectsAPI.getTeamProgress(currentTeam.team_id || currentTeam._id)
                    ]);

                    const projectMilestones = milestonesRes.status === 'fulfilled' ? (milestonesRes.value.data || []) : [];
                    const progress = progressRes.status === 'fulfilled' ? progressRes.value.data : null;

                    console.info('[STUDENT_MILESTONES] Data resources loaded:', {
                        milestones_found: projectMilestones.length,
                        progress_found: !!progress
                    });

                    // Merge Logic: Overlay progress status onto project milestones
                    const mergedMilestones = projectMilestones.map((m, index) => {
                        // Default state if no progress tracking
                        let isCompleted = false;
                        let isPending = false;
                        let isLocked = index > 0; // Lock everything except first by default

                        if (progress) {
                            // Find matching status in progress data
                            // Note: Progress usually returns lists of unlocked/locked, we can check IDs
                            const unlockedIds = (progress.unlocked_milestones || []).map(x => x.milestone_id);
                            const lockedIds = (progress.locked_milestones || []).map(x => x.milestone_id);

                            // Check explicit status on milestone object from progress if available, 
                            // OR infer from lists
                            const inUnlocked = unlockedIds.includes(m.milestone_id);

                            // If we have direct status from the milestone fetch:
                            if (m.is_completed) isCompleted = true;
                            if (m.pending_approval) isPending = true;

                            // Unlock logic
                            isLocked = !inUnlocked && !isCompleted && !isPending;

                            // Fallback: if progress tracks index
                            if (progress.current_milestone_index !== undefined) {
                                if (index <= progress.current_milestone_index) isLocked = false;
                                if (index < progress.milestones_completed) isCompleted = true;
                            }
                        }

                        return {
                            ...m,
                            is_completed: isCompleted,
                            pending_approval: isPending,
                            is_locked: isLocked
                        };
                    });

                    setMilestones(mergedMilestones);

                } catch (innerErr) {
                    console.error("Error creating merged view:", innerErr);
                    // Fallback to simple milestone list if merge fails
                    const res = await projectsAPI.getProjectMilestones(currentTeam.project_id);
                    setMilestones(res.data || []);
                }

            } catch (err) {
                console.error("Failed to load project milestones", err);
                setError("Failed to load project milestones");
            } finally {
                setLoading(false);
            }
        };

        fetchTeamAndMilestones();
    }, [getUserId]);

    // State for submission modal
    const [submittingId, setSubmittingId] = useState(null);
    const [submissionNotes, setSubmissionNotes] = useState('');
    const [reportFile, setReportFile] = useState(null);
    const [zipFile, setZipFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e, setFile) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Using fetch directly as api service wrapper might not support formData yet
            // Assuming base URL is same, or need to configure axios for multipart
            const res = await fetch('http://127.0.0.1:5000/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            return data.file_url;
        } catch (e) {
            console.error("Upload error:", e);
            toast.error(`Failed to upload ${file.name}`);
            return null;
        }
    };

    const handleSubmitMilestone = async () => {
        if (!submittingId) return;
        if (!submissionNotes) {
            toast.error("Please add some notes about your submission");
            return;
        }

        setIsUploading(true);
        try {
            console.info('[STUDENT_MILESTONES] Uploading files...');
            const reportUrl = await uploadFile(reportFile);
            const zipUrl = await uploadFile(zipFile);

            console.info('[STUDENT_MILESTONES] Submitting milestone:', {
                milestone_id: submittingId,
                team_id: team.team_id || team._id,
                report_url: reportUrl,
                zip_url: zipUrl
            });

            await projectsAPI.submitMilestone(team.project_id, submittingId, {
                team_id: team.team_id || team._id,
                notes: submissionNotes,
                report_url: reportUrl,
                zip_url: zipUrl
            });

            toast.success('Milestone submitted for approval!');

            // Cleanup
            setSubmittingId(null);
            setSubmissionNotes('');
            setReportFile(null);
            setZipFile(null);

            // Refresh milestones
            const progressRes = await projectsAPI.getTeamProgress(team.team_id || team._id);
            const progress = progressRes.data;
            const allMilestones = [
                ...(progress.unlocked_milestones || []),
                ...(progress.locked_milestones || [])
            ].sort((a, b) => a.order - b.order);
            // Re-trigger fetch or update local state logic would be here
            window.location.reload(); // Simple refresh for now to sync everything

        } catch (error) {
            console.error('[STUDENT_MILESTONES] Submit failed:', error);
            toast.error('Failed to submit milestone');
        } finally {
            setIsUploading(false);
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
                                                onClick={() => setSubmittingId(milestone.milestone_id)}
                                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                                            >
                                                <Send size={16} /> Submit Work
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

                {/* Submission Modal */}
                {submittingId && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl"
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Submit Milestone</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Submission Notes</label>
                                    <textarea
                                        value={submissionNotes}
                                        onChange={(e) => setSubmissionNotes(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Describe what you accomplished..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => handleFileSelect(e, setReportFile)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="pointer-events-none">
                                            <div className="bg-red-100 text-red-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <p className="text-sm font-bold text-gray-600">Project Report</p>
                                            <p className="text-xs text-gray-400">{reportFile ? reportFile.name : "Upload PDF"}</p>
                                        </div>
                                    </div>

                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                                        <input
                                            type="file"
                                            accept=".zip,.rar"
                                            onChange={(e) => handleFileSelect(e, setZipFile)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="pointer-events-none">
                                            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                            </div>
                                            <p className="text-sm font-bold text-gray-600">Project Code</p>
                                            <p className="text-xs text-gray-400">{zipFile ? zipFile.name : "Upload ZIP"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setSubmittingId(null)}
                                    className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitMilestone}
                                    disabled={isUploading}
                                    className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Submit Work'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentProjectMilestones;
