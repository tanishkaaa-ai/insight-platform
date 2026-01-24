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
    Loader,
    TrendingUp
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

            // 1. Fetch Active Alerts (At Risk Students)
            const alertsResponse = await dashboardAPI.getAlerts({
                teacher_id: userId,
                severity: filterStatus === 'all' ? undefined : filterStatus
            });
            const alerts = alertsResponse.data || [];

            // 2. Fetch Existing Interventions
            const interventionsResponse = await dashboardAPI.getTeacherInterventions(userId);
            const existingInterventions = interventionsResponse.data.interventions || [];

            // 3. Merge Data for Unified View
            // We want to show all Alerts. If an alert has an intervention, show that status.
            // Also show interventions that might not have an active alert (optional, but good for history)

            const mergedList = [];
            const processedInterventionIds = new Set();

            // First, process alerts
            alerts.forEach(alert => {
                // Check if there's an active intervention for this student/alert
                // (Simple matching by student_id for now if alert_id is not strictly linked in response)
                const relatedIntervention = existingInterventions.find(i =>
                    i.student_id === alert.student_id && i.status !== 'completed'
                );

                if (relatedIntervention) {
                    processedInterventionIds.add(relatedIntervention.intervention_id);
                }

                mergedList.push({
                    id: alert.alert_id, // Unique Key
                    type: 'alert',
                    student_id: alert.student_id,
                    student_name: alert.student_name,
                    severity: alert.severity,
                    reason: alert.behaviors,
                    date: alert.detected_at,
                    intervention: relatedIntervention, // Specific intervention object
                    status: relatedIntervention ? 'intervention_active' : 'needs_attention'
                });
            });

            // Then add remaining independent interventions (that aren't linked to current active alerts)
            existingInterventions.forEach(intervention => {
                if (!processedInterventionIds.has(intervention.intervention_id)) {
                    mergedList.push({
                        id: intervention.intervention_id,
                        type: 'intervention',
                        student_id: intervention.student_id,
                        student_name: intervention.student_name,
                        severity: 'monitor', // Default for routine interventions
                        reason: [{ description: intervention.description || 'Manual Intervention' }],
                        date: intervention.created_at || intervention.timestamp,
                        intervention: intervention,
                        status: intervention.status === 'completed' ? 'completed' : 'intervention_active'
                    });
                }
            });

            // Sort by Date (Newest first)
            mergedList.sort((a, b) => new Date(b.date) - new Date(a.date));

            setInterventions(mergedList);
        } catch (error) {
            console.error("Failed to fetch data", error);
            // toast.error("Could not load interventions");
            setInterventions([]);
        } finally {
            setLoading(false);
        }
    };

    const [selectedAlertId, setSelectedAlertId] = useState(null);

    const handleCreateIntervention = (studentId = null, alertId = null) => {
        setSelectedStudentId(studentId);
        setSelectedAlertId(alertId);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedAlertId(null);
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
        if (filterStatus === 'active') return i.status !== 'completed';
        if (filterStatus === 'completed') return i.status === 'completed';
        return i.severity === filterStatus;
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
                    {['all', 'CRITICAL', 'AT_RISK', 'MONITOR'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors
                                ${filterStatus === status ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <RecommendationsSection teacherId={getUserId()} onRequestCreate={handleCreateIntervention} />

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
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Intervention / Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredInterventions.map((item) => (
                                        <tr key={`${item.type}-${item.id}`} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-bold text-gray-700">{item.student_name || 'Unknown Student'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${item.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                    item.severity === 'AT_RISK' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {item.severity ? item.severity.replace(/_/g, ' ') : 'General'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    {item.reason && item.reason.slice(0, 2).map((b, i) => (
                                                        <span key={i} className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded w-fit">
                                                            {typeof b === 'string' ? b : b.description || b.type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {item.date && new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                {item.status === 'intervention_active' ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded mb-1">
                                                            {item.intervention.intervention_type ? item.intervention.intervention_type.replace(/_/g, ' ') : 'Active Plan'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleStatusUpdate(item.intervention.intervention_id, 'completed')}
                                                            className="text-gray-400 text-xs hover:text-gray-600"
                                                        >
                                                            Mark Done
                                                        </button>
                                                    </div>
                                                ) : item.status === 'completed' ? (
                                                    <span className="text-gray-400 text-xs font-bold flex items-center justify-end gap-1">
                                                        <CheckCircle size={14} /> Resolving
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreateIntervention(item.student_id, item.id)}
                                                        className="text-teal-600 font-bold text-sm hover:underline bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100"
                                                    >
                                                        Create Plan
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
                alertId={selectedAlertId}
            />
        </TeacherLayout>
    );
};

const RecommendationsSection = ({ teacherId, onRequestCreate }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!teacherId) return;
        const fetchRecommendations = async () => {
            try {
                const response = await dashboardAPI.getInterventionRecommendations(teacherId);
                setRecommendations(response.data.recommendations || []);
            } catch (error) {
                console.error('Failed to load recommendations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, [teacherId]);

    if (loading || recommendations.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-lg text-blue-800 mb-4 flex items-center gap-2">
                🤖 AI Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-800">{rec.student_name}</h4>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                {rec.priority || 'Normal'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rec.rationale}</p>

                        <div className="flex items-center justify-between mt-auto">
                            <div className="text-xs text-indigo-600 font-medium">
                                Suggested: {rec.recommended_intervention?.replace(/_/g, ' ')}
                            </div>
                            <button
                                onClick={() => onRequestCreate(rec.student_id)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                                Use This
                            </button>
                        </div>
                        {rec.predicted_effectiveness > 0 && (
                            <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                                <TrendingUp size={12} /> {(rec.predicted_effectiveness * 100).toFixed(0)}% predicted impact
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherInterventions;
