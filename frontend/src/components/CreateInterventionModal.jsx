import React, { useState } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { X, Save, AlertTriangle } from 'lucide-react';

const CreateInterventionModal = ({ studentId, alertId, isOpen, onClose }) => {
    const { getUserId } = useAuth();
    const [formData, setFormData] = useState({
        intervention_type: 'one_on_one_tutoring',
        description: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    // Use actual logged-in teacher ID
    const teacherId = getUserId();

    const interventionTypes = [
        'one_on_one_tutoring',
        'small_group_instruction',
        'peer_tutoring',
        'modified_assignment',
        'extra_practice',
        'parent_conference',
        'counseling_referral'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.info('[INTERVENTION] Creating intervention:', {
                student_id: studentId,
                type: formData.intervention_type
            });

            const response = await dashboardAPI.createIntervention({
                teacher_id: teacherId,
                student_id: studentId,
                intervention_type: formData.intervention_type,
                description: formData.description,
                alert_id: alertId
            });

            console.info('[INTERVENTION] Created successfully:', response.data);

            // Fetch effectiveness prediction
            try {
                const effectiveness = await dashboardAPI.getInterventionEffectiveness(response.data.intervention_id);
                const pred = effectiveness.data || {};
                const score = pred.predicted_effectiveness ? (pred.predicted_effectiveness * 100).toFixed(0) + '%' : 'N/A';
                const icon = pred.recommendation === 'HIGH_IMPACT' ? '✅' : '⚠️';

                toast.success(`Intervention created! Effectiveness: ${score} ${icon}`, { duration: 5000 });
            } catch (effError) {
                console.warn('Failed to get effectiveness', effError);
                toast.success(`Intervention created! Follow-up: ${new Date(response.data.follow_up_date).toLocaleDateString()}`);
            }

            onClose();

        } catch (error) {
            console.error('[INTERVENTION] Creation failed:', error);
            toast.error('Failed to create intervention');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" size={24} />
                        Create Intervention
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Intervention Type</label>
                        <select
                            value={formData.intervention_type}
                            onChange={(e) => setFormData({ ...formData, intervention_type: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                        >
                            {interventionTypes.map(type => (
                                <option key={type} value={type}>
                                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Description / Plan</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px]"
                            placeholder="Describe the action plan..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : <><Save size={18} /> Save Intervention</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateInterventionModal;
