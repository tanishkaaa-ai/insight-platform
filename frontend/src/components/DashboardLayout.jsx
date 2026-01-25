import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Backpack,
    LayoutDashboard,
    BookOpen,
    Target,
    Map as MapIcon,
    Radio,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ChevronLeft,
    Users,
    Trophy,
    Settings,
    UserCheck,
    Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, text, to, isCollapsed, end }) => {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
        ${isActive
                    ? 'bg-[#547792] text-[#EAE0CF] font-bold shadow-md'
                    : 'text-[#EAE0CF]/70 hover:bg-[#547792]/50 hover:text-[#EAE0CF] font-medium'
                }`
            }
        >
            <div className="relative z-10">
                <Icon size={24} className="transition-transform group-hover:scale-110" />
            </div>

            {!isCollapsed && (
                <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
                    {text}
                </span>
            )}

            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#547792] text-[#EAE0CF] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-lg">
                    {text}
                </div>
            )}
        </NavLink>
    );
};

const DashboardLayout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const navItems = [
        { icon: LayoutDashboard, text: 'Dashboard', to: '/student', end: true },
        { icon: BookOpen, text: 'My Classes', to: '/student/classes' },
        { icon: Target, text: 'Practice Zone', to: '/student/practice' },
        { icon: MapIcon, text: 'Projects', to: '/student/projects' },
        { icon: Target, text: 'Milestones', to: '/student/milestones' },
        { icon: Users, text: 'Peer Review', to: '/student/peer-review' },
        { icon: Radio, text: 'Live Polls', to: '/student/polls' },
        { icon: UserCheck, text: 'Attendance', to: '/student/attendance' },
        { icon: Compass, text: 'Interest Path', to: '/student/interest-path' },
        { icon: Trophy, text: 'Achievements', to: '/student/achievements' },
    ];

    return (
        <div className="min-h-screen bg-[#EAE0CF] flex flex-col md:flex-row">

            {/* Mobile Header */}
            <div className="md:hidden bg-[#213448] p-4 shadow-sm flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-[#EAE0CF]">
                    <Backpack className="text-[#EAE0CF]" />
                    <span>Student Portal</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[#EAE0CF]">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar - Desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? '5rem' : '16rem' }}
                className="hidden md:flex flex-col bg-[#213448] border-r border-[#547792]/30 h-screen sticky top-0 z-40 shadow-xl"
            >
                {/* Brand */}
                <div className="p-6 flex items-center gap-3 overflow-hidden">
                    <div className="bg-[#547792]/20 p-2 rounded-lg shrink-0">
                        <Backpack className="text-[#EAE0CF]" size={24} />
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-extrabold text-xl text-[#EAE0CF] tracking-tight"
                        >
                            School<span className="text-[#91ADC8]">Quest</span>
                        </motion.div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 bg-[#213448] border border-[#547792] rounded-full p-1 shadow-md text-[#EAE0CF] hover:text-white transition-colors z-50"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Navigation */}
                <div className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item, idx) => (
                        <SidebarItem key={idx} {...item} isCollapsed={isCollapsed} />
                    ))}
                </div>

                {/* User Footer */}
                <div className="p-3 border-t border-[#547792]/30">
                    <NavLink
                        to="/student/profile"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-[#EAE0CF]/70 hover:bg-[#547792]/20 hover:text-[#EAE0CF] font-medium mb-1 ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <Settings size={24} />
                        {!isCollapsed && <span>Settings</span>}
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={24} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-64 bg-[#213448] z-50 shadow-xl md:hidden overflow-y-auto"
                        >
                            <div className="p-6 border-b border-[#547792]/30">
                                <h2 className="text-xl font-bold text-[#EAE0CF] flex items-center gap-2">
                                    <Backpack className="text-[#EAE0CF]" />
                                    Menu
                                </h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {navItems.map((item, idx) => (
                                    <NavLink
                                        key={idx}
                                        to={item.to}
                                        end={item.end}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                      ${isActive
                                                ? 'bg-[#547792] text-[#EAE0CF] font-bold'
                                                : 'text-[#EAE0CF]/70 hover:bg-[#547792]/50 hover:text-[#EAE0CF]'
                                            }`
                                        }
                                    >
                                        <item.icon size={20} />
                                        {item.text}
                                    </NavLink>
                                ))}
                                <div className="pt-4 mt-4 border-t border-[#547792]/30">
                                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 w-full hover:bg-red-500/10 rounded-xl">
                                        <LogOut size={20} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#EAE0CF]">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
