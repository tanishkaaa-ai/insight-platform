import React, { useState, useEffect } from 'react';
import { Send, Users, CheckCircle, XCircle, Clock, BarChart3, MessageSquare, Activity, AlertCircle, TrendingUp, Check, User, EyeOff, Target, Zap } from 'lucide-react';

// Mock WebSocket for real-time updates (in production, use actual WebSocket)
const mockWebSocket = {
  on: (event, callback) => {
    // Simulate real-time response updates
    if (event === 'poll_response') {
      setInterval(() => {
        callback({
          pollId: 'current',
          totalResponses: Math.floor(Math.random() * 30) + 1
        });
      }, 3000);
    }
  }
};

const LivePollingSystem = () => {
  const [view, setView] = useState('teacher'); // 'teacher' or 'student'
  const [activePoll, setActivePoll] = useState(null);
  const [pollHistory, setPollHistory] = useState([]);
  const [liveResponses, setLiveResponses] = useState(0);
  const [hasResponded, setHasResponded] = useState(false);
  
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
    correctAnswer: null // For fact-based questions
  });

  // Sample poll data
  const samplePolls = [
    {
      id: 'poll_1',
      question: 'Do you understand today\'s concept?',
      options: ['Yes, completely', 'Partially', 'No, need help', 'Not sure'],
      type: 'understanding',
      responses: [
        { option: 'Yes, completely', count: 20, percentage: 71 },
        { option: 'Partially', count: 6, percentage: 21 },
        { option: 'No, need help', count: 2, percentage: 7 },
        { option: 'Not sure', count: 0, percentage: 0 }
      ],
      totalResponses: 28,
      classSize: 28,
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ];

  useEffect(() => {
    // Initialize with sample poll
    setActivePoll(samplePolls[0]);
    
    // Mock WebSocket connection for real-time updates
    mockWebSocket.on('poll_response', (data) => {
      setLiveResponses(data.totalResponses);
    });
  }, []);
  
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

  const createPoll = () => {
    const poll = {
      id: `poll_${Date.now()}`,
      question: newPoll.question,
      options: newPoll.options.filter(o => o.trim() !== ''),
      type: newPoll.type,
      correctAnswer: newPoll.correctAnswer,
      responses: newPoll.options
        .filter(o => o.trim() !== '')
        .map(opt => ({ option: opt, count: 0, percentage: 0 })),
      totalResponses: 0,
      classSize: 28,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    setActivePoll(poll);
    setLiveResponses(0);
    
    // Reset form
    setNewPoll({
      question: '',
      options: ['', '', '', ''],
      type: 'understanding',
      correctAnswer: null
    });
  };

  const closePoll = () => {
    if (activePoll) {
      setPollHistory([activePoll, ...pollHistory]);
      setActivePoll(null);
    }
  };

  const submitResponse = (option) => {
    if (!hasResponded) {
      setHasResponded(true);
      // In production, send to backend via API
      setTimeout(() => {
        setLiveResponses(prev => prev + 1);
      }, 500);
    }
  };

  // Teacher View
  const TeacherView = () => (
    <div className="space-y-6">
      {/* Create Poll Section */}
      {!activePoll && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <MessageSquare className="text-cyan-400" />
            Create New Poll
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Target className="text-cyan-400" size={16} />
                Question
              </label>
              <input
                type="text"
                value={newPoll.question}
                onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                placeholder="What would you like to ask your students?"
                className="w-full px-5 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <BarChart3 className="text-cyan-400" size={16} />
                Poll Type
              </label>
              <select
                value={newPoll.type}
                onChange={(e) => setNewPoll({ ...newPoll, type: e.target.value })}
                className="w-full px-5 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              >
                <option value="understanding" className="bg-slate-800">Understanding Check</option>
                <option value="multiple_choice" className="bg-slate-800">Multiple Choice</option>
                <option value="fact_based" className="bg-slate-800">Fact-Based (has correct answer)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <User className="text-cyan-400" size={16} />
                Options (minimum 2)
              </label>
              <div className="space-y-3">
                {newPoll.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const updated = [...newPoll.options];
                        updated[idx] = e.target.value;
                        setNewPoll({ ...newPoll, options: updated });
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-400"
                    />
                    {newPoll.type === 'fact_based' && (
                      <button
                        onClick={() => setNewPoll({ ...newPoll, correctAnswer: option })}
                        className={`p-2 rounded-lg ${
                          newPoll.correctAnswer === option
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={createPoll}
              disabled={!newPoll.question || newPoll.options.filter(o => o.trim()).length < 2}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Send size={20} />
              Launch Poll
            </button>
          </div>
        </div>
      )}

      {/* Active Poll Display */}
      {activePoll && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/30" />
                <span className="text-sm font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full">LIVE POLL</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{activePoll.question}</h2>
            </div>
            <button
              onClick={closePoll}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105"
            >
              Close Poll
            </button>
          </div>

          {/* Real-time Response Counter */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-700/50 rounded-xl">
                  <Users className="text-cyan-400" size={28} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Responses</p>
                  <p className="text-3xl font-bold text-white">
                    <AnimatedCounter end={activePoll.totalResponses} /> / {activePoll.classSize}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm font-medium">Participation Rate</p>
                <p className="text-3xl font-bold text-green-400">
                  {Math.round((activePoll.totalResponses / activePoll.classSize) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Results Visualization */}
          <div className="space-y-5">
            {activePoll.responses.map((response, idx) => {
              let colorClass = '';
              if (idx === 0) colorClass = 'from-green-500/30 to-emerald-500/30';
              else if (idx === 1) colorClass = 'from-yellow-500/30 to-amber-500/30';
              else if (idx === 2) colorClass = 'from-red-500/30 to-rose-500/30';
              else colorClass = 'from-blue-500/30 to-cyan-500/30';
              
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">{response.option}</span>
                    <span className="text-slate-400 font-bold">
                      {response.count} ({response.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-6 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out flex items-center justify-end pr-3`}
                      style={{ width: `${response.percentage}%` }}
                    >
                      {response.percentage > 15 && (
                        <span className="text-white text-xs font-medium">
                          {response.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insights */}
          {activePoll.responses[2]?.percentage >= 7 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-amber-500 mt-0.5" size={24} />
                <div>
                  <p className="font-bold text-amber-400 mb-2">Action Recommended</p>
                  <p className="text-slate-300">
                    {activePoll.responses[2].percentage}% of students need clarification. 
                    Consider re-explaining the concept or providing additional examples.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Poll History */}
      {pollHistory.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="text-cyan-400" />
            Recent Polls
          </h3>
          <div className="space-y-4">
            {pollHistory.slice(0, 3).map((poll, idx) => (
              <div key={idx} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <p className="font-medium text-white mb-2">{poll.question}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {poll.totalResponses} responses • {new Date(poll.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-green-400 font-medium">
                    {Math.round((poll.totalResponses / poll.classSize) * 100)}% participation
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Student View
  const StudentView = () => (
    <div className="space-y-6">
      {activePoll ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/30" />
              <span className="text-sm font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full">LIVE POLL</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">{activePoll.question}</h2>
            <p className="text-slate-400 text-lg flex items-center gap-2">
              <EyeOff className="text-cyan-400" size={18} />
              Your response is completely anonymous • Select one option
            </p>
          </div>

          {!hasResponded ? (
            <div className="space-y-4">
              {activePoll.responses.map((response, idx) => (
                <button
                  key={idx}
                  onClick={() => submitResponse(response.option)}
                  className="w-full p-5 text-left bg-slate-700/30 border-2 border-slate-600 rounded-xl hover:border-cyan-500 hover:bg-slate-600/30 transition-all duration-300 text-white"
                >
                  <span className="font-medium text-lg">{response.option}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                <Check className="text-white" size={40} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">Response Submitted!</h3>
              <p className="text-slate-300 text-lg mb-8">
                Thank you for your anonymous feedback. Your teacher will review the results.
              </p>
              
              {/* Show results after responding */}
              <div className="mt-10 space-y-5 max-w-md mx-auto text-left bg-slate-700/30 p-6 rounded-2xl border border-slate-600/50">
                <p className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="text-cyan-400" />
                  Class Results (so far):
                </p>
                {activePoll.responses.map((response, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300">{response.option}</span>
                      <span className="text-slate-400 font-bold">
                        {response.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000 ease-out"
                        style={{ width: `${response.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
          <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-slate-500" size={48} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">No Active Poll</h3>
          <p className="text-slate-400 text-lg">
            Waiting for your teacher to launch a poll. You'll be notified when one starts.
          </p>
        </div>
      )}

      {/* BR4: Anonymous Participation Message */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 p-6 rounded-2xl">
        <div className="flex items-start gap-3">
          <EyeOff className="text-cyan-400 mt-0.5" size={24} />
          <div>
            <h4 className="font-bold text-cyan-400 mb-2">100% Anonymous Participation</h4>
            <p className="text-slate-300">
              Your responses are completely anonymous. Your teacher only sees aggregated class data,
              not individual answers. This ensures everyone can participate honestly without fear of judgment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-3">📊 Live Polling System</h1>
        <p className="text-slate-400 text-xl">BR4: Inclusive Engagement Capture • 100% Participation</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-4 mb-8 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50">
        <button
          onClick={() => setView('teacher')}
          className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            view === 'teacher'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <Activity className="text-cyan-400" />
          Teacher View
        </button>
        <button
          onClick={() => {
            setView('student');
            setHasResponded(false);
          }}
          className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            view === 'student'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <User className="text-cyan-400" />
          Student View
        </button>
      </div>

      {/* Content */}
      {view === 'teacher' ? <TeacherView /> : <StudentView />}

      {/* Research Citation */}
      <div id="stats-section" className="mt-8 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 p-6 rounded-2xl">
        <div className="flex items-start gap-3">
          <Zap className="text-purple-400 mt-0.5" size={24} />
          <div>
            <p className="font-bold text-purple-400 mb-2">Research-Backed Design</p>
            <p className="text-slate-300">
              "By giving every student a chance to respond anonymously, live polling promotes inclusion 
              and provides quieter students a voice. Immediate feedback allows lecturers to gauge student 
              understanding in real-time and adjust teaching timely."
            </p>
            <p className="text-slate-500 mt-3">— Paper 8h.pdf: Impact of Live Polling Quizzes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePollingSystem;