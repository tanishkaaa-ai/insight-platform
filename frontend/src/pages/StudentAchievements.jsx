import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { engagementAPI, achievementsAPI } from '../services/api';
import { Trophy, Star, Shield, Zap, Award, Medal, Crown, Target, Loader, Plus, X, Trash2, Calendar, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const AchievementCard = ({ achievement, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border-2 flex items-center gap-4 ${achievement.unlocked
                ? 'bg-[#213448] border-yellow-500/30 shadow-sm'
                : 'bg-[#1a2c3d] border-[#EAE0CF]/5 opacity-60 grayscale'
                }`}
        >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 ${achievement.unlocked ? 'bg-yellow-900/20 text-yellow-400' : 'bg-[#213448] text-[#EAE0CF]/20'
                }`}>
                {achievement.icon || '🏆'}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-[#EAE0CF]">{achievement.name}</h3>
                <p className="text-xs text-[#EAE0CF]/60 mb-2">{achievement.description}</p>
                {achievement.unlocked ? (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-900/30 text-green-400 border border-green-500/20">
                        <Zap size={10} /> Unlocked {new Date(achievement.earned_at).toLocaleDateString()}
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#1a2c3d] text-[#EAE0CF]/40 border border-[#EAE0CF]/10">
                        <Zap size={10} /> {achievement.xp} XP
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const StudentAchievements = () => {
    const { getUserId } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [externalAchievements, setExternalAchievements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        category: 'Competition',
        proof_link: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userId = getUserId();
                if (userId) {
                    const [profileRes, externalRes] = await Promise.all([
                        engagementAPI.getGamificationProfile(userId),
                        achievementsAPI.getStudentAchievements(userId)
                    ]);
                    setProfile(profileRes.data);
                    setExternalAchievements(externalRes.data);
                }
            } catch (error) {
                console.error("Failed to load achievements", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleAddAchievement = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userId = getUserId();
            await achievementsAPI.addExternal({
                student_id: userId,
                ...formData
            });

            // Refresh list
            const res = await achievementsAPI.getStudentAchievements(userId);
            setExternalAchievements(res.data);

            setShowModal(false);
            setFormData({ title: '', description: '', date: '', category: 'Competition', proof_link: '' });
        } catch (error) {
            console.error("Failed to add achievement", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this achievement?")) return;
        try {
            await achievementsAPI.deleteExternal(id);
            setExternalAchievements(prev => prev.filter(a => a._id !== id));
        } catch (error) {
            console.error("Failed to delete achievement", error);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                    <Loader className="animate-spin text-orange-500" size={40} />
                </div>
            </DashboardLayout>
        );
    }

    // Mock data if profile is empty (for demo purposes if backend data not fully populated)
    const displayProfile = profile || {
        level: 1,
        current_level_xp: 0,
        next_level_xp: 1000,
        badges: []
    };

    // Use backend badges or fallback to static list for visual if empty
    const badges = displayProfile.badges?.length > 0 ? displayProfile.badges : [
        { name: 'First Steps', description: 'Complete your first practice session', xp: 50, icon: '👣', unlocked: true, earned_at: new Date() },
        { name: 'Speedster', description: 'Answer 5 questions in under 1 minute', xp: 100, icon: '⚡', unlocked: false },
        { name: 'Perfect Score', description: 'Get 100% on a quiz', xp: 200, icon: '🎯', unlocked: false },
        { name: 'Team Player', description: 'Collaborate on a project', xp: 150, icon: '🤝', unlocked: false },
        { name: 'Consistent', description: 'Login 5 days in a row', xp: 100, icon: '📅', unlocked: false },
        { name: 'Mastermind', description: 'Master a difficult concept', xp: 300, icon: '🧠', unlocked: false },
    ];

    const progressPercent = Math.min((displayProfile.current_level_xp / displayProfile.next_level_xp) * 100, 100);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#065F46] flex items-center gap-3">
                        <Trophy className="text-[#065F46]" size={32} /> Trophy Case
                    </h1>
                    <p className="text-[#065F46]/70 mt-2">Track your progress and unlocked achievements</p>
                </div>

                {/* Level Progress Card */}
                <div className="bg-[#213448] rounded-2xl p-8 shadow-sm border border-[#EAE0CF]/20 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        {/* Circular Progress (Simple CSS) */}
                        <div className="absolute inset-0 rounded-full border-8 border-[#1a2c3d]"></div>
                        <div className="absolute inset-0 rounded-full border-8 border-yellow-500 border-t-transparent -rotate-45"
                            style={{ clipPath: `circle(50% at 50% 50%)` }}></div> {/* Simplified for now */}
                        <div className="flex flex-col items-center">
                            <span className="text-[#EAE0CF]/40 font-bold text-xs uppercase">Level</span>
                            <span className="text-4xl font-black text-[#EAE0CF]">{displayProfile.level}</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="font-bold text-xl text-[#065F46]">Experience Points</h3>
                                <p className="text-[#065F46]/70 text-sm">Keep earning XP to reach Level {displayProfile.level + 1}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-yellow-500 text-lg">{displayProfile.current_level_xp}</span>
                                <span className="text-[#EAE0CF]/40 font-medium"> / {displayProfile.next_level_xp} XP</span>
                            </div>
                        </div>
                        <div className="h-4 bg-[#1a2c3d] rounded-full overflow-hidden border border-[#EAE0CF]/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div>
                    <h2 className="font-bold text-xl text-[#065F46] mb-6 flex items-center gap-2">
                        <Medal className="text-[#065F46]" /> All Achievements
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {badges.map((badge, idx) => (
                            <AchievementCard key={idx} achievement={badge} index={idx} />
                        ))}
                    </div>
                </div>

                {/* External Achievements Section */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-xl text-[#065F46] flex items-center gap-2">
                            <Star className="text-[#065F46]" /> External Achievements
                            <span className="text-sm font-normal text-[#065F46]/60 ml-2">({externalAchievements.length})</span>
                        </h2>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Achievement
                        </button>
                    </div>

                    {externalAchievements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {externalAchievements.map((achievement) => (
                                <div key={achievement._id} className="bg-[#213448] p-5 rounded-xl border border-[#EAE0CF]/20 shadow-sm relative group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-purple-900/40 rounded-full flex items-center justify-center text-purple-400 shrink-0">
                                            <Award size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-[#EAE0CF] text-lg mb-1">{achievement.title}</h3>
                                            <p className="text-[#EAE0CF]/60 text-sm mb-3">{achievement.description || 'No description provided.'}</p>

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="px-2 py-1 bg-[#1a2c3d] text-[#EAE0CF]/70 rounded flex items-center gap-1 border border-[#EAE0CF]/10">
                                                    <Calendar size={12} /> {achievement.date ? new Date(achievement.date).toLocaleDateString() : 'No Date'}
                                                </span>
                                                <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded border border-blue-500/20">
                                                    {achievement.category}
                                                </span>
                                                {achievement.proof_link && (
                                                    <a href={achievement.proof_link} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-green-900/30 text-green-400 rounded flex items-center gap-1 hover:underline border border-green-500/20">
                                                        <LinkIcon size={12} /> View Proof
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(achievement._id)}
                                            className="text-[#EAE0CF]/30 hover:text-red-400 transition-colors p-1"
                                            title="Delete Achievement"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-[#1a2c3d] rounded-2xl border-2 border-dashed border-[#EAE0CF]/10">
                            <Star className="mx-auto text-[#EAE0CF]/20 mb-2" size={32} />
                            <p className="text-[#EAE0CF]/70 font-medium">No external achievements added yet.</p>
                            <p className="text-[#EAE0CF]/40 text-sm mb-4">Showcase your awards, certificates, and wins!</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-purple-400 font-bold text-sm hover:underline"
                            >
                                Add your first achievement
                            </button>
                        </div>
                    )}
                </div>

                {/* Add Achievement Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#213448] rounded-2xl p-6 w-full max-w-md shadow-xl border border-[#EAE0CF]/20"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-[#EAE0CF]">Add External Achievement</h3>
                                <button onClick={() => setShowModal(false)} className="text-[#EAE0CF]/40 hover:text-[#EAE0CF]">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddAchievement} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Achievement Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-[#EAE0CF]"
                                        placeholder="e.g., National Science Fair Winner"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Description</label>
                                    <textarea
                                        className="w-full px-4 py-2 bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none resize-none h-24 text-[#EAE0CF]"
                                        placeholder="Describe your achievement..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-2 bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-[#EAE0CF]"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Category</label>
                                        <select
                                            className="w-full px-4 py-2 bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-[#EAE0CF]"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="Competition">Competition</option>
                                            <option value="Certification">Certification</option>
                                            <option value="Volunteering">Volunteering</option>
                                            <option value="Sports">Sports</option>
                                            <option value="Arts">Arts</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Proof / Certificate Link (Optional)</label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2 bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-[#EAE0CF]"
                                        placeholder="https://..."
                                        value={formData.proof_link}
                                        onChange={e => setFormData({ ...formData, proof_link: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-900/20 flex justify-center items-center gap-2"
                                >
                                    {submitting ? <Loader className="animate-spin" size={20} /> : <Plus size={20} />}
                                    Save Achievement
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default StudentAchievements;
