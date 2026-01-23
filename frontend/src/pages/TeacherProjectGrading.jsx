import React, { useState, useEffect } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI, projectsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { CheckCircle, Clock, FileText, Award, Folder, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherProjectGrading = () => {
    const { getUserId } = useAuth();
    const [deliverables, setDeliverables] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeliverables = async () => {
            try {
                setLoading(true);
                const teacherId = getUserId();

                // 1. Get all teacher's classrooms
                const classroomsRes = await classroomAPI.getTeacherClasses(teacherId);
                const classrooms = classroomsRes.data;

                // 2. Get projects for each classroom
                let allDeliverables = [];

                const projectPromises = classrooms.map(async (classroom) => {
                    try {
                        const projectsRes = await projectsAPI.getClassroomProjects(classroom.classroom_id);
                        const projects = projectsRes.data.projects || [];

                        // 3. Get deliverables for each project
                        const deliverablePromises = projects.map(async (project) => {
                            try {
                                const deliverablesRes = await projectsAPI.getProjectDeliverables(project.project_id);
                                const projDeliverables = deliverablesRes.data || [];

                                // Enrich with project/classroom context
                                return projDeliverables.map(d => ({
                                    ...d,
                                    project_title: project.title,
                                    classroom_name: classroom.class_name,
                                    // Need team name, but deliverable might only have team_id. 
                                    // We'd need to fetch team or Map checks. For MVP, we might show ID or fetch team if critical.
                                    // Let's rely on what we have or do a quick fetch for team name if needed.
                                    // For efficiency, we'll skip individual team fetch for now unless needed.
                                }));
                            } catch (e) {
                                console.warn(`Failed to fetch deliverables for project ${project.project_id}`, e);
                                return [];
                            }
                        });

                        const projectDeliverables = await Promise.all(deliverablePromises);
                        return projectDeliverables.flat();
                    } catch (e) {
                        return [];
                    }
                });

                const results = await Promise.all(projectPromises);
                allDeliverables = results.flat();

                // Sort by submission date (newest first)
                allDeliverables.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

                setDeliverables(allDeliverables);

            } catch (error) {
                console.error("Error fetching grading items:", error);
                toast.error("Failed to load deliverables");
            } finally {
                setLoading(false);
            }
        };

        if (getUserId()) {
            fetchDeliverables();
        }
    }, [getUserId]);

    const handleGrade = async (deliverable) => {
        const grade = window.prompt("Enter grade (0-100):");
        if (grade === null) return;

        const numGrade = parseInt(grade);
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
            toast.error("Please enter a valid number between 0 and 100");
            return;
        }

        const feedback = window.prompt("Enter feedback (optional):", "Good job!");

        try {
            await projectsAPI.updateDeliverableGrade(deliverable.deliverable_id, {
                grade: numGrade,
                feedback: feedback || ''
            });

            toast.success("Grade submitted successfully!");

            // Update local state
            setDeliverables(prev => prev.map(d =>
                d.deliverable_id === deliverable.deliverable_id
                    ? { ...d, graded: true, grade: numGrade, feedback }
                    : d
            ));
        } catch (error) {
            console.error("Grading failed", error);
            toast.error("Failed to submit grade");
        }
    };

    if (loading) return (
        <TeacherLayout>
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        </TeacherLayout>
    );

    const pendingDeliverables = deliverables.filter(d => !d.graded);
    const gradedDeliverables = deliverables.filter(d => d.graded);

    return (
        <TeacherLayout>
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <Award className="text-indigo-600" size={32} />
                        Grading Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2">Evaluate and grade student project deliverables.</p>
                </div>

                {/* Pending Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-orange-500" /> Pending Grading ({pendingDeliverables.length})
                    </h2>

                    {pendingDeliverables.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                            No pending deliverables to grade.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {pendingDeliverables.map(item => (
                                    <DeliverableCard key={item.deliverable_id} item={item} onGrade={handleGrade} />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div>
                    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-500" /> Recent Graded History
                    </h2>
                    <div className="grid gap-4 opacity-75">
                        {gradedDeliverables.slice(0, 5).map(item => (
                            <DeliverableCard key={item.deliverable_id} item={item} readOnly />
                        ))}
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
};

const DeliverableCard = ({ item, onGrade, readOnly = false }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6"
    >
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md uppercase tracking-wider">
                    {item.deliverable_type?.replace('_', ' ') || 'Deliverable'}
                </span>
                <span className="text-sm text-gray-400">
                    • Submitted {new Date(item.submitted_at).toLocaleDateString()}
                </span>
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h3>

            <div className="flex gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Folder size={14} /> {item.project_title}</span>
                <span className="flex items-center gap-1">Class: {item.classroom_name}</span>
            </div>

            {item.description && (
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm mb-4 italic">
                    "{item.description}"
                </p>
            )}

            {item.file_url && (
                <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                    <Download size={16} /> Download Attachment
                </a>
            )}
        </div>

        <div className="flex flex-col items-end min-w-[150px] justify-center">
            {readOnly ? (
                <div className="text-right">
                    <div className="text-3xl font-extrabold text-green-600">{item.grade}<span className="text-sm text-gray-400">/100</span></div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Graded</div>
                </div>
            ) : (
                <button
                    onClick={() => onGrade(item)}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
                >
                    <Award size={18} /> Grade
                </button>
            )}
        </div>
    </motion.div>
);

export default TeacherProjectGrading;
