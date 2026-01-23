import React, { useState, useEffect } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import CreateInterventionModal from '../components/CreateInterventionModal';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import {
    Users,
    ClipboardList,
    AlertTriangle,
    CheckCircle,
    Clock,
    Filter,
    Search,
    Plus,
    Loader
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const TeacherInterventions = () => {
    const { getUserId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [interventions, setInterventions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed

    useEffect(() => {
        fetchInterventions();
    }, [getUserId]);

    const fetchInterventions = async () => {
        try {
            const userId = getUserId();
            // TODO: Ensure backend supports this endpoint correctly or use a mock/filter approach if needed
            // Currently api.js has getTeacherInterventions(teacherId)
            const response = await dashboardAPI.getTeacherInterventions(userId);
            setInterventions(response.data.interventions || []);
        } catch (error) {
            console.error("Failed to fetch interventions", error);
            // toast.error("Could not load interventions");
            // Set empty for now if endpoint fails (e.g. if backend logic is missing)
            setInterventions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateIntervention = (studentId = null) => {
        setSelectedStudentId(studentId);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        fetchInterventions(); // Refresh list after creation
    };

    const handleStatusUpdate = async (interventionId, newStatus, outcome = null) => {
        try {
            await dashboardAPI.updateInterventionOutcome(interventionId, {
                status: newStatus,
                outcome_notes: outcome
            });
            toast.success("Intervention updated");
            fetchInterventions();
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to update status");
        }
    };

    const filteredInterventions = Array.isArray(interventions) ? interventions.filter(i => {
        if (filterStatus === 'all') return true;
        return i.status === filterStatus;
    }) : [];

    return (
        <TeacherLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ClipboardList className="text-teal-600" /> Interventions
                        </h1>
                        <p className="text-gray-500 mt-1">Track and manage student support plans.</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleCreateIntervention()}
                            className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={18} /> New Intervention
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-fit">
                    {['all', 'active', 'completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors
                                ${filterStatus === status ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader className="animate-spin text-teal-500" size={32} />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {filteredInterventions.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredInterventions.map((intervention) => (
                                        <tr key={intervention.intervention_id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-bold text-gray-700">{intervention.student_name || 'Unknown Student'}</td>
                                            <td className="p-4">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold capitalize">
                                                    {intervention.type ? intervention.type.replace(/_/g, ' ') : 'General'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {intervention.status === 'completed' ? (
                                                    <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded w-fit">
                                                        <CheckCircle size={14} /> Completed
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-yellow-600 font-bold text-xs bg-yellow-50 px-2 py-1 rounded w-fit">
                                                        <Clock size={14} /> Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(intervention.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                {intervention.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(intervention.intervention_id, 'completed', 'Completed manually')}
                                                        className="text-teal-600 font-bold text-sm hover:underline"
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                                <ClipboardList size={48} className="mb-4 opacity-20" />
                                <p>No interventions found with this filter.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateInterventionModal
                isOpen={showModal}
                onClose={handleModalClose}
                studentId={selectedStudentId}
            />
        </TeacherLayout>
    );
};

export default TeacherInterventions;
