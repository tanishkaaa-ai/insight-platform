
import React, { useState, useEffect } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI, projectsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { CheckCircle, Clock, FileText, Award, Folder, Download, ThumbsUp, ThumbsDown, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileAnnotator from '../components/FileAnnotator';

const TeacherProjectGrading = () => {
    const { getUserId } = useAuth();
    const [deliverables, setDeliverables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null); // Item being graded

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
                                        title: `Milestone: ${m.title} `,
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

    const handleGradeSubmit = async (grade, feedback, annotations) => {
        if (!selectedItem) return;

        try {
            await projectsAPI.updateDeliverableGrade(selectedItem.deliverable_id, {
                grade: parseInt(grade),
                feedback: feedback || '',
                annotations: annotations || []
            });

            toast.success("Grade submitted successfully!");

            // Update local state
            setDeliverables(prev => prev.map(d =>
                d.item_id === selectedItem.item_id
                    ? { ...d, graded: true, grade: parseInt(grade), feedback, annotations }
                    : d
            ));
            setSelectedItem(null);
        } catch (error) {
            console.error("Grading failed", error);
            toast.error("Failed to submit grade");
        }
    };

    const handleApprove = async (feedback, annotations) => {
        if (!selectedItem) return;

        try {
            await projectsAPI.approveMilestone(selectedItem.project_id, selectedItem.milestone_id, {
                teacher_id: getUserId(),
                feedback: feedback || '',
                annotations: annotations || []
            });

            toast.success("Milestone approved!");

            setDeliverables(prev => prev.map(d =>
                d.item_id === selectedItem.item_id
                    ? { ...d, graded: true, grade: 'Approved', teacher_feedback: feedback, annotations }
                    : d
            ));
            setSelectedItem(null);
        } catch (error) {
            console.error("Approval failed", error);
            toast.error("Failed to approve milestone");
        }
    };

    const handleReject = async (reason, annotations) => {
        if (!selectedItem) return;

        try {
            await projectsAPI.rejectMilestone(selectedItem.project_id, selectedItem.milestone_id, {
                teacher_id: getUserId(),
                reason: reason,
                feedback: reason,
                annotations: annotations || []
            });

            toast.success("Milestone rejected and returned to student"); // Info toast really

            // Remove from list or mark as rejected? usually remove from pending
            setDeliverables(prev => prev.filter(d => d.item_id !== selectedItem.item_id));
            setSelectedItem(null);
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
                    <h1 className="text-3xl font-extrabold text-[#065F46] flex items-center gap-3">
                        <Award className="text-[#065F46]" size={32} />
                        Grading Dashboard
                    </h1>
                    <p className="text-[#065F46]/70 mt-2">Evaluate and grade student project deliverables & milestones.</p>
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
                                        onReview={() => setSelectedItem(item)}
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

            {/* Grading Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <GradingModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        onGrade={handleGradeSubmit}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                )}
            </AnimatePresence>
        </TeacherLayout>
    );
};

// Simplified Card for list view
const GradingCard = ({ item, onReview, readOnly = false }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#F4FFFD] p-6 rounded-xl shadow-sm border-2 border-[#065F46]/20 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all"
    >
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                <span className={`text - xs font - bold px - 2 py - 1 rounded - md uppercase tracking - wider ${item.type === 'milestone' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-50 text-indigo-700'
                    } `}>
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
                    <span className="font-bold text-yellow-800 block text-xs mb-1">Student Notes:</span>
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
                <button
                    onClick={onReview}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                >
                    <Award size={18} /> Review & Grade
                </button>
            )}
        </div>
    </motion.div>
);

// New Split-Screen Grading Modal with Annotator
const GradingModal = ({ item, onClose, onGrade, onApprove, onReject }) => {
    const [score, setScore] = useState('');
    const [feedback, setFeedback] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [previewError, setPreviewError] = useState(false);
    const [annotations, setAnnotations] = useState(item.annotations || []);

    const fileUrl = item.report_url || item.file_url || item.zip_url;
    const isImage = fileUrl?.match(/\.(jpeg|jpg|gif|png)$/i);
    const isPdf = fileUrl?.match(/\.pdf$/i);
    const isZip = fileUrl?.match(/\.zip$/i);

    const handleSubmitGrade = () => {
        if (score === '' || score < 0 || score > 100) {
            toast.error("Please enter a valid grade (0-100)");
            return;
        }
        onGrade(score, feedback, annotations);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden"
            >
                {/* Left Panel: Preview/Annotator */}
                <div className="flex-1 bg-gray-100 border-r border-gray-200 relative flex flex-col">
                    <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <FileText size={18} /> Submission Preview
                        </h3>
                        {fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                                <ExternalLink size={14} /> Open in New Tab
                            </a>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                        {fileUrl && !previewError ? (
                            isImage ? (
                                <FileAnnotator
                                    fileUrl={fileUrl}
                                    initialAnnotations={annotations}
                                    onSave={(newAnnotations) => setAnnotations(newAnnotations)}
                                />
                            ) : isPdf ? (
                                <iframe src={`${fileUrl} #toolbar = 0`} className="w-full h-full rounded shadow-lg bg-white" title="PDF Preview" onError={() => setPreviewError(true)} />
                            ) : (
                                <div className="text-center">
                                    <div className="bg-white p-8 rounded-2xl shadow-sm inline-block mb-4">
                                        <Folder size={64} className="text-indigo-200 mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium mb-2">Preview not available for this file type</p>
                                        <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">Please download the file to view its contents.</p>
                                        <a href={fileUrl} download className="px-6 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-bold transition-colors inline-flex items-center gap-2">
                                            <Download size={18} /> Download File
                                        </a>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="text-center text-gray-400">
                                <FileText size={48} className="text-gray-300 mx-auto mb-2 opacity-50" />
                                <p>No file attached or preview failed</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Grading Controls */}
                <div className="w-[400px] bg-white flex flex-col h-full overflow-y-auto">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{item.title}</h2>
                                <p className="text-sm text-gray-500 mt-1">Submitted by</p>
                                <p className="font-medium text-indigo-600">{item.submission_notes ? "Student (See Notes)" : "Student"}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {item.submission_notes && (
                            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-sm text-gray-700">
                                <span className="block font-bold text-yellow-800 text-xs mb-1">Student Notes:</span>
                                {item.submission_notes}
                            </div>
                        )}
                    </div>

                    {/* Grading Form */}
                    <div className="p-6 flex-1">
                        {item.type === 'milestone' ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Feedback / Rejection Reason</label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Enter feedback for approval or reason for rejection..."
                                        className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onApprove(feedback, annotations)}
                                        className="py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex flex-col items-center justify-center gap-1"
                                    >
                                        <ThumbsUp size={20} />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!feedback) {
                                                toast.error("Please provide a reason for rejection");
                                                return;
                                            }
                                            onReject(feedback, annotations);
                                        }}
                                        className="py-3 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex flex-col items-center justify-center gap-1"
                                    >
                                        <ThumbsDown size={20} />
                                        Reject
                                    </button>
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    Feedback is required for rejection.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Grade (0-100)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={score}
                                            onChange={(e) => setScore(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-bold"
                                            placeholder="Enter score..."
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">/ 100</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Feedback (Optional)</label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Great job! Consider improving..."
                                        className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitGrade}
                                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                >
                                    <Award size={20} /> Submit Grade
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TeacherProjectGrading;

