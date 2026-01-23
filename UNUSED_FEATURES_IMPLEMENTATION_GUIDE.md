# Unused Backend Features - Implementation Guide for Frontend

**Purpose:** This document provides step-by-step instructions for implementing backend features that are currently NOT being used in the frontend.

**Target Audience:** AI agents, developers implementing missing frontend features

**Last Updated:** 2026-01-23

**Current Status:** 59 out of 103 API methods (57.3%) are unused in frontend

---

## Table of Contents

1. [Practice Zone Features (CRITICAL - 80% unused)](#1-practice-zone-features)
2. [Gamification System (CRITICAL - 100% unused)](#2-gamification-system)
3. [Peer Review & Soft Skills (HIGH PRIORITY - 100% unused)](#3-peer-review--soft-skills)
4. [Intervention System (HIGH PRIORITY - 100% unused)](#4-intervention-system)
5. [Project Deliverables & Grading (HIGH PRIORITY - 100% unused)](#5-project-deliverables--grading)
6. [Engagement Detection (MEDIUM PRIORITY - 75% unused)](#6-engagement-detection)
7. [Advanced Analytics (MEDIUM PRIORITY - 90% unused)](#7-advanced-analytics)
8. [Template Management (MEDIUM PRIORITY - 80% unused)](#8-template-management)
9. [Concept & Item Management (MEDIUM PRIORITY - 60% unused)](#9-concept--item-management)
10. [PBL Workflow Management (LOW PRIORITY - 50% unused)](#10-pbl-workflow-management)

---

## 1. Practice Zone Features

**Status:** CRITICAL - 4 out of 5 endpoints unused (80%)
**Impact:** Practice zone is essentially non-functional
**Estimated Implementation Time:** 2 weeks

### Current State

**What's Working:**
- `GET /api/mastery/student/{student_id}` - Get student's overall mastery ✅
- `GET /api/mastery/recommendations/{student_id}` - Get practice recommendations ✅

**What's Missing:**
- Mastery calculation after each question
- Practice session generation
- Response submission
- Historical trend visualization

### Unused Endpoints

#### 1.1 Calculate Mastery After Each Response

**Endpoint:** `POST /api/mastery/calculate`

**Request:**
```json
{
  "student_id": "student_123",
  "concept_id": "concept_456",
  "is_correct": true,
  "response_time": 15000,
  "current_mastery": 75.5
}
```

**Response:**
```json
{
  "mastery_score": 78.2,
  "bkt_component": 0.76,
  "dkt_component": 0.81,
  "dkvmn_component": 0.77,
  "confidence": 0.89,
  "learning_velocity": 2.5
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentPractice.jsx`
- When: After student answers each practice question
- Purpose: Update mastery score in real-time using hybrid AI (BKT + DKT + DKVMN)

**Implementation Steps:**

1. **Add state for current question:**
```javascript
const [currentQuestion, setCurrentQuestion] = useState(null);
const [questionStartTime, setQuestionStartTime] = useState(null);
```

2. **Create answer submission handler:**
```javascript
const handleAnswerSubmit = async (answer, isCorrect) => {
  const responseTime = Date.now() - questionStartTime;

  console.info('[PRACTICE] Submitting answer:', {
    concept_id: currentQuestion.concept_id,
    is_correct: isCorrect,
    response_time: responseTime
  });

  try {
    const response = await masteryAPI.calculateMastery({
      student_id: STUDENT_ID,
      concept_id: currentQuestion.concept_id,
      is_correct: isCorrect,
      response_time: responseTime,
      current_mastery: getCurrentMastery(currentQuestion.concept_id)
    });

    console.info('[PRACTICE] Mastery updated:', {
      new_score: response.data.mastery_score,
      confidence: response.data.confidence,
      velocity: response.data.learning_velocity
    });

    updateMasteryNode(currentQuestion.concept_id, response.data.mastery_score);

  } catch (error) {
    console.error('[PRACTICE] Failed to calculate mastery:', error);
  }
};
```

3. **Update frontend API service** (if not already defined):
```javascript
// frontend/src/services/api.js
export const masteryAPI = {
  calculateMastery: (data) => api.post('/mastery/calculate', data),
  // ... existing methods
};
```

---

#### 1.2 Generate Adaptive Practice Session

**Endpoint:** `POST /api/mastery/practice/generate`

**Request:**
```json
{
  "student_id": "student_123",
  "session_duration": 20
}
```

**Response:**
```json
{
  "session_id": "session_789",
  "recommended_items": [
    {
      "item_id": "item_1",
      "concept_id": "concept_456",
      "difficulty": 0.6,
      "priority": 0.85,
      "estimated_time": 5
    }
  ],
  "estimated_duration": 18,
  "focus_areas": ["Algebra", "Geometry"]
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentPractice.jsx`
- When: Student clicks "Start Practice" button
- Purpose: AI generates personalized practice session based on student's mastery gaps

**Implementation Steps:**

1. **Replace placeholder function:**
```javascript
// BEFORE (current placeholder):
const handleStartPractice = () => {
  console.info('[PRACTICE] Start practice clicked:', { student_id: STUDENT_ID });
  alert("Generating personalized practice session...");
};

// AFTER (real implementation):
const handleStartPractice = async () => {
  console.info('[PRACTICE] Generating practice session:', { student_id: STUDENT_ID });
  setLoading(true);

  try {
    const response = await practiceAPI.generateSession({
      student_id: STUDENT_ID,
      session_duration: 20
    });

    console.info('[PRACTICE] Session generated:', {
      session_id: response.data.session_id,
      item_count: response.data.recommended_items.length,
      duration: response.data.estimated_duration
    });

    setCurrentSession(response.data);
    setCurrentQuestion(response.data.recommended_items[0]);
    setQuestionStartTime(Date.now());
    setShowPracticeModal(true);

  } catch (error) {
    console.error('[PRACTICE] Failed to generate session:', error);
    toast.error('Failed to generate practice session');
  } finally {
    setLoading(false);
  }
};
```

2. **Add practice session state:**
```javascript
const [currentSession, setCurrentSession] = useState(null);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [showPracticeModal, setShowPracticeModal] = useState(false);
```

3. **Create practice modal component:**
```javascript
const PracticeSessionModal = ({ session, onClose }) => {
  const currentItem = session.recommended_items[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Practice Session</h2>
        <p className="text-gray-600 mb-6">
          Question {currentQuestionIndex + 1} of {session.recommended_items.length}
        </p>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">{currentItem.question}</h3>
          {/* Render question based on item_type */}
        </div>

        <div className="flex justify-between">
          <button onClick={onClose} className="btn-secondary">Exit</button>
          <button onClick={handleAnswerSubmit} className="btn-primary">Submit</button>
        </div>
      </div>
    </div>
  );
};
```

---

#### 1.3 Submit Student Response

**Endpoint:** `POST /api/mastery/response/submit`

**Request:**
```json
{
  "student_id": "student_123",
  "item_id": "item_1",
  "concept_id": "concept_456",
  "is_correct": true,
  "response_time": 15000,
  "hints_used": 1,
  "attempts": 2,
  "response_text": "x = 5"
}
```

**Response:**
```json
{
  "response_id": "resp_999",
  "message": "Response recorded successfully"
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentPractice.jsx`
- When: After calculating mastery, also save the detailed response
- Purpose: Track complete response history for analytics

**Implementation Steps:**

1. **Update answer submission handler to include response tracking:**
```javascript
const handleAnswerSubmit = async (answer, isCorrect) => {
  const responseTime = Date.now() - questionStartTime;

  // First, calculate mastery (as shown above)
  const masteryResponse = await masteryAPI.calculateMastery({...});

  // Then, submit detailed response for tracking
  try {
    await masteryAPI.submitResponse({
      student_id: STUDENT_ID,
      item_id: currentQuestion.item_id,
      concept_id: currentQuestion.concept_id,
      is_correct: isCorrect,
      response_time: responseTime,
      hints_used: hintsUsed,
      attempts: attemptCount,
      response_text: answer
    });

    console.info('[PRACTICE] Response tracked successfully');
  } catch (error) {
    console.error('[PRACTICE] Failed to track response:', error);
  }
};
```

---

#### 1.4 View Mastery History & Trends

**Endpoint:** `GET /api/mastery/history/{student_id}/{concept_id}?days=30`

**Response:**
```json
{
  "student_id": "student_123",
  "concept_id": "concept_456",
  "history": [
    {
      "date": "2026-01-20",
      "mastery_score": 65.5,
      "practice_count": 5
    },
    {
      "date": "2026-01-21",
      "mastery_score": 70.2,
      "practice_count": 8
    }
  ],
  "trend": "improving",
  "velocity": 2.3
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentPractice.jsx`
- When: Student clicks on a concept node to see details
- Purpose: Show progress over time with trend visualization

**Implementation Steps:**

1. **Add concept details modal:**
```javascript
const ConceptDetailModal = ({ concept, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await masteryAPI.getHistory(STUDENT_ID, concept.id);
        setHistory(response.data.history);
        console.info('[PRACTICE] History loaded:', {
          concept_id: concept.id,
          data_points: response.data.history.length,
          trend: response.data.trend
        });
      } catch (error) {
        console.error('[PRACTICE] Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [concept.id]);

  return (
    <div className="modal">
      <h2>{concept.title} - Progress History</h2>

      {/* Trend indicator */}
      <div className={`trend ${history.trend}`}>
        {history.trend === 'improving' ? '📈' : '📉'} {history.trend}
      </div>

      {/* Chart visualization */}
      <LineChart data={history.history} />

      {/* Statistics */}
      <div className="stats">
        <p>Current: {concept.score}%</p>
        <p>Learning Velocity: {history.velocity}</p>
      </div>
    </div>
  );
};
```

2. **Add click handler to concept nodes:**
```javascript
const handleNodeClick = (node) => {
  setSelectedNode(node);
  setShowConceptDetails(true);
};
```

---

## 2. Gamification System

**Status:** CRITICAL - 5 out of 5 endpoints unused (100%)
**Impact:** Complete gamification system built but never displayed
**Estimated Implementation Time:** 1.5 weeks

### Current State

**What's Working:**
- Nothing - entire system is unused ❌

**What's Missing:**
- Milestone submission workflow
- Teacher approval interface
- XP & level display
- Achievement badges
- Team progress tracking

### Backend System Details

The backend has a complete gamification system:
- **8 Achievement Types:** 🎯 Milestone Completed, 🚀 First Milestone, ⭐ Halfway There, 🏆 Milestone Master, ⚡ Early Completion, 🤝 Team Player, 💎 Excellence Award, ✨ Stage Master
- **XP System:** 100 base XP per milestone + 50 XP bonus per level
- **Level Progression:** 1 level per 3 milestones completed
- **Sequential Unlocking:** Must complete milestones in order

### Unused Endpoints

#### 2.1 Submit Milestone for Teacher Approval

**Endpoint:** `POST /api/pbl/projects/{project_id}/milestones/{milestone_id}/submit`

**Request:**
```json
{
  "team_id": "team_123",
  "notes": "Completed research phase with 5 sources"
}
```

**Response:**
```json
{
  "message": "Milestone submitted for teacher approval",
  "milestone_id": "milestone_456",
  "status": "pending_approval"
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentProjects.jsx` (create new)
- When: Student team completes a milestone
- Purpose: Submit work for teacher review before earning XP

**Implementation Steps:**

1. **Create student project milestone view:**
```javascript
// File: frontend/src/pages/StudentProjects.jsx

const StudentProjectMilestones = () => {
  const { getUserId } = useAuth();
  const [team, setTeam] = useState(null);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    const fetchTeamAndMilestones = async () => {
      console.info('[STUDENT_MILESTONES] Fetching team data');

      const teamsRes = await projectsAPI.getStudentTeams(getUserId());
      const currentTeam = teamsRes.data[0];
      setTeam(currentTeam);

      const milestonesRes = await projectsAPI.getProjectMilestones(currentTeam.project_id);
      setMilestones(milestonesRes.data);

      console.info('[STUDENT_MILESTONES] Data loaded:', {
        team_id: currentTeam.team_id,
        milestone_count: milestonesRes.data.length
      });
    };

    fetchTeamAndMilestones();
  }, []);

  const handleSubmitMilestone = async (milestoneId) => {
    const notes = prompt('Enter completion notes:');

    try {
      console.info('[STUDENT_MILESTONES] Submitting milestone:', {
        milestone_id: milestoneId,
        team_id: team.team_id
      });

      await api.post(`/pbl/projects/${team.project_id}/milestones/${milestoneId}/submit`, {
        team_id: team.team_id,
        notes
      });

      toast.success('Milestone submitted for approval!');
      console.info('[STUDENT_MILESTONES] Milestone submitted successfully');

      // Refresh milestones
      fetchTeamAndMilestones();

    } catch (error) {
      console.error('[STUDENT_MILESTONES] Submit failed:', error);
      toast.error('Failed to submit milestone');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Project Milestones</h1>

        {milestones.map((milestone) => (
          <div key={milestone.milestone_id} className="card mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{milestone.title}</h3>
                <p className="text-sm text-gray-600">{milestone.description}</p>
                <p className="text-xs text-gray-400">Due: {milestone.due_date}</p>
              </div>

              <div>
                {milestone.is_completed && (
                  <span className="badge badge-success">✅ Completed</span>
                )}
                {milestone.pending_approval && (
                  <span className="badge badge-warning">⏳ Pending Approval</span>
                )}
                {!milestone.is_completed && !milestone.pending_approval && (
                  <button
                    onClick={() => handleSubmitMilestone(milestone.milestone_id)}
                    className="btn-primary"
                  >
                    Submit for Approval
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};
```

2. **Add route in App.jsx:**
```javascript
<Route path="/student/milestones" element={
  <ProtectedRoute requiredRole="student">
    <StudentProjectMilestones />
  </ProtectedRoute>
} />
```

---

#### 2.2 Approve Milestone (Teacher)

**Endpoint:** `POST /api/pbl/projects/{project_id}/milestones/{milestone_id}/approve`

**Request:**
```json
{
  "teacher_id": "teacher_789",
  "feedback": "Great work on the research!"
}
```

**Response:**
```json
{
  "message": "Milestone approved successfully",
  "milestone_id": "milestone_456",
  "xp_earned": 150,
  "team_level": 2,
  "completion_percentage": 33.3,
  "next_milestone_unlocked": true
}
```

**Where to Use:**
- File: `frontend/src/pages/TeacherProjectReview.jsx` (create new)
- When: Teacher reviews pending milestone submissions
- Purpose: Award XP and unlock next milestone

**Implementation Steps:**

1. **Create teacher milestone approval interface:**
```javascript
// File: frontend/src/pages/TeacherProjectReview.jsx

const TeacherProjectReview = () => {
  const { getUserId } = useAuth();
  const [pendingMilestones, setPendingMilestones] = useState([]);

  useEffect(() => {
    const fetchPendingMilestones = async () => {
      console.info('[TEACHER_REVIEW] Fetching pending milestones');

      // Get all teacher's classrooms
      const classrooms = await classroomAPI.getTeacherClasses(getUserId());

      // Get projects for each classroom
      const allPending = [];
      for (const classroom of classrooms.data) {
        const projects = await projectsAPI.getClassroomProjects(classroom.classroom_id);

        for (const project of projects.data.projects) {
          const milestones = await projectsAPI.getProjectMilestones(project.project_id);
          const pending = milestones.data.filter(m => m.pending_approval);
          allPending.push(...pending.map(m => ({ ...m, project })));
        }
      }

      setPendingMilestones(allPending);
      console.info('[TEACHER_REVIEW] Found pending milestones:', allPending.length);
    };

    fetchPendingMilestones();
  }, []);

  const handleApproveMilestone = async (milestone) => {
    const feedback = prompt('Enter feedback for the team:');

    try {
      console.info('[TEACHER_REVIEW] Approving milestone:', {
        milestone_id: milestone.milestone_id,
        project_id: milestone.project.project_id
      });

      const response = await api.post(
        `/pbl/projects/${milestone.project.project_id}/milestones/${milestone.milestone_id}/approve`,
        {
          teacher_id: getUserId(),
          feedback
        }
      );

      console.info('[TEACHER_REVIEW] Milestone approved:', {
        xp_earned: response.data.xp_earned,
        new_level: response.data.team_level,
        completion: response.data.completion_percentage
      });

      toast.success(`Milestone approved! Team earned ${response.data.xp_earned} XP`);

      // Show achievement notification if any
      if (response.data.achievements_earned) {
        toast.success(`🏆 Achievement unlocked: ${response.data.achievements_earned.join(', ')}`);
      }

      // Refresh list
      setPendingMilestones(prev => prev.filter(m => m.milestone_id !== milestone.milestone_id));

    } catch (error) {
      console.error('[TEACHER_REVIEW] Approval failed:', error);
      toast.error('Failed to approve milestone');
    }
  };

  const handleRejectMilestone = async (milestone) => {
    const reason = prompt('Enter reason for rejection:');

    try {
      console.info('[TEACHER_REVIEW] Rejecting milestone:', {
        milestone_id: milestone.milestone_id
      });

      await api.post(
        `/pbl/projects/${milestone.project.project_id}/milestones/${milestone.milestone_id}/reject`,
        {
          teacher_id: getUserId(),
          reason,
          feedback: reason
        }
      );

      toast.info('Milestone rejected. Team can resubmit.');
      setPendingMilestones(prev => prev.filter(m => m.milestone_id !== milestone.milestone_id));

    } catch (error) {
      console.error('[TEACHER_REVIEW] Rejection failed:', error);
    }
  };

  return (
    <TeacherLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Pending Milestone Approvals</h1>

        {pendingMilestones.length === 0 ? (
          <p className="text-gray-500">No pending milestones</p>
        ) : (
          pendingMilestones.map((milestone) => (
            <div key={milestone.milestone_id} className="card mb-4 p-6">
              <div className="flex justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{milestone.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{milestone.project.title}</p>
                  <p className="text-gray-700">{milestone.submission_notes}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted: {new Date(milestone.submitted_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveMilestone(milestone)}
                    className="btn bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleRejectMilestone(milestone)}
                    className="btn bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </TeacherLayout>
  );
};
```

2. **Add route and navigation:**
```javascript
// In App.jsx
<Route path="/teacher/project-review" element={
  <ProtectedRoute requiredRole="teacher">
    <TeacherProjectReview />
  </ProtectedRoute>
} />

// In TeacherLayout.jsx navigation
<Link to="/teacher/project-review">
  <span className="badge">{pendingCount}</span> Milestone Approvals
</Link>
```

---

#### 2.3 View Team Progress & Level

**Endpoint:** `GET /api/pbl/teams/{team_id}/progress`

**Response:**
```json
{
  "team_id": "team_123",
  "project_id": "project_456",
  "current_level": 3,
  "total_xp": 450,
  "milestones_completed": 8,
  "completion_percentage": 66.7,
  "unlocked_milestones": [
    {
      "milestone_id": "m1",
      "title": "Research Phase",
      "is_completed": true
    }
  ],
  "locked_milestones": [
    {
      "milestone_id": "m4",
      "title": "Final Presentation",
      "order": 4
    }
  ],
  "achievements": [
    {
      "name": "First Milestone",
      "icon": "🚀",
      "xp": 50,
      "earned_at": "2026-01-15"
    }
  ]
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentProjects.jsx`
- When: Display team progress dashboard
- Purpose: Show gamification elements - level, XP, achievements

**Implementation Steps:**

1. **Create team progress card component:**
```javascript
const TeamProgressCard = ({ teamId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      console.info('[TEAM_PROGRESS] Fetching progress:', { team_id: teamId });

      try {
        const response = await api.get(`/pbl/teams/${teamId}/progress`);
        setProgress(response.data);

        console.info('[TEAM_PROGRESS] Progress loaded:', {
          level: response.data.current_level,
          xp: response.data.total_xp,
          completion: response.data.completion_percentage
        });
      } catch (error) {
        console.error('[TEAM_PROGRESS] Failed to load:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [teamId]);

  if (loading) return <div>Loading progress...</div>;
  if (!progress) return null;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Team Level {progress.current_level}</h2>
          <p className="text-purple-100">Keep completing milestones to level up!</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{progress.total_xp} XP</p>
          <p className="text-sm text-purple-100">Total Experience</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Level {progress.current_level}</span>
          <span>Level {progress.current_level + 1}</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${(progress.total_xp % 300) / 3}%` }}
          />
        </div>
        <p className="text-xs text-purple-100 mt-1">
          {300 - (progress.total_xp % 300)} XP until next level
        </p>
      </div>

      {/* Project Completion */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Project Progress</span>
          <span>{progress.completion_percentage}%</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all duration-500"
            style={{ width: `${progress.completion_percentage}%` }}
          />
        </div>
      </div>

      {/* Milestones Status */}
      <div className="flex gap-4 text-sm">
        <div>
          <p className="text-2xl font-bold">{progress.milestones_completed}</p>
          <p className="text-purple-100">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{progress.unlocked_milestones.length}</p>
          <p className="text-purple-100">Unlocked</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{progress.locked_milestones.length}</p>
          <p className="text-purple-100">Locked</p>
        </div>
      </div>
    </div>
  );
};
```

2. **Use in StudentProjects.jsx:**
```javascript
const StudentProjects = () => {
  const [activeTeam, setActiveTeam] = useState(null);

  // ... existing code

  return (
    <DashboardLayout>
      {activeTeam && <TeamProgressCard teamId={activeTeam.team_id} />}
      {/* Rest of the component */}
    </DashboardLayout>
  );
};
```

---

#### 2.4 View Team Achievements

**Endpoint:** `GET /api/pbl/teams/{team_id}/achievements`

**Response:**
```json
{
  "team_id": "team_123",
  "total_achievements": 5,
  "total_xp": 650,
  "achievements": [
    {
      "achievement_id": "ach_1",
      "name": "Milestone Completed",
      "icon": "🎯",
      "xp": 100,
      "earned_at": "2026-01-20T10:30:00Z"
    },
    {
      "achievement_id": "ach_2",
      "name": "First Milestone",
      "icon": "🚀",
      "xp": 50,
      "earned_at": "2026-01-15T14:20:00Z"
    },
    {
      "achievement_id": "ach_3",
      "name": "Halfway There",
      "icon": "⭐",
      "xp": 150,
      "earned_at": "2026-01-22T09:15:00Z"
    }
  ]
}
```

**Where to Use:**
- File: `frontend/src/components/AchievementsModal.jsx` (create new)
- When: Student clicks "View Achievements" button
- Purpose: Display earned badges and total XP from achievements

**Implementation Steps:**

1. **Create achievements modal:**
```javascript
// File: frontend/src/components/AchievementsModal.jsx

const AchievementsModal = ({ teamId, isOpen, onClose }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAchievements = async () => {
      console.info('[ACHIEVEMENTS] Fetching achievements:', { team_id: teamId });

      try {
        const response = await api.get(`/pbl/teams/${teamId}/achievements`);
        setAchievements(response.data.achievements);

        console.info('[ACHIEVEMENTS] Loaded:', {
          count: response.data.total_achievements,
          total_xp: response.data.total_xp
        });
      } catch (error) {
        console.error('[ACHIEVEMENTS] Failed to load:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [isOpen, teamId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🏆 Team Achievements</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading achievements...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.achievement_id}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{achievement.name}</h3>
                    <p className="text-yellow-700 text-sm mb-2">+{achievement.xp} XP</p>
                    <p className="text-xs text-gray-500">
                      Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {achievements.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">🎯</p>
            <p>No achievements yet. Complete milestones to earn badges!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsModal;
```

2. **Add to StudentProjects.jsx:**
```javascript
const StudentProjects = () => {
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <DashboardLayout>
      <button
        onClick={() => setShowAchievements(true)}
        className="btn-primary mb-4"
      >
        🏆 View Achievements
      </button>

      <AchievementsModal
        teamId={activeTeam?.team_id}
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
    </DashboardLayout>
  );
};
```

---

## 3. Peer Review & Soft Skills

**Status:** HIGH PRIORITY - 6 out of 6 endpoints unused (100%)
**Impact:** Research-backed 4D soft skills framework (Cronbach α > 0.97) completely unused
**Estimated Implementation Time:** 1.5 weeks

### Backend System Details

The backend implements the validated 4D soft skills framework from research papers:
- **Team Dynamics** - Communication, collaboration
- **Team Structure** - Organization, role clarity
- **Team Motivation** - Engagement, commitment
- **Team Excellence** - Quality, innovation

### Unused Endpoints

#### 3.1 Submit Peer Review

**Endpoint:** `POST /api/pbl/teams/{team_id}/peer-reviews`

**Request:**
```json
{
  "reviewer_id": "student_123",
  "reviewee_id": "student_456",
  "review_type": "mid_project",
  "ratings": {
    "team_dynamics": {
      "communication": 4,
      "active_listening": 5,
      "conflict_resolution": 3
    },
    "team_structure": {
      "responsibility": 5,
      "time_management": 4
    },
    "team_motivation": {
      "enthusiasm": 5,
      "commitment": 4
    },
    "team_excellence": {
      "quality_focus": 4,
      "creativity": 5
    }
  }
}
```

**Response:**
```json
{
  "review_id": "review_789",
  "message": "Peer review submitted successfully"
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentPeerReview.jsx` (create new)
- When: Teacher enables peer review for project stage
- Purpose: Collect 4D soft skills ratings from team members

**Implementation Steps:**

1. **Create peer review form component:**
```javascript
// File: frontend/src/pages/StudentPeerReview.jsx

const StudentPeerReview = () => {
  const { getUserId } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedReviewee, setSelectedReviewee] = useState(null);
  const [ratings, setRatings] = useState({
    team_dynamics: {
      communication: 3,
      active_listening: 3,
      conflict_resolution: 3,
      collaboration: 3
    },
    team_structure: {
      responsibility: 3,
      time_management: 3,
      organization: 3,
      role_clarity: 3
    },
    team_motivation: {
      enthusiasm: 3,
      commitment: 3,
      initiative: 3,
      perseverance: 3
    },
    team_excellence: {
      quality_focus: 3,
      creativity: 3,
      problem_solving: 3,
      innovation: 3
    }
  });

  useEffect(() => {
    const fetchTeamMembers = async () => {
      console.info('[PEER_REVIEW] Fetching team members');

      const teamsRes = await projectsAPI.getStudentTeams(getUserId());
      const team = teamsRes.data[0];

      const teamDetails = await projectsAPI.getTeam(team.team_id);

      // Filter out self
      const members = teamDetails.data.members.filter(m => m.student_id !== getUserId());
      setTeamMembers(members);

      console.info('[PEER_REVIEW] Team members loaded:', members.length);
    };

    fetchTeamMembers();
  }, []);

  const handleSubmitReview = async () => {
    if (!selectedReviewee) {
      toast.error('Please select a team member to review');
      return;
    }

    try {
      console.info('[PEER_REVIEW] Submitting review:', {
        reviewee_id: selectedReviewee,
        reviewer_id: getUserId()
      });

      await api.post(`/pbl/teams/${team.team_id}/peer-reviews`, {
        reviewer_id: getUserId(),
        reviewee_id: selectedReviewee,
        review_type: 'mid_project',
        ratings: ratings
      });

      toast.success('Peer review submitted successfully!');
      console.info('[PEER_REVIEW] Review submitted successfully');

      // Reset form
      setSelectedReviewee(null);
      setRatings(/* reset to defaults */);

    } catch (error) {
      console.error('[PEER_REVIEW] Submission failed:', error);
      toast.error('Failed to submit peer review');
    }
  };

  const RatingSlider = ({ dimension, skill, value, onChange }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium capitalize">
          {skill.replace('_', ' ')}
        </label>
        <span className="text-sm text-gray-600">{value}/5</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(dimension, skill, parseInt(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>Needs Work</span>
        <span>Excellent</span>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Peer Review - Team Soft Skills Assessment</h1>

        {/* Team Member Selection */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold mb-4">Select Team Member to Review</h2>
          <div className="grid grid-cols-2 gap-3">
            {teamMembers.map((member) => (
              <button
                key={member.student_id}
                onClick={() => setSelectedReviewee(member.student_id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedReviewee === member.student_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-gray-500">{member.role}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedReviewee && (
          <>
            {/* Team Dynamics */}
            <div className="card p-6 mb-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>🤝</span> Team Dynamics
              </h2>
              {Object.keys(ratings.team_dynamics).map((skill) => (
                <RatingSlider
                  key={skill}
                  dimension="team_dynamics"
                  skill={skill}
                  value={ratings.team_dynamics[skill]}
                  onChange={(dim, sk, val) => setRatings({
                    ...ratings,
                    [dim]: { ...ratings[dim], [sk]: val }
                  })}
                />
              ))}
            </div>

            {/* Team Structure */}
            <div className="card p-6 mb-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>🏗️</span> Team Structure
              </h2>
              {Object.keys(ratings.team_structure).map((skill) => (
                <RatingSlider
                  key={skill}
                  dimension="team_structure"
                  skill={skill}
                  value={ratings.team_structure[skill]}
                  onChange={(dim, sk, val) => setRatings({
                    ...ratings,
                    [dim]: { ...ratings[dim], [sk]: val }
                  })}
                />
              ))}
            </div>

            {/* Team Motivation */}
            <div className="card p-6 mb-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>🔥</span> Team Motivation
              </h2>
              {Object.keys(ratings.team_motivation).map((skill) => (
                <RatingSlider
                  key={skill}
                  dimension="team_motivation"
                  skill={skill}
                  value={ratings.team_motivation[skill]}
                  onChange={(dim, sk, val) => setRatings({
                    ...ratings,
                    [dim]: { ...ratings[dim], [sk]: val }
                  })}
                />
              ))}
            </div>

            {/* Team Excellence */}
            <div className="card p-6 mb-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>⭐</span> Team Excellence
              </h2>
              {Object.keys(ratings.team_excellence).map((skill) => (
                <RatingSlider
                  key={skill}
                  dimension="team_excellence"
                  skill={skill}
                  value={ratings.team_excellence[skill]}
                  onChange={(dim, sk, val) => setRatings({
                    ...ratings,
                    [dim]: { ...ratings[dim], [sk]: val }
                  })}
                />
              ))}
            </div>

            <button
              onClick={handleSubmitReview}
              className="w-full btn-primary py-3 text-lg"
            >
              Submit Peer Review
            </button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
```

2. **Add API method:**
```javascript
// frontend/src/services/api.js
export const projectsAPI = {
  // ... existing methods
  submitPeerReview: (teamId, data) => api.post(`/pbl/teams/${teamId}/peer-reviews`, data),
};
```

---

#### 3.2 View Student Soft Skills Profile

**Endpoint:** `GET /api/pbl/students/{student_id}/soft-skills?team_id={team_id}`

**Response:**
```json
{
  "student_id": "student_123",
  "overall_soft_skills_score": 4.2,
  "dimension_scores": {
    "team_dynamics": 4.5,
    "team_structure": 4.0,
    "team_motivation": 4.3,
    "team_excellence": 4.1
  },
  "skill_breakdown": {
    "communication": 4.7,
    "collaboration": 4.3,
    "responsibility": 4.5,
    "creativity": 3.8
  },
  "total_reviews_received": 5,
  "strengths": ["Communication", "Responsibility"],
  "areas_for_improvement": ["Creativity", "Time Management"]
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentDashboard.jsx`
- When: Display student's soft skills profile card
- Purpose: Show personalized soft skills assessment

**Implementation Steps:**

1. **Create soft skills profile card:**
```javascript
const SoftSkillsProfile = ({ studentId }) => {
  const [skills, setSkills] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      console.info('[SOFT_SKILLS] Fetching profile:', { student_id: studentId });

      try {
        const response = await projectsAPI.getStudentSoftSkills(studentId);
        setSkills(response.data);

        console.info('[SOFT_SKILLS] Profile loaded:', {
          overall_score: response.data.overall_soft_skills_score,
          reviews_count: response.data.total_reviews_received
        });
      } catch (error) {
        console.error('[SOFT_SKILLS] Failed to load:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [studentId]);

  if (loading || !skills) return null;

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Your Soft Skills Profile</h2>

      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-blue-600 mb-2">
          {skills.overall_soft_skills_score.toFixed(1)}
        </div>
        <p className="text-gray-600">Overall Soft Skills Score</p>
        <p className="text-sm text-gray-400">Based on {skills.total_reviews_received} peer reviews</p>
      </div>

      {/* 4D Dimensions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(skills.dimension_scores).map(([dimension, score]) => (
          <div key={dimension} className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium capitalize mb-2">
              {dimension.replace('_', ' ')}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(score / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold">{score.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Areas for Improvement */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-green-700 mb-2">💪 Strengths</h3>
          <ul className="space-y-1">
            {skills.strengths.map((strength) => (
              <li key={strength} className="text-sm">✓ {strength}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-orange-700 mb-2">📈 Growth Areas</h3>
          <ul className="space-y-1">
            {skills.areas_for_improvement.map((area) => (
              <li key={area} className="text-sm">→ {area}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
```

2. **Add to StudentDashboard.jsx:**
```javascript
<SoftSkillsProfile studentId={getUserId()} />
```

---

## 4. Intervention System

**Status:** HIGH PRIORITY - 8 out of 8 endpoints unused (100%)
**Impact:** Teachers can't create, track, or measure intervention effectiveness
**Estimated Implementation Time:** 1 week

### Unused Endpoints

#### 4.1 Create Intervention

**Endpoint:** `POST /api/dashboard/interventions`

**Request:**
```json
{
  "teacher_id": "teacher_789",
  "student_id": "student_123",
  "intervention_type": "one_on_one_tutoring",
  "description": "Focus on algebra concepts",
  "alert_id": "alert_456"
}
```

**Response:**
```json
{
  "intervention_id": "int_999",
  "message": "Intervention created successfully",
  "follow_up_date": "2026-02-01"
}
```

**Where to Use:**
- File: `frontend/src/pages/TeacherAnalytics.jsx`
- When: Teacher sees struggling student and wants to intervene
- Purpose: Create and track intervention actions

**Implementation Steps:**

1. **Create intervention modal:**
```javascript
const CreateInterventionModal = ({ studentId, alertId, isOpen, onClose }) => {
  const { getUserId } = useAuth();
  const [formData, setFormData] = useState({
    intervention_type: 'one_on_one_tutoring',
    description: '',
    notes: ''
  });

  const interventionTypes = [
    'one_on_one_tutoring',
    'small_group_instruction',
    'peer_tutoring',
    'modified_assignment',
    'extra_practice',
    'parent_conference',
    'counseling_referral'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.info('[INTERVENTION] Creating intervention:', {
      student_id: studentId,
      type: formData.intervention_type
    });

    try {
      const response = await api.post('/dashboard/interventions', {
        teacher_id: getUserId(),
        student_id: studentId,
        intervention_type: formData.intervention_type,
        description: formData.description,
        alert_id: alertId
      });

      console.info('[INTERVENTION] Created successfully:', {
        intervention_id: response.data.intervention_id,
        follow_up: response.data.follow_up_date
      });

      toast.success(`Intervention created! Follow-up: ${response.data.follow_up_date}`);
      onClose();

    } catch (error) {
      console.error('[INTERVENTION] Creation failed:', error);
      toast.error('Failed to create intervention');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Intervention</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-2">Intervention Type</label>
            <select
              value={formData.intervention_type}
              onChange={(e) => setFormData({...formData, intervention_type: e.target.value})}
              className="w-full p-2 border rounded"
            >
              {interventionTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded h-24"
              placeholder="Describe the intervention plan..."
              required
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Create Intervention
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

2. **Add to TeacherAnalytics.jsx:**
```javascript
const [showInterventionModal, setShowInterventionModal] = useState(false);
const [selectedStudent, setSelectedStudent] = useState(null);

// When teacher sees struggling student
<button
  onClick={() => {
    setSelectedStudent(student);
    setShowInterventionModal(true);
  }}
  className="btn-sm btn-primary"
>
  Create Intervention
</button>

<CreateInterventionModal
  studentId={selectedStudent?.student_id}
  isOpen={showInterventionModal}
  onClose={() => setShowInterventionModal(false)}
/>
```

---

#### 4.2 Track Intervention & Get AI Predictions

**Endpoint:** `POST /api/dashboard/interventions/track`

**Request:**
```json
{
  "teacher_id": "teacher_789",
  "concept_id": "concept_456",
  "intervention_type": "one_on_one_tutoring",
  "target_students": ["student_123", "student_456"]
}
```

**Response:**
```json
{
  "intervention_id": "int_999",
  "predicted_improvement": 15.5,
  "predicted_mastery_after": 78.3,
  "confidence": 0.87
}
```

**Where to Use:**
- File: Same as above, CreateInterventionModal
- When: Before creating intervention
- Purpose: Show teacher AI prediction of intervention effectiveness

**Implementation Steps:**

1. **Add prediction step before creation:**
```javascript
const [prediction, setPrediction] = useState(null);
const [showPrediction, setShowPrediction] = useState(false);

const handlePredict = async () => {
  console.info('[INTERVENTION] Getting AI prediction');

  try {
    const response = await api.post('/dashboard/interventions/track', {
      teacher_id: getUserId(),
      concept_id: selectedConcept,
      intervention_type: formData.intervention_type,
      target_students: [studentId]
    });

    setPrediction(response.data);
    setShowPrediction(true);

    console.info('[INTERVENTION] Prediction received:', {
      predicted_improvement: response.data.predicted_improvement,
      confidence: response.data.confidence
    });

  } catch (error) {
    console.error('[INTERVENTION] Prediction failed:', error);
  }
};

// In the modal UI:
{showPrediction && prediction && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <h3 className="font-semibold mb-2">📊 AI Prediction</h3>
    <p className="text-sm">
      Expected improvement: <strong>+{prediction.predicted_improvement.toFixed(1)}%</strong>
    </p>
    <p className="text-sm">
      Predicted mastery after: <strong>{prediction.predicted_mastery_after.toFixed(1)}%</strong>
    </p>
    <p className="text-xs text-gray-600 mt-1">
      Confidence: {(prediction.confidence * 100).toFixed(0)}%
    </p>
  </div>
)}

<button onClick={handlePredict} className="btn-secondary w-full mb-4">
  Get AI Prediction
</button>
```

---

## 5. Project Deliverables & Grading

**Status:** HIGH PRIORITY - 6 out of 6 endpoints unused (100%)
**Impact:** Projects can't be submitted or graded
**Estimated Implementation Time:** 1 week

### Unused Endpoints

#### 5.1 Submit Project Deliverable

**Endpoint:** `POST /api/pbl/projects/{project_id}/deliverable`

**Request:**
```json
{
  "team_id": "team_123",
  "submitted_by": "student_456",
  "deliverable_type": "final_presentation",
  "file_url": "https://storage.example.com/deliverables/team123_final.pdf",
  "title": "Final Project Presentation",
  "description": "Our solution to the sustainability challenge"
}
```

**Response:**
```json
{
  "deliverable_id": "deliv_789",
  "message": "Deliverable submitted successfully"
}
```

**Where to Use:**
- File: `frontend/src/pages/StudentProjects.jsx`
- When: Team completes a stage and needs to submit work
- Purpose: Upload and submit project deliverables

**Implementation Steps:**

1. **Create deliverable submission form:**
```javascript
const SubmitDeliverableModal = ({ project, team, isOpen, onClose }) => {
  const { getUserId } = useAuth();
  const [formData, setFormData] = useState({
    deliverable_type: 'research_report',
    title: '',
    description: '',
    file_url: ''
  });
  const [uploading, setUploading] = useState(false);

  const deliverableTypes = [
    'research_report',
    'prototype',
    'final_presentation',
    'design_document',
    'code_submission',
    'video_demo'
  ];

  const handleFileUpload = async (file) => {
    setUploading(true);
    console.info('[DELIVERABLE] Uploading file:', {
      name: file.name,
      size: file.size
    });

    try {
      // Upload to your file storage (S3, Firebase, etc.)
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/upload/deliverable', formData);

      setFormData(prev => ({
        ...prev,
        file_url: uploadResponse.data.url
      }));

      console.info('[DELIVERABLE] File uploaded:', uploadResponse.data.url);
      toast.success('File uploaded successfully');

    } catch (error) {
      console.error('[DELIVERABLE] Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.info('[DELIVERABLE] Submitting deliverable:', {
      project_id: project.project_id,
      team_id: team.team_id,
      type: formData.deliverable_type
    });

    try {
      const response = await projectsAPI.submitDeliverable(project.project_id, {
        team_id: team.team_id,
        submitted_by: getUserId(),
        deliverable_type: formData.deliverable_type,
        file_url: formData.file_url,
        title: formData.title,
        description: formData.description
      });

      console.info('[DELIVERABLE] Submitted successfully:', {
        deliverable_id: response.data.deliverable_id
      });

      toast.success('Deliverable submitted for grading!');
      onClose();

    } catch (error) {
      console.error('[DELIVERABLE] Submission failed:', error);
      toast.error('Failed to submit deliverable');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <h2 className="text-xl font-bold mb-4">Submit Project Deliverable</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-2">Deliverable Type</label>
            <select
              value={formData.deliverable_type}
              onChange={(e) => setFormData({...formData, deliverable_type: e.target.value})}
              className="w-full p-2 border rounded"
            >
              {deliverableTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="e.g., Final Project Presentation"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded h-20"
              placeholder="Brief description of this deliverable..."
            />
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">File Upload</label>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              className="w-full p-2 border rounded"
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            {formData.file_url && <p className="text-sm text-green-600 mt-1">✓ File uploaded</p>}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={!formData.file_url || uploading}
            >
              Submit Deliverable
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

2. **Add API method:**
```javascript
// frontend/src/services/api.js
export const projectsAPI = {
  // ... existing methods
  submitDeliverable: (projectId, data) => api.post(`/pbl/projects/${projectId}/deliverable`, data),
};
```

---

#### 5.2 Grade Project Deliverable

**Endpoint:** `POST /api/pbl/projects/{project_id}/grade`

**Request:**
```json
{
  "teacher_id": "teacher_789",
  "deliverable_id": "deliv_789",
  "grade": 92,
  "feedback": "Excellent work on the research and presentation!"
}
```

**Response:**
```json
{
  "message": "Project graded successfully"
}
```

**Where to Use:**
- File: `frontend/src/pages/TeacherProjectGrading.jsx` (create new)
- When: Teacher reviews submitted deliverables
- Purpose: Grade team projects and provide feedback

**Implementation Steps:**

1. **Create grading interface:**
```javascript
// File: frontend/src/pages/TeacherProjectGrading.jsx

const TeacherProjectGrading = () => {
  const { getUserId } = useAuth();
  const [ungradedDeliverables, setUngradedDeliverables] = useState([]);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchUngradedDeliverables = async () => {
      console.info('[GRADING] Fetching ungraded deliverables');

      // Get all teacher's projects
      const classrooms = await classroomAPI.getTeacherClasses(getUserId());

      const allUngraded = [];
      for (const classroom of classrooms.data) {
        const projects = await projectsAPI.getClassroomProjects(classroom.classroom_id);

        for (const project of projects.data.projects) {
          const deliverables = await projectsAPI.getProjectDeliverables(project.project_id);
          const ungraded = deliverables.data.filter(d => !d.graded);
          allUngraded.push(...ungraded.map(d => ({ ...d, project })));
        }
      }

      setUngradedDeliverables(allUngraded);
      console.info('[GRADING] Found ungraded deliverables:', allUngraded.length);
    };

    fetchUngradedDeliverables();
  }, []);

  const handleGradeSubmit = async () => {
    console.info('[GRADING] Submitting grade:', {
      deliverable_id: selectedDeliverable.deliverable_id,
      grade: grade
    });

    try {
      await projectsAPI.gradeProject(selectedDeliverable.project.project_id, {
        teacher_id: getUserId(),
        deliverable_id: selectedDeliverable.deliverable_id,
        grade: grade,
        feedback: feedback
      });

      console.info('[GRADING] Grade submitted successfully');
      toast.success('Project graded successfully!');

      // Remove from ungraded list
      setUngradedDeliverables(prev =>
        prev.filter(d => d.deliverable_id !== selectedDeliverable.deliverable_id)
      );
      setSelectedDeliverable(null);

    } catch (error) {
      console.error('[GRADING] Grading failed:', error);
      toast.error('Failed to grade project');
    }
  };

  return (
    <TeacherLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Project Grading</h1>

        <div className="grid grid-cols-2 gap-6">
          {/* Ungraded deliverables list */}
          <div>
            <h2 className="font-bold mb-4">Ungraded Deliverables ({ungradedDeliverables.length})</h2>

            {ungradedDeliverables.map((deliverable) => (
              <div
                key={deliverable.deliverable_id}
                onClick={() => setSelectedDeliverable(deliverable)}
                className={`card p-4 mb-3 cursor-pointer hover:shadow-lg transition ${
                  selectedDeliverable?.deliverable_id === deliverable.deliverable_id
                    ? 'border-2 border-blue-500'
                    : ''
                }`}
              >
                <h3 className="font-semibold">{deliverable.title}</h3>
                <p className="text-sm text-gray-600">{deliverable.project.title}</p>
                <p className="text-xs text-gray-400">
                  Type: {deliverable.deliverable_type.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-gray-400">
                  Submitted: {new Date(deliverable.submitted_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Grading form */}
          <div>
            {selectedDeliverable ? (
              <div className="card p-6 sticky top-6">
                <h2 className="font-bold text-lg mb-4">Grade Deliverable</h2>

                <div className="mb-4">
                  <h3 className="font-semibold">{selectedDeliverable.title}</h3>
                  <p className="text-sm text-gray-600">{selectedDeliverable.description}</p>
                </div>

                <div className="mb-4">
                  <a
                    href={selectedDeliverable.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    📎 View Submission
                  </a>
                </div>

                <div className="mb-4">
                  <label className="block font-medium mb-2">Grade (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value))}
                    className="w-full p-2 border rounded text-2xl font-bold text-center"
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-medium mb-2">Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-2 border rounded h-32"
                    placeholder="Provide constructive feedback..."
                  />
                </div>

                <button
                  onClick={handleGradeSubmit}
                  className="w-full btn-primary py-3"
                >
                  Submit Grade
                </button>
              </div>
            ) : (
              <div className="card p-6 text-center text-gray-500">
                Select a deliverable to grade
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
};
```

---

## Summary of Implementation Priority

### CRITICAL (Implement First)
1. **Practice Zone** - 80% unused, core learning feature
2. **Gamification System** - 100% unused, complete backend ready

### HIGH PRIORITY (Implement Second)
3. **Peer Review & Soft Skills** - 100% unused, research-validated
4. **Intervention System** - 100% unused, teacher effectiveness
5. **Project Deliverables & Grading** - 100% unused, project completion

### MEDIUM PRIORITY (Implement Third)
6. **Engagement Detection** - 75% unused, AI-powered alerts
7. **Advanced Analytics** - 90% unused, data insights
8. **Template Management** - 80% unused, collaboration features
9. **Concept & Item Management** - 60% unused, content editing

### LOW PRIORITY (Implement Last)
10. **PBL Workflow Management** - 50% unused, stage management

---

## General Implementation Notes for AI Agents

### Logging Standards
All new features MUST include comprehensive logging:
```javascript
console.info('[FEATURE_NAME] Action description:', { key_data });
console.error('[FEATURE_NAME] Error description:', { error, context });
```

### API Service Pattern
Always add new endpoints to `frontend/src/services/api.js`:
```javascript
export const featureAPI = {
  methodName: (params) => api.post('/endpoint', params),
};
```

### Error Handling Pattern
```javascript
try {
  console.info('[FEATURE] Starting action:', { params });
  const response = await apiCall();
  console.info('[FEATURE] Success:', { result: response.data });
  toast.success('User-friendly message');
} catch (error) {
  console.error('[FEATURE] Failed:', { error, params });
  toast.error('User-friendly error message');
}
```

### Component Structure
1. Import dependencies
2. Define state variables
3. Define useEffect hooks
4. Define event handlers
5. Define helper functions
6. Return JSX

### Testing Checklist
- [ ] Console logging works
- [ ] Error handling works
- [ ] Loading states display
- [ ] Success/error toasts show
- [ ] Backend endpoint returns expected data
- [ ] UI updates correctly after actions

---

**End of Implementation Guide**
