import React, { useState, useEffect } from 'react';
import { Send, Users, AlertCircle, Clock, BarChart3, MessageSquare, Zap, Loader } from 'lucide-react';
import { pollsAPI, classroomAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TeacherLayout from '../components/TeacherLayout';

const LivePollingSystem = () => {
  const { getUserId, isTeacher } = useAuth();
  const [activePoll, setActivePoll] = useState(null);
  const [pollHistory, setPollHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsInView, setStatsInView] = useState(false);

  // Class selection
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const teacherId = isTeacher() ? getUserId() : null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setStatsInView(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) observer.observe(statsSection);

    return () => observer.disconnect();
  }, []);

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!teacherId) {
        setLoadingClasses(false);
        return;
      }
      try {
        const response = await classroomAPI.getTeacherClasses(teacherId);
        setClasses(response.data);
        if (response.data.length > 0) {
          setNewPoll(prev => ({ ...prev, classroom_id: response.data[0].classroom_id }));
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [teacherId]);

  // Teacher: Create new poll
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '', '', ''],
    type: 'understanding',
    correctAnswer: null,
    classroom_id: ''
  });

  // Fetch polls when class is selected
  useEffect(() => {
    const fetchPolls = async () => {
      if (!newPoll.classroom_id) return;
      try {
        const res = await pollsAPI.getClassPolls(newPoll.classroom_id);
        const polls = res.data;

        // Separate active vs history
        // Backend returns formatted calculation now, but we need to ensure 'responses' array exists for UI
        // formatResponses helper handles response_counts/percentages -> array
        const processedPolls = polls.map(p => ({
          ...p,
          responses: p.responses || formatResponses(p)
        }));

        const active = processedPolls.find(p => p.is_active);
        const history = processedPolls.filter(p => !p.is_active);

        setActivePoll(active || null);
        setPollHistory(history);

      } catch (error) {
        console.error("Error fetching polls:", error);
      }
    };
    fetchPolls();
  }, [newPoll.classroom_id]);

  // Polling for live results
  useEffect(() => {
    let intervalId;
    if (activePoll?.is_active) {
      intervalId = setInterval(async () => {
        try {
          const response = await pollsAPI.getPollResults(activePoll.poll_id);
          // Only update if data changed significantly or just refresh stats
          setActivePoll(prev => ({
            ...prev,
            totalResponses: response.data.total_responses,
            responses: formatResponses(response.data),
            ...response.data // Merge other stats
          }));
        } catch (error) {
          console.error("Error fetching poll results:", error);
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [activePoll?.is_active, activePoll?.poll_id]);

  const formatResponses = (data) => {
    // Map API response percentages back to UI format
    // data.response_percentages = { "Yes": 50, "No": 50 }
    // data.response_counts = { "Yes": 5, "No": 5 }
    if (!data.response_counts) return [];

    return Object.keys(data.response_counts).map(option => ({
      option,
      count: data.response_counts[option],
      percentage: data.response_percentages[option] || 0
    }));
  };

  // Animated counter component
  const AnimatedCounter = ({ end, suffix = '', duration = 2000, decimals = 0 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!statsInView) return;

      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = progress * end;

        if (decimals > 0) {
          setCount(parseFloat(value.toFixed(decimals)));
        } else {
          setCount(Math.floor(value));
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [statsInView, end, duration, decimals]);

    return <span>{count}{suffix}</span>;
  };

  const createPoll = async () => {
    if (!teacherId) {
      alert("Please log in as a teacher to create polls.");
      return;
    }
    if (!newPoll.classroom_id) {
      alert("Please select a classroom.");
      return;
    }

    try {
      setLoading(true);

      // If there's an active poll, close it first so it goes to history cleanly
      if (activePoll && activePoll.is_active) {
        try {
          await pollsAPI.closePoll(activePoll.poll_id);
          // We don't need to update history state here because we are about to fetch/create state, 
          // but strictly speaking we should push it to history to be safe.
          // Actually, let's just let the new poll take over active slot.
          const closedPoll = { ...activePoll, is_active: false };
          setPollHistory(prev => [closedPoll, ...prev]);
        } catch (err) {
          console.warn("Failed to auto-close previous poll", err);
        }
      }

      const pollData = {
        teacher_id: teacherId,
        classroom_id: newPoll.classroom_id,
        question: newPoll.question,
        options: newPoll.options.filter(o => o.trim() !== ''),
        poll_type: newPoll.type,
        correct_answer: newPoll.correctAnswer,
        anonymous: true
      };

      const res = await pollsAPI.createPoll(pollData);

      const createdPoll = {
        poll_id: res.data.poll_id,
        ...pollData,
        is_active: true,
        totalResponses: 0,
        classSize: 30, // Mock
        responses: pollData.options.map(o => ({ option: o, count: 0, percentage: 0 }))
      };

      setActivePoll(createdPoll);
      setNewPoll(prev => ({
        ...prev,
        question: '',
        options: ['', '', '', ''],
        type: 'understanding',
        correctAnswer: null,
      }));
    } catch (error) {
      console.error("Failed to create poll:", error);
      alert("Failed to create poll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closePoll = async () => {
    if (activePoll) {
      try {
        await pollsAPI.closePoll(activePoll.poll_id);
        const closedPoll = { ...activePoll, is_active: false };
        setPollHistory([closedPoll, ...pollHistory]);
        setActivePoll(null);
      } catch (error) {
        console.error("Failed to close poll:", error);
      }
    }
  };

  if (loadingClasses) {
    return <div className="min-h-screen bg-teal-50/20 p-6 flex items-center justify-center">
      <Loader className="animate-spin text-teal-600" size={40} />
    </div>;
  }

  // Teacher View
  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Live Polling Control Center</h1>
          <p className="text-gray-500">Launch anonymous polls to gauge real-time understanding.</p>
        </div>

        {/* Create Poll Section */}
        {!activePoll && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <MessageSquare className="text-teal-600" />
              Create New Poll
            </h2>

            <div className="space-y-6 max-w-2xl">
              {/* Class Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Classroom</label>
                <select
                  value={newPoll.classroom_id}
                  onChange={(e) => setNewPoll({ ...newPoll, classroom_id: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                >
                  {classes.length === 0 && <option value="">No classes found</option>}
                  {classes.map(cls => (
                    <option key={cls.classroom_id} value={cls.classroom_id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Question</label>
                <input
                  type="text"
                  value={newPoll.question}
                  onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                  placeholder="What would you like to ask your students?"
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Poll Type</label>
                <select
                  value={newPoll.type}
                  onChange={(e) => setNewPoll({ ...newPoll, type: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-gray-900"
                >
                  <option value="understanding">Understanding Check</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="fact_based">Fact-Based (has correct answer)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Options</label>
                <div className="space-y-3">
                  {newPoll.options.map((option, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const updated = [...newPoll.options];
                        updated[idx] = e.target.value;
                        setNewPoll({ ...newPoll, options: updated });
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={createPoll}
                disabled={loading || !newPoll.question || !newPoll.classroom_id}
                className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-200 disabled:opacity-50"
              >
                {loading ? 'Launching...' : <><Send size={20} /> Launch Poll</>}
              </button>
            </div>
          </div>
        )}

        {/* Active Poll Display */}


        {/* Poll History */}
        {pollHistory.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Clock className="text-gray-400" />
              Recent Polls History
            </h2>
            <div className="space-y-6">
              {pollHistory.map((poll) => (
                <div key={poll.poll_id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{poll.question}</h3>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {poll.created_at ? new Date(poll.created_at).toLocaleDateString() : 'Unknown Date'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Handle both format variations just in case, though backend now returns formatResponses style data if we updated it, 
                          actually backend returns { response_percentages: {}, response_counts: {} } in calculate_poll_results.
                          We might need to run formatResponses on these items if they come raw from API.
                          But wait, I should probably format them when I fetch them. 
                      */}
                    {(poll.responses || formatResponses(poll)).map((response, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-600">{response.option}</span>
                          <span className="text-xs text-gray-500">
                            {response.count} votes ({response.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-400"
                            style={{ width: `${response.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm text-gray-500">
                    <span>Total Responses: {poll.total_responses || poll.totalResponses || 0}</span>
                    <span className="font-medium text-teal-600">{poll.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Citation */}
        <div id="stats-section" className="mt-8 bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
          <div className="flex items-start gap-3">
            <Zap className="text-indigo-600 mt-1" size={20} />
            <div>
              <p className="font-bold text-indigo-900 mb-1">Pedagogical Insight</p>
              <p className="text-indigo-700 text-sm">
                "Immediate feedback allows lecturers to gauge student understanding in real-time and adjust teaching timely."
                <br />
                <span className="opacity-75">— Educational Impact Study (Paper 8h)</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default LivePollingSystem;
