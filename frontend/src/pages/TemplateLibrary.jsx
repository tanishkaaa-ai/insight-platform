import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Search, Filter, Clock, Users, Target, Workflow, Sparkles, Award, Shield, Globe, Code2, Zap, TrendingUp, Loader, Plus, Upload, File } from 'lucide-react';
import { templatesAPI, resourcesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TeacherLayout from '../components/TeacherLayout';

const StatCard = ({ icon: Icon, label, value, trend, color, subtext }) => (
  <div className="bg-[#F4FFFD] p-6 rounded-2xl border-2 border-[#065F46]/20 shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <h3 className="text-3xl font-extrabold text-[#065F46] mb-1">{value}</h3>
    <p className="text-sm font-medium text-[#065F46]/70">{label}</p>
    {subtext && <p className="text-xs text-[#065F46]/50 mt-2">{subtext}</p>}
  </div>
);

const TemplateLibrary = () => {
  const { getUserId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('downloads');
  const [favorites, setFavorites] = useState([]);

  // Data State
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, downloads: 0 });

  // Resource Generation State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generationDifficulty, setGenerationDifficulty] = useState('Medium');
  const [generatedBanks, setGeneratedBanks] = useState([]);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'banks'

  const categories = ['Project', 'Lesson', 'Assessment', 'Activity', 'Unit Plan'];
  const subjects = ['Science', 'Mathematics', 'History', 'English', 'Civics', 'Computer Science'];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = {
        q: searchTerm,
        limit: 20
      };
      if (selectedCategory) params.template_type = selectedCategory.toLowerCase().replace(' ', '_');
      if (selectedSubject) params.subject = selectedSubject;

      const response = await templatesAPI.searchTemplates(params);

      let fetchedTemplates = response.data.templates || [];

      if (sortBy === 'downloads') {
        fetchedTemplates.sort((a, b) => b.usage_count - a.usage_count);
      } else if (sortBy === 'rating') {
        fetchedTemplates.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'date') {
        fetchedTemplates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      setTemplates(fetchedTemplates);
      setStats({
        total: response.data.total || fetchedTemplates.length,
        downloads: fetchedTemplates.reduce((sum, t) => sum + (t.usage_count || 0), 0)
      });

    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionBanks = async () => {
    try {
      setLoading(true);
      const res = await resourcesAPI.getQuestionBanks({ teacher_id: getUserId() });
      setGeneratedBanks(res.data);
    } catch (err) {
      console.error("Failed to fetch banks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const uploadRes = await resourcesAPI.uploadFile(formData);
      const fileUrl = uploadRes.data.file_url;

      await resourcesAPI.generateQuestions({
        file_url: fileUrl,
        difficulty: generationDifficulty,
        title: uploadFile.name.split('.')[0],
        teacher_id: getUserId()
      });

      await fetchQuestionBanks();
      setShowUploadModal(false);
      setUploadFile(null);
      setActiveTab('banks');
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate. Please ensure you have set the GOOGLE_API_KEY in backend .env");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') {
      const delayDebounceFn = setTimeout(() => {
        fetchTemplates();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      fetchQuestionBanks();
    }
  }, [searchTerm, selectedCategory, selectedSubject, sortBy, activeTab]);

  const toggleFavorite = (templateId) => {
    if (favorites.includes(templateId)) {
      setFavorites(favorites.filter(id => id !== templateId));
    } else {
      setFavorites([...favorites, templateId]);
    }
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'} w-4 h-4`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-gray-500 text-sm ml-1">{rating}</span>
      </div>
    );
  };

  const TemplateCard = ({ template }) => (
    <div className={`bg-[#F4FFFD] border-2 border-[#065F46]/20 rounded-2xl p-6 hover:border-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-teal-100 ${template.usage_count > 1000 ? 'ring-2 ring-teal-500/10' : ''}`}>
      {template.usage_count > 1000 && (
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-600 text-xs font-bold mb-4">
          <Sparkles size={12} />
          Popular
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-teal-50 rounded-xl">
          <FileText className="text-teal-600" size={24} />
        </div>
        <button
          onClick={() => toggleFavorite(template.template_id)}
          className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg
            className={`${favorites.includes(template.template_id) ? 'text-amber-400' : 'text-gray-300'} w-5 h-5`}
            fill={favorites.includes(template.template_id) ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-2">{template.title}</h3>
      <p className="text-gray-500 mb-4 text-sm line-clamp-2">{template.description || 'No description available.'}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {template.template_type && (
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100 capitalize">
            {template.template_type.replace('_', ' ')}
          </span>
        )}
        {template.subject_area && (
          <span className="px-3 py-1 bg-violet-50 text-violet-600 text-xs font-medium rounded-full border border-violet-100">
            {template.subject_area}
          </span>
        )}
        {template.grade_level && (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-100">
            Grade {template.grade_level}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <StarRating rating={template.rating || 0} />
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Download size={14} />
          <span>{(template.usage_count || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="text-xs text-gray-500">
          By {template.author?.name || 'Unknown'}
        </div>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-all flex items-center gap-2 shadow-sm">
          <Download size={16} />
          Use Template
        </button>
      </div>
    </div>
  );

  // Create Template Logic
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
    subject_area: 'Science',
    grade_level: 7,
    template_type: 'project',
    duration_weeks: 2
  });

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await templatesAPI.createTemplate({
        ...newTemplate,
        teacher_id: getUserId()
      });
      setShowCreateModal(false);
      fetchTemplates(); // Refresh list
      // Reset form
      setNewTemplate({
        title: '',
        description: '',
        subject_area: 'Science',
        grade_level: 7,
        template_type: 'project',
        duration_weeks: 2
      });
    } catch (error) {
      console.error("Failed to create template", error);
    }
  };


  const handleExportPDF = (bank) => {
    if (!bank) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export PDF");
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${bank.title} - Question Bank</title>
        <style>
          body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 30px; font-size: 0.9em; }
          .question-card { margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #eee; padding: 20px; border-radius: 8px; }
          .q-num { font-weight: bold; color: #4F46E5; margin-bottom: 10px; display: block; }
          .q-text { font-size: 1.1em; font-weight: bold; margin-bottom: 15px; }
          .options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .option { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          .correct { background-color: #ecfdf5; border-color: #10b981; font-weight: bold; }
          .explanation { margin-top: 15px; padding: 10px; background-color: #f3f4f6; border-left: 4px solid #4F46E5; font-size: 0.9em; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${bank.title}</h1>
        <div class="meta">
          <p><strong>Description:</strong> ${bank.description}</p>
          <p><strong>Create Date:</strong> ${new Date(bank.created_at).toLocaleDateString()}</p>
          <p><strong>Difficulty:</strong> ${bank.difficulty_level}</p>
        </div>

        ${bank.questions.map((q, idx) => `
          <div class="question-card">
            <span class="q-num">Question ${idx + 1}</span>
            <div class="q-text">${q.question}</div>
            <div class="options">
              ${q.options.map((opt, i) => `
                <div class="option ${opt === q.correct_answer ? 'correct' : ''}">
                  <span style="color: #999; font-weight: bold; margin-right: 5px;">${String.fromCharCode(65 + i)}.</span>
                  ${opt}
                </div>
              `).join('')}
            </div>
            ${q.explanation ? `
              <div class="explanation">
                <strong>Explanation:</strong> ${q.explanation}
              </div>
            ` : ''}
          </div>
        `).join('')}

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  // View Bank Logic
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  const handleViewBank = (bank) => {
    setSelectedBank(bank);
    setShowViewModal(true);
  };

  const ViewBankModal = ({ bank, onClose }) => {
    if (!bank) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{bank.title}</h2>
              <p className="text-gray-500 text-sm">{bank.description}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {bank.questions?.map((q, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-4">{q.question}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options?.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${opt === q.correct_answer
                            ? 'bg-green-50 border-green-200 text-green-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-600'
                            }`}
                        >
                          <span className="mr-2 uppercase text-xs font-bold text-gray-400">{String.fromCharCode(65 + i)}</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {q.explanation && (
                  <div className="mt-4 ml-11 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 text-sm text-indigo-800">
                    <span className="font-bold block mb-1">Explanation:</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
            >
              Close
            </button>
            <button
              onClick={() => handleExportPDF(bank)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2"
            >
              <Download size={18} /> Export PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#065F46] mb-2">Template Library</h1>
            <p className="text-[#065F46]/70">Curriculum-Aligned Templates • Save 3 Hours Weekly</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              <Upload size={20} /> Upload Resource
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg shadow-teal-200"
            >
              <Plus size={20} /> Create Template
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'templates' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Available Resources
          </button>
          <button
            onClick={() => setActiveTab('banks')}
            className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'banks' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Generated Question Banks
          </button>
        </div>

        {/* Search and Filters - Show only for Templates (or adapt for banks later) */}
        {activeTab === 'templates' && (
          <>
            <div className="bg-[#F4FFFD] border-2 border-[#065F46]/20 rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="downloads">Most Downloaded</option>
                  <option value="rating">Highest Rated</option>
                  <option value="date">Newest</option>
                </select>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                icon={FileText}
                label="Total Templates"
                value={stats.total}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                icon={Download}
                label="Total Downloads"
                value={stats.downloads.toLocaleString()}
                color="bg-green-50 text-green-600"
              />
              <StatCard
                icon={Users}
                label="Curated Resources"
                value={stats.total}
                color="bg-amber-50 text-amber-600"
              />
              <StatCard
                icon={TrendingUp}
                label="Time Saved"
                value="50%"
                color="bg-purple-50 text-purple-600"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-teal-50/20 rounded-2xl">
                <Loader className="animate-spin text-teal-600" size={40} />
              </div>
            ) : (
              <>
                {/* All Templates */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <BookOpen className="text-teal-600" size={24} />
                    Available Resources
                  </h2>
                  {templates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {templates.map(template => (
                        <div key={template.template_id} className={`bg-[#F4FFFD] border-2 border-[#065F46]/20 rounded-2xl p-6 hover:border-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-teal-100 ${template.usage_count > 1000 ? 'ring-2 ring-teal-500/10' : ''}`}>
                          {template.usage_count > 1000 && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-600 text-xs font-bold mb-4">
                              <Sparkles size={12} />
                              Popular
                            </div>
                          )}

                          <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-teal-50 rounded-xl">
                              <FileText className="text-teal-600" size={24} />
                            </div>
                            <button
                              onClick={() => toggleFavorite(template.template_id)}
                              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <svg
                                className={`${favorites.includes(template.template_id) ? 'text-amber-400' : 'text-gray-300'} w-5 h-5`}
                                fill={favorites.includes(template.template_id) ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>
                          </div>

                          <h3 className="text-xl font-bold text-gray-800 mb-2">{template.title}</h3>
                          <p className="text-gray-500 mb-4 text-sm line-clamp-2">{template.description || 'No description available.'}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {template.template_type && (
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100 capitalize">
                                {template.template_type.replace('_', ' ')}
                              </span>
                            )}
                            {template.subject_area && (
                              <span className="px-3 py-1 bg-violet-50 text-violet-600 text-xs font-medium rounded-full border border-violet-100">
                                {template.subject_area}
                              </span>
                            )}
                            {template.grade_level && (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-100">
                                Grade {template.grade_level}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <StarRating rating={template.rating || 0} />
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                              <Download size={14} />
                              <span>{(template.usage_count || 0).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="text-xs text-gray-500">
                              By {template.author?.name || 'Unknown'}
                            </div>
                            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-all flex items-center gap-2 shadow-sm">
                              <Download size={16} />
                              Use Template
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Search className="mx-auto text-gray-300 mb-4" size={48} />
                      <p>No templates found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}


        {/* Generated Question Banks Tab */}
        {
          activeTab === 'banks' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Code2 className="text-indigo-600" size={24} />
                Your Question Banks
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-20 bg-indigo-50/20 rounded-2xl">
                  <Loader className="animate-spin text-indigo-600" size={40} />
                </div>
              ) : generatedBanks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedBanks.map(bank => (
                    <div key={bank._id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                          <File className="text-indigo-600" size={24} />
                        </div>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-medium">
                          {bank.questions?.length || 0} Qs
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-800 mb-2 truncate" title={bank.title}>{bank.title}</h3>
                      <p className="text-gray-500 mb-4 text-sm line-clamp-2">{bank.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${bank.difficulty_level === 'Easy' ? 'bg-green-50 text-green-600 border-green-100' :
                          bank.difficulty_level === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                          {bank.difficulty_level}
                        </span>
                        <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100 flex items-center gap-1">
                          <Clock size={10} /> {new Date(bank.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <button
                          onClick={() => handleViewBank(bank)}
                          className="flex-1 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <BookOpen size={16} /> View Bank
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Upload className="mx-auto text-gray-300 mb-4" size={48} />
                  <p>No question banks generated yet. Upload a resource to get started!</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-4 text-indigo-600 font-bold hover:underline"
                  >
                    Upload Resource
                  </button>
                </div>
              )}
            </div>
          )
        }

        {/* Research Citation */}
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mt-8">
          <p className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
            <Zap className="text-indigo-600" size={20} />
            Research-Backed Design
          </p>
          <p className="text-indigo-700 text-sm">
            Curriculum-aligned template libraries reduce teacher planning time by 50% while maintaining pedagogical quality.
            Standardized templates ensure consistent learning objectives while providing flexibility for diverse teaching styles.
            <br />
            <span className="opacity-75 block mt-2">— Paper 12.pdf: Effectiveness of Template-Based Lesson Planning</span>
          </p>
        </div>
      </div >

      {/* View Bank Modal */}
      {showViewModal && selectedBank && (
        <ViewBankModal bank={selectedBank} onClose={() => setShowViewModal(false)} />
      )}

      {/* Upload Resource Modal */}
      {
        showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Upload className="text-indigo-600" /> Upload Resource
              </h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select File (PDF, DOCX, TXT)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-gray-50">
                    <input
                      required
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={e => setUploadFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <FileText className="text-gray-400" size={32} />
                      <span className="text-sm font-medium text-gray-600">
                        {uploadFile ? uploadFile.name : "Click to browse"}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                  <select
                    value={generationDifficulty}
                    onChange={e => setGenerationDifficulty(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader className="animate-spin" size={16} /> Generating...
                      </>
                    ) : (
                      <>Generate Questions</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Create Template Modal */}

      {/* Create Template Modal */}
      {
        showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F4FFFD] border-2 border-[#065F46]/20 rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 text-[#065F46]">Create New Template</h2>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newTemplate.title}
                    onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                    placeholder="e.g. Physics Lab 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newTemplate.description}
                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    rows={3}
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newTemplate.subject_area}
                      onChange={e => setNewTemplate({ ...newTemplate, subject_area: e.target.value })}
                    >
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      className="w-full p-2 border rounded-lg"
                      value={newTemplate.grade_level}
                      onChange={e => setNewTemplate({ ...newTemplate, grade_level: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={newTemplate.template_type}
                    onChange={e => setNewTemplate({ ...newTemplate, template_type: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c.toLowerCase().replace(' ', '_')}>{c}</option>)}
                  </select>
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
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </TeacherLayout >
  );
};


export default TemplateLibrary;