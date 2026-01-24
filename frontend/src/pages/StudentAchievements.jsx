import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { engagementAPI } from '../services/api';
import { Trophy, Zap, Medal, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const AchievementCard = ({ achievement, index }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4, scale: 1.02 }}
        className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${achievement.unlocked ? 'bg-white border-yellow-100 shadow-sm hover:shadow-md' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 ${achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'}`}>
            {achievement.icon || '🏆'}
        </div>
        <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1">{achievement.name}</h3>
            <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
            {achievement.unlocked ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                    <Zap size={12} /> Unlocked {new Date(achievement.earned_at).toLocaleDateString()}
                </div>
            ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-200 text-gray-500">
                    <Zap size={12} /> {achievement.xp} XP
                </div>
            )}
        </div>
    </motion.div>
);

const StudentAchievements = () => {
    const { getUserId } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userId = getUserId();
                if (userId) {
                    const response = await engagementAPI.getGamificationProfile(userId);
                    setProfile(response.data);
                }
            } catch (error) {
                console.error("Failed to load achievements", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [getUserId]);

    if (loading) {
        return (
            <DashboardLayout>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-[calc(100vh-8rem)]">
                    <Loader className="animate-spin text-orange-500" size={40} />
                </motion.div>
            </DashboardLayout>
        );
    }

    const displayProfile = profile || { level: 1, current_xp: 0, next_level_xp: 1000, badges: [] };
    const badges = displayProfile.badges?.length > 0 ? displayProfile.badges : [
        { name: 'First Steps', description: 'Complete your first practice session', xp: 50, icon: '👣', unlocked: true, earned_at: new Date() },
        { name: 'Speedster', description: 'Answer 5 questions in under 1 minute', xp: 100, icon: '⚡', unlocked: false },
        { name: 'Perfect Score', description: 'Get 100% on a quiz', xp: 200, icon: '🎯', unlocked: false },
        { name: 'Team Player', description: 'Collaborate on a project', xp: 150, icon: '🤝', unlocked: false },
        { name: 'Consistent', description: 'Login 5 days in a row', xp: 100, icon: '📅', unlocked: false },
        { name: 'Mastermind', description: 'Master a difficult concept', xp: 300, icon: '🧠', unlocked: false },
    ];
    const progressPercent = Math.min((displayProfile.current_xp / displayProfile.next_level_xp) * 100, 100);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <Trophy className="text-yellow-500" size={32} /> Trophy Case
                    </h1>
                    <p className="text-gray-500 mt-2">Track your progress and unlocked achievements</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
                        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128">
                            <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-yellow-500" strokeDasharray={`${progressPercent * 3.52} 352`} strokeLinecap="round" />
                        </svg>
                        <div className="flex flex-col items-center">
                            <span className="text-gray-400 font-bold text-xs uppercase">Level</span>
                            <span className="text-4xl font-black text-gray-800">{displayProfile.level}</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800">Experience Points</h3>
                                <p className="text-gray-500 text-sm">Keep earning XP to reach Level {displayProfile.level + 1}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-yellow-600 text-lg">{displayProfile.current_xp}</span>
                                <span className="text-gray-400 font-medium"> / {displayProfile.next_level_xp} XP</span>
                            </div>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-sm" />
                        </div>
                    </div>
                </motion.div>

                <div>
                    <motion.h2 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
                        <Medal className="text-orange-500" /> All Achievements
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {badges.map((badge, idx) => <AchievementCard key={idx} achievement={badge} index={idx} />)}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentAchievements;
