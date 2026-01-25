import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Download, CheckCircle, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const BulkReportModal = ({ isOpen, onClose, teacherId }) => {
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');

    useEffect(() => {
        if (isOpen && teacherId) {
            fetchReportData();
        }
    }, [isOpen, teacherId, selectedClass]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const res = await dashboardAPI.getBulkReports(
                teacherId,
                selectedClass === 'all' ? undefined : selectedClass
            );
            setStudents(res.data.students || []);
            setClassrooms(res.data.classrooms || []);
        } catch (error) {
            console.error("Failed to fetch report preview", error);
            toast.error("Failed to load student reports");
        } finally {
            setLoading(false);
        }
    };

    const handleRemarkChange = (studentId, value) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, remark: value } : s
        ));
    };

    const handleSendAll = async () => {
        try {
            setSending(true);
            const res = await dashboardAPI.sendBatchReports({ reports: students, teacher_id: teacherId });
            toast.success(res.data.message || `Successfully sent ${res.data.sent_count} reports!`);
            onClose();
        } catch (error) {
            console.error("Failed to send batch reports", error);
            toast.error("An error occurred while sending emails");
        } finally {
            setSending(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="p-2 bg-blue-600 rounded-xl text-white">
                                <Send size={20} />
                            </span>
                            Weekly Student Summaries
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Review performance and add personal remarks before emailing student's parents.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Search & Actions Bar */}
                <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4 max-w-2xl">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Filter by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                            />
                        </div>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs text-gray-600 appearance-none cursor-pointer"
                        >
                            <option value="all">All Classes</option>
                            {classrooms.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 mr-2">{students.length} Students Total</span>
                        <button
                            onClick={handleSendAll}
                            disabled={sending || students.length === 0}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            Send to parent of each student
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center">
                            <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                            <p className="text-gray-500 font-medium">Aggregating weekly performance data...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center">
                            <AlertCircle size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No students found matching your criteria.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="text-left border-b-2 border-gray-100">
                                    <th className="pb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student & Contact</th>
                                    <th className="pb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Engagement</th>
                                    <th className="pb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Mastery</th>
                                    <th className="pb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Attendance</th>
                                    <th className="pb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Alerts</th>
                                    <th className="pb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStudents.map((s) => (
                                    <tr key={s.student_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-gray-800">{s.name}</div>
                                            <div className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">
                                                {s.parent_email ? (
                                                    <span className="text-gray-600">Parent: {s.parent_email}</span>
                                                ) : (
                                                    <span className="text-amber-500 italic flex items-center gap-1">
                                                        <AlertCircle size={10} /> No Parent Linked
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold ${s.engagement_score >= 75 ? 'bg-green-100 text-green-700' :
                                                s.engagement_score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {s.engagement_score}%
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center text-sm font-bold text-gray-600">
                                            {s.mastery_score}%
                                            <div className="text-[10px] text-gray-400 font-normal">{s.mastered_concepts} Mastered</div>
                                        </td>
                                        <td className="py-4 px-4 text-center text-sm font-bold text-emerald-600">
                                            {s.attendance_pct}%
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {s.alert_count > 0 ? (
                                                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                                    {s.alert_count} Active
                                                </span>
                                            ) : (
                                                <CheckCircle size={16} className="mx-auto text-green-400" />
                                            )}
                                        </td>
                                        <td className="py-4 px-4 min-w-[250px]">
                                            <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 focus-within:border-blue-300 focus-within:bg-white transition-all">
                                                <MessageSquare size={14} className="text-gray-400 mt-1" />
                                                <textarea
                                                    placeholder="Add a personalized note..."
                                                    value={s.remark}
                                                    onChange={(e) => handleRemarkChange(s.student_id, e.target.value)}
                                                    className="w-full bg-transparent border-none focus:outline-none text-sm resize-none h-12"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <AlertCircle size={16} />
                        Emails will be logged in the system and sent to student registration addresses.
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-all">
                            Close Preview
                        </button>
                        <button
                            onClick={handleSendAll}
                            disabled={sending || students.length === 0}
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                        >
                            {sending ? "Sending..." : "Confirm & Send Emails"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BulkReportModal;
