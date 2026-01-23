import React from 'react';
import { Calendar, CheckCircle, Circle, Clock } from 'lucide-react';

const MilestoneTimeline = ({ milestones }) => {
    return (
        <div className="space-y-6 relative ml-4 border-l-2 border-gray-100 pl-8 py-2">
            {milestones.map((milestone, index) => (
                <div key={milestone.milestone_id} className="relative">
                    {/* Node */}
                    <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border-4 bg-white z-10 
            ${milestone.is_completed ? 'border-teal-500' : 'border-gray-200'}
          `}>
                        {milestone.is_completed && <div className="w-full h-full bg-teal-500 rounded-full scale-50" />}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className={`font-bold text-lg ${milestone.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {milestone.title}
                            </h4>
                            <div className={`px-2 py-1 rounded text-xs font-bold uppercase
                    ${milestone.is_completed ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}
                `}>
                                {milestone.is_completed ? 'Completed' : 'Pending'}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{milestone.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <Calendar size={14} /> Due: {new Date(milestone.due_date).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MilestoneTimeline;
