"""
AMEP Pydantic Schemas
Data validation and serialization schemas for API requests/responses

Located: backend/models/schemas.py
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# ============================================================================
# ENUMS
# ============================================================================

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class EngagementLevel(str, Enum):
    ENGAGED = "ENGAGED"
    PASSIVE = "PASSIVE"
    MONITOR = "MONITOR"
    AT_RISK = "AT_RISK"
    CRITICAL = "CRITICAL"

class ProjectStage(str, Enum):
    QUESTIONING = "questioning"
    DEFINE = "define"
    RESEARCH = "research"
    CREATE = "create"
    PRESENT = "present"

class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class PollType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    UNDERSTANDING = "understanding"
    FACT_BASED = "fact_based"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"

# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    role: UserRole

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    grade_level: Optional[int] = Field(None, ge=1, le=12)
    section: Optional[str] = None

class StudentCreate(StudentBase):
    user_id: str

class StudentResponse(StudentBase):
    student_id: str
    enrollment_date: date
    learning_style: Optional[str] = None

    class Config:
        from_attributes = True

class TeacherBase(BaseModel):
    first_name: str
    last_name: str
    subject_area: Optional[str] = None
    department: Optional[str] = None

class TeacherResponse(TeacherBase):
    teacher_id: str
    years_experience: Optional[int] = None

    class Config:
        from_attributes = True

# ============================================================================
# MASTERY & KNOWLEDGE TRACING SCHEMAS (BR1, BR2, BR3)
# ============================================================================

class ConceptBase(BaseModel):
    concept_name: str = Field(..., max_length=255)
    description: Optional[str] = None
    subject_area: Optional[str] = None
    difficulty_level: float = Field(default=0.5, ge=0.0, le=1.0)
    level: int = Field(default=1, ge=1, le=10)
    weight: float = Field(default=1.0, ge=0.0)

class ConceptResponse(ConceptBase):
    concept_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class MasteryCalculationRequest(BaseModel):
    """BR1: Request to calculate mastery score"""
    student_id: str
    concept_id: str
    is_correct: bool
    response_time: float = Field(..., gt=0)
    current_mastery: Optional[float] = Field(None, ge=0.0, le=100.0)
    response_history: List[Dict[str, Any]] = []
    related_concepts: List[str] = []

class MasteryCalculationResponse(BaseModel):
    """BR1: Mastery score calculation result"""
    mastery_score: float = Field(..., ge=0.0, le=100.0)
    bkt_component: float
    dkt_component: float
    dkvmn_component: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    learning_velocity: float
    needs_practice: bool
    recommendation: str
    timestamp: datetime

class StudentMasteryResponse(BaseModel):
    """BR1: Student's mastery across all concepts"""
    student_id: str
    concepts: List[Dict[str, Any]]
    overall_mastery: float

class PracticeSessionRequest(BaseModel):
    """BR2: Request to generate adaptive practice session"""
    student_id: str
    session_duration: int = Field(default=30, ge=5, le=180)  # minutes
    subject_area: Optional[str] = None
    classroom_id: Optional[str] = None
    concept_id: Optional[str] = None

class ContentItemResponse(BaseModel):
    """BR2: Practice content item"""
    item_id: str
    concept_id: str
    difficulty: float
    estimated_time: int
    question: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None

class PracticeSessionResponse(BaseModel):
    """BR2, BR3: Generated practice session"""
    session_id: str
    student_id: str
    content_items: List[ContentItemResponse]
    total_items: int
    estimated_duration: int
    cognitive_load: float
    load_status: str
    zpd_alignment: str

class StudentResponseCreate(BaseModel):
    """Record student response to practice item"""
    student_id: str
    item_id: str
    concept_id: str
    is_correct: bool
    response_time: float
    hints_used: int = 0
    attempts: int = 1
    response_text: Optional[str] = None

# ============================================================================
# ENGAGEMENT SCHEMAS (BR4, BR6)
# ============================================================================

class ImplicitSignalsSchema(BaseModel):
    """BR4: Implicit engagement indicators"""
    login_frequency: int = Field(..., ge=0)
    avg_session_duration: float = Field(..., ge=0)
    time_on_task: float = Field(..., ge=0)
    interaction_count: int = Field(..., ge=0)
    response_times: List[float] = []
    task_completion_rate: float = Field(..., ge=0.0, le=1.0)
    reattempt_rate: float = Field(..., ge=0.0, le=1.0)
    optional_resource_usage: int = Field(default=0, ge=0)
    discussion_participation: int = Field(default=0, ge=0)

class ExplicitSignalsSchema(BaseModel):
    """BR4: Explicit engagement indicators"""
    poll_responses: int = Field(default=0, ge=0)
    understanding_level: float = Field(default=3.0, ge=1.0, le=5.0)
    participation_rate: float = Field(..., ge=0.0, le=1.0)
    quiz_accuracy: float = Field(..., ge=0.0, le=1.0)

class EngagementAnalysisRequest(BaseModel):
    """BR4: Request to analyze student engagement"""
    student_id: str
    implicit_signals: ImplicitSignalsSchema
    explicit_signals: ExplicitSignalsSchema
    recent_responses: List[Dict[str, Any]] = []

class DisengagementBehavior(BaseModel):
    """BR4: Detected disengagement behavior"""
    type: str
    severity: str
    count: Optional[int] = None
    description: str
    detected_at: datetime

class EngagementAnalysisResponse(BaseModel):
    """BR4: Engagement analysis result"""
    engagement_score: float = Field(..., ge=0.0, le=100.0)
    implicit_component: float
    explicit_component: float
    engagement_level: EngagementLevel
    behaviors_detected: int
    recommendations: List[str]

class ClassEngagementResponse(BaseModel):
    """BR6: Class-level engagement metrics"""
    class_id: str
    class_engagement_index: float
    distribution: Dict[str, int]
    alert_count: int
    students_needing_attention: List[Dict[str, Any]]
    trend: str
    engagement_rate: float

# ============================================================================
# LIVE POLLING SCHEMAS (BR4)
# ============================================================================

class PollCreate(BaseModel):
    """BR4: Create new poll"""
    teacher_id: str
    question: str = Field(..., min_length=5)
    options: List[str] = Field(..., min_items=2, max_items=6)
    poll_type: PollType = PollType.MULTIPLE_CHOICE
    correct_answer: Optional[str] = None

class PollResponse(BaseModel):
    """BR4: Poll information"""
    poll_id: str
    teacher_id: str
    question: str
    options: List[str]
    poll_type: PollType
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class PollResponseCreate(BaseModel):
    """BR4: Submit poll response"""
    student_id: str
    selected_option: str
    response_time: Optional[float] = None

class PollResultsResponse(BaseModel):
    """BR6: Aggregated poll results"""
    poll_id: str
    question: str
    responses: List[Dict[str, Any]]
    total_responses: int
    class_size: int
    participation_rate: float

# ============================================================================
# PROJECT-BASED LEARNING SCHEMAS (BR5, BR9)
# ============================================================================

class ProjectBase(BaseModel):
    """BR9: Project information"""
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    start_date: date
    end_date: date
    current_stage: ProjectStage = ProjectStage.QUESTIONING

class ProjectCreate(ProjectBase):
    teacher_id: str
    curriculum_alignment: Optional[str] = None

class ProjectResponse(ProjectBase):
    project_id: str
    teacher_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    """BR9: Team information"""
    team_name: str = Field(..., max_length=100)

class TeamCreate(TeamBase):
    project_id: str

class TeamResponse(TeamBase):
    team_id: str
    project_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TeamMemberBase(BaseModel):
    """BR9: Team member assignment"""
    student_id: str
    role: Optional[str] = None

class TeamMemberCreate(TeamMemberBase):
    team_id: str

class MilestoneBase(BaseModel):
    """BR9: Project milestone"""
    title: str
    description: Optional[str] = None
    due_date: date
    status: MilestoneStatus = MilestoneStatus.PENDING

class MilestoneCreate(MilestoneBase):
    project_id: str
    team_id: Optional[str] = None

class MilestoneResponse(MilestoneBase):
    milestone_id: str
    project_id: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ArtifactCreate(BaseModel):
    """BR9: Project artifact submission"""
    team_id: str
    project_id: str
    artifact_type: str
    file_name: str
    file_url: str
    uploaded_by: str

class ArtifactResponse(BaseModel):
    """BR9: Artifact information"""
    artifact_id: str
    team_id: str
    artifact_type: str
    file_name: str
    version: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# SOFT SKILLS ASSESSMENT SCHEMAS (BR5)
# ============================================================================

class SoftSkillRatings(BaseModel):
    """BR5: Individual ratings for 4-dimensional model"""
    # Team Dynamics (TD)
    td_communication: float = Field(..., ge=1.0, le=5.0)
    td_mutual_support: float = Field(..., ge=1.0, le=5.0)
    td_trust: float = Field(..., ge=1.0, le=5.0)
    td_active_listening: float = Field(..., ge=1.0, le=5.0)
    
    # Team Structure (TS)
    ts_clear_roles: float = Field(..., ge=1.0, le=5.0)
    ts_task_scheduling: float = Field(..., ge=1.0, le=5.0)
    ts_decision_making: float = Field(..., ge=1.0, le=5.0)
    ts_conflict_resolution: float = Field(..., ge=1.0, le=5.0)
    
    # Team Motivation (TM)
    tm_clear_purpose: float = Field(..., ge=1.0, le=5.0)
    tm_smart_goals: float = Field(..., ge=1.0, le=5.0)
    tm_passion: float = Field(..., ge=1.0, le=5.0)
    tm_synergy: float = Field(..., ge=1.0, le=5.0)
    
    # Team Excellence (TE)
    te_growth_mindset: float = Field(..., ge=1.0, le=5.0)
    te_quality_work: float = Field(..., ge=1.0, le=5.0)
    te_self_monitoring: float = Field(..., ge=1.0, le=5.0)
    te_reflective_practice: float = Field(..., ge=1.0, le=5.0)

class SoftSkillAssessmentCreate(BaseModel):
    """BR5: Create soft skill assessment"""
    team_id: str
    assessed_student_id: str
    assessor_student_id: str
    assessment_type: str = Field(default="peer_review")
    ratings: SoftSkillRatings
    comments: Optional[str] = None

class SoftSkillAssessmentResponse(BaseModel):
    """BR5: Assessment result with computed averages"""
    assessment_id: str
    team_id: str
    assessed_student_id: str
    overall_td_score: float
    overall_ts_score: float
    overall_tm_score: float
    overall_te_score: float
    overall_score: float
    assessed_at: datetime

    class Config:
        from_attributes = True

class TeamSoftSkillsResponse(BaseModel):
    """BR5: Aggregated team soft skills"""
    team_id: str
    team_name: str
    current_scores: Dict[str, float]
    trend_data: List[Dict[str, Any]]
    assessment_count: int

# ============================================================================
# TEMPLATE LIBRARY SCHEMAS (BR7)
# ============================================================================

class TemplateBase(BaseModel):
    """BR7: Curriculum template"""
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    subject_area: Optional[str] = None
    grade_level: Optional[int] = Field(None, ge=1, le=12)
    template_type: str
    learning_objectives: List[str] = []
    estimated_duration: Optional[int] = None  # minutes
    soft_skills_targeted: List[str] = []

class TemplateCreate(TemplateBase):
    content: Dict[str, Any]
    created_by: str
    is_public: bool = False

class TemplateResponse(TemplateBase):
    template_id: str
    created_by: str
    times_used: int
    avg_rating: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# ANALYTICS SCHEMAS (BR8)
# ============================================================================

class UnifiedMetricsResponse(BaseModel):
    """BR8: Unified institutional metrics"""
    metric_date: date
    mastery_rate: float = Field(..., ge=0.0, le=100.0)
    teacher_adoption_rate: float = Field(..., ge=0.0, le=100.0)
    admin_confidence_score: float = Field(..., ge=0.0, le=100.0)
    total_students: int
    active_students: int
    total_teachers: int
    active_teachers: int
    avg_engagement_score: float
    avg_planning_time_minutes: float
    data_entry_events: int

class InterventionCreate(BaseModel):
    """BR6: Track teacher intervention"""
    teacher_id: str
    concept_id: str
    intervention_type: str
    target_students: List[str]
    description: Optional[str] = None
    mastery_before: float = Field(..., ge=0.0, le=100.0)

class InterventionResponse(BaseModel):
    """BR6: Intervention tracking"""
    intervention_id: str
    teacher_id: str
    concept_id: str
    intervention_type: str
    mastery_before: float
    mastery_after: Optional[float] = None
    improvement: Optional[float] = None
    performed_at: datetime
    measured_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============================================================================
# PAGINATION & FILTERING
# ============================================================================

class PaginationParams(BaseModel):
    """Generic pagination parameters"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

class FilterParams(BaseModel):
    """Generic filter parameters"""
    subject_area: Optional[str] = None
    grade_level: Optional[int] = Field(None, ge=1, le=12)
    date_from: Optional[date] = None
    date_to: Optional[date] = None

# ============================================================================
# RESPONSE WRAPPERS
# ============================================================================

class SuccessResponse(BaseModel):
    """Generic success response"""
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    """Generic error response"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None

class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

# ============================================================================
# VALIDATORS
# ============================================================================

class MasteryCalculationRequest(MasteryCalculationRequest):
    @validator('response_time')
    def validate_response_time(cls, v):
        if v <= 0:
            raise ValueError('Response time must be positive')
        if v > 3600:  # 1 hour
            raise ValueError('Response time seems unrealistic')
        return v

class PollCreate(PollCreate):
    @validator('options')
    def validate_options(cls, v):
        if len(v) != len(set(v)):
            raise ValueError('Poll options must be unique')
        return v
    
    @validator('correct_answer')
    def validate_correct_answer(cls, v, values):
        if v and 'options' in values and v not in values['options']:
            raise ValueError('Correct answer must be one of the options')
        return v

class ProjectCreate(ProjectCreate):
    @validator('end_date')
    def validate_dates(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

# ============================================================================
# WEBSOCKET EVENT SCHEMAS
# ============================================================================

class WebSocketEvent(BaseModel):
    """Generic WebSocket event"""
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)

class PollUpdateEvent(BaseModel):
    """BR4: Poll update notification"""
    poll_id: str
    total_responses: int
    participation_rate: float

class EngagementAlertEvent(BaseModel):
    """BR6: Real-time engagement alert"""
    student_id: str
    alert_type: str
    severity: str
    message: str

# ============================================================================
# ATTENDANCE SCHEMAS
# ============================================================================

class OpenAttendanceSessionRequest(BaseModel):
    """Request to open attendance session"""
    classroom_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius: int = Field(100, ge=10, le=5000, description="Radius in meters")
    duration: int = Field(15, ge=1, le=180, description="Duration in minutes")

class MarkAttendanceRequest(BaseModel):
    """Request to mark attendance"""
    session_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    photo: str = Field(..., description="Base64 encoded photo")

class AttendanceRecordResponse(BaseModel):
    """Attendance record response"""
    record_id: str
    student_id: str
    student_name: str
    marked_at: datetime
    distance_meters: float
    photo_base64: str
    status: AttendanceStatus

    class Config:
        from_attributes = True