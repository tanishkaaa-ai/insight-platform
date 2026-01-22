import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Target, Lock, CheckCircle, Play, BrainCircuit, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { masteryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentPractice = () => {
    const { getUserId } = useAuth();
    const [selectedNode, setSelectedNode] = useState(null);
    const [masteryNodes, setMasteryNodes] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const STUDENT_ID = getUserId();

    // Fixed positions for graph visualization (since backend doesn't store coordinates yet)
    // We'll deterministically map concepts to these slots
    const GRAPH_SLOTS = [
        { x: 10, y: 10 }, { x: 40, y: 20 }, { x: 20, y: 50 },
        { x: 60, y: 40 }, { x: 80, y: 60 }, { x: 50, y: 80 },
        { x: 30, y: 80 }, { x: 70, y: 20 }, { x: 90, y: 40 }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [masteryRes, recsRes] = await Promise.all([
                    masteryAPI.getStudentMastery(STUDENT_ID),
                    masteryAPI.getRecommendations(STUDENT_ID)
                ]);

                // Transform Mastery Data to Nodes
                const concepts = masteryRes.data.concepts || [];
                const nodes = concepts.map((concept, index) => {
                    const slot = GRAPH_SLOTS[index % GRAPH_SLOTS.length];
                    let status = 'locked';
                    if (concept.mastery_score >= 85) status = 'mastered';
                    else if (concept.mastery_score > 0) status = 'in_progress';
                    // Simple logic: unlock if previous concept has score > 50 (chained)
                    // Or if it has any score. For now, assuming if it's in the list it's unlocked or in progress.
                    // The backend returns only concepts with some interaction usually, or all if initialized.
                    // Let's assume if score > 0 it's unlocked.
                    if (concept.mastery_score === 0) status = 'locked';
                    // To make it look better for demo, let's unlock "next" empty ones if we have few
                    if (concept.mastery_score === 0 && index === 0) status = 'in_progress'; // Always unlock first

                    return {
                        id: concept.concept_id,
                        title: concept.concept_name,
                        status: status,
                        score: Math.round(concept.mastery_score),
                        x: slot.x,
                        y: slot.y,
                        // Add some randomness to bubbles so they don't look too rigid
                        x: slot.x + (Math.random() * 5 - 2.5),
                        y: slot.y + (Math.random() * 5 - 2.5)
                    };
                });

                // If no data, keep some mock nodes or show empty state?
                // For demo, if empty, we might want to seed some data or handle it.
                // But the user wants "Real API". If API returns empty, UI should reflect that.

                setMasteryNodes(nodes);
                setRecommendations(recsRes.data.recommendations || []);

            } catch (err) {
                console.error("Error loading practice data:", err);
                setError("Failed to load your mastery path.");
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
    }, [STUDENT_ID]);

    const handleStartPractice = () => {
        alert("Generating personalized practice session... (Feature linking to /api/mastery/practice/generate coming soon)");
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
        </DashboardLayout>
    );
};

export default StudentPractice;
