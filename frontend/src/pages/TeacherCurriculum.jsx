import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { BookOpen, Plus, Search, Edit2, Trash2, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { conceptsAPI } from '../services/api';
import toast from 'react-hot-toast';

const TeacherCurriculum = () => {
    const [concepts, setConcepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedConcept, setExpandedConcept] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [selectedConceptForItem, setSelectedConceptForItem] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Form States
    const [newConcept, setNewConcept] = useState({ name: '', subject_area: 'Computer Science', description: '', difficulty_level: 'medium' });
    const [newItem, setNewItem] = useState({ question: '', item_type: 'multiple_choice', difficulty: 'medium', correct_answer: '', options: ['', '', '', ''] });
    const [conceptItems, setConceptItems] = useState({}); // Map conceptId -> items

    useEffect(() => {
        fetchConcepts();
    }, [refreshTrigger]);

    const fetchConcepts = async () => {
        try {
            setLoading(true);
            const res = await conceptsAPI.getConcepts({});
            setConcepts(res.data);
        } catch (err) {
            toast.error('Failed to load concepts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async (conceptId) => {
        try {
            const res = await conceptsAPI.getItems({ concept_id: conceptId });
            setConceptItems(prev => ({ ...prev, [conceptId]: res.data }));
        } catch (err) {
            console.error("Failed to load items", err);
        }
    };

    const toggleExpand = (conceptId) => {
        if (expandedConcept === conceptId) {
            setExpandedConcept(null);
        } else {
            setExpandedConcept(conceptId);
            if (!conceptItems[conceptId]) {
                fetchItems(conceptId);
            }
        }
    };

    const handleCreateConcept = async (e) => {
        e.preventDefault();
        try {
            await conceptsAPI.createConcept(newConcept);
            toast.success('Concept created successfully!');
            setShowCreateModal(false);
            setNewConcept({ name: '', subject_area: 'Computer Science', description: '', difficulty_level: 'medium' });
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            toast.error('Failed to create concept');
        }
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newItem,
                concept_id: selectedConceptForItem,
                options: newItem.options.filter(o => o.trim() !== '') // Clean empty options
            };

            await conceptsAPI.createItem(payload);
            toast.success('Question added successfully!');
            setShowItemModal(false);
            setNewItem({ question: '', item_type: 'multiple_choice', difficulty: 'medium', correct_answer: '', options: ['', '', '', ''] });
            fetchItems(selectedConceptForItem); // Refresh items
        } catch (err) {
            toast.error('Failed to add question');
        }
    };

    const updateOption = (index, value) => {
        const newOptions = [...newItem.options];
        newOptions[index] = value;
        setNewItem({ ...newItem, options: newOptions });
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="text-orange-500" /> Curriculum Manager
                        </h1>
                        <p className="text-gray-500">Manage mastery concepts and practice questions for students.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus size={20} /> Create Concept
                    </button>
                </div>

                {/* Concepts List */}
                {loading ? (
                    <div className="text-center py-10">Loading curriculum...</div>
                ) : (
                    <div className="space-y-4">
                        {concepts.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <BookOpen className="mx-auto text-gray-300 mb-2" size={48} />
                                <p className="text-gray-500">No concepts defined yet.</p>
                                <button onClick={() => setShowCreateModal(true)} className="text-orange-500 font-medium mt-2 hover:underline">Create your first concept</button>
                            </div>
                        )}
                        {concepts.map((concept) => (
                            <div key={concept.concept_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleExpand(concept.concept_id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedConcept === concept.concept_id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                        <div>
                                            <h3 className="font-bold text-gray-800">{concept.name}</h3>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{concept.subject_area}</span>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{concept.difficulty_level}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details - Practice Items */}
                                {expandedConcept === concept.concept_id && (
                                    <div className="bg-slate-50 border-t border-gray-100 p-4 pl-12">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                                <HelpCircle size={16} /> Practice Current Questions
                                            </h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedConceptForItem(concept.concept_id); setShowItemModal(true); }}
                                                className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-1 shadow-sm"
                                            >
                                                <Plus size={14} /> Add Question
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {/* Items List */}
                                            {!conceptItems[concept.concept_id] ? (
                                                <div className="text-gray-400 text-sm">Loading questions...</div>
                                            ) : conceptItems[concept.concept_id].length === 0 ? (
                                                <div className="text-gray-400 text-sm italic">No questions added yet.</div>
                                            ) : (
                                                conceptItems[concept.concept_id].map(item => (
                                                    <div key={item.item_id} className="bg-white p-3 rounded border border-gray-200 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-gray-800">{item.question}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded ${item.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                                                    item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-green-100 text-green-700'
                                                                }`}>{item.difficulty}</span>
                                                        </div>
                                                        <div className="mt-2 text-gray-500 text-xs">
                                                            Answer: {item.correct_answer}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Concept Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold mb-4">Create New Concept</h2>
                            <form onSubmit={handleCreateConcept} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Concept Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={newConcept.name}
                                        onChange={e => setNewConcept({ ...newConcept, name: e.target.value })}
                                        placeholder="e.g. Digital Evidence Collection"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={newConcept.difficulty_level}
                                        onChange={e => setNewConcept({ ...newConcept, difficulty_level: e.target.value })}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="w-full p-2 border rounded-lg"
                                        value={newConcept.description}
                                        onChange={e => setNewConcept({ ...newConcept, description: e.target.value })}
                                        rows={3}
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Question Modal */}
                {showItemModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                            <h2 className="text-xl font-bold mb-4">Add Practice Question</h2>
                            <form onSubmit={handleCreateItem} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                    <textarea
                                        required
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={newItem.question}
                                        onChange={e => setNewItem({ ...newItem, question: e.target.value })}
                                        placeholder="What is the primary function of..."
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {newItem.options.map((opt, idx) => (
                                        <div key={idx}>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Option {idx + 1}</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded-lg text-sm"
                                                value={opt}
                                                onChange={e => updateOption(idx, e.target.value)}
                                                placeholder={`Option ${idx + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-2 border rounded-lg"
                                        value={newItem.correct_answer}
                                        onChange={e => setNewItem({ ...newItem, correct_answer: e.target.value })}
                                        placeholder="Exact text of correct option"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Must match one of the options exactly.</p>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowItemModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Add Question
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default TeacherCurriculum;
