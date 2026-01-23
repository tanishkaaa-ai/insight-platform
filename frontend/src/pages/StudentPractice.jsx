import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Target, Lock, CheckCircle, Play, BrainCircuit, Loader2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { masteryAPI, classroomAPI, practiceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
                console.info('[PRACTICE] Mastery data retrieved:', {
                    concepts_count: masteryRes.data.concepts?.length || 0,
                    overall_mastery: masteryRes.data.overall_mastery,
                    recommendations_count: recsRes.data.recommendations?.length || 0
                });

                const concepts = masteryRes.data.concepts || [];
                const nodes = concepts.map((concept, index) => {
                    const slot = GRAPH_SLOTS[index % GRAPH_SLOTS.length];
                    // trust backend status
                    let status = concept.status || 'locked';

                    // Map 'available' to 'in_progress' visually if we want them clickable, 
                    // or keep 'available' and style it specifically.
                    // Let's treat 'available' similar to 'in_progress' but gray/blue?
                    // For now, let's map 'available' to 'available' and update styles.

                    return {
                        id: concept.concept_id,
                        title: concept.concept_name,
                        status: status,
                        score: Math.round(concept.mastery_score),
                        // Add some randomness to bubbles so they don't look too rigid
                        x: slot.x + (Math.random() * 5 - 2.5),
                        y: slot.y + (Math.random() * 5 - 2.5)
                    };
                });

                setMasteryNodes(nodes);
                setRecommendations(recsRes.data.recommendations || []);
                console.info('[PRACTICE] Nodes and recommendations set:', {
                    node_count: nodes.length,
                    mastered: nodes.filter(n => n.status === 'mastered').length,
                    available: nodes.filter(n => n.status === 'available' || n.status === 'in_progress').length,
                    locked: nodes.filter(n => n.status === 'locked').length
                });

            } catch (err) {
                console.error("[PRACTICE] Error loading practice data:", {
                    error: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    student_id: STUDENT_ID
                });
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
            setMasteryNodes(prev => prev.map(node =>
                node.id === currentItem.concept_id
                    ? { ...node, score: Math.round(masteryResponse.data.mastery_score), status: masteryResponse.data.mastery_score > 0 ? 'in_progress' : node.status }
                    : node
            ));

        } catch (error) {
            console.error('[PRACTICE] Failed to submit answer:', error);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < currentSession.content_items.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionStartTime(Date.now());
        } else {
            // End of session
            setShowPracticeModal(false);
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
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <p className="text-gray-500">{error}</p>
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
                        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                            <Target className="text-green-500" /> Practice Zone
                        </h1>
                        <p className="text-gray-500 mt-1">Master concepts to unlock new levels and earn XP!</p>

                        <div className="mt-4 w-64">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg border border-purple-400 flex items-center gap-2 animate-pulse">
                            <BrainCircuit size={20} />
                            <span className="font-bold text-sm">Recommended: {recommendations[0].concept_name}</span>
                        </div>
                    )}
                </div>

                {/* Main Area: Map & Details */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden relative grid grid-cols-1 lg:grid-cols-3">

                    {/* Concept Map Visualizer (Left 2/3) */}
                    <div className="col-span-2 bg-slate-50 relative p-8 overflow-auto flex items-center justify-center">

                        {/* Connection Lines (Decoration) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                            <path d="M100 100 L 300 200 L 150 400" stroke="#cbd5e1" strokeWidth="4" fill="none" />
                            <path d="M300 200 L 500 350 L 700 500" stroke="#cbd5e1" strokeWidth="4" fill="none" />
                        </svg>

                        {/* Nodes */}
                        <div className="relative w-full h-full max-w-2xl max-h-2xl">
                            {masteryNodes.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 flex-col">
                                    <Target size={48} className="mb-4 opacity-20" />
                                    <p>No mastery data yet. Complete assignments to see your progress!</p>
                                </div>
                            ) : (
                                masteryNodes.map((node) => (
                                    <motion.button
                                        key={node.id}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setSelectedNode(node)}
                                        className={`absolute w-32 p-3 rounded-xl shadow-lg border-2 flex flex-col items-center justify-center gap-2 transition-all z-10
                         ${node.status === 'mastered' ? 'bg-green-50 border-green-500 text-green-700' :
                                                node.status === 'in_progress' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' :
                                                    node.status === 'available' ? 'bg-blue-50 border-blue-400 text-blue-700' :
                                                        'bg-gray-100 border-gray-300 text-gray-400 grayscale'}
                         ${selectedNode?.id === node.id ? 'ring-4 ring-offset-2 ring-blue-200' : ''}
                       `}
                                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                    >
                                        {node.status === 'locked' ? <Lock size={20} /> :
                                            node.status === 'mastered' ? <CheckCircle size={20} /> :
                                                <Target size={20} />}
                                        <span className="font-bold text-xs text-center leading-tight">{node.title}</span>
                                        {node.status !== 'locked' && <span className="text-xs font-mono bg-white/50 px-1 rounded">{node.score}%</span>}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Details Panel (Right 1/3) */}
                    <div className="bg-white border-l border-gray-100 p-6 flex flex-col justify-center">
                        {selectedNode ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={selectedNode.id}
                                className="space-y-6 text-center"
                            >
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl shadow-inner
                   ${selectedNode.status === 'mastered' ? 'bg-green-100 text-green-600' :
                                        selectedNode.status === 'in_progress' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-gray-100 text-gray-400'}
                `}>
                                    {selectedNode.status === 'locked' ? <Lock /> : <BrainCircuit />}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-extrabold text-gray-800">{selectedNode.title}</h2>
                                    <p className="text-gray-500 uppercase tracking-wider text-xs font-bold mt-2">
                                        Status: {selectedNode.status.replace('_', ' ')}
                                    </p>
                                </div>

                                {selectedNode.status === 'locked' ? (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
                                        This module is currently locked. Complete prerequisites to unlock.
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500">Mastery Score</p>
                                                <p className="font-bold text-xl text-gray-800">{selectedNode.score}%</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500">Est. Time</p>
                                                <p className="font-bold text-xl text-gray-800">15m</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowHistoryModal(true)}
                                            className="w-full py-2 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors mb-2"
                                        >
                                            View Progress History
                                        </button>

                                        <button
                                            onClick={handleStartPractice}
                                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition-all flex items-center justify-center gap-2"
                                        >
                                            <Play size={20} fill="currentColor" />
                                            Start Practice Session
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <div className="text-center text-gray-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{concept.title} - Progress</h3>
                        <p className="text-sm text-gray-500">Mastery history over time</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-gray-500 text-sm">Current Score</span>
                            <div className="text-2xl font-bold text-gray-800">{concept.score}%</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-gray-500 text-sm">Learning Velocity</span>
                            <div className={`text-2xl font-bold ${velocity >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {velocity > 0 ? '+' : ''}{velocity.toFixed(1)}/session
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-gray-500 text-sm">Practice Sessions</span>
                            <div className="text-2xl font-bold text-gray-800">{history.length}</div>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" /></div>
                        ) : history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="mastery_score"
                                        stroke="#4F46E5"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Practice Session</h3>
                        <p className="text-sm text-gray-500">Question {questionIndex + 1} of {session.content_items.length}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1">
                    <div className="mb-8">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider
                            ${(currentItem.difficulty || 0.5) > 0.7 ? 'bg-red-100 text-red-600' :
                                (currentItem.difficulty || 0.5) > 0.4 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                            {(currentItem.difficulty || 0.5) > 0.7 ? 'Hard' : (currentItem.difficulty || 0.5) > 0.4 ? 'Medium' : 'Easy'}
                        </span>
                        <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">{currentItem.question}</h2>
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
                                                ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                                            ${selectedAnswer === option ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {selectedAnswer === option && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                                        </div>
                                        <span className="text-lg">{option}</span>
                                    </button>
                                ))
                            ) : (
                                <textarea
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="Type your answer here..."
                                    rows={4}
                                    value={selectedAnswer}
                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                />
                            )}
                        </div>
                    ) : (
                        <div className={`p-6 rounded-2xl border-2 mb-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500
                            ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>

                            <div className="mb-4">
                                {isCorrect ? (
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                        <CheckCircle size={32} />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                                        <X size={32} />
                                    </div>
                                )}
                            </div>

                            <h3 className={`text-2xl font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                {isCorrect ? 'Correct!' : 'Not quite right'}
                            </h3>

                            {!isCorrect && (
                                <p className="text-gray-600 mb-2">
                                    The correct answer is: <span className="font-bold">{currentItem.correct_answer}</span>
                                </p>
                            )}

                            {currentItem.explanation && (
                                <div className="mt-4 p-4 bg-white/50 rounded-xl text-left text-sm text-gray-700">
                                    <span className="font-bold block mb-1">Explanation:</span>
                                    {currentItem.explanation}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    {!showFeedback ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedAnswer || submitting}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
