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
  const [showDetails, setShowDetails] = useState(false);

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
          const response = await pollsAPI.getPollResults(activePoll.poll_id, { include_details: showDetails });
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
  }, [activePoll?.is_active, activePoll?.poll_id, showDetails]);

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
        {activePoll && activePoll.is_active && (
          <div className="bg-white border border-teal-200 rounded-2xl p-8 shadow-md mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-teal-500"></div>

            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                    Live Now
                  </span>
                  <span className="text-gray-400 text-sm">
                    Started {activePoll.created_at ? new Date(activePoll.created_at).toLocaleTimeString() : ''}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{activePoll.question}</h2>
              </div>

              <button
                onClick={closePoll}
                className="bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                End Poll
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart Section */}
              <div className="lg:col-span-2 space-y-4">
                {(activePoll.responses || []).map((response, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-gray-700">{response.option}</span>
                      <span className="font-bold text-teal-700">{response.count} votes ({response.percentage}%)</span>
                    </div>
                    <div className="w-full h-12 bg-gray-100 rounded-xl overflow-hidden relative">
                      <div
                        className="h-full bg-teal-500 transition-all duration-1000 ease-out flex items-center px-4"
                        style={{ width: `${Math.max(response.percentage, 5)}%` }}
                      >
                      </div>
                      <span className="absolute inset-y-0 right-4 flex items-center text-gray-400 font-bold z-10">
                        {response.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Column */}
              <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-6">
                <div>
                  <div className="text-4xl font-black text-gray-800 mb-1">
                    {activePoll.total_responses || activePoll.totalResponses || 0}
                  </div>
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Responses</div>
                </div>

                <div className="w-full h-px bg-gray-200"></div>

                {activePoll.recommendation && (
                  <div className="w-full bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-xs font-bold text-teal-600 uppercase mb-2">AI Insight</div>
                    <p className="text-sm font-medium text-gray-700 leading-snug">
                      {activePoll.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Responses Toggle */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} Student Responses
              </button>

              {showDetails && (
                <div className="mt-4 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Student</th>
                        <th className="px-6 py-3">Response</th>
                        <th className="px-6 py-3">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activePoll.detailed_responses?.length > 0 ? (
                        activePoll.detailed_responses.map((resp, i) => (
                          <tr key={i} className="bg-white hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{resp.student_name || 'Unknown'}</td>
                            <td className="px-6 py-3 text-gray-600">{resp.response}</td>
                            <td className="px-6 py-3">
                              {resp.is_correct === true && <span className="text-green-600 font-bold">Correct</span>}
                              {resp.is_correct === false && <span className="text-red-500 font-bold">Incorrect</span>}
                              {resp.is_correct === null && <span className="text-gray-400">-</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-400 italic">
                            No responses recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

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
