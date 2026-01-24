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
    UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, text, to, isCollapsed }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
        ${isActive
                    ? 'bg-orange-100 text-orange-600 font-bold shadow-sm'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500 font-medium'
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
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
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
        { icon: LayoutDashboard, text: 'Dashboard', to: '/student' },
        { icon: BookOpen, text: 'My Classes', to: '/student/classes' },
        { icon: Target, text: 'Practice Zone', to: '/student/practice' },
        { icon: MapIcon, text: 'Projects', to: '/student/projects' },
        { icon: Target, text: 'Milestones', to: '/student/milestones' },
        { icon: Users, text: 'Peer Review', to: '/student/peer-review' },
        { icon: Radio, text: 'Live Polls', to: '/student/polls' },
        { icon: UserCheck, text: 'Attendance', to: '/student/attendance' },
        { icon: Trophy, text: 'Achievements', to: '/student/achievements' },
    ];

    return (
        <div className="min-h-screen bg-orange-50/50 flex flex-col md:flex-row">

            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-gray-800">
                    <Backpack className="text-orange-500" />
                    <span>Student Portal</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar - Desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? '5rem' : '16rem' }}
                className="hidden md:flex flex-col bg-white border-r border-orange-100 h-screen sticky top-0 z-40 shadow-sm"
            >
                {/* Brand */}
                <div className="p-6 flex items-center gap-3 overflow-hidden">
                    <div className="bg-orange-100 p-2 rounded-lg shrink-0">
                        <Backpack className="text-orange-600" size={24} />
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-extrabold text-xl text-gray-800 tracking-tight"
                        >
                            School<span className="text-orange-500">Quest</span>
                        </motion.div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 bg-white border border-orange-200 rounded-full p-1 shadow-sm text-orange-500 hover:text-orange-600 transition-colors z-50"
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
                <div className="p-3 border-t border-orange-100">
                    <NavLink
                        to="/student/profile"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-800 font-medium mb-1 ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <Settings size={24} />
                        {!isCollapsed && <span>Settings</span>}
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-500 hover:bg-red-50 hover:text-red-600 font-medium ${isCollapsed ? 'justify-center' : ''}`}
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
                            className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-xl md:hidden overflow-y-auto"
                        >
                            <div className="p-6 border-b border-orange-100">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Backpack className="text-orange-500" />
                                    Menu
                                </h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {navItems.map((item, idx) => (
                                    <NavLink
                                        key={idx}
                                        to={item.to}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                      ${isActive
                                                ? 'bg-orange-100 text-orange-600 font-bold'
                                                : 'text-gray-600 hover:bg-orange-50'
                                            }`
                                        }
                                    >
                                        <item.icon size={20} />
                                        {item.text}
                                    </NavLink>
                                ))}
                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 w-full hover:bg-red-50 rounded-xl">
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
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-orange-50/30">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
