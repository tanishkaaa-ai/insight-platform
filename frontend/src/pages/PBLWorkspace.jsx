import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, Users, FileText, Upload, Calendar, AlertTriangle, Workflow, Target, Check, Briefcase, Sparkles, Award, Gauge, Plus, ChevronRight, Layout, Loader, X, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import TeacherLayout from '../components/TeacherLayout';
import { projectsAPI, classroomAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// --- MODALS ---

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated, classroomId, teacherId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        classroom_id: classroomId,
        teacher_id: teacherId,
        stage: 'QUESTIONING',
        project_type: 'team'
      };
      console.info('[PBL] Creating project:', {
        title: data.title,
        classroom_id: classroomId,
        teacher_id: teacherId,
        deadline: data.deadline
      });
      const response = await projectsAPI.createProject(data);
      console.info('[PBL] Project created successfully:', response.data);
      toast.success('Project created successfully!');
      onProjectCreated();
      onClose();
    } catch (error) {
      console.error("[PBL] Failed to create project:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error("Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Create New Project</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Project Title <span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
              placeholder="e.g. Sustainable Energy Solutions"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all font-medium h-24 resize-none"
              placeholder="Briefly describe the project goals..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Deadline <span className="text-red-500">*</span></label>
            <input
              required
              type="date"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all font-medium"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const CreateMilestoneModal = ({ isOpen, onClose, onCreated, projectId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectsAPI.createMilestone(projectId, formData);
      toast.success('Milestone created!');
      onCreated();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create milestone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Add Milestone</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
            <input required type="text" className="w-full px-4 py-2 bg-gray-50 border rounded-xl"
              value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Details</label>
            <textarea className="w-full px-4 py-2 bg-gray-50 border rounded-xl h-20"
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
            <input required type="date" className="w-full px-4 py-2 bg-gray-50 border rounded-xl"
              value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-teal-600 text-white font-bold rounded-xl mt-2">
            {loading ? 'Saving...' : 'Create Milestone'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const CreateTeamModal = ({ isOpen, onClose, onCreated, projectId, students }) => {
  const [teamName, setTeamName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectsAPI.createTeam(projectId, {
        team_name: teamName,
        members: selectedStudents
      });
      toast.success('Team created successfully!');
      onCreated();
      onClose();
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.error || 'Failed to create team';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Create Team & Assign Students</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Team Name</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl"
              placeholder="e.g. Alpha Squad"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Students ({selectedStudents.length})</label>
            <div className="space-y-2 border border-gray-100 rounded-xl p-2 max-h-60 overflow-y-auto">
              {students.map(student => (
                <div key={student.student_id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedStudents.includes(student.student_id) ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50 border border-transparent'}`}
                  onClick={() => toggleStudent(student.student_id)}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 ${selectedStudents.includes(student.student_id) ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
                    {selectedStudents.includes(student.student_id) && <Check size={14} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{student.name}</div>
                    <div className="text-xs text-gray-500">{student.email || 'No email'}</div>
                  </div>
                </div>
              ))}
              {students.length === 0 && <div className="text-center text-gray-400 py-4">No students found in class.</div>}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !teamName || selectedStudents.length === 0} className="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const PBLWorkspace = () => {
  const { getUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // ... (inside PBLWorkspace component)



  useEffect(() => {
    // Fetch classes first
    const fetchClasses = async () => {
      const userId = getUserId();
      if (userId) {
        try {
          const res = await classroomAPI.getTeacherClasses(userId);
          setClasses(res.data);
          if (res.data.length > 0) {
            setSelectedClassId(res.data[0].classroom_id);
          } else {
            setLoading(false);
          }
        } catch (e) {
          console.error("Error fetching classes:", e);
          setLoading(false);
        }
      }
    };
    fetchClasses();
  }, [getUserId]);

  useEffect(() => {
    if (!selectedClassId) return;

    const fetchClassStudents = async () => {
      try {
        const res = await classroomAPI.getClassroomStudents(selectedClassId);
        setStudents(res.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchClassStudents();
    fetchProjects();
  }, [selectedClassId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.getClassroomProjects(selectedClassId);
      const fetchedProjects = res.data.projects || [];
      setProjects(fetchedProjects);

      if (fetchedProjects.length > 0) {
        // If we already have a selected project, keep it (refresh)
        // Otherwise, do NOT auto-select, let user choose from list
        if (selectedProjectId && fetchedProjects.find(p => p.project_id === selectedProjectId)) {
          // Refetch details for the selected one
          const detailRes = await projectsAPI.getProjectDetails(selectedProjectId);
          const transformedProject = transformBackendData(detailRes.data);
          setProject(transformedProject);
          setTeams(detailRes.data.teams || []);
        } else {
          // List view mode
          setProject(null);
          setTeams([]);
          setSelectedProjectId('');
        }
      } else {
        setProject(null);
        setTeams([]);
        setSelectedProjectId('');
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }

  };

  const handleProjectSelect = async (projectId) => {
    setLoading(true);
    try {
      setSelectedProjectId(projectId);
      const detailRes = await projectsAPI.getProjectDetails(projectId);
      const transformedProject = transformBackendData(detailRes.data);
      setProject(transformedProject);
      setTeams(detailRes.data.teams || []);
    } catch (err) {
      console.error("Error selecting project:", err);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToProjects = () => {
    setProject(null);
    setSelectedProjectId('');
  };

  const fetchTeams = async (projectId) => {
    if (!projectId) return;
    try {
      // Verify endpoints - usually getProjectDetails includes teams, but let's be safe
      const res = await projectsAPI.getProjectDetails(projectId);
      if (res.data.teams) {
        setTeams(res.data.teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleCreateTeam = async (teamName, selectedMembers) => {
    if (!project) return;
    try {
      await projectsAPI.createTeam(project.project_id, {
        team_name: teamName,
        members: selectedMembers
      });
      // Refresh
      fetchProjects();
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team");
    }
  };

  const handleAddMember = async (teamId, studentId) => {
    try {
      await projectsAPI.addTeamMember(teamId, { student_id: studentId });
      fetchProjects();
    } catch (error) {
      console.error("Failed to add member", error);
      alert("Failed to add member");
    }
  };

  const transformBackendData = (data) => {
    return {
      ...data,
      metrics: data.metrics || {
        completion: 0,
        quality: 0,
        efficiency: 0,
        collaboration: 0
      },
      artifacts: data.artifacts || [],
      // Ensure milestones array exists
      milestones: data.milestones || [],
      team: data.teams && data.teams.length > 0 ? data.teams[0] : { name: "No Team Selected", members: [] },
      // Ensure stages exist
      stages: Object.values(data.stage_info ? { [data.stage]: data.stage_info } : {}) // simplified fallback
    };
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader className="animate-spin text-teal-600" size={40} />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">PBL Workspace</h1>
            <p className="text-gray-500">Project Management & Assignments</p>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 font-bold text-gray-700 focus:ring-2 focus:ring-teal-500"
            >
              {classes.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.class_name}</option>)}
            </select>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {!project ? (
          <div className="space-y-6">
            {projects.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                <Workflow className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Projects</h3>
                <p className="text-gray-500 mb-6">Start a new Project-Based Learning module for this class.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
                >
                  <Plus size={20} /> Create First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <div
                    key={p.project_id}
                    onClick={() => handleProjectSelect(p.project_id)}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg ${p.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Workflow size={24} />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">{p.title}</h3>

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Gauge size={16} />
                        <span className="font-semibold">{p.stage || 'Planning'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={16} />
                        <span>Due: {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No Deadline'}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">View Details</span>
                      <div className="p-2 bg-gray-50 rounded-full group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={handleBackToProjects}
              className="flex items-center gap-2 text-gray-500 hover:text-teal-600 font-bold mb-4 transition-colors"
            >
              <ChevronRight size={20} className="rotate-180" /> Back to Projects
            </button>
            {/* Tabs */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
              {[
                { id: 'overview', label: 'Overview', icon: Layout },
                { id: 'team', label: 'Assignments & Teams', icon: Users },
                { id: 'milestones', label: 'Milestones', icon: Target }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-bold transition-all duration-300 whitespace-nowrap border-b-2 ${activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{project.title}</h2>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                        {project.status}
                      </span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> Due: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">{project.description}</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-teal-600">{project.stage}</div>
                    <div className="text-xs text-gray-400 uppercase font-bold">Current Stage</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
                    <div className="text-xs text-gray-400 uppercase font-bold">Active Teams</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-600">{project.milestones.length}</div>
                    <div className="text-xs text-gray-400 uppercase font-bold">Milestones</div>
                  </div>
                </div>
              </div>
            )}

            {/* TEAM / ASSIGNMENT TAB */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">Project Assignments</h3>
                    <p className="text-sm text-gray-500">Manage student groups and assignments</p>
                  </div>
                  <button
                    className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200"
                    onClick={() => setIsTeamModalOpen(true)}
                  >
                    <Plus size={18} /> Assign / Create Team
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map(team => (
                    <div key={team.team_id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Users size={20} />
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg mb-1">{team.team_name}</h4>
                      <p className="text-sm text-gray-500 mb-4">{team.member_count} Members</p>

                      <div className="flex -space-x-2 mb-4">
                        {team.members && team.members.map((member, i) => (
                          <div
                            key={member.student_id || i}
                            className="w-8 h-8 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-xs font-bold text-teal-700 relative group/avatar"
                            title={member.student_name}
                          >
                            {member.student_name?.charAt(0) || '?'}
                            <div className="absolute bottom-full mb-1 hidden group-hover/avatar:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {member.student_name}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-gray-400">
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <Users className="mx-auto mb-3 opacity-50" size={48} />
                      <p className="font-medium">No teams created yet.</p>
                      <button onClick={() => setIsTeamModalOpen(true)} className="text-teal-600 font-bold hover:underline mt-2">
                        Create Team & Assign Students
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MILESTONES TAB */}
            {activeTab === 'milestones' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">Project Milestones</h3>
                    <p className="text-sm text-gray-500">Track key deliverables and deadlines</p>
                  </div>
                  <button
                    className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200"
                    onClick={() => setIsMilestoneModalOpen(true)}
                  >
                    <Plus size={18} /> Add Milestone
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {project.milestones.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <Target className="mx-auto mb-3 opacity-50" size={48} />
                      <p className="font-medium">No milestones set for this project.</p>
                      <button onClick={() => setIsMilestoneModalOpen(true)} className="text-teal-600 font-bold hover:underline mt-2">
                        Add your first milestone
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="p-4 font-bold text-gray-600 text-sm">Milestone</th>
                          <th className="p-4 font-bold text-gray-600 text-sm">Due Date</th>
                          <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                          <th className="p-4 font-bold text-gray-600 text-sm text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {project.milestones.map((m) => (
                          <tr key={m.milestone_id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-gray-800">{m.title}</div>
                              <div className="text-sm text-gray-500">{m.description || 'No description'}</div>
                            </td>
                            <td className="p-4 text-gray-600 font-medium">
                              {m.due_date ? new Date(m.due_date).toLocaleDateString() : 'No date'}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${m.is_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {m.is_completed ? 'Completed' : 'Pending'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={async () => {
                                  if (confirm('Delete milestone?')) {
                                    try {
                                      await projectsAPI.deleteMilestone(m.milestone_id);
                                      fetchProjects();
                                      toast.success('Deleted');
                                    } catch (e) { toast.error('Failed'); }
                                  }
                                }}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </>
        )}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateProjectModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onProjectCreated={fetchProjects}
            classroomId={selectedClassId}
            teacherId={getUserId()}
          />
        )}
        {isMilestoneModalOpen && (
          <CreateMilestoneModal
            isOpen={isMilestoneModalOpen}
            onClose={() => setIsMilestoneModalOpen(false)}
            onCreated={fetchProjects}
            projectId={project?.project_id}
          />
        )}
        {isTeamModalOpen && (
          <CreateTeamModal
            isOpen={isTeamModalOpen}
            onClose={() => setIsTeamModalOpen(false)}
            onCreated={fetchProjects}
            projectId={project?.project_id}
            students={students}
          />
        )}
      </AnimatePresence>
    </TeacherLayout>
  );
};

export default PBLWorkspace;