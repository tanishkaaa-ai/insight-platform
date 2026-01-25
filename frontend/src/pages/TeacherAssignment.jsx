import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { classroomAPI } from '../services/api';
import { ArrowLeft, Loader, Check, X, FileText, User, Calendar, Award, PenTool, ExternalLink, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FileAnnotator from '../components/FileAnnotator';
import { motion, AnimatePresence } from 'framer-motion';

const RubricGrading = ({ onGradeChange, currentGrade, maxPoints }) => {
    const rubric = [
        {
            id: 1, name: "Content Accuracy", weight: 40, levels: [
                { score: 10, label: "Excellent", desc: "All facts accurate, deep understanding shown." },
                { score: 7, label: "Good", desc: "Mostly accurate, some minor errors." },
                { score: 4, label: "Fair", desc: "Some accurate facts, significant errors." },
                { score: 0, label: "Poor", desc: "Investigate inaccurate or missing." }
            ]
        },
        {
            id: 2, name: "Analysis & Logic", weight: 30, levels: [
                { score: 10, label: "Strong", desc: "Clear reasoning, strong evidence connection." },
                { score: 7, label: "Moderate", desc: "Reasonable logic, some gaps." },
                { score: 4, label: "Weak", desc: "Flawed logic or weak connections." },
                { score: 0, label: "None", desc: "No analysis provided." }
            ]
        },
        {
            id: 3, name: "Presentation", weight: 30, levels: [
                { score: 10, label: "Clear", desc: "Professional, well-organized." },
                { score: 7, label: "Adequate", desc: "Readable, some organization issues." },
                { score: 4, label: "Messy", desc: "Hard to follow." },
                { score: 0, label: "Poor", desc: "Illegible or chaotic." }
            ]
        }
    ];

    const [scores, setScores] = useState({});

    const handleLevelClick = (criteriaId, score, weight) => {
        const newScores = { ...scores, [criteriaId]: score };
        setScores(newScores);

        // Calculate weighted total
        let total = 0;
        rubric.forEach(c => {
            const s = newScores[c.id] || 0;
            total += (s / 10) * c.weight;
        });

        // Scale based on maxPoints (default to 100 if not provided)
        const max = maxPoints || 100;
        const scaledTotal = (total / 100) * max;

        onGradeChange(Math.round(scaledTotal));
    };

    return (
        <div className="space-y-4 mb-4">
            {rubric.map(criteria => (
                <div key={criteria.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-sm text-gray-700">{criteria.name}</span>
                        <span className="text-xs font-bold text-gray-400">{criteria.weight}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                        {criteria.levels.map(level => (
                            <button
                                key={level.score}
                                onClick={() => handleLevelClick(criteria.id, level.score, criteria.weight)}
                                className={`p-1 rounded text-xs transition-colors text-center border
                                    ${scores[criteria.id] === level.score
                                        ? 'bg-teal-100 border-teal-300 text-teal-800 font-bold'
                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                title={level.desc}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            <div className="text-right text-xs text-gray-400">Total Calculated: {currentGrade}</div>
        </div>
    );
};

const TeacherAssignment = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [shareAnnotations, setShareAnnotations] = useState(false);
    const [gradingLoading, setGradingLoading] = useState(false);

    // Preview/Annotation State
    const [previewFile, setPreviewFile] = useState(null); // { url, type, name }
    const [correctedFileUrl, setCorrectedFileUrl] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assignRes, subsRes] = await Promise.all([
                    classroomAPI.getAssignment(assignmentId),
                    classroomAPI.getAssignmentSubmissions(assignmentId)
                ]);
                setAssignment(assignRes.data);
                setSubmissions(subsRes.data);
            } catch (error) {
                console.error("Error fetching assignment data:", error);
                toast.error("Failed to load assignment details");
            } finally {
                setLoading(false);
            }
        };

        if (assignmentId) {
            fetchData();
        }
    }, [assignmentId]);

    const handleGradeClick = (submission) => {
        setSelectedSubmission(submission);
        setGrade(submission.grade || '');
        setFeedback(submission.teacher_feedback || '');
        setCorrectedFileUrl(submission.corrected_file || null);
        setShareAnnotations(submission.share_annotations || false);
    };

    // New File Click Handler
    const handleFileClick = (e, fileUrl, fileName, fileType) => {
        e.preventDefault();
        let type = 'unknown';
        if (fileUrl.match(/\.(jpeg|jpg|png|gif)$/i)) type = 'image';
        else if (fileUrl.match(/\.pdf$/i)) type = 'pdf';

        setPreviewFile({
            url: fileUrl,
            name: fileName || 'Attachment',
            type: type
        });
    };

    const handleSaveAnnotationImage = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Upload the annotated file
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
            const res = await fetch(`${apiBaseUrl}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setCorrectedFileUrl(data.file_url);
            setPreviewFile(null); // Close preview after save
            toast.success("Annotated corrections saved!");

        } catch (error) {
            console.error("Annotation upload failed", error);
            toast.error("Failed to save annotation");
        }
    };

    const submitGrade = async () => {
        if (!selectedSubmission) return;

        setGradingLoading(true);
        try {
            await classroomAPI.gradeSubmission(selectedSubmission.submission_id, {
                grade: parseFloat(grade),
                teacher_feedback: feedback,
                corrected_file: correctedFileUrl,
                share_annotations: shareAnnotations,
                return_to_student: true
            });

            toast.success("Grade & Corrections saved!");

            setSubmissions(prev => prev.map(sub =>
                sub.submission_id === selectedSubmission.submission_id
                    ? {
                        ...sub,
                        grade: parseFloat(grade),
                        teacher_feedback: feedback,
                        corrected_file: correctedFileUrl,
                        share_annotations: shareAnnotations,
                        status: 'returned'
                    }
                    : sub
            ));

            setSelectedSubmission(null);
            setCorrectedFileUrl(null);
        } catch (error) {
            console.error("Error saving grade:", error);
            toast.error("Failed to save grade");
        } finally {
            setGradingLoading(false);
        }
    };

    if (loading) {
        return (
            <TeacherLayout>
                <div className="flex justify-center items-center h-96">
                    <Loader className="animate-spin text-teal-600" size={32} />
                </div>
            </TeacherLayout>
        );
    }

    if (!assignment) return null;

    return (
        <TeacherLayout>
            <div className="space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#065F46]/70 hover:text-[#065F46] font-medium">
                    <ArrowLeft size={18} /> Back to Class
                </button>

                <div className="bg-[#F4FFFD] rounded-2xl p-8 shadow-sm border-2 border-[#065F46]/20">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[#065F46] mb-2">{assignment.title}</h1>
                            <div className="flex items-center gap-4 text-[#065F46]/70 text-sm">
                                <span className="flex items-center gap-1"><Calendar size={14} /> Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No Deadline'}</span>
                                <span className="flex items-center gap-1"><Award size={14} /> Points: {assignment.points}</span>
                            </div>
                        </div>
                        <div className="bg-[#AED6CF]/20 px-4 py-2 rounded-lg text-[#065F46] font-bold">
                            {submissions.length} Submissions
                        </div>
                    </div>
                    <p className="text-[#065F46]/80 whitespace-pre-wrap">{assignment.content}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Submission List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="font-bold text-xl text-[#065F46]">Student Submissions</h2>
                        {submissions.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                                No submissions yet.
                            </div>
                        ) : (
                            submissions.map(sub => (
                                <div
                                    key={sub.submission_id}
                                    className={`bg-[#F4FFFD] p-4 rounded-xl shadow-sm border-2 transition-all cursor-pointer ${selectedSubmission?.submission_id === sub.submission_id
                                        ? 'border-[#065F46] ring-2 ring-[#AED6CF]'
                                        : 'border-[#065F46]/20 hover:border-[#065F46]/50'
                                        }`}
                                    onClick={() => handleGradeClick(sub)}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                {sub.student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{sub.student.name}</h3>
                                                <p className="text-xs text-gray-500">
                                                    Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Not submitted'}
                                                    {sub.is_late && <span className="text-red-500 ml-2 font-bold">LATE</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {sub.grade !== null && sub.grade !== undefined ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold">
                                                    {sub.grade} / {assignment.points}
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg font-bold text-sm">
                                                    Needs Grading
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 line-clamp-2">
                                        {sub.submission_text || 'No text content'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Grading Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#F4FFFD] rounded-2xl p-6 shadow-sm border-2 border-[#065F46]/20 sticky top-6">
                            <h2 className="font-bold text-xl text-gray-800 mb-4">Grading</h2>

                            {selectedSubmission ? (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                        <h3 className="text-sm font-bold text-gray-500 mb-1">Student</h3>
                                        <p className="font-bold text-gray-800">{selectedSubmission.student.name}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-500 mb-2">Submission</h3>
                                        {selectedSubmission.submission_text && (
                                            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto mb-4 border border-gray-200">
                                                {selectedSubmission.submission_text}
                                            </div>
                                        )}

                                        {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Attachments</h4>
                                                <div className="space-y-2">
                                                    {selectedSubmission.attachments.map((att, idx) => (
                                                        <div key={idx} className="flex flex-col gap-2">
                                                            <button
                                                                onClick={(e) => handleFileClick(e, att.url, att.name, att.type)}
                                                                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all group w-full text-left"
                                                            >
                                                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p className="font-bold text-gray-800 text-sm truncate">{att.name || 'Attached File'}</p>
                                                                    <p className="text-xs text-gray-500">Click to view/annotate</p>
                                                                </div>
                                                                <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Corrected File Display */}
                                    {correctedFileUrl && (
                                        <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-xs font-bold text-green-700 uppercase">Correction Saved</h4>
                                                <button onClick={() => setCorrectedFileUrl(null)} className="text-xs text-red-500 hover:underline">Remove</button>
                                            </div>
                                            <a href={correctedFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 font-bold hover:underline flex items-center gap-2">
                                                <Check size={14} /> View Annotated File
                                            </a>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-500 mb-2">Rubric Grading</h3>
                                        <RubricGrading onGradeChange={setGrade} currentGrade={grade} maxPoints={assignment.points} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Final Grade (out of {assignment.points})</label>
                                        <input
                                            type="number"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                                            placeholder="Enter grade"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Feedback</label>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 h-32 resize-none"
                                            placeholder="Enter feedback for the student..."
                                        />
                                    </div>

                                    {correctedFileUrl && (
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <input
                                                type="checkbox"
                                                id="shareAnnotations"
                                                checked={shareAnnotations}
                                                onChange={(e) => setShareAnnotations(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <label htmlFor="shareAnnotations" className="text-sm font-bold text-blue-700 cursor-pointer select-none">
                                                Share annotated paper with student
                                            </label>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => setSelectedSubmission(null)}
                                            className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={submitGrade}
                                            disabled={gradingLoading || !grade}
                                            className="flex-1 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                        >
                                            {gradingLoading ? <Loader size={16} className="animate-spin" /> : <Check size={18} />}
                                            Save Grade
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <User size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Select a submission from the list to view details and grade.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* File Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl overflow-hidden flex flex-col relative"
                        >
                            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    {previewFile.type === 'image' ? 'Annotate Correction' : 'File Preview'}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <a href={previewFile.url} download className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Download">
                                        <Download size={20} />
                                    </a>
                                    <button onClick={() => setPreviewFile(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-gray-100 overflow-hidden relative">
                                {previewFile.type === 'image' || previewFile.type === 'pdf' ? (
                                    <FileAnnotator
                                        fileUrl={previewFile.url}
                                        fileType={previewFile.type}
                                        onSave={(anns) => console.log('Saved JSON', anns)} // We don't save JSON for this flow yet
                                        onSaveImage={handleSaveAnnotationImage} // We save flattened image 
                                    />
                                ) : (
                                    <iframe
                                        src={previewFile.url}
                                        className="w-full h-full bg-white"
                                        title="Preview"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </TeacherLayout>
    );
};

export default TeacherAssignment;
