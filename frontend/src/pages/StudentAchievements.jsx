import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { engagementAPI } from '../services/api';
import { Trophy, Star, Shield, Zap, Award, Medal, Crown, Target, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const AchievementCard = ({ achievement, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border-2 flex items-center gap-4 ${achievement.unlocked
                ? 'bg-white border-yellow-100 shadow-sm'
                : 'bg-gray-50 border-gray-100 opacity-60 grayscale'
                }`}
        >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 ${achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
                }`}>
                {achievement.icon || '🏆'}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-gray-800">{achievement.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                {achievement.unlocked ? (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                        <Zap size={10} /> Unlocked {new Date(achievement.earned_at).toLocaleDateString()}
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-gray-200 text-gray-500">
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
    }, []);

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
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <Trophy className="text-yellow-500" size={32} /> Trophy Case
                    </h1>
                    <p className="text-gray-500 mt-2">Track your progress and unlocked achievements</p>
                </div>

                {/* Level Progress Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        {/* Circular Progress (Simple CSS) */}
                        <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
                        <div className="absolute inset-0 rounded-full border-8 border-yellow-500 border-t-transparent -rotate-45"
                            style={{ clipPath: `circle(50% at 50% 50%)` }}></div> {/* Simplified for now */}
                        <div className="flex flex-col items-center">
                            <span className="text-gray-400 font-bold text-xs uppercase">Level</span>
                            <span className="text-4xl font-black text-gray-800">{displayProfile.level}</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800">Experience Points</h3>
                                <p className="text-gray-500 text-sm">Keep earning XP to reach Level {displayProfile.level + 1}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-yellow-600 text-lg">{displayProfile.current_level_xp}</span>
                                <span className="text-gray-400 font-medium"> / {displayProfile.next_level_xp} XP</span>
                            </div>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div>
                    <h2 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
                        <Medal className="text-orange-500" /> All Achievements
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {badges.map((badge, idx) => (
                            <AchievementCard key={idx} achievement={badge} index={idx} />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentAchievements;
