import React, { useState, useEffect } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI, projectsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { CheckCircle, Clock, FileText, Award, Folder, Download, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherProjectGrading = () => {
    const { getUserId } = useAuth();
    const [deliverables, setDeliverables] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGradingItems = async () => {
            try {
                setLoading(true);
                const teacherId = getUserId();

                // 1. Get all teacher's classrooms
                const classroomsRes = await classroomAPI.getTeacherClasses(teacherId);
                const classrooms = classroomsRes.data;

                // 2. Get projects for each classroom
                let allItems = [];

                const projectPromises = classrooms.map(async (classroom) => {
                    try {
                        const projectsRes = await projectsAPI.getClassroomProjects(classroom.classroom_id);
                        const projects = projectsRes.data.projects || [];

                        // 3. Get deliverables AND milestones for each project
                        const itemPromises = projects.map(async (project) => {
                            try {
                                const [deliverablesRes, milestonesRes] = await Promise.all([
                                    projectsAPI.getProjectDeliverables(project.project_id),
                                    projectsAPI.getProjectMilestones(project.project_id)
                                ]);

                                const projDeliverables = (deliverablesRes.data || []).map(d => ({
                                    ...d,
                                    type: 'deliverable',
                                    project_title: project.title,
                                    classroom_name: classroom.class_name,
                                    item_id: d.deliverable_id,
                                    submitted_at: d.submitted_at || new Date().toISOString() // Fallback
                                }));

                                const projMilestones = (milestonesRes.data || [])
                                    .filter(m => m.pending_approval || m.is_completed) // Only show relevant ones
                                    .map(m => ({
                                        ...m,
                                        type: 'milestone',
                                        project_title: project.title,
                                        classroom_name: classroom.class_name,
                                        item_id: m.milestone_id,
                                        title: `Milestone: ${m.title}`,
                                        submitted_at: m.submitted_at || m.completed_at || new Date().toISOString(),
                                        graded: m.is_completed, // Map completed to graded concept for filtering
                                        grade: m.is_completed ? 'Approved' : null,
                                        file_url: m.report_url || m.zip_url // Prefer report, fallback to zip
                                    }));

                                return [...projDeliverables, ...projMilestones];
                            } catch (e) {
                                console.warn(`Failed to fetch items for project ${project.project_id}`, e);
                                return [];
                            }
                        });

                        const projectItems = await Promise.all(itemPromises);
                        return projectItems.flat();
                    } catch (e) {
                        return [];
                    }
                });

                const results = await Promise.all(projectPromises);
                allItems = results.flat();

                // Sort by submission date (newest first)
                allItems.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

                setDeliverables(allItems);

            } catch (error) {
                console.error("Error fetching grading items:", error);
                toast.error("Failed to load grading items");
            } finally {
                setLoading(false);
            }
        };

        if (getUserId()) {
            fetchGradingItems();
        }
    }, [getUserId]);

    const handleGrade = async (item) => {
        const grade = window.prompt("Enter grade (0-100):");
        if (grade === null) return;

        const numGrade = parseInt(grade);
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
            toast.error("Please enter a valid number between 0 and 100");
            return;
        }

        const feedback = window.prompt("Enter feedback (optional):", "Good job!");

        try {
            await projectsAPI.updateDeliverableGrade(item.deliverable_id, {
                grade: numGrade,
                feedback: feedback || ''
            });

            toast.success("Grade submitted successfully!");

            // Update local state
            setDeliverables(prev => prev.map(d =>
                d.item_id === item.item_id
                    ? { ...d, graded: true, grade: numGrade, feedback }
                    : d
            ));
        } catch (error) {
            console.error("Grading failed", error);
            toast.error("Failed to submit grade");
        }
    };

    const handleApprove = async (item) => {
        const feedback = window.prompt("Enter approval feedback (optional):", "Great work!");
        if (feedback === null) return;

        try {
            await projectsAPI.approveMilestone(item.project_id, item.milestone_id, {
                teacher_id: getUserId(),
                feedback: feedback || ''
            });

            toast.success("Milestone approved!");

            setDeliverables(prev => prev.map(d =>
                d.item_id === item.item_id
                    ? { ...d, graded: true, grade: 'Approved', teacher_feedback: feedback }
                    : d
            ));
        } catch (error) {
            console.error("Approval failed", error);
            toast.error("Failed to approve milestone");
        }
    };

    const handleReject = async (item) => {
        const reason = window.prompt("Reason for rejection:", "Missing requirements");
        if (!reason) return;

        try {
            await projectsAPI.rejectMilestone(item.project_id, item.milestone_id, {
                teacher_id: getUserId(),
                reason: reason,
                feedback: reason
            });

            toast.error("Milestone rejected"); // Info toast really

            // Remove from list or mark as rejected? usually remove from pending
            setDeliverables(prev => prev.filter(d => d.item_id !== item.item_id));
        } catch (error) {
            console.error("Rejection failed", error);
            toast.error("Failed to reject milestone");
        }
    };

    if (loading) return (
        <TeacherLayout>
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        </TeacherLayout>
    );

    const pendingItems = deliverables.filter(d => !d.graded);
    const gradedItems = deliverables.filter(d => d.graded);

    return (
        <TeacherLayout>
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <Award className="text-indigo-600" size={32} />
                        Grading Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2">Evaluate and grade student project deliverables & milestones.</p>
                </div>

                {/* Pending Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-orange-500" /> Pending Review ({pendingItems.length})
                    </h2>

                    {pendingItems.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                            No pending items to review.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {pendingItems.map(item => (
                                    <GradingCard
                                        key={item.item_id}
                                        item={item}
                                        onGrade={handleGrade}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div>
                    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-500" /> Recent History
                    </h2>
                    <div className="grid gap-4 opacity-75">
                        {gradedItems.slice(0, 5).map(item => (
                            <GradingCard key={item.item_id} item={item} readOnly />
                        ))}
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
};

const GradingCard = ({ item, onGrade, onApprove, onReject, readOnly = false }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6"
    >
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${item.type === 'milestone' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                    {item.type === 'milestone' ? 'Milestone' : item.deliverable_type?.replace('_', ' ') || 'Deliverable'}
                </span>
                <span className="text-sm text-gray-400">
                    • Submitted {new Date(item.submitted_at).toLocaleDateString()}
                </span>
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h3>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Folder size={14} /> {item.project_title}</span>
                <span className="flex items-center gap-1">Class: {item.classroom_name}</span>
                {item.team_name && <span className="flex items-center gap-1 font-medium text-gray-700">Team: {item.team_name}</span>}
            </div>

            {item.description && (
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm mb-4 italic">
                    "{item.description}"
                </p>
            )}

            {item.submission_notes && (
                <div className="text-gray-600 bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-sm mb-4">
                    <span className="font-bold text-yellow-700 block text-xs mb-1">Student Notes:</span>
                    {item.submission_notes}
                </div>
            )}

            <div className="flex gap-2">
                {item.report_url && (
                    <a
                        href={item.report_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg"
                    >
                        <FileText size={16} /> View Report
                    </a>
                )}
                {item.zip_url && (
                    <a
                        href={item.zip_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-800 hover:underline bg-gray-100 px-3 py-1.5 rounded-lg"
                    >
                        <Download size={16} /> Download Files
                    </a>
                )}
                {item.file_url && !item.report_url && !item.zip_url && (
                    <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg"
                    >
                        <Download size={16} /> Download Attachment
                    </a>
                )}
            </div>
        </div>

        <div className="flex flex-col items-end min-w-[150px] justify-center">
            {readOnly ? (
                <div className="text-right">
                    <div className="text-xl font-extrabold text-green-600">{item.grade}</div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</div>
                </div>
            ) : (
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    {item.type === 'milestone' ? (
                        <>
                            <button
                                onClick={() => onApprove(item)}
                                className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <ThumbsUp size={18} /> Approve
                            </button>
                            <button
                                onClick={() => onReject(item)}
                                className="px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <ThumbsDown size={18} /> Reject
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => onGrade(item)}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                        >
                            <Award size={18} /> Grade
                        </button>
                    )}
                </div>
            )}
        </div>
    </motion.div>
);

export default TeacherProjectGrading;
