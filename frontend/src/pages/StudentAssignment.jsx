import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, Clock, FileText, Upload, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { classroomAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const StudentAssignment = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [submissionText, setSubmissionText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const response = await classroomAPI.getAssignment(assignmentId);
                setAssignment(response.data);
                if (response.data.current_user_submission) {
                    const status = response.data.current_user_submission.status;
                    if (['turned_in', 'graded', 'returned'].includes(status)) setSubmitted(true);
                    setSubmissionText(response.data.current_user_submission.submission_text || '');
                }
            } catch (err) {
                setError("Failed to load assignment details.");
            } finally {
                setLoading(false);
            }
        };
        if (assignmentId) fetchAssignment();
    }, [assignmentId]);

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
            const res = await fetch(`${apiBaseUrl}/api/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            return data.file_url;
        } catch (e) {
            console.error("Upload error:", e);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!submissionText.trim() && !attachment) return;
        try {
            setSubmitting(true);
            let attachmentUrl = null;
            if (attachment) {
                attachmentUrl = await uploadFile(attachment);
                if (!attachmentUrl) throw new Error("Failed to upload file");
            }
            const attachments = attachmentUrl ? [{ type: 'file', url: attachmentUrl, name: attachment.name }] : [];
            await classroomAPI.submitAssignment(assignmentId, {
                student_id: user?.user_id || user?.id,
                submission_text: submissionText,
                attachments
            });
            setSubmitted(true);
            setTimeout(() => navigate('/student/classes'), 2000);
        } catch (err) {
            console.error("Submission error:", err);
            setError("Failed to submit assignment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center h-96">
                    <Loader2 className="animate-spin text-orange-500" size={48} />
                </motion.div>
            </DashboardLayout>
        );
    }

    if (error || !assignment) {
        return (
            <DashboardLayout>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-96">
                    <AlertCircle className="text-red-500 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">{error || "Assignment not found"}</p>
                    <button onClick={() => navigate(-1)} className="text-blue-500 hover:underline font-bold">Go Back</button>
                </motion.div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">
                <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-800 transition-colors group">
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Class
                </motion.button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-3xl font-bold text-gray-800">{assignment.title}</h1>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                {assignment.points ? `${assignment.points} Points` : 'Ungraded'}
                            </span>
                        </div>
                        <div className="flex items-center text-gray-500 gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No Due Date'}
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText size={16} />
                                {assignment.type || 'Assignment'}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 mb-4">Instructions</h3>
                                <div className="prose text-gray-600 whitespace-pre-wrap">
                                    {assignment.content || assignment.description || "No instructions provided."}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl h-fit border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-4">Your Work</h3>
                            <AnimatePresence mode="wait">
                                {submitted ? (
                                    <motion.div key="submitted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {assignment.current_user_submission && (assignment.current_user_submission.status === 'returned' || assignment.current_user_submission.grade != null) && (
                                            <div className="mb-6 border-b border-gray-200 pb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-bold text-gray-800 text-lg">Grade & Feedback</h4>
                                                    <span className="text-2xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                                                        {assignment.current_user_submission?.grade || 0} <span className="text-sm text-green-400 font-normal">/ {assignment.points || 100}</span>
                                                    </span>
                                                </div>
                                                {assignment.current_user_submission?.teacher_feedback ? (
                                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                        <p className="text-sm font-bold text-blue-800 mb-1">Teacher Feedback:</p>
                                                        <p className="text-blue-700">{assignment.current_user_submission.teacher_feedback}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 italic text-sm">No written feedback provided</p>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mb-4">
                                            <CheckCircle className="text-green-500" size={24} />
                                            <div>
                                                <h4 className="font-bold text-gray-800">Assignment Submitted</h4>
                                                <p className="text-sm text-gray-500">
                                                    {assignment.current_user_submission?.submitted_at ? new Date(assignment.current_user_submission.submitted_at).toLocaleString() : 'Submitted'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Answer</p>
                                            <div className="p-4 bg-white rounded-xl text-gray-700 border border-gray-200 whitespace-pre-wrap">
                                                {submissionText}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Text Response</label>
                                            <textarea value={submissionText} onChange={(e) => setSubmissionText(e.target.value)}
                                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[150px] resize-none outline-none transition-all"
                                                placeholder="Type your answer here..." />
                                        </div>

                                        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${attachment ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                            <input type="file" id="file-upload" className="hidden" onChange={(e) => setAttachment(e.target.files[0])} />
                                            <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                                                {attachment ? (
                                                    <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                                                        <CheckCircle size={20} />
                                                        {attachment.name}
                                                        <button onClick={(e) => { e.preventDefault(); setAttachment(null); }} className="ml-2 text-red-500 hover:text-red-700">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                                                        <p className="text-sm font-medium text-gray-600">Click to upload a file</p>
                                                        <p className="text-xs text-gray-400 mt-1">PDF, DOCX, Images supported</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>

                                        <button type="submit" disabled={submitting || !submissionText.trim()}
                                            className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm">
                                            {submitting ? <><Loader2 className="animate-spin" size={20} />Submitting...</> : 'Turn In'}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default StudentAssignment;
