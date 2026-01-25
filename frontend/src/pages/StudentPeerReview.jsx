import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { User, Users, Star, Award, Zap, Layout, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const RatingSlider = ({ dimension, skill, value, onChange }) => (
    <div className="mb-4">
        <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-[#EAE0CF]/80 capitalize">
                {skill.replace(/_/g, ' ')}
            </label>
            <span className="text-sm font-bold text-[#EAE0CF]">{value}</span>
        </div>
        <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={value}
            onChange={(e) => onChange(dimension, skill, parseFloat(e.target.value))}
            className="w-full h-2 bg-[#1a2c3d] rounded-lg appearance-none cursor-pointer accent-[#547792]"
        />
        <div className="flex justify-between text-xs text-[#EAE0CF]/40 mt-1">
            <span>Poor</span>
            <span>Excellent</span>
        </div>
    </div>
);

const StudentPeerReview = () => {
    const { getUserId } = useAuth();
    const [completedReviews, setCompletedReviews] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedReviewee, setSelectedReviewee] = useState(null);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState({
        team_dynamics: { communication: 3, support: 3, trust: 3, listening: 3 },
        team_structure: { roles: 3, scheduling: 3, decisions: 3, conflict_resolution: 3 },
        team_motivation: { purpose: 3, goals: 3, passion: 3, synergy: 3 },
        team_excellence: { growth_mindset: 3, quality: 3, monitoring: 3, reflection: 3 }
    });

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const userId = getUserId();
                const teamsRes = await projectsAPI.getStudentTeams(userId);

                if (teamsRes.data.teams && teamsRes.data.teams.length > 0) {
                    const currentTeam = teamsRes.data.teams[0];
                    setTeam(currentTeam);
                    const teamId = currentTeam.team_id || currentTeam._id;

                    const [teamDetails, reviewsRes] = await Promise.all([
                        projectsAPI.getTeam(teamId),
                        projectsAPI.getTeamPeerReviews(teamId)
                    ]);

                    // Filter out self
                    const members = (teamDetails.data.members || []).filter(m => m.student_id !== userId);
                    setTeamMembers(members);

                    // Track who I have already reviewed
                    const myReviews = (reviewsRes.data.reviews || [])
                        .filter(r => r.reviewer_id === userId && r.review_type === 'mid-project'); // Assuming 'mid-project' for now

                    setCompletedReviews(myReviews.map(r => r.reviewee_id));
                }
            } catch (error) {
                console.error("Failed to load team data", error);
                // toast.error("Failed to load team data");
            } finally {
                setLoading(false);
            }
        };

        if (getUserId()) {
            fetchTeamData();
        }
    }, [getUserId]);

    const handleSubmitReview = async () => {
        if (!selectedReviewee) {
            toast.error('Please select a team member to review');
            return;
        }

        try {
            const userId = getUserId();
            const reviewType = 'mid-project'; // Hardcoded for now to match filter logic

            await projectsAPI.submitPeerReview(team.team_id || team._id, {
                reviewer_id: userId,
                reviewee_id: selectedReviewee,
                review_type: reviewType, // Ensure this matches what we look for in useEffect
                ratings: ratings,
                comments: '' // Placeholder for comments
            });

            toast.success('Peer review submitted successfully!');

            // Mark as completed locally to update UI immediately
            setCompletedReviews(prev => [...prev, selectedReviewee]);
            setSelectedReviewee(null);

            // Reset ratings? - Optional

        } catch (error) {
            console.error("Review submission error:", error);
            const errorMsg = error.response?.data?.error || 'Failed to submit peer review';

            // If it's the specific "already submitted" error, update the UI state
            if (errorMsg.includes('already submitted')) {
                setCompletedReviews(prev => [...prev, selectedReviewee]);
                setSelectedReviewee(null);
            }

            toast.error(errorMsg);
        }
    };

    // ... RatingSlider component ...

    return (
        <DashboardLayout>
            <div className="bg-[#213448] rounded-2xl shadow-sm border border-[#EAE0CF]/20 p-6 mb-8">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                    <User size={20} className="text-white" />
                    Select Team Member to Review
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {teamMembers.map((member) => {
                        const isCompleted = completedReviews.includes(member.student_id);
                        return (
                            <motion.button
                                whileHover={!isCompleted ? { scale: 1.02 } : {}}
                                whileTap={!isCompleted ? { scale: 0.98 } : {}}
                                key={member.student_id}
                                onClick={() => !isCompleted && setSelectedReviewee(member.student_id)}
                                disabled={isCompleted}
                                className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${selectedReviewee === member.student_id
                                    ? 'border-white bg-[#1a2c3d] shadow-md ring-2 ring-white/20'
                                    : isCompleted
                                        ? 'border-green-900/30 bg-green-900/10 cursor-default opacity-60 grayscale'
                                        : 'border-white/10 bg-[#1a2c3d] hover:border-white/30 hover:bg-[#1a2c3d]/80'
                                    }`}
                            >
                                {isCompleted && (
                                    <div className="absolute top-0 right-0 bg-green-900/60 text-green-300 text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg z-10 backdrop-blur-sm">
                                        Done
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-0 ${isCompleted ? 'bg-green-900/20 text-green-400' : 'bg-[#547792] text-white border border-white/20'
                                        }`}>
                                        {member.student_name ? member.student_name[0] : '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{member.student_name || 'Unknown Student'}</p>
                                        <p className="text-xs text-white/60 uppercase tracking-wider font-bold">{member.role || 'Member'}</p>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {
                selectedReviewee && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Team Dynamics */}
                            <div className="bg-[#213448] rounded-2xl p-6 shadow-sm border border-[#EAE0CF]/20">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#EAE0CF]">
                                    <Users size={24} className="text-[#547792]" /> Team Dynamics
                                </h2>
                                {Object.keys(ratings.team_dynamics).map((skill) => (
                                    <RatingSlider
                                        key={skill}
                                        dimension="team_dynamics"
                                        skill={skill}
                                        value={ratings.team_dynamics[skill]}
                                        onChange={(dim, sk, val) => setRatings({
                                            ...ratings,
                                            [dim]: { ...ratings[dim], [sk]: val }
                                        })}
                                    />
                                ))}
                            </div>

                            {/* Team Structure */}
                            <div className="bg-[#213448] rounded-2xl p-6 shadow-sm border border-[#EAE0CF]/20">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#EAE0CF]">
                                    <Layout size={24} className="text-[#547792]" /> Team Structure
                                </h2>
                                {Object.keys(ratings.team_structure).map((skill) => (
                                    <RatingSlider
                                        key={skill}
                                        dimension="team_structure"
                                        skill={skill}
                                        value={ratings.team_structure[skill]}
                                        onChange={(dim, sk, val) => setRatings({
                                            ...ratings,
                                            [dim]: { ...ratings[dim], [sk]: val }
                                        })}
                                    />
                                ))}
                            </div>

                            {/* Team Motivation */}
                            <div className="bg-[#213448] rounded-2xl p-6 shadow-sm border border-[#EAE0CF]/20">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#EAE0CF]">
                                    <Zap size={24} className="text-orange-400" /> Team Motivation
                                </h2>
                                {Object.keys(ratings.team_motivation).map((skill) => (
                                    <RatingSlider
                                        key={skill}
                                        dimension="team_motivation"
                                        skill={skill}
                                        value={ratings.team_motivation[skill]}
                                        onChange={(dim, sk, val) => setRatings({
                                            ...ratings,
                                            [dim]: { ...ratings[dim], [sk]: val }
                                        })}
                                    />
                                ))}
                            </div>

                            <div className="bg-[#213448] rounded-2xl p-6 shadow-sm border border-[#EAE0CF]/20">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#EAE0CF]">
                                    <Award size={24} className="text-purple-400" /> Team Excellence
                                </h2>
                                {Object.keys(ratings.team_excellence).map((skill) => (
                                    <RatingSlider
                                        key={skill}
                                        dimension="team_excellence"
                                        skill={skill}
                                        value={ratings.team_excellence[skill]}
                                        onChange={(dim, sk, val) => setRatings({
                                            ...ratings,
                                            [dim]: { ...ratings[dim], [sk]: val }
                                        })}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSubmitReview}
                            className="w-full py-4 bg-[#EAE0CF] text-[#213448] font-bold rounded-xl shadow-lg hover:bg-white hover:scale-[1.01] transition-all text-lg flex items-center justify-center gap-2"
                        >
                            <Star fill="currentColor" /> Submit Peer Review
                        </button>
                    </motion.div>
                )
            }

        </DashboardLayout >
    );
};

export default StudentPeerReview;
