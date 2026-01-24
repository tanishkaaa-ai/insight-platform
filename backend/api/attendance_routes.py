"""
AMEP Attendance Routes
Simple IP-based attendance with geolocation and photo capture

Location: backend/api/attendance_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
from math import radians, sin, cos, sqrt, atan2

from models.database import (
    db,
    USERS,
    STUDENTS,
    ATTENDANCE_SESSIONS,
    ATTENDANCE_RECORDS,
    CLASSROOMS
)
from utils.logger import get_logger

attendance_bp = Blueprint('attendance', __name__)
logger = get_logger(__name__)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_student_or_create_stub(student_id):
    """
    Robustly find a student profile, or create a stub if User exists but Student profile is missing.
    Returns (student_dict, error_response_tuple)
    If student found/created: returns (student, None)
    If error: returns (None, (jsonify(...), status_code))
    """
    if not student_id:
        return None, (jsonify({'error': 'User ID required'}), 401)

    # 1. Try finding student by _id (which should be user_id)
    student = db[STUDENTS].find_one({'_id': student_id})
    
    # 2. Key fallbacks
    if not student:
        student = db[STUDENTS].find_one({'user_id': student_id})
    
    if not student and len(student_id) == 24:
        try:
             student = db[STUDENTS].find_one({'_id': ObjectId(student_id)})
        except:
             pass
             
    if not student and len(student_id) == 24:
        try:
             student = db[STUDENTS].find_one({'user_id': ObjectId(student_id)})
        except:
             pass

    # 3. If found, return
    if student:
        return student, None
        
    # 4. REPAIR: Check if User exists
    user = db[USERS].find_one({'_id': student_id})
    # Try ObjectId for user too
    if not user and len(student_id) == 24:
        try:
            user = db[USERS].find_one({'_id': ObjectId(student_id)})
        except:
             pass
             
    if user:
        # User exists but Student profile missing. Create stub!
        logger.warning(f"Repairing missing student profile for User: {student_id}")
        new_student = {
            '_id': str(user['_id']),
            'user_id': str(user['_id']),
            'first_name': user.get('username', 'Student'),
            'last_name': '(Repaired)',
            'grade_level': 1,
            'section': 'General',
            'created_at': datetime.utcnow(),
            'registered_ip': None 
        }
        try:
            db[STUDENTS].insert_one(new_student)
            return new_student, None
        except Exception as e:
            logger.error(f"Failed to repair student profile: {e}")
            
    return None, (jsonify({'error': 'Student profile not found. Please contact admin.'}), 404)


def get_current_user_id():
    """Get current user ID from JWT token (simplified)"""
    # TODO: Implement proper JWT validation
    # For now, get from request headers
    return request.headers.get('X-User-Id') or request.args.get('user_id')

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in meters
    """
    R = 6371000  # Earth radius in meters

    phi1 = radians(lat1)
    phi2 = radians(lat2)
    dphi = radians(lat2 - lat1)
    dlam = radians(lon2 - lon1)

    a = sin(dphi/2)**2 + cos(phi1) * cos(phi2) * sin(dlam/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return R * c

# ============================================================================
# STUDENT ENDPOINTS
# ============================================================================

@attendance_bp.route('/student/status', methods=['GET'])
def get_student_status():
    """
    Get student's attendance capability status

    Request: GET /api/attendance/student/status
    Headers: X-User-Id: <student_id>

    Response:
    {
        "is_registered": true,
        "registered_ip": "192.168.1.1"
    }
    """
    try:
        student_id = get_current_user_id()
        if not student_id:
            return jsonify({'error': 'User ID required'}), 401
            
        student, error_resp = get_student_or_create_stub(student_id)
        if error_resp:
            return error_resp

        registered_ip = student.get('registered_ip')

        return jsonify({
            'is_registered': bool(registered_ip),
            'registered_ip': registered_ip
        }), 200

    except Exception as e:
        logger.error(f"Error getting status | Error: {str(e)}")
        return jsonify({'error': 'Failed to get status'}), 500


@attendance_bp.route('/bind-ip', methods=['POST'])
def bind_ip():
    """
    Bind student's current IP address to their profile

    Request: POST /api/attendance/bind-ip
    Headers: X-User-Id: <student_id>

    Response:
    {
        "message": "IP registered successfully",
        "registered_ip": "192.168.1.1"
    }
    """
    try:
        student_id = get_current_user_id()
        student, error_resp = get_student_or_create_stub(student_id)
        if error_resp:
            return error_resp

        # Get IP address from request
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ',' in ip_address:
            ip_address = ip_address.split(',')[0].strip()

        logger.info(f"Binding IP | Student: {student_id} | IP: {ip_address}")

        # Update student record (using the ID we found/created)
        student_oid = student['_id']
        result = db[STUDENTS].update_one(
            {'_id': student_oid},
            {'$set': {'registered_ip': ip_address, 'ip_registered_at': datetime.utcnow()}}
        )

        if result.matched_count == 0:
            # Should not happen since we just found/created it, but safe fallback
            logger.warning(f"Student update failed | ID: {student_oid}")
            return jsonify({'error': 'Student update failed'}), 500

        logger.info(f"IP bound successfully | Student: {student_id}")
        return jsonify({
            'message': 'IP registered successfully',
            'registered_ip': ip_address
        }), 200

    except Exception as e:
        logger.error(f"Error binding IP | Error: {str(e)}")
        return jsonify({'error': 'Failed to bind IP'}), 500


@attendance_bp.route('/check-session/<classroom_id>', methods=['GET'])
def check_session(classroom_id):
    """
    Check if student can mark attendance for a classroom

    Request: GET /api/attendance/check-session/<classroom_id>
    Headers: X-User-Id: <student_id>

    Response:
    {
        "session": {
            "_id": "session_id",
            "closes_at": "2024-01-24T10:15:00Z"
        },
        "can_mark": true,
        "registered_ip": "192.168.1.1",
        "current_ip": "192.168.1.1",
        "reason": null
    }
    """
    try:
        student_id = get_current_user_id()
        if not student_id:
            return jsonify({'error': 'User ID required'}), 401

        student_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ',' in student_ip:
            student_ip = student_ip.split(',')[0].strip()

        logger.info(f"Checking session | Input: {classroom_id} | Student User: {student_id}")

        # 1. Resolve Classroom (Handle Join Code vs ID)
        real_classroom_id = classroom_id
        if len(classroom_id) < 10: # Assuming join codes are short
            classroom = db[CLASSROOMS].find_one({'join_code': classroom_id})
            if classroom:
                real_classroom_id = str(classroom['_id'])
                logger.info(f"Resolved join code {classroom_id} to {real_classroom_id}")
            else:
                # If valid join code not found, returns session none 
                logger.warning(f"Join code not found: {classroom_id}")
                return jsonify({
                    'session': None,
                    'can_mark': False,
                    'reason': f'Invalid class code: {classroom_id}'
                }), 200

        # Find active session
        session = db[ATTENDANCE_SESSIONS].find_one({
            'classroom_id': real_classroom_id,
            'is_open': True,
            'closes_at': {'$gt': datetime.utcnow()}
        })

        if not session:
            logger.info(f"No active session | Classroom: {real_classroom_id}")
            return jsonify({
                'session': None,
                'can_mark': False,
                'reason': 'No active attendance session'
            }), 200

        # Resolve Student (Robust Lookup + Repair)
        student, error_resp = get_student_or_create_stub(student_id)
        if error_resp:
            # Check if it was 404
            if error_resp[1] == 404:
                 logger.warning(f"Student not found for ID: {student_id}")
            return error_resp
            
        actual_student_id = str(student['_id'])

        # Check if already marked
        already_marked = db[ATTENDANCE_RECORDS].find_one({
            'session_id': session['_id'],
            'student_id': actual_student_id
        })

        registered_ip = student.get('registered_ip')

        # Check IP match
        ip_valid = (registered_ip == student_ip)

        if not ip_valid:
            logger.info(f"IP mismatch | Student: {student_id} | Registered: {registered_ip} | Current: {student_ip}")

        return jsonify({
            'session': {
                '_id': str(session['_id']),
                'closes_at': session['closes_at'].isoformat(),
                'radius_meters': session['radius_meters']
            },
            'can_mark': ip_valid and not already_marked,
            'registered_ip': registered_ip,
            'current_ip': student_ip,
            'reason': None if (ip_valid and not already_marked) else ('Attendance already marked' if already_marked else 'IP address mismatch')
        }), 200
    except Exception as e:
        logger.error(f"Error checking session | Error: {str(e)}")
        return jsonify({'error': 'Failed to check session'}), 500


@attendance_bp.route('/mark', methods=['POST'])
def mark_attendance():
    """
    Mark attendance with photo and validation

    Request: POST /api/attendance/mark
    Headers: X-User-Id: <student_id>
    Body:
    {
        "session_id": "session_id",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "photo": "data:image/jpeg;base64,..."
    }

    Response:
    {
        "message": "Attendance marked successfully",
        "record_id": "record_id"
    }
    """
    try:
        data = request.json
        student_id = get_current_user_id()

        if not student_id:
            return jsonify({'error': 'User ID required'}), 401

        student_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ',' in student_ip:
            student_ip = student_ip.split(',')[0].strip()

        logger.info(f"Marking attendance | Student: {student_id} | Session: {data.get('session_id')}")

        # Validate required fields
        required = ['session_id', 'latitude', 'longitude', 'photo']
        missing = [field for field in required if field not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {missing}'}), 400

        # Get session
        session = db[ATTENDANCE_SESSIONS].find_one({
            '_id': ObjectId(data['session_id']),
            'is_open': True,
            'closes_at': {'$gt': datetime.utcnow()}
        })

        if not session:
            logger.warning(f"Session not open | Session: {data['session_id']}")
            return jsonify({'error': 'Attendance session is not open or has expired'}), 403

        # Get student
        student, error_resp = get_student_or_create_stub(student_id)
        if error_resp:
            return error_resp

        # VALIDATION 1: IP Match
        registered_ip = student.get('registered_ip')
        if registered_ip != student_ip:
            logger.warning(f"IP mismatch | Student: {student_id} | Registered: {registered_ip} | Current: {student_ip}")
            return jsonify({'error': 'IP address mismatch - please use your registered device'}), 403

        # VALIDATION 2: Location within radius
        distance = calculate_distance(
            data['latitude'], data['longitude'],
            session['center_lat'], session['center_lon']
        )

        if distance > session['radius_meters']:
            logger.warning(f"Location out of range | Student: {student_id} | Distance: {distance}m | Allowed: {session['radius_meters']}m")
            return jsonify({
                'error': f'You are too far from the classroom ({int(distance)}m away). Please move closer.'
            }), 403

        # VALIDATION 3: Not already marked
        existing = db[ATTENDANCE_RECORDS].find_one({
            'session_id': session['_id'],
            'student_id': student_id
        })

        if existing:
            logger.warning(f"Already marked | Student: {student_id} | Session: {session['_id']}")
            return jsonify({'error': 'Attendance already marked for this session'}), 409

        # All validations passed - create attendance record
        record = {
            "session_id": session['_id'],
            "student_id": student_id,
            "student_name": f"{student.get('first_name', '')} {student.get('last_name', '')}".strip(),
            "marked_at": datetime.utcnow(),
            "student_ip": student_ip,
            "registered_ip": registered_ip,
            "student_lat": data['latitude'],
            "student_lon": data['longitude'],
            "distance_meters": round(distance, 2),
            "photo_base64": data['photo'],
            "status": "present"
        }

        result = db[ATTENDANCE_RECORDS].insert_one(record)
        logger.info(f"Attendance marked | Student: {student_id} | Record: {result.inserted_id}")

        return jsonify({
            'message': 'Attendance marked successfully',
            'record_id': str(result.inserted_id),
            'distance_meters': round(distance, 2)
        }), 201

    except Exception as e:
        logger.error(f"Error marking attendance | Error: {str(e)}")
        return jsonify({'error': 'Failed to mark attendance'}), 500


# ============================================================================
# TEACHER ENDPOINTS
# ============================================================================

@attendance_bp.route('/sessions/open', methods=['POST'])
def open_session():
    """
    Teacher opens an attendance session

    Request: POST /api/attendance/sessions/open
    Headers: X-User-Id: <teacher_id>
    Body:
    {
        "classroom_id": "classroom_id",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "radius": 100,
        "duration": 15
    }

    Response:
    {
        "message": "Attendance session opened",
        "session_id": "session_id",
        "closes_at": "2024-01-24T10:15:00Z"
    }
    """
    try:
        data = request.json
        teacher_id = get_current_user_id()

        if not teacher_id:
            return jsonify({'error': 'User ID required'}), 401

        logger.info(f"Opening attendance session | Teacher: {teacher_id} | Classroom: {data.get('classroom_id')}")

        # Validate required fields
        required = ['classroom_id', 'latitude', 'longitude']
        missing = [field for field in required if field not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {missing}'}), 400

        # Close any existing open sessions for this classroom
        db[ATTENDANCE_SESSIONS].update_many(
            {
                'classroom_id': data['classroom_id'],
                'is_open': True
            },
            {'$set': {'is_open': False}}
        )

        # Create new session
        duration_minutes = data.get('duration', 15)
        closes_at = datetime.utcnow() + timedelta(minutes=duration_minutes)

        session = {
            "classroom_id": data['classroom_id'],
            "teacher_id": teacher_id,
            "date": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
            "is_open": True,
            "center_lat": data['latitude'],
            "center_lon": data['longitude'],
            "radius_meters": data.get('radius', 100),
            "opened_at": datetime.utcnow(),
            "closes_at": closes_at
        }

        result = db[ATTENDANCE_SESSIONS].insert_one(session)
        logger.info(f"Session opened | ID: {result.inserted_id} | Closes at: {closes_at}")

        return jsonify({
            'message': 'Attendance session opened successfully',
            'session_id': str(result.inserted_id),
            'closes_at': closes_at.isoformat()
        }), 201

    except Exception as e:
        logger.error(f"Error opening session | Error: {str(e)}")
        return jsonify({'error': 'Failed to open attendance session'}), 500


@attendance_bp.route('/sessions/<session_id>/close', methods=['POST'])
def close_session(session_id):
    """
    Teacher closes an attendance session

    Request: POST /api/attendance/sessions/<session_id>/close
    Headers: X-User-Id: <teacher_id>

    Response:
    {
        "message": "Attendance session closed",
        "total_marked": 25
    }
    """
    try:
        teacher_id = get_current_user_id()

        if not teacher_id:
            return jsonify({'error': 'User ID required'}), 401

        logger.info(f"Closing attendance session | Teacher: {teacher_id} | Session: {session_id}")

        # Update session
        result = db[ATTENDANCE_SESSIONS].update_one(
            {'_id': ObjectId(session_id), 'teacher_id': teacher_id},
            {'$set': {'is_open': False, 'closed_at': datetime.utcnow()}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Session not found or unauthorized'}), 404

        # Count attendance records
        total_marked = db[ATTENDANCE_RECORDS].count_documents({
            'session_id': ObjectId(session_id)
        })

        logger.info(f"Session closed | ID: {session_id} | Total marked: {total_marked}")

        return jsonify({
            'message': 'Attendance session closed',
            'total_marked': total_marked
        }), 200

    except Exception as e:
        logger.error(f"Error closing session | Error: {str(e)}")
        return jsonify({'error': 'Failed to close session'}), 500


@attendance_bp.route('/sessions/<session_id>/records', methods=['GET'])
def get_session_records(session_id):
    """
    Get all attendance records for a session

    Request: GET /api/attendance/sessions/<session_id>/records
    Headers: X-User-Id: <teacher_id>

    Response:
    [
        {
            "_id": "record_id",
            "student_id": "student_id",
            "student_name": "John Doe",
            "marked_at": "2024-01-24T09:05:00Z",
            "distance_meters": 45.5,
            "photo_base64": "data:image/jpeg;base64,...",
            "status": "present"
        }
    ]
    """
    try:
        teacher_id = get_current_user_id()

        if not teacher_id:
            return jsonify({'error': 'User ID required'}), 401

        logger.info(f"Getting attendance records | Teacher: {teacher_id} | Session: {session_id}")

        # Verify teacher owns this session
        session = db[ATTENDANCE_SESSIONS].find_one({
            '_id': ObjectId(session_id),
            'teacher_id': teacher_id
        })

        if not session:
            return jsonify({'error': 'Session not found or unauthorized'}), 404

        # Get all records
        records = list(db[ATTENDANCE_RECORDS].find({
            'session_id': ObjectId(session_id)
        }).sort('marked_at', 1))

        # Convert ObjectIds to strings
        for record in records:
            record['_id'] = str(record['_id'])
            record['session_id'] = str(record['session_id'])
            record['marked_at'] = record['marked_at'].isoformat()

        logger.info(f"Retrieved {len(records)} attendance records | Session: {session_id}")

        return jsonify(records), 200

    except Exception as e:
        logger.error(f"Error getting records | Error: {str(e)}")
        return jsonify({'error': 'Failed to get attendance records'}), 500


@attendance_bp.route('/classrooms/<classroom_id>/sessions', methods=['GET'])
def get_classroom_sessions(classroom_id):
    """
    Get all attendance sessions for a classroom

    Request: GET /api/attendance/classrooms/<classroom_id>/sessions
    Headers: X-User-Id: <teacher_id>
    Query params: ?limit=10

    Response:
    [
        {
            "_id": "session_id",
            "date": "2024-01-24",
            "is_open": true,
            "opened_at": "2024-01-24T09:00:00Z",
            "closes_at": "2024-01-24T09:15:00Z",
            "total_marked": 25
        }
    ]
    """
    try:
        teacher_id = get_current_user_id()

        if not teacher_id:
            return jsonify({'error': 'User ID required'}), 401

        limit = int(request.args.get('limit', 10))

        logger.info(f"Getting classroom sessions | Teacher: {teacher_id} | Classroom: {classroom_id}")

        # Get sessions
        sessions = list(db[ATTENDANCE_SESSIONS].find({
            'classroom_id': classroom_id,
            'teacher_id': teacher_id
        }).sort('opened_at', -1).limit(limit))

        # Add count of marked students
        for session in sessions:
            session['_id'] = str(session['_id'])
            session['date'] = session['date'].isoformat() if hasattr(session['date'], 'isoformat') else str(session['date'])
            session['opened_at'] = session['opened_at'].isoformat()
            session['closes_at'] = session['closes_at'].isoformat()

            # Count attendance
            session['total_marked'] = db[ATTENDANCE_RECORDS].count_documents({
                'session_id': ObjectId(session['_id'])
            })

        logger.info(f"Retrieved {len(sessions)} sessions | Classroom: {classroom_id}")

        return jsonify(sessions), 200

    except Exception as e:
        logger.error(f"Error getting sessions | Error: {str(e)}")
        return jsonify({'error': 'Failed to get sessions'}), 500
