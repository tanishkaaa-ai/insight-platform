import React from 'react';
import { Users, Award, Star } from 'lucide-react';

const TeamCard = ({ team }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Users size={20} className="text-teal-600" />
                        {team.team_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Project Team</p>
                </div>
                <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star size={12} className="fill-current" /> Level {team.level || 1}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Members</h4>
                    <div className="flex flex-wrap gap-2">
                        {team.members.map((member) => (
                            <div key={member.student_id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">
                                    {member.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{member.name}</span>
                                <span className="text-xs text-gray-400">({member.role})</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-4">
                    <div className="flex-1 text-center">
                        <div className="text-2xl font-bold text-gray-800">{team.total_xp || 0}</div>
                        <div className="text-xs text-gray-400 font-bold uppercase">Total XP</div>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="text-2xl font-bold text-gray-800">{team.achievements?.length || 0}</div>
                        <div className="text-xs text-gray-400 font-bold uppercase">Badges</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamCard;
