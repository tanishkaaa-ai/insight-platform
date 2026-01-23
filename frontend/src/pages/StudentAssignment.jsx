import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, Clock, FileText, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { classroomAPI } from '../services/api';
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
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const response = await classroomAPI.getAssignment(assignmentId);
                setAssignment(response.data);

                // Check if already submitted (if the API supports checking status in the assignment details or separate call)
                // For now, we assume simplicity and fresh submission
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!submissionText.trim()) return;

        try {
            setSubmitting(true);
            await classroomAPI.submitAssignment(assignmentId, {
                student_id: user.id /* or get from context */,
                content: submissionText,
                attachments: [] // Placeholder for file upload
            });
            setSubmitted(true);
            setTimeout(() => {
                navigate(-1); // Go back after success
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
                    <Loader2 className="animate-spin text-orange-500" size={48} />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !assignment) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-96">
                    <AlertCircle className="text-red-500 mb-4" size={48} />
                    <p className="text-gray-600">{error || "Assignment not found"}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 hover:underline">
                        Go Back
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Class
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-3xl font-bold text-gray-800">{assignment.title}</h1>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                {assignment.points ? `${assignment.points} Points` : 'Ungraded'}
                            </span>
                        </div>
                        <div className="flex items-center text-gray-500 gap-6 text-sm">
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

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 mb-3">Instructions</h3>
                                <div className="prose text-gray-600">
                                    {assignment.description || "No instructions provided."}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl h-fit border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-4">Your Work</h3>

                            {submitted ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
                                    <h4 className="font-bold text-green-700 text-lg">Submitted!</h4>
                                    <p className="text-green-600">Great job!</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Text Response
                                        </label>
                                        <textarea
                                            value={submissionText}
                                            onChange={(e) => setSubmissionText(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[150px]"
                                            placeholder="Type your answer here..."
                                        />
                                    </div>

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-gray-100 transition-colors cursor-not-allowed opacity-70">
                                        <Upload className="mx-auto mb-2" size={24} />
                                        <p className="text-xs">File upload coming soon</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || !submissionText.trim()}
                                        className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
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
