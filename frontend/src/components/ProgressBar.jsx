import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ value, max = 100, color = 'bg-orange-500', height = 'h-4', showLabel = true, label }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between mb-1 text-sm font-bold text-gray-600">
                    <span>{label || 'Progress'}</span>
                    <span>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height} shadow-inner`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color} relative`}
                >
                    {/* Shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full animate-shimmer" />

                    {/* Stripes pattern */}
                    <div
                        className="w-full h-full opacity-20"
                        style={{
                            backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                            backgroundSize: '1rem 1rem'
                        }}
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default ProgressBar;
