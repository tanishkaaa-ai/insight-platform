-- AMEP Database Schema - Optimized for Performance
-- Addresses Issue #29: Database Performance with Complex Queries

-- Main tables (normalized)
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    class_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id)
);

CREATE TABLE mastery_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    concept_id INT NOT NULL,
    mastery_score DECIMAL(5,2) NOT NULL,
    response_time INT,
    correct BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_concept (student_id, concept_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE engagement_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    engagement_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_created (student_id, created_at),
    INDEX idx_event_type (event_type),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE pbl_projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    project_id INT NOT NULL,
    project_status VARCHAR(50) NOT NULL,
    soft_skills_score DECIMAL(5,2),
    completion_percentage INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_project (student_id, project_id),
    INDEX idx_status (project_status),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ✅ SOLUTION: Denormalized analytics snapshot table
CREATE TABLE student_analytics_snapshot (
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    current_mastery_avg DECIMAL(5,2) DEFAULT 0.00,
    engagement_score DECIMAL(5,2) DEFAULT 0.00,
    project_status VARCHAR(50) DEFAULT 'not_started',
    total_responses INT DEFAULT 0,
    avg_response_time DECIMAL(8,2) DEFAULT 0.00,
    last_activity TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (student_id),
    INDEX idx_class_updated (class_id, updated_at),
    INDEX idx_mastery_score (current_mastery_avg),
    INDEX idx_engagement_score (engagement_score),
    INDEX idx_last_activity (last_activity),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Real-time aggregation table for class-level metrics
CREATE TABLE class_analytics_snapshot (
    class_id INT NOT NULL,
    avg_mastery DECIMAL(5,2) DEFAULT 0.00,
    avg_engagement DECIMAL(5,2) DEFAULT 0.00,
    active_students INT DEFAULT 0,
    total_students INT DEFAULT 0,
    projects_completed INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (class_id),
    INDEX idx_updated_at (updated_at)
);

-- Materialized view for teacher dashboard (fast reads)
CREATE TABLE teacher_dashboard_cache (
    teacher_id INT NOT NULL,
    class_id INT NOT NULL,
    dashboard_data JSON NOT NULL,
    cache_key VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (teacher_id, class_id),
    INDEX idx_cache_key (cache_key),
    INDEX idx_expires_at (expires_at)
);