import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, DECIMAL, Boolean, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.sql import func
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///amep.db')
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ORM Models
class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), unique=True, nullable=False, index=True)
    class_id = Column(Integer, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class MasteryTracking(Base):
    __tablename__ = "mastery_tracking"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False, index=True)
    concept_id = Column(Integer, nullable=False)
    mastery_score = Column(DECIMAL(5,2), nullable=False)
    response_time = Column(Integer)
    correct = Column(Boolean)
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True)

class EngagementEvent(Base):
    __tablename__ = "engagement_events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    event_data = Column(JSON)
    engagement_score = Column(DECIMAL(5,2))
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True)

class PBLProject(Base):
    __tablename__ = "pbl_projects"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False, index=True)
    project_id = Column(Integer, nullable=False)
    project_status = Column(String(50), nullable=False, index=True)
    soft_skills_score = Column(DECIMAL(5,2))
    completion_percentage = Column(Integer, default=0)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

# ✅ OPTIMIZED: Denormalized analytics table
class StudentAnalyticsSnapshot(Base):
    __tablename__ = "student_analytics_snapshot"
    
    student_id = Column(Integer, ForeignKey('students.id'), primary_key=True)
    class_id = Column(Integer, nullable=False, index=True)
    current_mastery_avg = Column(DECIMAL(5,2), default=0.00, index=True)
    engagement_score = Column(DECIMAL(5,2), default=0.00, index=True)
    project_status = Column(String(50), default='not_started')
    total_responses = Column(Integer, default=0)
    avg_response_time = Column(DECIMAL(8,2), default=0.00)
    last_activity = Column(TIMESTAMP, index=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), index=True)

class ClassAnalyticsSnapshot(Base):
    __tablename__ = "class_analytics_snapshot"
    
    class_id = Column(Integer, primary_key=True)
    avg_mastery = Column(DECIMAL(5,2), default=0.00)
    avg_engagement = Column(DECIMAL(5,2), default=0.00)
    active_students = Column(Integer, default=0)
    total_students = Column(Integer, default=0)
    projects_completed = Column(Integer, default=0)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), index=True)

@contextmanager
def get_db_session():
    """Database session context manager"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        session.close()

def init_database():
    """Initialize database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise