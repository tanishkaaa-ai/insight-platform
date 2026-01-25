import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CheckCircle, Clock, BarChart2, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { pollsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentPolls = () => {
    const { getUserId } = useAuth();
    const [activePoll, setActivePoll] = useState(null);
    const [activePolls, setActivePolls] = useState([]);
    const [hasResponded, setHasResponded] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(false);

    // Polling for active polls
    useEffect(() => {
        const studentId = getUserId();
        if (!studentId) return;

        const checkPolls = async () => {
            try {
                // Get active polls for ALL classrooms this student is in
                const res = await pollsAPI.getStudentActivePolls(studentId);
                const polls = res.data || [];
                setActivePolls(polls);

                setActivePoll(prev => {
                    if (polls.length === 0) return null;

                    // If we have a previous selection, find its updated version in the new list
                    if (prev) {
                        const updatedPrev = polls.find(p => p.poll_id === prev.poll_id);
                        if (updatedPrev) return updatedPrev; // Keep current selection updated
                    }

                    // If no previous selection, or the previous one is gone:
                    // Priority 1: First unanswered poll
                    const firstUnanswered = polls.find(p => !p.has_responded);
                    if (firstUnanswered) return firstUnanswered;

                    // Priority 2: First poll in list (most recent usually)
                    return polls[0];
                });
            } catch (error) {
                console.error("Error checking for polls:", error);
            }
        };

        // Check immediately then every 3s
        checkPolls();
        const intervalId = setInterval(checkPolls, 3000);
        return () => clearInterval(intervalId);
    }, [getUserId]);

    // Update local state when activePoll changes
    useEffect(() => {
        if (activePoll) {
            if (activePoll.has_responded) {
                setHasResponded(true);
                setSelectedOption(activePoll.user_response);
            } else {
                setHasResponded(false);
                setSelectedOption(null);
            }
        }
    }, [activePoll]);

    const submitResponse = async (option) => {
        if (!activePoll) return;
        const studentId = getUserId();

        try {
            setLoading(true);
            setSelectedOption(option);

            await pollsAPI.respondToPoll(activePoll.poll_id, {
                student_id: studentId,
                response: option
            });

            setHasResponded(true);

            // Optimistically update the poll in the list
            setActivePolls(prev => prev.map(p =>
                p.poll_id === activePoll.poll_id
                    ? { ...p, has_responded: true, user_response: option }
                    : p
            ));

        } catch (error) {
            console.error("Failed to submit vote:", error);
            alert("Failed to submit response. You may have already voted.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto py-10 px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-[#065F46]">Live Session</h1>
                    <p className="text-[#065F46]/70 mt-2">Real-time feedback & anonymous polling.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar for multiple polls */}
                    {activePolls.length > 0 && (
                        <div className="lg:col-span-1 space-y-3">
                            <h3 className="font-bold text-[#065F46] flex items-center gap-2 mb-4">
                                <List size={20} /> Active Polls
                            </h3>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto p-2">
                                {activePolls.map(poll => (
                                    <button
                                        key={poll.poll_id}
                                        onClick={() => setActivePoll(poll)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border group relative overflow-hidden ${activePoll?.poll_id === poll.poll_id
                                            ? 'bg-[#F4FFFD] border-[#065F46] shadow-md transform scale-[1.02]'
                                            : 'bg-[#213448] border-[#EAE0CF]/10 hover:bg-[#547792]/20 hover:border-[#EAE0CF]/30 shadow-sm'
                                            }`}
                                    >
                                        <div className={`text-sm font-bold line-clamp-2 ${activePoll?.poll_id === poll.poll_id ? 'text-[#065F46]' : 'text-[#EAE0CF]'}`}>
                                            {poll.question}
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className={`text-xs font-medium ${activePoll?.poll_id === poll.poll_id ? 'text-[#065F46]/60' : 'text-[#EAE0CF]/40'}`}>
                                                {new Date(poll.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {poll.has_responded ? (
                                                <div className="bg-green-900/40 text-green-400 p-1 rounded-full">
                                                    <CheckCircle size={14} />
                                                </div>
                                            ) : (
                                                <div className="bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                                    Vote
                                                </div>
                                            )}
                                        </div>
                                        {/* Class ID badge if available in future */}
                                        {poll.classroom_id && (
                                            <div className="mt-1 text-[10px] text-[#EAE0CF]/30 truncate">
                                                Class: {poll.classroom_id}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className={activePolls.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
                        {activePoll ? (
                            <motion.div
                                key={activePoll.poll_id}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#213448] rounded-3xl shadow-lg border border-[#EAE0CF]/20 p-8 relative overflow-hidden min-h-[400px]"
                            >
                                <div className="inline-flex items-center gap-2 bg-red-900/20 text-red-400 px-4 py-1 rounded-full text-sm font-bold animate-pulse mb-6 border border-red-500/30">
                                    <span className="w-2 h-2 bg-red-500 rounded-full" /> LIVE POLL ACTIVE
                                </div>

                                <h2 className="text-2xl font-bold text-[#EAE0CF] mb-6 relative z-10">{activePoll.question}</h2>

                                {!hasResponded ? (
                                    <div className="space-y-4 relative z-10 max-w-2xl">
                                        {activePoll.options.map((option, idx) => (
                                            <motion.button
                                                key={idx}
                                                whileHover={{ scale: 1.01, backgroundColor: '#1a2c3d', borderColor: '#547792' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => submitResponse(option)}
                                                disabled={loading}
                                                className="w-full p-5 text-left border-2 border-[#EAE0CF]/10 rounded-2xl transition-all font-medium text-[#EAE0CF]/80 flex items-center justify-between group disabled:opacity-50 hover:text-[#EAE0CF]"
                                            >
                                                <span>{option}</span>
                                                <span className="w-6 h-6 rounded-full border-2 border-[#EAE0CF]/30 group-hover:border-orange-400 flex items-center justify-center">
                                                    <span className="w-3 h-3 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 relative z-10">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-20 h-20 bg-green-900/40 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6"
                                        >
                                            <CheckCircle size={40} />
                                        </motion.div>
                                        <h3 className="text-2xl font-bold text-[#EAE0CF] mb-2">Response Submitted!</h3>
                                        <p className="text-[#EAE0CF]/60 max-w-sm mx-auto">
                                            You selected <span className="font-bold text-[#EAE0CF]">"{selectedOption}"</span>.
                                            Waiting for teacher to close the poll...
                                        </p>
                                        <div className="mt-8 flex justify-center">
                                            <BarChart2 className="animate-pulse text-orange-400" size={32} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-[#1a2c3d] border-2 border-dashed border-[#EAE0CF]/10 rounded-3xl p-12 text-center h-[400px] flex flex-col items-center justify-center"
                            >
                                <div className="w-16 h-16 bg-[#213448] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#EAE0CF]/20">
                                    <Clock size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-[#EAE0CF]/70 mb-2">No Active Poll</h3>
                                <p className="text-[#EAE0CF]/50">Sit tight! When your teacher launches a question, it will appear here automatically.</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentPolls;
