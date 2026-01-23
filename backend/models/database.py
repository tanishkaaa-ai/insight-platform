"""
AMEP MongoDB Database Models
Using PyMongo and MongoEngine for MongoDB integration

Location: backend/models/database.py
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure
from datetime import datetime
from bson import ObjectId
import os

# ============================================================================
# MONGODB CONNECTION
# ============================================================================

class MongoDB:
    """MongoDB connection singleton"""
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDB, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self.connect()
    
    def connect(self):
        """Connect to MongoDB"""
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        db_name = os.getenv('MONGODB_DB_NAME', 'amep_db')
        
        try:
            self._client = MongoClient(
                mongodb_uri,
                maxPoolSize=50,
                minPoolSize=10,
                serverSelectionTimeoutMS=5000,
                socketTimeoutMS=30000,
            )
            # Test connection
            self._client.admin.command('ping')
            self._db = self._client[db_name]
            print(f"[OK] Connected to MongoDB: {db_name}")
        except ConnectionFailure as e:
            print(f"[FAIL] MongoDB connection failed: {e}")
            raise
    
    @property
    def db(self):
        """Get database instance"""
        if self._db is None:
            self.connect()
        return self._db
    
    @property
    def client(self):
        """Get client instance"""
        if self._client is None:
            self.connect()
        return self._client
    
    def close(self):
        """Close connection"""
        if self._client:
            self._client.close()
            print("[OK] MongoDB connection closed")

# Global database instance
mongo = MongoDB()
db = mongo.db

# ============================================================================
# COLLECTION NAMES
# ============================================================================

USERS = 'users'
STUDENTS = 'students'
TEACHERS = 'teachers'
CONCEPTS = 'concepts'
STUDENT_CONCEPT_MASTERY = 'student_concept_mastery'
STUDENT_RESPONSES = 'student_responses'
ENGAGEMENT_SESSIONS = 'engagement_sessions'
ENGAGEMENT_LOGS = 'engagement_logs'
DISENGAGEMENT_ALERTS = 'disengagement_alerts'
LIVE_POLLS = 'live_polls'
POLL_RESPONSES = 'poll_responses'
PROJECTS = 'projects'
TEAMS = 'teams'
TEAM_MEMBERSHIPS = 'team_memberships'
SOFT_SKILL_ASSESSMENTS = 'soft_skill_assessments'
PROJECT_MILESTONES = 'project_milestones'
PROJECT_ARTIFACTS = 'project_artifacts'
CURRICULUM_TEMPLATES = 'curriculum_templates'
INSTITUTIONAL_METRICS = 'institutional_metrics'
TEACHER_INTERVENTIONS = 'teacher_interventions'
PRACTICE_ITEMS = 'practice_items'

# Classroom Management Collections
CLASSROOMS = 'classrooms'
CLASSROOM_MEMBERSHIPS = 'classroom_memberships'
CLASSROOM_POSTS = 'classroom_posts'
CLASSROOM_COMMENTS = 'classroom_comments'
CLASSROOM_SUBMISSIONS = 'classroom_submissions'
CLASSROOM_NOTIFICATIONS = 'classroom_notifications'

# PBL Extended Collections
PROJECT_TASKS = 'project_tasks'
PROJECT_DELIVERABLES = 'project_deliverables'
PEER_REVIEWS = 'peer_reviews'
PROJECT_GRADES = 'project_grades'
TEAM_ACHIEVEMENTS = 'team_achievements'
TEAM_PROGRESS = 'team_progress'

# Additional Collections
INTERVENTIONS = 'interventions'
TEMPLATE_USAGE = 'template_usage'
TEMPLATE_RATINGS = 'template_ratings'

# ============================================================================
# INITIALIZE COLLECTIONS & INDEXES
# ============================================================================

def init_db(app=None):
    """Initialize MongoDB collections and create indexes"""
    
    print("\n" + "="*60)
    print("Initializing MongoDB Collections and Indexes...")
    print("="*60)
    
    # Users collection
    db[USERS].create_index([('email', ASCENDING)], unique=True)
    db[USERS].create_index([('username', ASCENDING)], unique=True)
    db[USERS].create_index([('role', ASCENDING)])
    print(f"[OK] {USERS} collection initialized")
    
    # Students collection
    db[STUDENTS].create_index([('user_id', ASCENDING)], unique=True)
    db[STUDENTS].create_index([('grade_level', ASCENDING)])
    db[STUDENTS].create_index([('section', ASCENDING)])
    print(f"[OK] {STUDENTS} collection initialized")
    
    # Teachers collection
    db[TEACHERS].create_index([('user_id', ASCENDING)], unique=True)
    db[TEACHERS].create_index([('subject_area', ASCENDING)])
    print(f"[OK] {TEACHERS} collection initialized")
    
    # Concepts collection
    db[CONCEPTS].create_index([('concept_name', ASCENDING)])
    db[CONCEPTS].create_index([('subject_area', ASCENDING)])
    db[CONCEPTS].create_index([('difficulty_level', ASCENDING)])
    print(f"[OK] {CONCEPTS} collection initialized")
    
    # Student Concept Mastery collection (BR1)
    db[STUDENT_CONCEPT_MASTERY].create_index([
        ('student_id', ASCENDING),
        ('concept_id', ASCENDING)
    ], unique=True)
    db[STUDENT_CONCEPT_MASTERY].create_index([('mastery_score', ASCENDING)])
    db[STUDENT_CONCEPT_MASTERY].create_index([('last_assessed', DESCENDING)])
    print(f"[OK] {STUDENT_CONCEPT_MASTERY} collection initialized")
    
    # Student Responses collection
    db[STUDENT_RESPONSES].create_index([('student_id', ASCENDING)])
    db[STUDENT_RESPONSES].create_index([('concept_id', ASCENDING)])
    db[STUDENT_RESPONSES].create_index([('submitted_at', DESCENDING)])
    db[STUDENT_RESPONSES].create_index([('session_id', ASCENDING)])
    print(f"[OK] {STUDENT_RESPONSES} collection initialized")
    
    # Engagement Sessions collection (BR4)
    db[ENGAGEMENT_SESSIONS].create_index([('student_id', ASCENDING)])
    db[ENGAGEMENT_SESSIONS].create_index([('start_time', DESCENDING)])
    print(f"[OK] {ENGAGEMENT_SESSIONS} collection initialized")
    
    # Engagement Logs collection (BR4)
    db[ENGAGEMENT_LOGS].create_index([('student_id', ASCENDING)])
    db[ENGAGEMENT_LOGS].create_index([('timestamp', DESCENDING)])
    db[ENGAGEMENT_LOGS].create_index([('event_type', ASCENDING)])
    print(f"[OK] {ENGAGEMENT_LOGS} collection initialized")
    
    # Disengagement Alerts collection (BR6)
    db[DISENGAGEMENT_ALERTS].create_index([('student_id', ASCENDING)])
    db[DISENGAGEMENT_ALERTS].create_index([('severity', ASCENDING)])
    db[DISENGAGEMENT_ALERTS].create_index([('detected_at', DESCENDING)])
    print(f"[OK] {DISENGAGEMENT_ALERTS} collection initialized")
    
    # Live Polls collection (BR4)
    db[LIVE_POLLS].create_index([('teacher_id', ASCENDING)])
    db[LIVE_POLLS].create_index([('is_active', ASCENDING)])
    db[LIVE_POLLS].create_index([('created_at', DESCENDING)])
    print(f"[OK] {LIVE_POLLS} collection initialized")
    
    # Poll Responses collection (BR4)
    db[POLL_RESPONSES].create_index([
        ('poll_id', ASCENDING),
        ('student_id', ASCENDING)
    ], unique=True)
    db[POLL_RESPONSES].create_index([('submitted_at', DESCENDING)])
    print(f"[OK] {POLL_RESPONSES} collection initialized")
    
    # Projects collection (BR9)
    db[PROJECTS].create_index([('teacher_id', ASCENDING)])
    db[PROJECTS].create_index([('current_stage', ASCENDING)])
    db[PROJECTS].create_index([('start_date', ASCENDING)])
    print(f"[OK] {PROJECTS} collection initialized")
    
    # Teams collection (BR9)
    db[TEAMS].create_index([('project_id', ASCENDING)])
    print(f"[OK] {TEAMS} collection initialized")
    
    # Team Memberships collection (BR9)
    db[TEAM_MEMBERSHIPS].create_index([
        ('team_id', ASCENDING),
        ('student_id', ASCENDING)
    ], unique=True)
    print(f"[OK] {TEAM_MEMBERSHIPS} collection initialized")
    
    # Soft Skills Assessments collection (BR5)
    db[SOFT_SKILL_ASSESSMENTS].create_index([('team_id', ASCENDING)])
    db[SOFT_SKILL_ASSESSMENTS].create_index([('assessed_student_id', ASCENDING)])
    db[SOFT_SKILL_ASSESSMENTS].create_index([('assessed_at', DESCENDING)])
    print(f"[OK] {SOFT_SKILL_ASSESSMENTS} collection initialized")
    
    # Project Milestones collection (BR9)
    db[PROJECT_MILESTONES].create_index([('project_id', ASCENDING)])
    db[PROJECT_MILESTONES].create_index([('team_id', ASCENDING)])
    db[PROJECT_MILESTONES].create_index([('due_date', ASCENDING)])
    print(f"[OK] {PROJECT_MILESTONES} collection initialized")
    
    # Project Artifacts collection (BR9)
    db[PROJECT_ARTIFACTS].create_index([('team_id', ASCENDING)])
    db[PROJECT_ARTIFACTS].create_index([('project_id', ASCENDING)])
    db[PROJECT_ARTIFACTS].create_index([('uploaded_at', DESCENDING)])
    print(f"[OK] {PROJECT_ARTIFACTS} collection initialized")
    
    # Curriculum Templates collection (BR7)
    db[CURRICULUM_TEMPLATES].create_index([('subject_area', ASCENDING)])
    db[CURRICULUM_TEMPLATES].create_index([('grade_level', ASCENDING)])
    db[CURRICULUM_TEMPLATES].create_index([('template_type', ASCENDING)])
    db[CURRICULUM_TEMPLATES].create_index([('is_public', ASCENDING)])
    # Text search index for title and description
    db[CURRICULUM_TEMPLATES].create_index([
        ('title', 'text'),
        ('description', 'text')
    ])
    print(f"[OK] {CURRICULUM_TEMPLATES} collection initialized")
    
    # Institutional Metrics collection (BR8)
    db[INSTITUTIONAL_METRICS].create_index([('metric_date', DESCENDING)])
    print(f"[OK] {INSTITUTIONAL_METRICS} collection initialized")
    
    # Teacher Interventions collection (BR6)
    db[TEACHER_INTERVENTIONS].create_index([('teacher_id', ASCENDING)])
    db[TEACHER_INTERVENTIONS].create_index([('concept_id', ASCENDING)])
    db[TEACHER_INTERVENTIONS].create_index([('performed_at', DESCENDING)])
    print(f"[OK] {TEACHER_INTERVENTIONS} collection initialized")

    # Classrooms collection
    db[CLASSROOMS].create_index([('teacher_id', ASCENDING)])
    db[CLASSROOMS].create_index([('join_code', ASCENDING)], unique=True)
    db[CLASSROOMS].create_index([('is_active', ASCENDING)])
    db[CLASSROOMS].create_index([('created_at', DESCENDING)])
    print(f"[OK] {CLASSROOMS} collection initialized")

    # Classroom Memberships collection
    db[CLASSROOM_MEMBERSHIPS].create_index([
        ('classroom_id', ASCENDING),
        ('student_id', ASCENDING)
    ], unique=True)
    db[CLASSROOM_MEMBERSHIPS].create_index([('student_id', ASCENDING)])
    db[CLASSROOM_MEMBERSHIPS].create_index([('classroom_id', ASCENDING), ('is_active', ASCENDING)])
    print(f"[OK] {CLASSROOM_MEMBERSHIPS} collection initialized")

    # Classroom Posts collection
    db[CLASSROOM_POSTS].create_index([('classroom_id', ASCENDING), ('created_at', DESCENDING)])
    db[CLASSROOM_POSTS].create_index([('author_id', ASCENDING)])
    db[CLASSROOM_POSTS].create_index([('post_type', ASCENDING)])
    db[CLASSROOM_POSTS].create_index([('is_pinned', DESCENDING), ('created_at', DESCENDING)])
    print(f"[OK] {CLASSROOM_POSTS} collection initialized")

    # Classroom Comments collection
    db[CLASSROOM_COMMENTS].create_index([('post_id', ASCENDING), ('created_at', ASCENDING)])
    db[CLASSROOM_COMMENTS].create_index([('author_id', ASCENDING)])
    print(f"[OK] {CLASSROOM_COMMENTS} collection initialized")

    # Classroom Submissions collection
    db[CLASSROOM_SUBMISSIONS].create_index([
        ('assignment_id', ASCENDING),
        ('student_id', ASCENDING)
    ], unique=True)
    db[CLASSROOM_SUBMISSIONS].create_index([('student_id', ASCENDING), ('status', ASCENDING)])
    db[CLASSROOM_SUBMISSIONS].create_index([('assignment_id', ASCENDING), ('status', ASCENDING)])
    print(f"[OK] {CLASSROOM_SUBMISSIONS} collection initialized")

    # Classroom Notifications collection
    db[CLASSROOM_NOTIFICATIONS].create_index([('user_id', ASCENDING), ('is_read', ASCENDING), ('created_at', DESCENDING)])
    db[CLASSROOM_NOTIFICATIONS].create_index([('classroom_id', ASCENDING)])
    print(f"[OK] {CLASSROOM_NOTIFICATIONS} collection initialized")

    # PBL Tasks collection
    db[PROJECT_TASKS].create_index([('team_id', ASCENDING)])
    db[PROJECT_TASKS].create_index([('assigned_to', ASCENDING)])
    db[PROJECT_TASKS].create_index([('status', ASCENDING)])
    db[PROJECT_TASKS].create_index([('due_date', ASCENDING)])
    print(f"[OK] {PROJECT_TASKS} collection initialized")

    # PBL Deliverables collection
    db[PROJECT_DELIVERABLES].create_index([('project_id', ASCENDING)])
    db[PROJECT_DELIVERABLES].create_index([('team_id', ASCENDING)])
    db[PROJECT_DELIVERABLES].create_index([('submitted_at', DESCENDING)])
    db[PROJECT_DELIVERABLES].create_index([('graded', ASCENDING)])
    print(f"[OK] {PROJECT_DELIVERABLES} collection initialized")

    # PBL Peer Reviews collection
    db[PEER_REVIEWS].create_index([('team_id', ASCENDING)])
    db[PEER_REVIEWS].create_index([('reviewer_id', ASCENDING)])
    db[PEER_REVIEWS].create_index([('reviewee_id', ASCENDING)])
    db[PEER_REVIEWS].create_index([('review_type', ASCENDING)])
    db[PEER_REVIEWS].create_index([('submitted_at', DESCENDING)])
    print(f"[OK] {PEER_REVIEWS} collection initialized")

    # PBL Grades collection
    db[PROJECT_GRADES].create_index([('project_id', ASCENDING)])
    db[PROJECT_GRADES].create_index([('team_id', ASCENDING)])
    db[PROJECT_GRADES].create_index([('graded_at', DESCENDING)])
    print(f"[OK] {PROJECT_GRADES} collection initialized")

    # Team Achievements collection
    db[TEAM_ACHIEVEMENTS].create_index([('team_id', ASCENDING)])
    db[TEAM_ACHIEVEMENTS].create_index([('achievement_type', ASCENDING)])
    db[TEAM_ACHIEVEMENTS].create_index([('earned_at', DESCENDING)])
    print(f"[OK] {TEAM_ACHIEVEMENTS} collection initialized")

    # Team Progress collection
    db[TEAM_PROGRESS].create_index([('team_id', ASCENDING)], unique=True)
    db[TEAM_PROGRESS].create_index([('project_id', ASCENDING)])
    db[TEAM_PROGRESS].create_index([('current_level', ASCENDING)])
    print(f"[OK] {TEAM_PROGRESS} collection initialized")

    # Interventions collection
    db[INTERVENTIONS].create_index([('student_id', ASCENDING)])
    db[INTERVENTIONS].create_index([('teacher_id', ASCENDING)])
    db[INTERVENTIONS].create_index([('status', ASCENDING)])
    db[INTERVENTIONS].create_index([('created_at', DESCENDING)])
    print(f"[OK] {INTERVENTIONS} collection initialized")

    # Template Usage collection
    db[TEMPLATE_USAGE].create_index([('template_id', ASCENDING)])
    db[TEMPLATE_USAGE].create_index([('teacher_id', ASCENDING)])
    db[TEMPLATE_USAGE].create_index([('used_at', DESCENDING)])
    print(f"[OK] {TEMPLATE_USAGE} collection initialized")

    # Template Ratings collection
    db[TEMPLATE_RATINGS].create_index([('template_id', ASCENDING)])
    db[TEMPLATE_RATINGS].create_index([('user_id', ASCENDING)])
    print(f"[OK] {TEMPLATE_RATINGS} collection initialized")

    print("="*60)
    print("[OK] All MongoDB collections and indexes created successfully")
    print("="*60 + "\n")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_collection(collection_name):
    """Get a MongoDB collection"""
    return db[collection_name]

def insert_one(collection_name, document):
    """Insert a single document"""
    if '_id' not in document:
        document['_id'] = str(ObjectId())
    if 'created_at' not in document:
        document['created_at'] = datetime.utcnow()
    
    result = db[collection_name].insert_one(document)
    return str(result.inserted_id)

def insert_many(collection_name, documents):
    """Insert multiple documents"""
    for doc in documents:
        if '_id' not in doc:
            doc['_id'] = str(ObjectId())
        if 'created_at' not in doc:
            doc['created_at'] = datetime.utcnow()
    
    result = db[collection_name].insert_many(documents)
    return [str(id) for id in result.inserted_ids]

def find_one(collection_name, query, projection=None):
    """Find a single document"""
    return db[collection_name].find_one(query, projection)

def find_many(collection_name, query, projection=None, sort=None, limit=None, skip=None):
    """Find multiple documents"""
    cursor = db[collection_name].find(query, projection)
    
    if sort:
        cursor = cursor.sort(sort)
    if skip:
        cursor = cursor.skip(skip)
    if limit:
        cursor = cursor.limit(limit)
    
    return list(cursor)

def update_one(collection_name, query, update, upsert=False):
    """Update a single document"""
    if 'updated_at' not in update.get('$set', {}):
        if '$set' not in update:
            update['$set'] = {}
        update['$set']['updated_at'] = datetime.utcnow()
    
    result = db[collection_name].update_one(query, update, upsert=upsert)
    return result.modified_count

def update_many(collection_name, query, update):
    """Update multiple documents"""
    if 'updated_at' not in update.get('$set', {}):
        if '$set' not in update:
            update['$set'] = {}
        update['$set']['updated_at'] = datetime.utcnow()
    
    result = db[collection_name].update_many(query, update)
    return result.modified_count

def delete_one(collection_name, query):
    """Delete a single document"""
    result = db[collection_name].delete_one(query)
    return result.deleted_count

def delete_many(collection_name, query):
    """Delete multiple documents"""
    result = db[collection_name].delete_many(query)
    return result.deleted_count

def count_documents(collection_name, query=None):
    """Count documents matching query"""
    if query is None:
        query = {}
    return db[collection_name].count_documents(query)

def aggregate(collection_name, pipeline):
    """Perform aggregation"""
    return list(db[collection_name].aggregate(pipeline))

# ============================================================================
# DOCUMENT SCHEMAS (for reference)
# ============================================================================

"""
User Document Schema:
{
    "_id": "ObjectId or string",
    "email": "string",
    "username": "string",
    "password_hash": "string",
    "role": "student|teacher|admin",
    "created_at": "datetime",
    "updated_at": "datetime"
}

Student Document Schema:
{
    "_id": "string",
    "user_id": "string (reference to users._id)",
    "first_name": "string",
    "last_name": "string",
    "grade_level": "int",
    "section": "string",
    "enrollment_date": "datetime",
    "learning_style": "string",
    "created_at": "datetime"
}

Concept Document Schema:
{
    "_id": "string",
    "concept_name": "string",
    "description": "string",
    "subject_area": "string",
    "difficulty_level": "float (0-1)",
    "weight": "float",
    "prerequisites": ["concept_id1", "concept_id2"],
    "created_at": "datetime"
}

Student Concept Mastery Document Schema (BR1):
{
    "_id": "string",
    "student_id": "string",
    "concept_id": "string",
    "mastery_score": "float (0-100)",
    "bkt_component": "float",
    "dkt_component": "float",
    "dkvmn_component": "float",
    "confidence": "float (0-1)",
    "learning_velocity": "float",
    "last_assessed": "datetime",
    "times_assessed": "int",
    "updated_at": "datetime"
}

Live Poll Document Schema (BR4):
{
    "_id": "string",
    "teacher_id": "string",
    "question": "string",
    "poll_type": "multiple_choice|understanding|fact_based",
    "options": ["option1", "option2", ...],
    "correct_answer": "string (optional)",
    "created_at": "datetime",
    "closed_at": "datetime (optional)",
    "is_active": "boolean"
}

Soft Skill Assessment Document Schema (BR5):
{
    "_id": "string",
    "team_id": "string",
    "assessed_student_id": "string",
    "assessor_student_id": "string",
    "assessment_type": "peer_review|self_assessment|teacher_assessment",
    "ratings": {
        "td_communication": "float (1-5)",
        "td_mutual_support": "float (1-5)",
        "td_trust": "float (1-5)",
        "td_active_listening": "float (1-5)",
        "ts_clear_roles": "float (1-5)",
        "ts_task_scheduling": "float (1-5)",
        "ts_decision_making": "float (1-5)",
        "ts_conflict_resolution": "float (1-5)",
        "tm_clear_purpose": "float (1-5)",
        "tm_smart_goals": "float (1-5)",
        "tm_passion": "float (1-5)",
        "tm_synergy": "float (1-5)",
        "te_growth_mindset": "float (1-5)",
        "te_quality_work": "float (1-5)",
        "te_self_monitoring": "float (1-5)",
        "te_reflective_practice": "float (1-5)"
    },
    "overall_td_score": "float",
    "overall_ts_score": "float",
    "overall_tm_score": "float",
    "overall_te_score": "float",
    "comments": "string",
    "assessed_at": "datetime"
}
"""

# ============================================================================
# SEED DATA (for testing)
# ============================================================================

def seed_sample_data():
    """Insert sample data for testing"""
    
    print("Seeding sample data...")
    
    # Sample concepts
    concepts = [
        {
            '_id': 'concept_001',
            'concept_name': 'Linear Equations',
            'description': 'Solving equations of the form ax + b = c',
            'subject_area': 'Algebra',
            'difficulty_level': 0.5,
            'weight': 1.0
        },
        {
            '_id': 'concept_002',
            'concept_name': 'Quadratic Equations',
            'description': 'Solving equations of the form ax² + bx + c = 0',
            'subject_area': 'Algebra',
            'difficulty_level': 0.7,
            'weight': 1.5
        }
    ]
    
    try:
        db[CONCEPTS].insert_many(concepts)
        print(f"[OK] Inserted {len(concepts)} sample concepts")
    except Exception as e:
        print(f"Note: Sample concepts may already exist")
    
    print("Sample data seeding complete")