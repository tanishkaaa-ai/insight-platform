import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import {
    User,
    Mail,
    Lock,
    Bell,
    Save,
    Shield,
    Trophy,
    Zap,
    Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentProfile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [profileData, setProfileData] = useState({
        name: user?.name || 'Student Name',
        email: user?.email || 'student@example.com',
        bio: 'Enthusiastic learner passionate about science and technology.',
        grade: '10th Grade'
    });

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        assignmentDue: true,
        gradePosted: true,
        newBadges: false
    });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
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
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password changed successfully!");
        }, 1000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-extrabold text-[#065F46]">Account Settings</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-left
                                ${activeTab === 'profile' ? 'bg-[#065F46] text-[#F4FFFD] shadow-sm' : 'text-[#065F46]/60 hover:bg-[#065F46]/10'}`}
                        >
                            <User size={20} /> Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-left
                                ${activeTab === 'security' ? 'bg-[#065F46] text-[#F4FFFD] shadow-sm' : 'text-[#065F46]/60 hover:bg-[#065F46]/10'}`}
                        >
                            <Shield size={20} /> Security
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-left
                                ${activeTab === 'notifications' ? 'bg-[#065F46] text-[#F4FFFD] shadow-sm' : 'text-[#065F46]/60 hover:bg-[#065F46]/10'}`}
                        >
                            <Bell size={20} /> Notifications
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {activeTab === 'profile' && (
                            <div className="bg-[#213448] rounded-2xl shadow-sm border border-[#EAE0CF]/20 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-xl font-bold text-[#EAE0CF] mb-6 flex items-center gap-2">
                                    <User className="text-[#EAE0CF]" /> Personal Information
                                </h2>

                                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#EAE0CF]/10">
                                    <div className="w-24 h-24 rounded-full bg-[#547792] flex items-center justify-center text-3xl font-bold text-[#EAE0CF] border-4 border-[#213448] shadow-sm">
                                        {profileData.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#EAE0CF]">{profileData.name}</h3>
                                        <p className="text-[#EAE0CF]/60">Student • {profileData.grade}</p>
                                        <button className="text-sm text-[#EAE0CF] font-bold mt-2 hover:underline">Change Avatar</button>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg px-4 py-2 text-[#EAE0CF] focus:ring-2 focus:ring-[#547792] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 text-[#EAE0CF]/40" size={18} />
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled
                                                className="w-full bg-[#1a2c3d]/50 border border-[#EAE0CF]/10 rounded-lg pl-10 pr-4 py-2 text-[#EAE0CF]/40 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Bio</label>
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            className="w-full bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg px-4 py-2 text-[#EAE0CF] focus:ring-2 focus:ring-[#547792] outline-none h-24 resize-none"
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-6 py-2 bg-[#EAE0CF] text-[#213448] font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Save size={18} /> Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="bg-[#213448] rounded-2xl shadow-sm border border-[#EAE0CF]/20 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-xl font-bold text-[#EAE0CF] mb-6 flex items-center gap-2">
                                    <Lock className="text-red-400" /> Security Settings
                                </h2>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={securityData.currentPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                            className="w-full bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg px-4 py-2 text-[#EAE0CF] focus:ring-2 focus:ring-red-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={securityData.newPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                            className="w-full bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg px-4 py-2 text-[#EAE0CF] focus:ring-2 focus:ring-red-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#EAE0CF]/80 mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={securityData.confirmPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                            className="w-full bg-[#1a2c3d] border border-[#EAE0CF]/20 rounded-lg px-4 py-2 text-[#EAE0CF] focus:ring-2 focus:ring-red-400 outline-none"
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-6 py-2 bg-red-900/40 text-red-300 border border-red-500/50 font-bold rounded-xl hover:bg-red-900/60 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Shield size={18} /> Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="bg-[#213448] rounded-2xl shadow-sm border border-[#EAE0CF]/20 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-xl font-bold text-[#EAE0CF] mb-6 flex items-center gap-2">
                                    <Bell className="text-yellow-400" /> Notification Preferences
                                </h2>
                                <div className="space-y-6">
                                    {Object.entries(notifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-[#1a2c3d] rounded-xl border border-[#EAE0CF]/10">
                                            <div>
                                                <h4 className="font-bold text-[#EAE0CF] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                <p className="text-sm text-[#EAE0CF]/60">Receive alerts via email and push notification.</p>
                                            </div>
                                            <button
                                                onClick={() => setNotifications({ ...notifications, [key]: !value })}
                                                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${value ? 'bg-green-500' : 'bg-gray-600'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProfile;
