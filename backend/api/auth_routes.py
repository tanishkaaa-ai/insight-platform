"""
AMEP Authentication Routes
Handles user login, registration, and JWT token management

Location: backend/api/auth_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import bcrypt
import jwt
import os
from bson import ObjectId

# Import MongoDB helper functions
from models.database import (
    db,
    USERS,
    STUDENTS,
    TEACHERS,
    find_one,
    insert_one,
    update_one
)

# Import logging
from utils.logger import get_logger, log_authentication

auth_bp = Blueprint('auth', __name__)
logger = get_logger(__name__)

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 24))

# Hardcoded Admin Credentials (Bypass DB)
HARDCODED_ADMIN_EMAIL = "admin@amep.edu"
HARDCODED_ADMIN_PASS = "admin123"
HARDCODED_ADMIN_ID = "000000000000000000000000"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_jwt_token(user_id, role):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def decode_jwt_token(token):
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def extract_token_from_header():
    """Extract JWT token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None

    return parts[1]


def require_auth(required_role=None):
    """
    Decorator to protect routes with authentication

    Usage:
        @auth_bp.route('/protected')
        @require_auth()
        def protected_route():
            ...

        @auth_bp.route('/admin-only')
        @require_auth(required_role='admin')
        def admin_route():
            ...
    """
    def decorator(f):
        from functools import wraps

        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = extract_token_from_header()
            if not token:
                return jsonify({'error': 'Authentication required'}), 401

            payload = decode_jwt_token(token)
            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401

            # Check role if required
            if required_role and payload.get('role') != required_role:
                return jsonify({'error': 'Insufficient permissions'}), 403

            # Add user info to request context
            request.user_id = payload['user_id']
            request.user_role = payload['role']

            return f(*args, **kwargs)

        return decorated_function
    return decorator


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user (student or teacher)
    ... (omitted docs)
    """
    try:
        data = request.json
        logger.info(f"Registration attempt | email: {data.get('email')} | role: {data.get('role')}")

        # Validate required fields
        required = ['email', 'username', 'password', 'role', 'first_name', 'last_name']
        missing = [field for field in required if field not in data]
        if missing:
            logger.info(f"Registration failed | email: {data.get('email')} | error: Missing fields {missing}")
            return jsonify({'error': f'Missing required fields: {missing}'}), 400

        # Validate role
        if data['role'] not in ['student', 'teacher']:
            if data['role'] == 'admin':
                logger.info(f"Registration failed | email: {data.get('email')} | error: Admin registration disabled")
                return jsonify({'error': 'Admin registration is not allowed. Please contact system administrator.'}), 403
            
            logger.info(f"Registration failed | email: {data.get('email')} | error: Invalid role {data['role']}")
            return jsonify({'error': 'Invalid role. Must be student or teacher'}), 400

        # Check if user already exists
        existing_email = find_one(USERS, {'email': data['email']})
        if existing_email:
            logger.info(f"Registration failed | email: {data.get('email')} | error: Email already registered")
            return jsonify({'error': 'Email already registered'}), 409

        existing_username = find_one(USERS, {'username': data['username']})
        if existing_username:
            logger.info(f"Registration failed | username: {data.get('username')} | error: Username already taken")
            return jsonify({'error': 'Username already taken'}), 409

        # Hash password
        logger.info(f"Hashing password | email: {data.get('email')}")
        password_hash = bcrypt.hashpw(
            data['password'].encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        # Create user document
        user_id = str(ObjectId())
        user_doc = {
            '_id': user_id,
            'email': data['email'],
            'username': data['username'],
            'password_hash': password_hash,
            'role': data['role'],
            'created_at': datetime.utcnow()
        }

        logger.info(f"Creating user document | user_id: {user_id} | email: {data['email']} | role: {data['role']}")
        insert_one(USERS, user_doc)

        # Create role-specific profile
        if data['role'] == 'student':
            student_doc = {
                '_id': user_id,
                'user_id': user_id,
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'grade_level': data.get('grade_level', 8),
                'section': data.get('section', 'Section-A'),
                'enrollment_date': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
            logger.info(f"Creating student profile | user_id: {user_id} | grade_level: {student_doc['grade_level']}")
            insert_one(STUDENTS, student_doc)

        elif data['role'] == 'teacher':
            teacher_doc = {
                '_id': user_id,
                'user_id': user_id,
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'subject_area': data.get('subject_area', 'General'),
                'department': data.get('department', 'Education'),
                'created_at': datetime.utcnow()
            }
            logger.info(f"Creating teacher profile | user_id: {user_id} | subject: {teacher_doc['subject_area']}")
            insert_one(TEACHERS, teacher_doc)

        # Generate JWT token
        logger.info(f"Generating JWT token | user_id: {user_id}")
        token = generate_jwt_token(user_id, data['role'])

        logger.info(f"Registration successful | user_id: {user_id} | email: {data['email']} | role: {data['role']}")
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': {
                'user_id': user_id,
                'email': data['email'],
                'username': data['username'],
                'role': data['role']
            }
        }), 201

    except Exception as e:
        logger.info(f"Registration exception | email: {data.get('email') if data else 'unknown'} | error: {str(e)}")
        return jsonify({
            'error': 'Registration failed',
            'detail': str(e)
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and return JWT token
    """
    try:
        data = request.json
        logger.info(f"Login attempt | email: {data.get('email') if data else 'none'}")

        # Validate required fields
        if not data or 'email' not in data or 'password' not in data:
            logger.info(f"Login failed | error: Missing credentials")
            return jsonify({'error': 'Email and password required'}), 400

        # HARDCODED ADMIN CHECK (Bypass DB)
        if data['email'] == HARDCODED_ADMIN_EMAIL and data['password'] == HARDCODED_ADMIN_PASS:
             logger.info("Admin Login Bypass Triggered")
             token = generate_jwt_token(HARDCODED_ADMIN_ID, 'admin')
             return jsonify({
                'message': 'Login successful (Admin)',
                'token': token,
                'user': {
                    'user_id': HARDCODED_ADMIN_ID,
                    'email': HARDCODED_ADMIN_EMAIL,
                    'username': 'System Administrator',
                    'role': 'admin',
                    'profile': {'first_name': 'System', 'last_name': 'Admin'}
                }
            }), 200

        # Find user by email
        user = find_one(USERS, {'email': data['email']})
        if not user:
            logger.info(f"Login failed | email: {data['email']} | error: User not found")
            return jsonify({'error': 'Invalid email or password'}), 401

        # Verify password
        logger.info(f"Verifying password | email: {data['email']}")
        password_valid = bcrypt.checkpw(
            data['password'].encode('utf-8'),
            user['password_hash'].encode('utf-8')
        )

        if not password_valid:
            logger.info(f"Login failed | email: {data['email']} | error: Invalid password")
            return jsonify({'error': 'Invalid email or password'}), 401

        # Update last login
        logger.info(f"Updating last login | user_id: {user['_id']}")
        update_one(
            USERS,
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )

        # Generate JWT token
        logger.info(f"Generating JWT token | user_id: {user['_id']} | role: {user['role']}")
        token = generate_jwt_token(user['_id'], user['role'])

        # Get user profile
        profile = None
        if user['role'] == 'student':
            logger.info(f"Fetching student profile | user_id: {user['_id']}")
            profile = find_one(STUDENTS, {'user_id': user['_id']})
        elif user['role'] == 'teacher':
            logger.info(f"Fetching teacher profile | user_id: {user['_id']}")
            profile = find_one(TEACHERS, {'user_id': user['_id']})

        logger.info(f"Login successful | user_id: {user['_id']} | email: {data['email']} | role: {user['role']}")
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'user_id': user['_id'],
                'email': user['email'],
                'username': user['username'],
                'role': user['role'],
                'profile': {
                    'first_name': profile.get('first_name') if profile else None,
                    'last_name': profile.get('last_name') if profile else None
                }
            }
        }), 200

    except Exception as e:
        logger.info(f"Login exception | email: {data.get('email') if data else 'unknown'} | error: {str(e)}")
        return jsonify({
            'error': 'Login failed',
            'detail': str(e)
        }), 500


@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    """
    Verify JWT token validity
    """
    try:
        logger.info("Token verification attempt")
        token = extract_token_from_header()
        if not token:
            logger.info("Token verification failed | error: No token provided")
            return jsonify({'error': 'No token provided'}), 401

        logger.info("Decoding JWT token")
        payload = decode_jwt_token(token)
        if not payload:
            logger.info("Token verification failed | error: Invalid or expired token")
            return jsonify({'error': 'Invalid or expired token'}), 401

        # HARDCODED ADMIN CHECK
        if payload['user_id'] == HARDCODED_ADMIN_ID:
             logger.info("Token verified for Hardcoded Admin")
             return jsonify({
                'valid': True,
                'user': {
                    'user_id': HARDCODED_ADMIN_ID,
                    'role': 'admin'
                }
            }), 200

        # Check if user still exists
        logger.info(f"Verifying user existence | user_id: {payload['user_id']}")
        user = find_one(USERS, {'_id': payload['user_id']})
        if not user:
            logger.info(f"Token verification failed | user_id: {payload['user_id']} | error: User not found")
            return jsonify({'error': 'User not found'}), 404

        logger.info(f"Token verification successful | user_id: {payload['user_id']} | role: {payload['role']}")
        return jsonify({
            'valid': True,
            'user': {
                'user_id': payload['user_id'],
                'role': payload['role']
            }
        }), 200

    except Exception as e:
        logger.info(f"Token verification exception | error: {str(e)}")
        return jsonify({
            'error': 'Token verification failed',
            'detail': str(e)
        }), 500


@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """
    Change user password
    """
    try:
        logger.info("Password change attempt")
        token = extract_token_from_header()
        if not token:
            logger.info("Password change failed | error: No authentication token")
            return jsonify({'error': 'Authentication required'}), 401

        payload = decode_jwt_token(token)
        if not payload:
            logger.info("Password change failed | error: Invalid token")
            return jsonify({'error': 'Invalid token'}), 401
            
        # Prevent change for hardcoded admin
        if payload['user_id'] == HARDCODED_ADMIN_ID:
             return jsonify({'error': 'Cannot change password for system administrator'}), 403

        logger.info(f"Password change request | user_id: {payload['user_id']}")
        data = request.json
        if not data or 'old_password' not in data or 'new_password' not in data:
            logger.info(f"Password change failed | user_id: {payload['user_id']} | error: Missing passwords")
            return jsonify({'error': 'Old password and new password required'}), 400

        # Validate new password length
        if len(data['new_password']) < 6:
            logger.info(f"Password change failed | user_id: {payload['user_id']} | error: Password too short")
            return jsonify({'error': 'New password must be at least 6 characters'}), 400

        # Get user
        logger.info(f"Fetching user | user_id: {payload['user_id']}")
        user = find_one(USERS, {'_id': payload['user_id']})
        if not user:
            logger.info(f"Password change failed | user_id: {payload['user_id']} | error: User not found")
            return jsonify({'error': 'User not found'}), 404

        # Verify old password
        logger.info(f"Verifying old password | user_id: {payload['user_id']}")
        password_valid = bcrypt.checkpw(
            data['old_password'].encode('utf-8'),
            user['password_hash'].encode('utf-8')
        )

        if not password_valid:
            logger.info(f"Password change failed | user_id: {payload['user_id']} | error: Incorrect old password")
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Hash new password
        logger.info(f"Hashing new password | user_id: {payload['user_id']}")
        new_password_hash = bcrypt.hashpw(
            data['new_password'].encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        # Update password
        logger.info(f"Updating password in database | user_id: {payload['user_id']}")
        update_one(
            USERS,
            {'_id': payload['user_id']},
            {'$set': {'password_hash': new_password_hash, 'password_changed_at': datetime.utcnow()}}
        )

        logger.info(f"Password changed successfully | user_id: {payload['user_id']}")
        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        logger.info(f"Password change exception | user_id: {payload.get('user_id') if 'payload' in locals() else 'unknown'} | error: {str(e)}")
        return jsonify({
            'error': 'Password change failed',
            'detail': str(e)
        }), 500


@auth_bp.route('/profile', methods=['PATCH'])
@require_auth()
def update_profile():
    """
    Update user profile (e.g., student's parent email)
    """
    try:
        user_id = request.user_id
        role = request.user_role
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        logger.info(f"Updating profile | user_id: {user_id} | role: {role}")
        
        # Only allow specific fields for now
        allowed_student_fields = ['parent_email', 'first_name', 'last_name']
        allowed_teacher_fields = ['first_name', 'last_name', 'subject_area']
        
        if role == 'student':
            update_data = {k: v for k, v in data.items() if k in allowed_student_fields}
            if update_data:
                update_one(STUDENTS, {'user_id': user_id}, {'$set': update_data})
        elif role == 'teacher':
            update_data = {k: v for k, v in data.items() if k in allowed_teacher_fields}
            if update_data:
                update_one(TEACHERS, {'user_id': user_id}, {'$set': update_data})
                
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        logger.error(f"Profile update failed: {str(e)}")
        return jsonify({'error': 'Update failed', 'detail': str(e)}), 500
