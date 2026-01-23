import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Search, Filter, Clock, Users, Target, Workflow, Sparkles, Award, Shield, Globe, Code2, Zap, TrendingUp, Loader } from 'lucide-react';
import { templatesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TeacherLayout from '../components/TeacherLayout';

const StatCard = ({ icon: Icon, label, value, trend, color, subtext }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
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
    <h3 className="text-3xl font-extrabold text-gray-800 mb-1">{value}</h3>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTemplates();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory, selectedSubject, sortBy]);

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
    <div className={`bg-white border border-gray-100 rounded-2xl p-6 hover:border-teal-200 transition-all duration-300 hover:shadow-lg hover:shadow-teal-100 ${template.usage_count > 1000 ? 'ring-2 ring-teal-500/10' : ''}`}>
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

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Template Library</h1>
          <p className="text-gray-500">Curriculum-Aligned Templates • Save 3 Hours Weekly</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
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
                    <TemplateCard key={template.template_id} template={template} />
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

        {/* Research Citation */}
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
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
      </div>
    </TeacherLayout>
  );
};

export default TemplateLibrary;