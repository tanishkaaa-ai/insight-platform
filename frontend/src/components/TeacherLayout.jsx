import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BarChart2,
    Radio,
    Map as MapIcon,
    Library,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ChevronLeft,
    BookOpen,

    CheckCircle,
    Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, text, to, isCollapsed }) => {
    return (
        <NavLink
            to={to}
            end={to === '/teacher'} // Only exact match for dashboard home
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
        ${isActive
                    ? 'bg-teal-100 text-teal-800 font-bold shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600 font-medium'
                }`
            }
        >
            <div className="relative z-10">
                <Icon size={24} className="transition-transform group-hover:scale-105" />
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

const TeacherLayout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const navItems = [
        { icon: LayoutDashboard, text: 'Overview', to: '/teacher' },
        { icon: Users, text: 'Classes & Rosters', to: '/teacher/classes' },
        { icon: BarChart2, text: 'Analytics Hub', to: '/teacher/analytics' },
        { icon: Radio, text: 'Live Sessions', to: '/teacher/polls' }, // Reusing/Aliasing Polling
        { icon: MapIcon, text: 'Projects (PBL)', to: '/teacher/projects' },
        { icon: CheckCircle, text: 'Approvals', to: '/teacher/project-review' },
        { icon: Award, text: 'Grading', to: '/teacher/grading' },
        { icon: BookOpen, text: 'Curriculum', to: '/teacher/curriculum' },
        { icon: Library, text: 'Templates', to: '/teacher/templates' },
    ];

    return (
        <div className="min-h-screen bg-teal-50/30 flex flex-col md:flex-row font-sans">

            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-50 border-b border-gray-200">
                <div className="flex items-center gap-2 font-bold text-gray-800">
                    <div className="bg-teal-600 p-1.5 rounded text-white"><BarChart2 size={20} /></div>
                    <span>AMEP Access</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar - Desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? '5rem' : '17rem' }}
                className="hidden md:flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
            >
                {/* Brand */}
                <div className="p-6 flex items-center gap-3 overflow-hidden border-b border-gray-100">
                    <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-2 rounded-lg shrink-0 text-white shadow-md">
                        <BarChart2 size={24} />
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-lg text-gray-800 tracking-tight leading-tight"
                        >
                            AMEP <span className="text-teal-600">Teacher</span>
                            <div className="text-[10px] text-gray-400 font-normal uppercase tracking-widest">Workspace</div>
                        </motion.div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-400 hover:text-teal-600 transition-colors z-50"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Navigation */}
                <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item, idx) => (
                        <SidebarItem key={idx} {...item} isCollapsed={isCollapsed} />
                    ))}
                </div>

                {/* User Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-gray-600 hover:bg-white hover:shadow-sm hover:text-teal-700 font-medium ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} />
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
                            className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl md:hidden overflow-y-auto"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                <div className="bg-teal-600 p-2 rounded text-white"><BarChart2 size={24} /></div>
                                <span className="font-bold text-xl text-gray-800">Menu</span>
                            </div>
                            <div className="p-4 space-y-2">
                                {navItems.map((item, idx) => (
                                    <NavLink
                                        key={idx}
                                        to={item.to}
                                        end={item.to === '/teacher'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive
                                                ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`
                                        }
                                    >
                                        <item.icon size={20} />
                                        {item.text}
                                    </NavLink>
                                ))}
                                <div className="pt-4 mt-6 border-t border-gray-100">
                                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 w-full hover:bg-red-50 rounded-lg font-medium">
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
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;
