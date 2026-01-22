import React, { useState, useEffect } from 'react';
import { Send, Users, AlertCircle, Clock, BarChart3, MessageSquare, Zap } from 'lucide-react';
import { pollsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const LivePollingSystem = () => {
  const { getUserId, isTeacher } = useAuth();
  const [activePoll, setActivePoll] = useState(null);
  const [pollHistory, setPollHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const teacherId = isTeacher() ? getUserId() : null;

  // Stats animation trigger
  const [statsInView, setStatsInView] = useState(false);

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

  // Teacher: Create new poll
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '', '', ''],
    type: 'understanding',
    correctAnswer: null,
    classroom_id: 'class_101' // Mock Classroom ID
  });

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
    
    try {
      setLoading(true);
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
      setNewPoll({
        question: '',
        options: ['', '', '', ''],
        type: 'understanding',
        correctAnswer: null,
        classroom_id: 'class_101'
      });
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

  // Teacher View
  return (
    <div className="min-h-screen bg-teal-50/20 p-6 space-y-6">
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
              disabled={loading || !newPoll.question}
              className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-200 disabled:opacity-50"
            >
              {loading ? 'Launching...' : <><Send size={20} /> Launch Poll</>}
            </button>
          </div>
        </div>
      )}

      {/* Active Poll Display */}
      {activePoll && (
        <div className="bg-white border-2 border-teal-500/20 rounded-2xl p-8 shadow-lg shadow-teal-100">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/30" />
                <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full uppercase tracking-wider">Live & Listening</span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">{activePoll.question}</h2>
            </div>
            <button
              onClick={closePoll}
              className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              End Poll
            </button>
          </div>

          {/* Real-time Response Counter */}
          <div className="mb-8 flex gap-6">
            <div className="flex-1 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <Users className="text-teal-600" size={32} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-bold uppercase">Responses Recieved</p>
                <p className="text-4xl font-extrabold text-gray-800">
                  <AnimatedCounter end={activePoll.totalResponses || 0} />
                </p>
              </div>
            </div>
          </div>

          {/* Results Visualization */}
          <div className="space-y-6">
            {activePoll.responses?.map((response, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-bold">{response.option}</span>
                  <span className="text-gray-500 font-medium">
                    {response.count} votes ({response.percentage}%)
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-1000 ease-out"
                    style={{ width: `${response.percentage}%` }}
                  />
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
  );
};

export default LivePollingSystem;
