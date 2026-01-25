import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { Loader2, TrendingUp, AlertCircle, CheckCircle, BarChart2 } from 'lucide-react';

const StudentSoftSkillsProfile = ({ studentId, teamId: propTeamId }) => {
    const [skills, setSkills] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSkills = async () => {
            console.info('[SOFT_SKILLS] Fetching profile:', { student_id: studentId, team_id: propTeamId });

            try {
                let targetTeamId = propTeamId;

                // If no teamId provided, try to find one from student's teams
                if (!targetTeamId) {
                    const teamsRes = await projectsAPI.getStudentTeams(studentId);
                    // Use the most recent team if available (assuming list might not be sorted, we take the first as fallback or sort?)
                    // For now, keeping existing behavior of taking the first one if not provided
                    targetTeamId = teamsRes.data.teams?.[0]?.team_id;
                }

                if (targetTeamId) {
                    const response = await projectsAPI.getStudentSoftSkills(studentId, targetTeamId);
                    setSkills(response.data);

                    console.info('[SOFT_SKILLS] Profile loaded:', {
                        overall_score: response.data.overall_soft_skills_score,
                        reviews_count: response.data.total_reviews_received
                    });
                } else {
                    // No team found, maybe fetch aggregate? 
                    // API supports fetching without team_id for aggregate (implied by pbl_workflow_routes.py analysis)
                    // Let's try fetching without teamId if none found
                    const response = await projectsAPI.getStudentSoftSkills(studentId, null);
                    setSkills(response.data);
                }

            } catch (error) {
                console.error('[SOFT_SKILLS] Failed to load:', error);
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchSkills();
        }
    }, [studentId, propTeamId]);

    if (loading) return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-center min-h-[300px]">
            <Loader2 className="animate-spin text-gray-300" />
        </div>
    );

    if (!skills || !skills.dimension_scores) return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-center min-h-[300px] text-gray-400">
            No soft skills data available yet. Receive peer reviews to unlock your profile!
        </div>
    );

    return (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                        <BarChart2 className="text-blue-500" /> Soft Skills Profile
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Based on {skills.total_reviews_received} peer reviews</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-center">
                    <span className="block text-3xl font-extrabold text-blue-600 leading-none">
                        {skills.overall_soft_skills_score ? skills.overall_soft_skills_score.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Overall</span>
                </div>
            </div>

            {/* 4D Dimensions */}
            <div className="grid grid-cols-1 gap-4 mb-8">
                {Object.entries(skills.dimension_scores).map(([dimension, scoreData]) => (
                    <div key={dimension} className="">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold text-gray-700 capitalize">
                                {scoreData.dimension_name || dimension.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{typeof scoreData === 'number' ? scoreData.toFixed(1) : scoreData.average_rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out
                    ${(typeof scoreData === 'number' ? scoreData : scoreData.average_rating) >= 4.0 ? 'bg-green-500' : (typeof scoreData === 'number' ? scoreData : scoreData.average_rating) >= 3.0 ? 'bg-blue-500' : 'bg-orange-400'}`}
                                style={{ width: `${((typeof scoreData === 'number' ? scoreData : scoreData.average_rating) / 5) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Strengths & Areas for Improvement */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                    <h3 className="font-bold text-green-700 mb-2 flex items-center gap-1 text-sm">
                        <CheckCircle size={14} /> Strengths
                    </h3>
                    <ul className="space-y-1">
                        {skills.strengths && skills.strengths.length > 0 ? skills.strengths.slice(0, 3).map((strength) => (
                            <li key={strength} className="text-xs text-green-800 font-medium truncate">• {strength}</li>
                        )) : <span className="text-xs text-green-600/50 italic">None identified yet</span>}
                    </ul>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                    <h3 className="font-bold text-orange-700 mb-2 flex items-center gap-1 text-sm">
                        <TrendingUp size={14} /> Growth Areas
                    </h3>
                    <ul className="space-y-1">
                        {skills.areas_for_improvement && skills.areas_for_improvement.length > 0 ? skills.areas_for_improvement.slice(0, 3).map((area) => (
                            <li key={area} className="text-xs text-orange-800 font-medium truncate">• {area}</li>
                        )) : <span className="text-xs text-orange-600/50 italic">None identified yet</span>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StudentSoftSkillsProfile;
