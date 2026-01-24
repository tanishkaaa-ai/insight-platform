import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Bell, Save, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const StudentProfile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || 'Student Name',
        email: user?.email || 'student@example.com',
        bio: 'Enthusiastic learner passionate about science and technology.',
        grade: '10th Grade'
    });
    const [securityData, setSecurityData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notifications, setNotifications] = useState({ emailAlerts: true, assignmentDue: true, gradePosted: true, newBadges: false });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.success("Profile updated successfully!");
        }, 1000);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password changed successfully!");
        }, 1000);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">
                <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold text-gray-800">Account Settings</motion.h1>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <motion.button key={tab.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-left ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                                    <Icon size={20} /> {tab.label}
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="flex-1">
                        {activeTab === 'profile' && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <User className="text-blue-500" /> Personal Information
                                </h2>
                                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 border-4 border-white shadow-sm">
                                        {profileData.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{profileData.name}</h3>
                                        <p className="text-gray-500">Student • {profileData.grade}</p>
                                        <button className="text-sm text-blue-600 font-bold mt-2 hover:underline">Change Avatar</button>
                                    </div>
                                </div>
                                <form onSubmit={handleProfileUpdate} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                        <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            <input type="email" value={profileData.email} disabled
                                                className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-500 cursor-not-allowed" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                                        <textarea value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-24 resize-none transition-all" />
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" disabled={isLoading}
                                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
                                            <Save size={18} /> {isLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Lock className="text-red-500" /> Security Settings
                                </h2>
                                <form onSubmit={handlePasswordChange} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                                        <input type="password" value={securityData.currentPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                                        <input type="password" value={securityData.newPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                                        <input type="password" value={securityData.confirmPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" disabled={isLoading}
                                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
                                            <Shield size={18} /> {isLoading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Bell className="text-yellow-500" /> Notification Preferences
                                </h2>
                                <div className="space-y-4">
                                    {Object.entries(notifications).map(([key, value]) => (
                                        <motion.div key={key} whileHover={{ x: 2 }} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                                            <div>
                                                <h4 className="font-bold text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                <p className="text-sm text-gray-500">Receive alerts via email and push notification</p>
                                            </div>
                                            <button onClick={() => setNotifications({ ...notifications, [key]: !value })}
                                                className={`w-12 h-6 rounded-full transition-all relative flex items-center ${value ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                                    className={`w-5 h-5 bg-white rounded-full shadow-sm absolute ${value ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProfile;
