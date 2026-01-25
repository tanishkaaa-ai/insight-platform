import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, Clock, FileText, Upload, CheckCircle, AlertCircle, Loader2, PenTool, ArrowRight } from 'lucide-react';
import { classroomAPI, engagementAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
                console.log("[StudentAssignment] Loaded assignment:", response.data.title);
                setAssignment(response.data);

                if (response.data.current_user_submission) {
                    const status = response.data.current_user_submission.status;
                    if (['turned_in', 'graded', 'returned'].includes(status)) {
                        setSubmitted(true);
                    }
                    setSubmissionText(response.data.current_user_submission.submission_text || '');
                }
            } catch (err) {
                setError("Failed to load assignment details.");
            } finally {
                setLoading(false);
            }
        };

        if (assignmentId) {
            fetchAssignment();
        }
    }, [assignmentId]);

    const uploadFile = async (file) => {
        console.log("[StudentAssignment] Uploading file:", file.name);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
            const res = await fetch(`${apiBaseUrl}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            console.log("[StudentAssignment] Upload success, URL:", data.file_url);
            console.log("[StudentAssignment] Full upload response:", data);
            return data.file_url;
        } catch (e) {
            console.error("Upload error:", e);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("[StudentAssignment] Submitting assignment...");
        if (!submissionText.trim() && !attachment) return;

        try {
            setSubmitting(true);
            let attachmentUrl = null;

            if (attachment) {
                attachmentUrl = await uploadFile(attachment);
                if (!attachmentUrl) {
                    throw new Error("Failed to upload file");
                }
            }

            const attachments = attachmentUrl ? [{
                type: 'file',
                url: attachmentUrl,
                name: attachment.name
            }] : [];

            await classroomAPI.submitAssignment(assignmentId, {
                student_id: user?.user_id || user?.id,
                submission_text: submissionText,
                attachments: attachments
            });
            console.log("[StudentAssignment] Submission payload:", {
                student_id: user?.user_id || user?.id,
                submission_text: submissionText,
                attachments: attachments
            });
            console.log("[StudentAssignment] Submission success");
            setSubmitted(true);

            // Trigger engagement update
            try {
                await engagementAPI.analyzeEngagement({ student_id: user?.user_id || user?.id });
            } catch (e) {
                console.error("Failed to update engagement stats", e);
            }

            setTimeout(() => {
                navigate('/student/classes');
            }, 2000);
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
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="animate-spin text-[#EAE0CF]" size={48} />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !assignment) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-96">
                    <AlertCircle className="text-red-400 mb-4" size={48} />
                    <p className="text-[#EAE0CF]/70">{error || "Assignment not found"}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-[#EAE0CF] hover:underline font-bold">
                        Go Back
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-[#EAE0CF]/60 hover:text-[#EAE0CF] mb-6 transition-colors font-medium"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Class
                </button>

                <div className="bg-[#547792] rounded-2xl shadow-sm border border-[#EAE0CF]/10 overflow-hidden">
                    <div className="p-8 border-b border-[#EAE0CF]/10">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
                            <span className="bg-[#213448] text-[#EAE0CF] px-3 py-1 rounded-full text-sm font-medium border border-[#EAE0CF]/20">
                                {assignment.points ? `${assignment.points} Points` : 'Ungraded'}
                            </span>
                        </div>
                        <div className="flex items-center text-[#EAE0CF]/70 gap-6 text-sm">
                            <div className="flex items-center">
                                <Clock size={16} className="mr-2" />
                                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No Due Date'}
                            </div>
                            <div className="flex items-center">
                                <FileText size={16} className="mr-2" />
                                {assignment.type || 'Assignment'}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            <div>
                                <h3 className="font-bold text-lg text-[#EAE0CF] mb-3">Instructions</h3>
                                <div className="prose text-[#EAE0CF]/80">
                                    {assignment.content || assignment.description || "No instructions provided."}
                                </div>

                                {console.log("[StudentAssignment] Assignment Attachments:", assignment.attachments)}

                                {/* Attachments Display */}
                                {(assignment.attachments?.length > 0 || assignment.assignment_details?.attachments?.length > 0) && (
                                    <div className="mt-6">
                                        <h4 className="font-bold text-[#EAE0CF] text-sm mb-3 flex items-center gap-2">
                                            <FileText size={16} /> Attachments
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {[...(assignment.attachments || []), ...(assignment.assignment_details?.attachments || [])].filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i).map((att, idx) => (
                                                <a
                                                    key={idx}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 bg-[#213448] p-3 rounded-xl border border-[#EAE0CF]/10 hover:border-[#EAE0CF]/30 hover:bg-[#2a4055] transition-all group"
                                                >
                                                    <div className="bg-[#547792]/20 p-2 rounded-lg text-[#EAE0CF] group-hover:text-white transition-colors">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-bold text-[#EAE0CF] text-sm truncate group-hover:text-white transition-colors">{att.name}</p>
                                                        <p className="text-[#EAE0CF]/50 text-xs">Click to view</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-[#213448]/30 p-6 rounded-xl h-fit border border-[#EAE0CF]/10">
                            <h3 className="font-bold text-lg text-[#EAE0CF] mb-4">Your Work</h3>

                            {submitted ? (
                                <div className="text-left">
                                    {/* Grade & Feedback Section */}
                                    {assignment.current_user_submission && (assignment.current_user_submission.status === 'returned' || assignment.current_user_submission.grade != null) && (
                                        <div className="mb-6 border-b border-[#EAE0CF]/10 pb-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-bold text-[#EAE0CF] text-lg">Grade & Feedback</h4>
                                                <span className="text-2xl font-bold text-green-400 bg-green-900/30 px-4 py-2 rounded-xl border border-green-500/30">
                                                    {assignment.current_user_submission?.grade || 0} <span className="text-sm text-green-300/70 font-normal">/ {assignment.points || 100}</span>
                                                </span>
                                            </div>

                                            {/* Corrected File Display */}
                                            {assignment.current_user_submission?.corrected_file && (
                                                <div className="mb-6 bg-[#213448] p-5 rounded-2xl border border-[#EAE0CF]/10 shadow-sm">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="bg-[#EAE0CF] p-2.5 rounded-lg text-[#213448] shadow-md mt-1">
                                                                <PenTool size={20} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-[#EAE0CF] text-base leading-snug mb-1">Teacher Corrections Available</h4>
                                                                <p className="text-[#EAE0CF]/70 text-sm leading-relaxed">
                                                                    Your teacher has annotated your answer sheet with specific feedback.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <a
                                                            href={assignment.current_user_submission.corrected_file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-2 w-full py-3 bg-[#EAE0CF] text-[#213448] text-sm font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-white active:scale-[0.98] transition-all group"
                                                        >
                                                            <FileText size={18} className="text-[#547792] group-hover:text-[#213448]" />
                                                            View Marked Answer Sheet
                                                            <ArrowRight size={16} className="text-[#547792] group-hover:translate-x-1 transition-transform" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {assignment.current_user_submission?.teacher_feedback ? (
                                                <div className="bg-[#213448] p-4 rounded-xl border border-blue-500/30">
                                                    <p className="text-sm font-bold text-blue-300 mb-1">Teacher Feedback:</p>
                                                    <p className="text-blue-100">{assignment.current_user_submission.teacher_feedback}</p>
                                                </div>
                                            ) : (
                                                <p className="text-[#EAE0CF]/40 italic">No written feedback provided.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Submission Confirmation / Status */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <CheckCircle className="text-green-400" size={24} />
                                        <div>
                                            <h4 className="font-bold text-[#EAE0CF]">Assignment Submitted</h4>
                                            <p className="text-sm text-[#EAE0CF]/60">
                                                {assignment.current_user_submission?.submitted_at
                                                    ? new Date(assignment.current_user_submission.submitted_at).toLocaleString()
                                                    : 'Submitted'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Your Work */}
                                    <div>
                                        <p className="text-xs font-bold text-[#EAE0CF]/40 uppercase tracking-wider mb-2">Your Answer</p>
                                        <div className="p-4 bg-[#213448] rounded-xl text-[#EAE0CF]/90 border border-[#EAE0CF]/10 whitespace-pre-wrap">
                                            {submissionText}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#EAE0CF]/80 mb-2">
                                            Text Response
                                        </label>
                                        <textarea
                                            value={submissionText}
                                            onChange={(e) => setSubmissionText(e.target.value)}
                                            className="w-full p-3 bg-[#213448] border border-[#EAE0CF]/20 rounded-lg focus:ring-2 focus:ring-[#EAE0CF] focus:border-transparent min-h-[150px] text-[#EAE0CF] placeholder-[#EAE0CF]/30"
                                            placeholder="Type your answer here..."
                                        />
                                    </div>

                                    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors
                                        ${attachment ? 'border-green-400/50 bg-green-900/20' : 'border-[#EAE0CF]/20 hover:bg-[#213448]'}`}>
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={(e) => setAttachment(e.target.files[0])}
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                                            {attachment ? (
                                                <div className="flex items-center justify-center gap-2 text-green-300 font-medium">
                                                    <CheckCircle size={20} />
                                                    {attachment.name}
                                                    <span className="text-xs ml-2 text-green-500 hover:text-red-400" onClick={(e) => { e.preventDefault(); setAttachment(null); }}>Remove</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="mx-auto mb-2 text-[#EAE0CF]/40" size={24} />
                                                    <p className="text-sm font-medium text-[#EAE0CF]/80">Click to upload a file</p>
                                                    <p className="text-xs text-[#EAE0CF]/40 mt-1">PDF, DOCX, Images supported</p>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || !submissionText.trim()}
                                        className="w-full py-3 bg-[#EAE0CF] text-[#213448] font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" /> : 'Turn In'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentAssignment;
