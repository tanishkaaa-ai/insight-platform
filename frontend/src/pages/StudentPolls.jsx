import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// Reusing logic from original LivePolling.jsx but simplified for Student Portal
const StudentPolls = () => {
    // In a real app, this would come from a Context or API call
    const [activePoll, setActivePoll] = useState({
        id: 'poll_1',
        question: 'Do you feel confident about today\'s evidence collection technique?',
        options: ['Yes, fully confident', 'Mostly understand', 'Need a bit more practice', 'Did not understand'],
        responses: []
    });

    const [hasResponded, setHasResponded] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    const submitResponse = (option) => {
        setSelectedOption(option);
        setHasResponded(true);
        // API call would go here
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto py-10">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1 rounded-full text-sm font-bold animate-pulse mb-4">
                        <span className="w-2 h-2 bg-red-600 rounded-full" /> LIVE SESSION
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Live Poll Active!</h1>
                    <p className="text-gray-500 mt-2">Your teacher has requested your feedback. 100% Anonymous.</p>
                </div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 relative overflow-hidden"
                >
                    {/* Background blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />

                    <h2 className="text-2xl font-bold text-gray-800 mb-6 relative z-10">{activePoll.question}</h2>

                    {!hasResponded ? (
                        <div className="space-y-4 relative z-10">
                            {activePoll.options.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.02, backgroundColor: '#fff7ed' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => submitResponse(option)}
                                    className="w-full p-5 text-left border-2 border-gray-100 rounded-2xl hover:border-orange-300 transition-all font-medium text-gray-700 flex items-center justify-between group"
                                >
                                    <span>{option}</span>
                                    <span className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-orange-400 flex items-center justify-center">
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
                                className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle size={40} />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Response Submitted!</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Thanks for participating. You selected <span className="font-bold text-gray-800">"{selectedOption}"</span>.
                                Waiting for teacher to close the poll...
                            </p>
                            <div className="mt-8 flex justify-center">
                                <Clock className="animate-spin text-orange-400" size={24} />
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default StudentPolls;
