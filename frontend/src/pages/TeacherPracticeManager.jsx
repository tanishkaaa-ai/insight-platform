import React, { useState, useEffect } from 'react';
import { conceptsAPI, classroomAPI } from '../services/api';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
    BookOpen,
    Plus,
    Edit2,
    Trash2,
    ChevronRight,
    Save,
    X,
    FileText,
    CheckCircle,
    Loader,
    Filter
} from 'lucide-react';

const TeacherPracticeManager = () => {
    const { getUserId } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');

    const [concepts, setConcepts] = useState([]);
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(false);

    // Concept Form State
    const [showConceptModal, setShowConceptModal] = useState(false);
    const [conceptForm, setConceptForm] = useState({ id: null, name: '', description: '', subject_area: 'Science', difficulty_level: 0.5 });

    // Item Form State
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemForm, setItemForm] = useState({
        id: null,
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        difficulty: 0.5,
        explanation: ''
    });

    // --- Fetch Logic --- 

    useEffect(() => {
        const loadClasses = async () => {
            try {
                const res = await classroomAPI.getTeacherClasses(getUserId());
                setClasses(res.data);
            } catch (err) {
                console.error("Failed to load classes", err);
            }
        };
        if (getUserId()) loadClasses();
    }, [getUserId]);

    useEffect(() => {
        fetchConcepts();
    }, [selectedClass]);

    const fetchConcepts = async () => {
        try {
            setLoading(true);
            const params = selectedClass ? { classroom_id: selectedClass } : {};
            const res = await conceptsAPI.getConcepts(params);
            setConcepts(res.data.concepts || res.data || []);
        } catch (error) {
            console.error("Failed to load concepts", error);
            // toast.error("Failed to load concepts"); // Silent fail on init sometimes better
        } finally {
            setLoading(false);
        }
    };


    const fetchItems = async (conceptId) => {
        try {
            setItemsLoading(true);
            // Assuming backend supports filtering by concept_id
            const res = await conceptsAPI.getItems({ concept_id: conceptId });
            setItems(res.data.items || res.data || []);
        } catch (error) {
            console.error("Failed to load items", error);
            toast.error("Failed to load practice items");
        } finally {
            setItemsLoading(false);
        }
    };

    // --- Concept Handlers ---

    const handleEditConcept = (concept) => {
        setConceptForm({
            id: concept.concept_id,
            name: concept.name,
            description: concept.description,
            subject_area: concept.subject_area || 'Science',
            difficulty_level: concept.difficulty_level || 0.5
        });
        setShowConceptModal(true);
    };

    const handleCreateConcept = () => {
        setConceptForm({ id: null, name: '', description: '', subject_area: 'Science', difficulty_level: 0.5 });
        setShowConceptModal(true);
    };

    const handleDeleteConcept = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure? This will delete all associated questions.")) return;
        try {
            await conceptsAPI.deleteConcept(id);
            toast.success("Concept deleted");
            if (selectedConcept?.concept_id === id) setSelectedConcept(null);
            fetchConcepts();
        } catch (error) {
            toast.error("Failed to delete concept");
        }
    };

    const submitConcept = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...conceptForm, classroom_id: selectedClass || undefined };
            if (conceptForm.id) {
                await conceptsAPI.updateConcept(conceptForm.id, payload);
                toast.success("Concept updated");
            } else {
                await conceptsAPI.createConcept(payload);
                toast.success("Concept created");
            }
            setShowConceptModal(false);
            fetchConcepts();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save concept");
        }
    };

    // --- Item Handlers ---

    const handleEditItem = (item) => {
        setItemForm({
            id: item.item_id,
            question_text: item.question_text,
            question_type: item.question_type || 'multiple_choice',
            options: item.options || ['', '', '', ''],
            correct_answer: item.correct_answer,
            difficulty: item.difficulty || 0.5,
            explanation: item.explanation || ''
        });
        setShowItemModal(true);
    };

    const handleCreateItem = () => {
        setItemForm({
            id: null,
            question_text: '',
            question_type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: '',
            difficulty: 0.5,
            explanation: ''
        });
        setShowItemModal(true);
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await conceptsAPI.deleteItem(id);
            toast.success("Question deleted");
            fetchItems(selectedConcept.concept_id);
        } catch (error) {
            toast.error("Failed to delete question");
        }
    };

    const submitItem = async (e) => {
        e.preventDefault();
        if (!selectedConcept) return;

        const payload = {
            ...itemForm,
            question: itemForm.question_text, // Map to backend field
            concept_id: selectedConcept.concept_id,
            // Ensure options is array of strings
            options: itemForm.options.filter(o => o.trim() !== '')
        };

        try {
            if (itemForm.id) {
                await conceptsAPI.updateItem(itemForm.id, payload);
                toast.success("Question updated");
            } else {
                await conceptsAPI.createItem(payload);
                toast.success("Question created");
            }
            setShowItemModal(false);
            fetchItems(selectedConcept.concept_id);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save question");
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...itemForm.options];
        newOptions[index] = value;
        setItemForm({ ...itemForm, options: newOptions });
    };

    return (
        <TeacherLayout>
            <div className="h-[calc(100vh-140px)] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <BookOpen className="text-teal-600" /> Practice Content Manager
                        </h1>
                        <p className="text-gray-500">Manage curriculum concepts and practice questions</p>
                    </div>
                    {/* Class Selector */}
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="bg-transparent border-none text-gray-700 font-medium focus:ring-0 cursor-pointer min-w-[200px]"
                        >
                            <option value="">All Classes (Global)</option>
                            {classes.map(cls => (
                                <option key={cls.classroom_id} value={cls.classroom_id}>
                                    {cls.class_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Left: Concepts List */}
                    <div className="w-1/3 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="font-bold text-gray-700">Concepts</h2>
                            <button
                                onClick={handleCreateConcept}
                                className="p-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
                                title="Add Concept"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader className="animate-spin text-gray-400" /></div>
                            ) : concepts.length === 0 ? (
                                <div className="text-center text-gray-400 p-8">No concepts found. Create one!</div>
                            ) : (
                                concepts.map(concept => (
                                    <div
                                        key={concept.concept_id}
                                        onClick={() => setSelectedConcept(concept)}
                                        className={`p-4 rounded-xl cursor-pointer border transition-all hover:bg-teal-50 group relative
                                            ${selectedConcept?.concept_id === concept.concept_id
                                                ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500'
                                                : 'bg-white border-gray-100 hover:border-teal-200'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-sm">{concept.name}</h3>
                                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{concept.description}</p>
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full mt-2 inline-block text-gray-600">
                                                    {concept.subject_area}
                                                </span>
                                            </div>
                                            {selectedConcept?.concept_id === concept.concept_id && (
                                                <ChevronRight size={16} className="text-teal-600" />
                                            )}
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 p-1 rounded-lg backdrop-blur-sm">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditConcept(concept); }}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteConcept(concept.concept_id, e)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Items Manager */}
                    <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm">
                        {selectedConcept ? (
                            <>
                                <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-2xl flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            {selectedConcept.name}
                                            <span className="text-xs font-normal bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                                                Difficulty: {selectedConcept.difficulty_level}
                                            </span>
                                        </h2>
                                        <p className="text-gray-500 mt-1 text-sm">{selectedConcept.description}</p>
                                    </div>
                                    <button
                                        onClick={handleCreateItem}
                                        className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={18} /> Add Question
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                                    {itemsLoading ? (
                                        <div className="flex justify-center p-8"><Loader className="animate-spin text-teal-500" /></div>
                                    ) : items.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-bold">No questions yet</p>
                                            <p className="text-sm">Add practice items for students to master this concept.</p>
                                        </div>
                                    ) : (
                                        items.map((item, idx) => (
                                            <div key={item.item_id || idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        Q{idx + 1} • {item.question_type?.replace('_', ' ')}
                                                    </span>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditItem(item)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteItem(item.item_id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="font-medium text-gray-800 mb-4">{item.question_text}</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {item.options && item.options.map((opt, i) => (
                                                        <div
                                                            key={i}
                                                            className={`p-2 rounded border text-sm ${opt === item.correct_answer
                                                                ? 'bg-green-50 border-green-200 text-green-700 font-medium'
                                                                : 'bg-white border-gray-100 text-gray-500'
                                                                }`}
                                                        >
                                                            {opt === item.correct_answer && <CheckCircle size={14} className="inline mr-1" />}
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                                <BookOpen size={64} className="mb-4 opacity-10" />
                                <p className="text-lg font-medium">Select a concept to manage questions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Concept Modal */}
            {showConceptModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">{conceptForm.id ? 'Edit Concept' : 'New Concept'}</h3>
                            <button onClick={() => setShowConceptModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={submitConcept} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                <input
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={conceptForm.name}
                                    onChange={e => setConceptForm({ ...conceptForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg h-24"
                                    value={conceptForm.description}
                                    onChange={e => setConceptForm({ ...conceptForm, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Subject Area</label>
                                    <input
                                        className="w-full p-2 border rounded-lg"
                                        value={conceptForm.subject_area}
                                        onChange={e => setConceptForm({ ...conceptForm, subject_area: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty (0-1)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        className="w-full p-2 border rounded-lg"
                                        value={conceptForm.difficulty_level}
                                        onChange={e => setConceptForm({ ...conceptForm, difficulty_level: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 mt-4">
                                Save Concept
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">{itemForm.id ? 'Edit Question' : 'New Question'}</h3>
                            <button onClick={() => setShowItemModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={submitItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Question Text</label>
                                <textarea
                                    required
                                    className="w-full p-2 border rounded-lg h-24"
                                    value={itemForm.question_text}
                                    onChange={e => setItemForm({ ...itemForm, question_text: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Options (Enter 4 choices)</label>
                                <div className="space-y-2">
                                    {itemForm.options.map((opt, i) => (
                                        <div key={i} className="flex gap-2">
                                            <span className="p-2 bg-gray-100 rounded text-gray-500 font-mono w-8 text-center">{String.fromCharCode(65 + i)}</span>
                                            <input
                                                required={i < 2} // Require at least 2 options
                                                className="flex-1 p-2 border rounded-lg"
                                                value={opt}
                                                onChange={e => handleOptionChange(i, e.target.value)}
                                                placeholder={`Option ${i + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Correct Answer (Exact Match)</label>
                                <select
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={itemForm.correct_answer}
                                    onChange={e => setItemForm({ ...itemForm, correct_answer: e.target.value })}
                                >
                                    <option value="">Select Correct Option</option>
                                    {itemForm.options.map((opt, i) => (
                                        opt && <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Explanation</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg h-20"
                                    value={itemForm.explanation}
                                    onChange={e => setItemForm({ ...itemForm, explanation: e.target.value })}
                                    placeholder="Why is this the correct answer?"
                                />
                            </div>

                            <button type="submit" className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 mt-4">
                                Save Question
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </TeacherLayout>
    );
};

export default TeacherPracticeManager;
