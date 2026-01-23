import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

const stages = [
    { id: 'QUESTIONING', label: 'Questioning', color: 'bg-red-500' },
    { id: 'DEFINE', label: 'Define', color: 'bg-orange-500' },
    { id: 'RESEARCH', label: 'Research', color: 'bg-yellow-500' },
    { id: 'CREATE_IMPROVE', label: 'Create & Improve', color: 'bg-teal-500' },
    { id: 'PRESENT_EVALUATE', label: 'Present & Evaluate', color: 'bg-blue-500' }
];

const StageTracker = ({ currentStage }) => {
    const currentIndex = stages.findIndex(s => s.id === currentStage);

    return (
        <div className="w-full overflow-x-auto py-4">
            <div className="flex items-center justify-between min-w-[600px] px-2 relative">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-gray-300 -z-10 rounded-full transition-all duration-500"
                    style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
                />

                {stages.map((stage, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;

                    return (
                        <div key={stage.id} className="flex flex-col items-center gap-2 relative group">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: isActive ? 1.2 : 1 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white
                  ${isCompleted ? 'border-teal-500 text-teal-500' :
                                        isActive ? `${stage.color.replace('bg-', 'border-')} text-gray-800 shadow-lg` :
                                            'border-gray-200 text-gray-300'}
                `}
                            >
                                {isCompleted ? <CheckCircle size={20} className="fill-current" /> :
                                    isActive ? <span className="font-bold text-sm">{index + 1}</span> :
                                        <Circle size={20} />}
                            </motion.div>

                            <div className={`text-xs font-bold uppercase transition-colors duration-300 mt-2
                ${isActive ? 'text-gray-800' : 'text-gray-400'}
              `}>
                                {stage.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StageTracker;
