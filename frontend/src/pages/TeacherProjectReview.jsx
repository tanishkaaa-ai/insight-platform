import React, { useState, useEffect } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI, projectsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, AlertTriangle, MessageSquare, FileText, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherProjectReview = () => {
    const { getUserId } = useAuth();
    const [pendingMilestones, setPendingMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPendingMilestones = async () => {
            try {
                setLoading(true);
                const teacherId = getUserId();
                console.info('[TEACHER_REVIEW] Fetching pending milestones for teacher:', teacherId);

                // 1. Get all teacher's classrooms
                const classroomsRes = await classroomAPI.getTeacherClasses(teacherId);
                const classrooms = classroomsRes.data;

                // 2. Get projects for each classroom
                let allPending = [];

                // Using Promise.all for parallel fetching
                const projectPromises = classrooms.map(async (classroom) => {
                    try {
                        const projectsRes = await projectsAPI.getClassroomProjects(classroom.classroom_id);
                        const projects = projectsRes.data.projects || [];

                        // 3. Get milestones AND project details (for team names) for each project
                        const milestonePromises = projects.map(async (project) => {
                            try {
                                const [milestonesRes, detailsRes] = await Promise.all([
                                    projectsAPI.getProjectMilestones(project.project_id),
                                    projectsAPI.getProjectDetails(project.project_id)
                                ]);

                                const milestones = milestonesRes.data || [];
                                const teams = detailsRes.data.teams || [];
                                const teamMap = teams.reduce((acc, t) => ({ ...acc, [t.team_id]: t.team_name }), {});

                                // Filter for pending approval
                                const pending = milestones.filter(m => m.pending_approval);

                                // Enrich with project context
                                return pending.map(m => ({
                                    ...m,
                                    team_name: teamMap[m.submitted_by_team] || 'Unknown Team',
                                    project: {
                                        project_id: project.project_id,
                                        title: project.title,
                                        classroom_name: classroom.class_name
                                    }
                                }));
                            } catch (e) {
                                console.warn(`Failed to fetch milestones for project ${project.project_id}`, e);
                                return [];
                            }
                        });

                        const projectMilestones = await Promise.all(milestonePromises);
                        return projectMilestones.flat();
                    } catch (e) {
                        console.warn(`Failed to fetch projects for classroom ${classroom.classroom_id}`, e);
                        return [];
                    }
                });

                const results = await Promise.all(projectPromises);
                allPending = results.flat();

                setPendingMilestones(allPending);
                console.info('[TEACHER_REVIEW] Found pending milestones:', allPending.length);

            } catch (error) {
                console.error('[TEACHER_REVIEW] Error fetching reviews:', error);
                toast.error("Failed to load pending reviews");
            } finally {
                setLoading(false);
            }
        };

        if (getUserId()) {
            fetchPendingMilestones();
        }
    }, [getUserId]);

    const handleApprove = async (milestone) => {
        const feedback = window.prompt("Enter approval feedback (optional):", "Great work!");
        if (feedback === null) return; // Cancelled

        try {
            await projectsAPI.approveMilestone(milestone.project.project_id, milestone.milestone_id, {
                teacher_id: getUserId(),
                feedback
            });

            toast.success("Milestone approved successfully!");
            setPendingMilestones(prev => prev.filter(m => m.milestone_id !== milestone.milestone_id));
        } catch (error) {
            console.error("Approval failed", error);
            toast.error("Failed to approve milestone");
        }
    };

    const handleReject = async (milestone) => {
        const reason = window.prompt("Enter reason for rejection (required):");
        if (!reason) return;

        try {
            await projectsAPI.rejectMilestone(milestone.project.project_id, milestone.milestone_id, {
                teacher_id: getUserId(),
                reason,
                feedback: reason
            });

            toast.success("Milestone rejected.");
            setPendingMilestones(prev => prev.filter(m => m.milestone_id !== milestone.milestone_id));
        } catch (error) {
            console.error("Rejection failed", error);
            toast.error("Failed to reject milestone");
        }
    };

    if (loading) return (
        <TeacherLayout>
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        </TeacherLayout>
    );

    return (
        <TeacherLayout>
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <CheckCircle className="text-green-600" size={32} />
                        Project Approvals
                    </h1>
                    <p className="text-gray-500 mt-2">Review and approve student team milestones to verify progress.</p>
                </div>

                <div className="max-w-5xl mx-auto">
                    {pendingMilestones.length === 0 ? (
                        <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
                            <CheckCircle size={64} className="mx-auto text-green-100 mb-6" />
                            <h3 className="text-xl font-bold text-gray-800">All Caught Up!</h3>
                            <p className="text-gray-500 mt-2">There are no pending milestones awaiting your review.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            <AnimatePresence>
                                {pendingMilestones.map((milestone) => (
                                    <motion.div
                                        key={milestone.milestone_id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                        <Clock size={12} /> Pending Review
                                                    </span>
                                                    <span className="text-sm text-gray-400 font-medium">
                                                        Team: <span className="text-gray-600 font-bold">{milestone.team_name}</span>
                                                    </span>
                                                </div>

                                                <h3 className="text-xl font-bold text-gray-800 mb-1">{milestone.title}</h3>
                                                <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-2">
                                                    Project: <span className="text-gray-700">{milestone.project.title}</span>
                                                    <span className="text-gray-300">•</span>
                                                    Class: <span className="text-gray-700">{milestone.project.classroom_name}</span>
                                                </p>

                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <MessageSquare size={12} /> Submission Notes
                                                    </h4>
                                                    <p className="text-gray-700 italic">"{milestone.submission_notes || 'No notes provided'}"</p>

                                                    <div className="mt-2 text-xs text-gray-400">
                                                        Submitted: {milestone.submitted_at ? new Date(milestone.submitted_at).toLocaleString() : 'Unknown date'}
                                                    </div>
                                                </div>

                                                {(milestone.report_url || milestone.zip_url) && (
                                                    <div className="flex gap-3 mt-4">
                                                        {milestone.report_url && (
                                                            <a
                                                                href={`http://127.0.0.1:5000${milestone.report_url}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors border border-red-100"
                                                            >
                                                                <FileText size={16} /> Report PDF
                                                            </a>
                                                        )}
                                                        {milestone.zip_url && (
                                                            <a
                                                                href={`http://127.0.0.1:5000${milestone.zip_url}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                                                            >
                                                                <Code size={16} /> Code ZIP
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col justify-center gap-3 md:min-w-[160px]">
                                                <button
                                                    onClick={() => handleApprove(milestone)}
                                                    className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <CheckCircle size={20} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(milestone)}
                                                    className="w-full py-3 bg-white border-2 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={20} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherProjectReview;
