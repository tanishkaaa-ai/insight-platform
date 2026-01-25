import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Target, Lock, CheckCircle, Play, BrainCircuit, Loader2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { masteryAPI, classroomAPI, practiceAPI, engagementAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useTabDetection from '../hooks/useTabDetection';

const StudentPractice = () => {
    const { getUserId } = useAuth();
    const [selectedNode, setSelectedNode] = useState(null);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [masteryNodes, setMasteryNodes] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Practice Session State
    const [currentSession, setCurrentSession] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showPracticeModal, setShowPracticeModal] = useState(false);
    const [questionStartTime, setQuestionStartTime] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const STUDENT_ID = getUserId();

    // Fixed positions for graph visualization (since backend doesn't store coordinates yet)
    // We'll deterministically map concepts to these slots
    const GRAPH_SLOTS = [
        { x: 10, y: 10 }, { x: 40, y: 20 }, { x: 20, y: 50 },
        { x: 60, y: 40 }, { x: 80, y: 60 }, { x: 50, y: 80 },
        { x: 30, y: 80 }, { x: 70, y: 20 }, { x: 90, y: 40 }
    ];

    // Helper function to calculate nodes state
    const calculateGraphNodes = (rawConcepts, levelStatus = {}) => {
        // Sort concepts by Level first, then Creation Date
        const sortedConcepts = [...rawConcepts].sort((a, b) => {
            const levelA = a.level || 1;
            const levelB = b.level || 1;
            if (levelA !== levelB) return levelA - levelB;
            if (a.created_at && b.created_at) return new Date(a.created_at) - new Date(b.created_at);
            return (a.concept_name || '').localeCompare(b.concept_name || '');
        });

        return sortedConcepts.map((concept, index) => {
            const level = concept.level || 1;
            const isLevelLocked = levelStatus[level]?.status === 'locked';

            let status = concept.status || 'available';

            if (isLevelLocked) {
                status = 'locked';
            } else if (status === 'locked') {
                // Backend says unlocked, but local legacy status was locked
                status = 'available';
            }

            // Force Mastered visual
            if ((concept.mastery_score || 0) >= 85) {
                status = 'mastered';
            }

            return {
                id: concept.concept_id,
                title: concept.concept_name,
                level: level,
                status: status,
                score: Math.round(concept.mastery_score || 0),
                x: 0, // Will be handled by renderer or grid layout
                y: 0,
                _raw: concept
            };
        });
    };

    useEffect(() => {
        fetchStudentClasses();
    }, [STUDENT_ID]);

    const fetchStudentClasses = async () => {
        if (!STUDENT_ID) return;
        try {
            const res = await classroomAPI.getStudentClasses(STUDENT_ID);
            setClasses(res.data);
            if (res.data.length > 0) {
                setSelectedClass(res.data[0].classroom_id);
            }
        } catch (err) {
            console.error("Failed to load classes", err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedClass) {
                setMasteryNodes([]);
                setRecommendations([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.info('[PRACTICE] Fetching mastery data:', { student_id: STUDENT_ID, classroom_id: selectedClass });

                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), 10000)
                );

                const dataPromise = Promise.all([
                    masteryAPI.getStudentMastery(STUDENT_ID, { classroom_id: selectedClass }),
                    masteryAPI.getRecommendations(STUDENT_ID)
                ]);

                const [masteryRes, recsRes] = await Promise.race([dataPromise, timeoutPromise]);

                const concepts = masteryRes.data.concepts || [];
                const levelStatus = masteryRes.data.level_status || {};

                // Calculate nodes using shared logic with Level Status
                const nodes = calculateGraphNodes(concepts, levelStatus);

                setMasteryNodes(nodes);
                setRecommendations(recsRes.data.recommendations || []);
                console.info('[PRACTICE] Nodes set:', {
                    count: nodes.length,
                    levels: Object.keys(levelStatus)
                });

            } catch (err) {
                console.error("[PRACTICE] Error loading practice data:", err);
                setError(`Failed to load mastery path: ${err.message}`);
                toast.error(`Error loading practice data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (STUDENT_ID) {
            fetchData();
        } else {
            setLoading(false);
            setError("Please log in to view your practice zone.");
        }
    }, [selectedClass]); // Depend on selectedClass

    const handleAnswerSubmit = async (answer, isCorrect) => {
        const responseTime = Date.now() - questionStartTime;
        const currentItem = currentSession.content_items[currentQuestionIndex];

        console.info('[PRACTICE] Submitting answer:', {
            concept_id: currentItem.concept_id,
            is_correct: isCorrect,
            response_time: responseTime
        });

        try {
            // 1. Calculate and update Mastery
            const masteryResponse = await masteryAPI.calculateMastery({
                student_id: STUDENT_ID,
                concept_id: currentItem.concept_id,
                is_correct: isCorrect,
                response_time: responseTime,
                current_mastery: selectedNode ? selectedNode.score : 0,
                difficulty: currentItem.difficulty || 0.5
            });

            console.info('[PRACTICE] Mastery updated:', masteryResponse.data);

            // 2. Submit detailed response log
            await masteryAPI.submitResponse({
                student_id: STUDENT_ID,
                item_id: currentItem.item_id,
                concept_id: currentItem.concept_id,
                is_correct: isCorrect,
                response_time: responseTime,
                response_text: answer
            });

            // 3. Update local graph state
            // 3. Update local graph state AND re-calculate locks
            setMasteryNodes(prevNodes => {
                // 1. Reconstruct raw concepts list from nodes (we stored _raw in step 1)
                // If _raw is missing, we might have trouble.
                // Alternative: Update the specific node's _raw data, then recalculate all.

                const updatedConcepts = prevNodes.map(node => {
                    if (node.id === currentItem.concept_id) {
                        return {
                            ...node._raw,
                            mastery_score: masteryResponse.data.mastery_score
                        };
                    }
                    return node._raw;
                });

                // 2. Re-run calculation to propagate unlock status
                return calculateGraphNodes(updatedConcepts);
            });

        } catch (error) {
            console.error('[PRACTICE] Failed to submit answer:', error);
        }
    };

    const handleNextQuestion = async () => {
        if (currentQuestionIndex < currentSession.content_items.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionStartTime(Date.now());
        } else {
            // End of session
            setShowPracticeModal(false);

            try {
                // Trigger engagement analysis to update XP/Levels
                await engagementAPI.analyzeEngagement({ student_id: STUDENT_ID });
            } catch (err) {
                console.error("Failed to update engagement stats", err);
            }

            toast.success("Practice session completed! Great job!", { duration: 4000 });
        }
    };

    const handleStartPractice = async () => {
        console.info('[PRACTICE] Generating practice session:', { student_id: STUDENT_ID, classroom_id: selectedClass });
        setLoading(true);

        try {
            const payload = {
                student_id: STUDENT_ID,
                session_duration: 20,
                classroom_id: selectedClass
            };

            if (selectedNode) {
                payload.concept_id = selectedNode.id;
            }

            const response = await practiceAPI.generateSession(payload);

            console.info('[PRACTICE] Session generated:', {
                session_id: response.data.session_id,
                item_count: response.data.content_items.length,
                duration: response.data.estimated_duration
            });

            if (response.data.content_items && response.data.content_items.length > 0) {
                setCurrentSession(response.data);
                setCurrentQuestionIndex(0);
                setQuestionStartTime(Date.now());
                setShowPracticeModal(true);
            } else {
                toast("No practice items found for this selection yet.", { icon: "ℹ️" });
            }

        } catch (error) {
            console.error('[PRACTICE] Failed to generate session:', error);
            toast.error('Failed to generate practice session');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
                    <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading knowledge map...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                    <div className="bg-red-900/20 p-4 rounded-full text-red-400 mb-4 border border-red-500/30">
                        <AlertCircle size={32} />
                    </div>
                    <p className="text-[#EAE0CF]/70">{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col">

                {/* Header */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#EAE0CF] flex items-center gap-2">
                            <Target className="text-green-400" /> Practice Zone
                        </h1>
                        <p className="text-[#EAE0CF]/60 mt-1">Master concepts to unlock new levels and earn XP!</p>

                        <div className="mt-4 w-64">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full bg-[#213448] border border-[#EAE0CF]/20 text-[#EAE0CF] py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#547792]"
                            >
                                <option value="" disabled>Select Class Context</option>
                                {classes.map(cls => (
                                    <option key={cls.classroom_id} value={cls.classroom_id}>
                                        {cls.class_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {recommendations.length > 0 && (
                        <div className="bg-gradient-to-r from-[#547792] to-[#213448] text-[#EAE0CF] px-4 py-2 rounded-xl shadow-lg border border-[#EAE0CF]/20 flex items-center gap-2 animate-pulse">
                            <BrainCircuit size={20} />
                            <span className="font-bold text-sm">Recommended: {recommendations[0].concept_name}</span>
                        </div>
                    )}
                </div>

                {/* Main Area: Map & Details */}
                <div className="flex-1 bg-[#213448] rounded-3xl shadow-sm border border-[#EAE0CF]/20 overflow-hidden relative grid grid-cols-1 lg:grid-cols-3">

                    {/* Concept Map Visualizer (Left 2/3) */}
                    <div className="col-span-2 bg-[#1a2c3d] relative p-8 overflow-auto flex items-center justify-center">

                        {/* Connection Lines (Decoration) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                            <path d="M100 100 L 300 200 L 150 400" stroke="#EAE0CF" strokeWidth="4" fill="none" />
                            <path d="M300 200 L 500 350 L 700 500" stroke="#EAE0CF" strokeWidth="4" fill="none" />
                        </svg>

                        {/* Nodes */}
                        <div className="relative w-full h-full max-w-4xl mx-auto py-8">
                            {masteryNodes.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-[#EAE0CF]/30 flex-col">
                                    <Target size={48} className="mb-4 opacity-50" />
                                    <p>No mastery data yet. Complete assignments to see your progress!</p>
                                </div>
                            ) : (
                                // Group by levels for rendering
                                Array.from(new Set(masteryNodes.map(n => n.level || 1)))
                                    .sort((a, b) => a - b)
                                    .map(level => (
                                        <div key={level} className="mb-12 relative">
                                            <div className="absolute -left-4 top-0 bottom-0 border-l-2 border-dashed border-[#EAE0CF]/10" />
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="bg-[#547792] text-[#EAE0CF] px-3 py-1 rounded-full text-xs font-bold border border-[#EAE0CF]/20 z-10">
                                                    LEVEL {level}
                                                </div>
                                                <div className="h-px bg-[#EAE0CF]/10 flex-1" />
                                            </div>

                                            <div className="flex flex-wrap gap-4 pl-4">
                                                {masteryNodes.filter(n => (n.level || 1) === level).map(node => (
                                                    <motion.button
                                                        key={node.id}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setSelectedNode(node)}
                                                        className={`w-40 p-3 rounded-xl shadow-sm border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative
                                                          ${node.status === 'mastered' ? 'bg-green-900/40 border-green-500/50 text-green-300' :
                                                                node.status === 'in_progress' ? 'bg-yellow-900/40 border-yellow-500/50 text-yellow-300' :
                                                                    node.status === 'available' ? 'bg-[#547792] border-transparent text-white hover:bg-[#547792]/80' :
                                                                        'bg-[#213448]/50 border-[#EAE0CF]/5 text-[#EAE0CF]/20 grayscale cursor-not-allowed'}
                                                          ${selectedNode?.id === node.id ? 'ring-4 ring-offset-2 ring-offset-[#213448] ring-[#EAE0CF]' : ''}
                                                        `}
                                                    >
                                                        {node.status === 'locked' ? <Lock size={20} /> :
                                                            node.status === 'mastered' ? <CheckCircle size={20} /> :
                                                                <Target size={20} />}

                                                        <span className="font-bold text-xs text-center leading-tight line-clamp-2">{node.title}</span>

                                                        {node.status !== 'locked' && (
                                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                                                <div
                                                                    className={`h-full ${node.score >= 85 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                    style={{ width: `${node.score}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Details Panel (Right 1/3) */}
                    <div className="bg-[#213448] border-l border-[#EAE0CF]/10 p-6 flex flex-col justify-center">
                        {selectedNode ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={selectedNode.id}
                                className="space-y-6 text-center"
                            >
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl shadow-inner
                   ${selectedNode.status === 'mastered' ? 'bg-green-900/40 text-green-400' :
                                        selectedNode.status === 'in_progress' ? 'bg-yellow-900/40 text-yellow-400' :
                                            'bg-[#1a2c3d] text-[#EAE0CF]/20'}
                `}>
                                    {selectedNode.status === 'locked' ? <Lock /> : <BrainCircuit />}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-extrabold text-[#EAE0CF]">{selectedNode.title}</h2>
                                    <p className="text-[#EAE0CF]/50 uppercase tracking-wider text-xs font-bold mt-2">
                                        Status: {selectedNode.status.replace('_', ' ')}
                                    </p>
                                </div>

                                {selectedNode.status === 'locked' ? (
                                    <div className="bg-red-900/20 text-red-300 p-4 rounded-xl text-sm font-medium border border-red-500/20">
                                        This module is currently locked. Attempt the previous module to unlock.
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <div className="bg-[#547792]/20 p-3 rounded-lg border border-[#EAE0CF]/5">
                                                <p className="text-xs text-[#EAE0CF]/60">Mastery Score</p>
                                                <p className="font-bold text-xl text-[#EAE0CF]">{selectedNode.score}%</p>
                                            </div>
                                            <div className="bg-[#547792]/20 p-3 rounded-lg border border-[#EAE0CF]/5">
                                                <p className="text-xs text-[#EAE0CF]/60">Est. Time</p>
                                                <p className="font-bold text-xl text-[#EAE0CF]">15m</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowHistoryModal(true)}
                                            className="w-full py-2 bg-[#213448] border-2 border-[#EAE0CF]/20 text-[#EAE0CF]/70 font-bold rounded-xl hover:bg-[#547792] hover:text-[#EAE0CF] transition-colors mb-2"
                                        >
                                            View Progress History
                                        </button>

                                        <button
                                            onClick={handleStartPractice}
                                            className="w-full py-4 bg-[#EAE0CF] text-[#213448] font-bold rounded-xl shadow-lg hover:bg-white hover:scale-[1.02] transform transition-all flex items-center justify-center gap-2"
                                        >
                                            <Play size={20} fill="currentColor" />
                                            Start Practice Session
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <div className="text-center text-[#EAE0CF]/30">
                                <Target size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Select a topic from the map to view details and start practicing.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showPracticeModal && currentSession && (
                <PracticeSessionModal
                    session={currentSession}
                    questionIndex={currentQuestionIndex}
                    onClose={() => setShowPracticeModal(false)}
                    onAnswer={handleAnswerSubmit}
                    onNext={handleNextQuestion}
                />
            )}

            {showHistoryModal && selectedNode && (
                <ConceptHistoryModal
                    studentId={STUDENT_ID}
                    concept={selectedNode}
                    onClose={() => setShowHistoryModal(false)}
                />
            )}
        </DashboardLayout>
    );
};

export default StudentPractice;

const ConceptHistoryModal = ({ studentId, concept, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await masteryAPI.getHistory(studentId, concept.id);
                setHistory(response.data.history || []);
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };

        if (concept.id) {
            fetchHistory();
        }
    }, [concept.id, studentId]);

    // Calculate simplified velocity (change over last few sessions)
    const velocity = history.length > 1
        ? (history[history.length - 1].mastery_score - history[0].mastery_score) / history.length
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#213448] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#EAE0CF]/20"
            >
                <div className="p-6 border-b border-[#EAE0CF]/10 flex justify-between items-center bg-[#1a2c3d]">
                    <div>
                        <h3 className="text-xl font-bold text-[#EAE0CF]">{concept.title} - Progress</h3>
                        <p className="text-sm text-[#EAE0CF]/60">Mastery history over time</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#547792]/50 rounded-full text-[#EAE0CF]/60">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="p-4 bg-[#1a2c3d] rounded-2xl border border-[#EAE0CF]/10">
                            <span className="text-[#EAE0CF]/60 text-sm">Current Score</span>
                            <div className="text-2xl font-bold text-[#EAE0CF]">{concept.score}%</div>
                        </div>
                        <div className="p-4 bg-[#1a2c3d] rounded-2xl border border-[#EAE0CF]/10">
                            <span className="text-[#EAE0CF]/60 text-sm">Learning Velocity</span>
                            <div className={`text-2xl font-bold ${velocity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {velocity > 0 ? '+' : ''}{velocity.toFixed(1)}/session
                            </div>
                        </div>
                        <div className="p-4 bg-[#1a2c3d] rounded-2xl border border-[#EAE0CF]/10">
                            <span className="text-[#EAE0CF]/60 text-sm">Practice Sessions</span>
                            <div className="text-2xl font-bold text-[#EAE0CF]">{history.length}</div>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#EAE0CF]/20" /></div>
                        ) : history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE0CF" strokeOpacity={0.1} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#EAE0CF"
                                        strokeOpacity={0.4}
                                        tick={{ fontSize: 12, fill: '#EAE0CF', opacity: 0.6 }}
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="#EAE0CF" strokeOpacity={0.4} tick={{ fontSize: 12, fill: '#EAE0CF', opacity: 0.6 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a2c3d', borderRadius: '12px', border: '1px solid rgba(234, 224, 207, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', color: '#EAE0CF' }}
                                        itemStyle={{ color: '#EAE0CF' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="mastery_score"
                                        stroke="#547792"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#213448', stroke: '#547792' }}
                                        activeDot={{ r: 6, fill: '#EAE0CF' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[#EAE0CF]/30 border-2 border-dashed border-[#EAE0CF]/10 rounded-2xl">
                                No history data available yet. Start practicing!
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const PracticeSessionModal = ({ session, questionIndex, onClose, onAnswer, onNext }) => {
    const currentItem = session.content_items[questionIndex];
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Reset state when question changes
    useEffect(() => {
        setSelectedAnswer('');
        setShowFeedback(false);
        setIsCorrect(false);
        setSubmitting(false);
    }, [currentItem]);

    const { user } = useAuth();
    const { isFlagged } = useTabDetection(user?.user_id || user?.id, 'practice_session', session.session_id);

    const handleSubmit = async () => {
        if (!selectedAnswer) return;

        setSubmitting(true);
        // Basic check for exact match or contained (for text)
        // For multiple choice, exact match
        // For practice, we assume 'correct_answer' is the string value
        const correct = selectedAnswer === currentItem.correct_answer;
        setIsCorrect(correct);

        // Call parent handler
        try {
            await onAnswer(selectedAnswer, correct);
            setShowFeedback(true);
        } catch (error) {
            console.error("Answer submission failed", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (isFlagged) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-center p-8 border-2 border-red-500"
                >
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={48} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Session Terminated</h2>
                    <p className="text-gray-600 mb-6">
                        Academic integrity violation detected. You switched tabs during an active practice session.
                        This incident has been flagged to your instructor.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                    >
                        Close Session
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#213448] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#EAE0CF]/20"
            >
                {/* Header */}
                <div className="p-6 border-b border-[#EAE0CF]/10 flex justify-between items-center bg-[#1a2c3d]">
                    <div>
                        <h3 className="text-xl font-bold text-[#EAE0CF]">Practice Session</h3>
                        <p className="text-sm text-[#EAE0CF]/60">Question {questionIndex + 1} of {session.content_items.length}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#547792]/50 rounded-full text-[#EAE0CF]/60">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1">
                    <div className="mb-8">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider
                            ${(currentItem.difficulty || 0.5) > 0.7 ? 'bg-red-900/20 text-red-400' :
                                (currentItem.difficulty || 0.5) > 0.4 ? 'bg-yellow-900/20 text-yellow-400' : 'bg-green-900/20 text-green-400'}`}>
                            {(currentItem.difficulty || 0.5) > 0.7 ? 'Hard' : (currentItem.difficulty || 0.5) > 0.4 ? 'Medium' : 'Easy'}
                        </span>
                        <h2 className="text-2xl font-bold text-[#EAE0CF] leading-relaxed">{currentItem.question}</h2>
                    </div>

                    {!showFeedback ? (
                        <div className="space-y-4">
                            {currentItem.options && currentItem.options.length > 0 ? (
                                currentItem.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedAnswer(option)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3
                                            ${selectedAnswer === option
                                                ? 'border-[#547792] bg-[#547792]/20 text-[#EAE0CF] shadow-md'
                                                : 'border-[#EAE0CF]/10 hover:border-[#547792] hover:bg-[#1a2c3d] text-[#EAE0CF]/80'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                                            ${selectedAnswer === option ? 'border-[#547792]' : 'border-[#EAE0CF]/30'}`}>
                                            {selectedAnswer === option && <div className="w-3 h-3 rounded-full bg-[#547792]" />}
                                        </div>
                                        <span className="text-lg">{option}</span>
                                    </button>
                                ))
                            ) : (
                                <textarea
                                    className="w-full p-4 border-2 border-[#EAE0CF]/20 rounded-xl focus:border-[#547792] outline-none bg-[#1a2c3d] text-[#EAE0CF] placeholder-[#EAE0CF]/30"
                                    placeholder="Type your answer here..."
                                    rows={4}
                                    value={selectedAnswer}
                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                />
                            )}
                        </div>
                    ) : (
                        <div className={`p-6 rounded-2xl border-2 mb-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500
                            ${isCorrect ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>

                            <div className="mb-4">
                                {isCorrect ? (
                                    <div className="w-16 h-16 bg-green-900/40 rounded-full flex items-center justify-center mx-auto text-green-400">
                                        <CheckCircle size={32} />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center mx-auto text-red-400">
                                        <X size={32} />
                                    </div>
                                )}
                            </div>

                            <h3 className={`text-2xl font-bold mb-2 ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                                {isCorrect ? 'Correct!' : 'Not quite right'}
                            </h3>

                            {!isCorrect && (
                                <p className="text-[#EAE0CF]/70 mb-2">
                                    The correct answer is: <span className="font-bold text-[#EAE0CF]">{currentItem.correct_answer}</span>
                                </p>
                            )}

                            {currentItem.explanation && (
                                <div className="mt-4 p-4 bg-[#1a2c3d] rounded-xl text-left text-sm text-[#EAE0CF]/80 border border-[#EAE0CF]/10">
                                    <span className="font-bold block mb-1 text-[#EAE0CF]">Explanation:</span>
                                    {currentItem.explanation}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#EAE0CF]/10 bg-[#1a2c3d] flex justify-between items-center">
                    {!showFeedback ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedAnswer || submitting}
                            className="w-full py-4 bg-[#EAE0CF] text-[#213448] font-bold rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : 'Check Answer'}
                        </button>
                    ) : (
                        <button
                            onClick={onNext}
                            className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-black flex items-center justify-center gap-2"
                        >
                            Continue <ArrowRight size={20} />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
