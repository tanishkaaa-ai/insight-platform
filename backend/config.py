"""
AMEP Configuration File - MongoDB Version
All configuration settings for the application

Location: backend/config.py
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class"""
    
    # ========================================================================
    # GENERAL APPLICATION SETTINGS
    # ========================================================================
    
    ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    TESTING = False
    
    # Server settings
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # Secret keys
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # ========================================================================
    # MONGODB CONFIGURATION
    # ========================================================================
    
    # MongoDB connection string
    MONGODB_URI = os.getenv(
        'MONGODB_URI',
        'mongodb://localhost:27017/'
    )
    
    # MongoDB database name
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'amep_db')
    
    # MongoDB connection settings
    MONGODB_SETTINGS = {
        'host': MONGODB_URI,
        'db': MONGODB_DB_NAME,
        'connect': True,
        'maxPoolSize': 50,
        'minPoolSize': 10,
        'serverSelectionTimeoutMS': 5000,
        'socketTimeoutMS': 30000,
    }
    
    # # MongoDB Atlas settings (if using cloud)
    # MONGODB_USERNAME = os.getenv('MONGODB_USERNAME')
    # MONGODB_PASSWORD = os.getenv('MONGODB_PASSWORD')
    # MONGODB_CLUSTER = os.getenv('MONGODB_CLUSTER')
    
    # # If using MongoDB Atlas, construct URI
    # if MONGODB_USERNAME and MONGODB_PASSWORD and MONGODB_CLUSTER:
    #     MONGODB_URI = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority"
    #     MONGODB_SETTINGS['host'] = MONGODB_URI
    
    # ========================================================================
    # REDIS CONFIGURATION (for caching and sessions)
    # ========================================================================
    
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
    
    # Cache timeout (seconds)
    CACHE_TIMEOUT = int(os.getenv('CACHE_TIMEOUT', 300))  # 5 minutes
    
    # ========================================================================
    # CORS CONFIGURATION
    # ========================================================================
    
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000'
    ).split(',')
    
    CORS_HEADERS = ['Content-Type', 'Authorization']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_SUPPORTS_CREDENTIALS = True
    
    # ========================================================================
    # JWT AUTHENTICATION CONFIGURATION
    # ========================================================================
    
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 30))  # 30 days
    )
    JWT_ALGORITHM = 'HS256'
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # ========================================================================
    # AI ENGINE CONFIGURATION (BR1, BR2, BR3)
    # ========================================================================
    
    # Bayesian Knowledge Tracing parameters
    BKT_PRIOR_MASTERY = float(os.getenv('BKT_PRIOR_MASTERY', 0.3))
    BKT_LEARNING_RATE = float(os.getenv('BKT_LEARNING_RATE', 0.2))
    BKT_GUESS_RATE = float(os.getenv('BKT_GUESS_RATE', 0.25))
    BKT_SLIP_RATE = float(os.getenv('BKT_SLIP_RATE', 0.1))
    
    # Deep Knowledge Tracing parameters
    DKT_SEQUENCE_LENGTH = int(os.getenv('DKT_SEQUENCE_LENGTH', 10))
    DKT_HISTORY_WEIGHT = float(os.getenv('DKT_HISTORY_WEIGHT', 0.7))
    DKT_TREND_WEIGHT = float(os.getenv('DKT_TREND_WEIGHT', 0.3))
    
    # DKVMN parameters
    DKVMN_MEMORY_SIZE = int(os.getenv('DKVMN_MEMORY_SIZE', 50))
    DKVMN_CORRELATION_THRESHOLD = float(os.getenv('DKVMN_CORRELATION_THRESHOLD', 0.3))
    
    # Mastery thresholds (BR3: Efficiency optimization)
    MASTERY_THRESHOLD_SKIP = float(os.getenv('MASTERY_THRESHOLD_SKIP', 85.0))
    MASTERY_THRESHOLD_LIGHT = float(os.getenv('MASTERY_THRESHOLD_LIGHT', 60.0))
    MASTERY_THRESHOLD_FOCUS = float(os.getenv('MASTERY_THRESHOLD_FOCUS', 60.0))
    
    # ========================================================================
    # ADAPTIVE PRACTICE CONFIGURATION (BR2)
    # ========================================================================
    
    # Cognitive load management
    COGNITIVE_LOAD_OPTIMAL = float(os.getenv('COGNITIVE_LOAD_OPTIMAL', 0.65))
    COGNITIVE_LOAD_MIN = float(os.getenv('COGNITIVE_LOAD_MIN', 0.4))
    COGNITIVE_LOAD_MAX = float(os.getenv('COGNITIVE_LOAD_MAX', 0.85))
    
    # Difficulty adjustment
    DIFFICULTY_ADJUSTMENT_GAMMA = float(os.getenv('DIFFICULTY_ADJUSTMENT_GAMMA', 0.1))
    DIFFICULTY_ADJUSTMENT_ALPHA = float(os.getenv('DIFFICULTY_ADJUSTMENT_ALPHA', 0.01))
    
    # Session defaults
    DEFAULT_SESSION_DURATION = int(os.getenv('DEFAULT_SESSION_DURATION', 30))
    MAX_SESSION_DURATION = int(os.getenv('MAX_SESSION_DURATION', 180))
    
    # ========================================================================
    # ENGAGEMENT DETECTION CONFIGURATION (BR4, BR6)
    # ========================================================================
    
    # Disengagement behavior thresholds
    QUICK_GUESS_THRESHOLD = float(os.getenv('QUICK_GUESS_THRESHOLD', 3.0))
    MAX_HINTS_THRESHOLD = int(os.getenv('MAX_HINTS_THRESHOLD', 3))
    MANY_ATTEMPTS_THRESHOLD = int(os.getenv('MANY_ATTEMPTS_THRESHOLD', 3))
    MIN_LOGIN_FREQUENCY = int(os.getenv('MIN_LOGIN_FREQUENCY', 3))
    MIN_SESSION_DURATION = float(os.getenv('MIN_SESSION_DURATION', 5.0))
    LONG_INACTIVITY_THRESHOLD = int(os.getenv('LONG_INACTIVITY_THRESHOLD', 300))
    
    # Engagement score weights
    ENGAGEMENT_IMPLICIT_WEIGHT = float(os.getenv('ENGAGEMENT_IMPLICIT_WEIGHT', 0.6))
    ENGAGEMENT_EXPLICIT_WEIGHT = float(os.getenv('ENGAGEMENT_EXPLICIT_WEIGHT', 0.4))
    
    # Alert thresholds
    ENGAGEMENT_AT_RISK_THRESHOLD = float(os.getenv('ENGAGEMENT_AT_RISK_THRESHOLD', 50.0))
    ENGAGEMENT_CRITICAL_THRESHOLD = float(os.getenv('ENGAGEMENT_CRITICAL_THRESHOLD', 30.0))
    
    # ========================================================================
    # SOFT SKILLS ASSESSMENT CONFIGURATION (BR5)
    # ========================================================================
    
    # Validation thresholds
    SOFT_SKILLS_MIN_ASSESSMENTS = int(os.getenv('SOFT_SKILLS_MIN_ASSESSMENTS', 3))
    SOFT_SKILLS_CRONBACH_ALPHA_THRESHOLD = float(os.getenv('SOFT_SKILLS_CRONBACH_ALPHA_THRESHOLD', 0.7))
    
    # Likert scale range
    LIKERT_SCALE_MIN = 1.0
    LIKERT_SCALE_MAX = 5.0
    
    # ========================================================================
    # LIVE POLLING CONFIGURATION (BR4)
    # ========================================================================
    
    # Poll settings
    MAX_POLL_OPTIONS = int(os.getenv('MAX_POLL_OPTIONS', 6))
    MIN_POLL_OPTIONS = int(os.getenv('MIN_POLL_OPTIONS', 2))
    POLL_AUTO_CLOSE_MINUTES = int(os.getenv('POLL_AUTO_CLOSE_MINUTES', 30))
    
    # Real-time update interval
    POLL_UPDATE_INTERVAL = int(os.getenv('POLL_UPDATE_INTERVAL', 2))
    
    # ========================================================================
    # FILE UPLOAD CONFIGURATION (BR9)
    # ========================================================================
    
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads/')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16 MB
    ALLOWED_EXTENSIONS = {
        'pdf', 'doc', 'docx', 'ppt', 'pptx', 
        'xls', 'xlsx', 'txt', 'png', 'jpg', 
        'jpeg', 'gif', 'mp4', 'zip'
    }
    
    # ========================================================================
    # TEMPLATE LIBRARY CONFIGURATION (BR7)
    # ========================================================================
    
    TEMPLATES_PER_PAGE = int(os.getenv('TEMPLATES_PER_PAGE', 20))
    TEMPLATE_SEARCH_LIMIT = int(os.getenv('TEMPLATE_SEARCH_LIMIT', 100))
    
    # ========================================================================
    # ANALYTICS CONFIGURATION (BR8)
    # ========================================================================
    
    # Data drop reduction
    DATA_DROPS_PER_YEAR = int(os.getenv('DATA_DROPS_PER_YEAR', 3))
    
    # Metrics refresh intervals
    METRICS_CACHE_DURATION = int(os.getenv('METRICS_CACHE_DURATION', 3600))
    REALTIME_METRICS_INTERVAL = int(os.getenv('REALTIME_METRICS_INTERVAL', 30))
    
    # ========================================================================
    # RATE LIMITING
    # ========================================================================
    
    RATELIMIT_ENABLED = os.getenv('RATELIMIT_ENABLED', 'True') == 'True'
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '100 per hour')
    RATELIMIT_STORAGE_URL = REDIS_URL
    
    # API-specific rate limits
    RATELIMIT_LOGIN = '5 per minute'
    RATELIMIT_UPLOAD = '10 per hour'
    RATELIMIT_POLL_CREATE = '20 per hour'
    
    # ========================================================================
    # LOGGING CONFIGURATION
    # ========================================================================
    
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = os.getenv('LOG_FILE', 'logs/amep.log')
    
    # ========================================================================
    # EMAIL CONFIGURATION (for notifications)
    # ========================================================================
    
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@amep.edu')
    
    # ========================================================================
    # CELERY CONFIGURATION (for async tasks)
    # ========================================================================
    
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL)
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TIMEZONE = 'UTC'
    CELERY_ENABLE_UTC = True
    
    # ========================================================================
    # WEBSOCKET CONFIGURATION
    # ========================================================================
    
    SOCKETIO_MESSAGE_QUEUE = REDIS_URL
    SOCKETIO_ASYNC_MODE = 'eventlet'
    SOCKETIO_CORS_ALLOWED_ORIGINS = CORS_ORIGINS
    SOCKETIO_PING_TIMEOUT = 60
    SOCKETIO_PING_INTERVAL = 25
    
    # ========================================================================
    # SECURITY SETTINGS
    # ========================================================================
    
    # CSRF Protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None
    
    # Session settings
    SESSION_COOKIE_SECURE = ENV == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # Password hashing
    BCRYPT_LOG_ROUNDS = 12
    
    # ========================================================================
    # FEATURE FLAGS
    # ========================================================================
    
    FEATURE_ENGAGEMENT_DETECTION = os.getenv('FEATURE_ENGAGEMENT_DETECTION', 'True') == 'True'
    FEATURE_SOFT_SKILLS_ASSESSMENT = os.getenv('FEATURE_SOFT_SKILLS_ASSESSMENT', 'True') == 'True'
    FEATURE_LIVE_POLLING = os.getenv('FEATURE_LIVE_POLLING', 'True') == 'True'
    FEATURE_ADAPTIVE_PRACTICE = os.getenv('FEATURE_ADAPTIVE_PRACTICE', 'True') == 'True'
    FEATURE_EMAIL_NOTIFICATIONS = os.getenv('FEATURE_EMAIL_NOTIFICATIONS', 'False') == 'True'


class DevelopmentConfig(Config):
    """Development-specific configuration"""
    DEBUG = True
    TESTING = False
    
    # Use local MongoDB
    MONGODB_URI = os.getenv('DEV_MONGODB_URI', 'mongodb://localhost:27017/')
    MONGODB_DB_NAME = os.getenv('DEV_MONGODB_DB_NAME', 'amep_dev')
    
    # Less strict rate limiting in dev
    RATELIMIT_ENABLED = False


class TestingConfig(Config):
    """Testing-specific configuration"""
    TESTING = True
    DEBUG = True
    
    # Use test MongoDB database
    MONGODB_URI = os.getenv('TEST_MONGODB_URI', 'mongodb://localhost:27017/')
    MONGODB_DB_NAME = os.getenv('TEST_MONGODB_DB_NAME', 'amep_test')
    
    # Disable CSRF for testing
    WTF_CSRF_ENABLED = False
    
    # Disable rate limiting in tests
    RATELIMIT_ENABLED = False


class ProductionConfig(Config):
    """Production-specific configuration"""
    DEBUG = False
    TESTING = False
    
    # Strict security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    
    # Enable all security features
    WTF_CSRF_ENABLED = True
    RATELIMIT_ENABLED = True
    
    # Longer cache durations
    CACHE_TIMEOUT = 600  # 10 minutes
    
    # Production logging
    LOG_LEVEL = 'WARNING'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])