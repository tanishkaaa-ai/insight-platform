import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { classroomAPI } from '../services/api';
import { ArrowLeft, Loader, Check, X, FileText, User, Calendar, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    const [gradingLoading, setGradingLoading] = useState(false);

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
    };

    const submitGrade = async () => {
        if (!selectedSubmission) return;

        setGradingLoading(true);
        try {
            await classroomAPI.gradeSubmission(selectedSubmission.submission_id, {
                grade: parseFloat(grade),
                teacher_feedback: feedback,
                return_to_student: true
            });

            toast.success("Grade saved!");

            // Update local state
            setSubmissions(prev => prev.map(sub =>
                sub.submission_id === selectedSubmission.submission_id
                    ? { ...sub, grade: parseFloat(grade), teacher_feedback: feedback, status: 'returned' }
                    : sub
            ));

            setSelectedSubmission(null);
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

    if (!assignment) {
        return (
            <TeacherLayout>
                <div className="text-center py-20">
                    <h2 className="text-xl font-bold text-gray-800">Assignment not found</h2>
                    <button onClick={() => navigate(-1)} className="text-teal-600 hover:underline mt-4">
                        Go Back
                    </button>
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-medium"
                >
                    <ArrowLeft size={18} /> Back to Class
                </button>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{assignment.title}</h1>
                            <div className="flex items-center gap-4 text-gray-500 text-sm">
                                <span className="flex items-center gap-1"><Calendar size={14} /> Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No Deadline'}</span>
                                <span className="flex items-center gap-1"><Award size={14} /> Points: {assignment.points}</span>
                            </div>
                        </div>
                        <div className="bg-teal-50 px-4 py-2 rounded-lg text-teal-800 font-bold">
                            {submissions.length} Submissions
                        </div>
                    </div>
                    <p className="text-gray-600 whitespace-pre-wrap">{assignment.content}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Submission List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="font-bold text-xl text-gray-800">Student Submissions</h2>
                        {submissions.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                                No submissions yet.
                            </div>
                        ) : (
                            submissions.map(sub => (
                                <div
                                    key={sub.submission_id}
                                    className={`bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer ${selectedSubmission?.submission_id === sub.submission_id
                                        ? 'border-teal-500 ring-2 ring-teal-100'
                                        : 'border-gray-200 hover:border-teal-300'
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
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6">
                            <h2 className="font-bold text-xl text-gray-800 mb-4">Grading</h2>

                            {selectedSubmission ? (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                        <h3 className="text-sm font-bold text-gray-500 mb-1">Student</h3>
                                        <p className="font-bold text-gray-800">{selectedSubmission.student.name}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-500 mb-2">Submission</h3>
                                        <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto mb-4 border border-gray-200">
                                            {selectedSubmission.submission_text || 'No text content'}
                                        </div>
                                    </div>

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
        </TeacherLayout>
    );
};

export default TeacherAssignment;
