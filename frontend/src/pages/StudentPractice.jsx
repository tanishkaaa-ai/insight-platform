import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Target, Lock, CheckCircle, Play, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Mastery Data
const masteryNodes = [
    { id: 1, title: 'Intro to Forensics', status: 'mastered', score: 95, x: 10, y: 10 },
    { id: 2, title: 'Crime Scene Basics', status: 'mastered', score: 88, x: 40, y: 20 },
    { id: 3, title: 'Evidence Collection', status: 'in_progress', score: 65, x: 20, y: 50 },
    { id: 4, title: 'Fingerprint Analysis', status: 'in_progress', score: 45, x: 60, y: 40 },
    { id: 5, title: 'DNA Profiling', status: 'locked', score: 0, x: 80, y: 60 },
    { id: 6, title: 'Digital Forensics', status: 'locked', score: 0, x: 50, y: 80 },
];

const StudentPractice = () => {
    const [selectedNode, setSelectedNode] = useState(null);

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
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
                        <BrainCircuit className="text-purple-500" size={20} />
                        <span className="font-bold text-gray-700">Adaptive AI Active</span>
                    </div>
                </div>

                {/* Main Area: Map & Details */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden relative grid grid-cols-1 lg:grid-cols-3">

                    {/* Concept Map Visualizer (Left 2/3) */}
                    <div className="col-span-2 bg-slate-50 relative p-8 overflow-auto flex items-center justify-center">

                        {/* Connection Lines (Simulated SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                            <path d="M100 100 L 300 200 L 150 400" stroke="#cbd5e1" strokeWidth="4" fill="none" />
                            <path d="M300 200 L 500 350 L 700 500" stroke="#cbd5e1" strokeWidth="4" fill="none" />
                        </svg>

                        {/* Nodes */}
                        <div className="relative w-full h-full max-w-2xl max-h-2xl">
                            {masteryNodes.map((node) => (
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
                            ))}
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
                                        This module is currently locked. Complete "Evidence Collection" to unlock.
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

                                        <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition-all flex items-center justify-center gap-2">
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
