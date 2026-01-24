import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlignLeft, CheckCircle, ArrowRight, Clock } from 'lucide-react';

const TaskTransitionModal = ({ isOpen, onClose, task, targetStatus, onConfirm }) => {
    const [description, setDescription] = useState(task?.description || '');
    const [tentativeDate, setTentativeDate] = useState(task?.tentative_completion_date ? new Date(task.tentative_completion_date).toISOString().split('T')[0] : '');
    const [completionSummary, setCompletionSummary] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const isMovingToInProgress = targetStatus === 'in_progress';
    const isMovingToCompleted = targetStatus === 'completed';

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const updateData = {
                status: targetStatus,
            };

            if (isMovingToInProgress) {
                updateData.description = description; // Update/Refine description
                updateData.tentative_completion_date = tentativeDate;
            }

            if (isMovingToCompleted) {
                updateData.completion_summary = completionSummary;
            }

            await onConfirm(task.task_id || task._id, updateData);
            onClose();
        } catch (error) {
            console.error("Transition failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
                <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${isMovingToCompleted ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <div>
                        <h3 className={`font-bold text-xl flex items-center gap-2 ${isMovingToCompleted ? 'text-green-800' : 'text-blue-800'}`}>
                            {isMovingToCompleted ? <CheckCircle size={24} /> : <Clock size={24} />}
                            {isMovingToCompleted ? 'Mark as Completed' : 'Start Task'}
                        </h3>
                        <p className={`text-sm ${isMovingToCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                            Moving "{task.title}" to {isMovingToCompleted ? 'Done' : 'In Action'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* If moving to In Progress: Ask for Description refinement & Tentative Date */}
                    {isMovingToInProgress && (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                    <AlignLeft size={16} /> Task Description / Plan
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Briefly describe what you plan to do..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                    <Calendar size={16} /> Tentative Completion Date
                                </label>
                                <input
                                    type="date"
                                    value={tentativeDate}
                                    onChange={(e) => setTentativeDate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </>
                    )}

                    {/* If moving to Completed: Ask for Summary */}
                    {isMovingToCompleted && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                <CheckCircle size={16} /> Completion Summary
                            </label>
                            <textarea
                                value={completionSummary}
                                onChange={(e) => setCompletionSummary(e.target.value)}
                                placeholder="Briefly summarize what was accomplished..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none"
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
                            ${isMovingToCompleted
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                    >
                        {loading ? 'Updating...' : (
                            <>
                                {isMovingToCompleted ? 'Complete Task' : 'Start Task'} <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TaskTransitionModal;
