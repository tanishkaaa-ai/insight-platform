"""
AMEP Classroom Routes - Google Classroom-like functionality
Handles classroom creation, management, posts, assignments, and submissions

Location: backend/api/classroom_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
import random
import string
import jwt
import os

# Import MongoDB helper functions
from models.database import (
    db,
    find_one,
    find_many,
    insert_one,
    update_one,
    delete_one,
    aggregate,
    count_documents
)

# Import logging
from utils.logger import get_logger

classroom_bp = Blueprint('classroom', __name__)
logger = get_logger(__name__)

# Collection names
CLASSROOMS = 'classrooms'
CLASSROOM_MEMBERSHIPS = 'classroom_memberships'
CLASSROOM_POSTS = 'classroom_posts'
CLASSROOM_COMMENTS = 'classroom_comments'
CLASSROOM_SUBMISSIONS = 'classroom_submissions'
CLASSROOM_NOTIFICATIONS = 'classroom_notifications'
USERS = 'users'
STUDENTS = 'students'
TEACHERS = 'teachers'

# JWT Configuration (duplicated from auth_routes to avoid circular imports)
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
JWT_ALGORITHM = 'HS256'


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_join_code():
    """Generate a unique 6-character alphanumeric join code"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        # Check if code already exists
        existing = find_one(CLASSROOMS, {'join_code': code})
        if not existing:
            return code


def create_notification(user_id, classroom_id, notification_type, title, message, link=None):
    """Helper to create classroom notifications"""
    notification_doc = {
        '_id': str(ObjectId()),
        'user_id': user_id,
        'classroom_id': classroom_id,
        'notification_type': notification_type,
        'title': title,
        'message': message,
        'link': link,
        'is_read': False,
        'created_at': datetime.utcnow(),
        'read_at': None
    }
    insert_one(CLASSROOM_NOTIFICATIONS, notification_doc)
    logger.info(f"Notification created | user_id: {user_id} | type: {notification_type}")


def get_current_user_id():
    """Extract user_id from Authorization header if present"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None, None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None, None

    token = parts[1]
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get('user_id'), payload.get('role')
    except:
        return None, None


# ============================================================================
# CLASSROOM MANAGEMENT ROUTES
# ============================================================================

@classroom_bp.route('/classrooms', methods=['POST'])
def create_classroom():
    """
    Create a new classroom

    Request body:
    {
        "teacher_id": "teacher_user_id",
        "class_name": "Math 101",
        "section": "Section A",
        "subject": "Mathematics",
        "room": "Room 204",
        "description": "Advanced mathematics course",
        "grade_level": 10,
        "theme_color": "#4285f4"
    }
    """
    try:
        data = request.json
        logger.info(f"Classroom creation request | teacher_id: {data.get('teacher_id')} | name: {data.get('class_name')}")

        # Validate required fields
        if not data.get('teacher_id') or not data.get('class_name'):
            logger.info("Classroom creation failed | error: Missing required fields")
            return jsonify({'error': 'teacher_id and class_name are required'}), 400

        # Verify teacher exists
        teacher = find_one(TEACHERS, {'_id': data['teacher_id']})
        if not teacher:
            logger.info(f"Classroom creation failed | teacher_id: {data.get('teacher_id')} | error: Teacher not found")
            return jsonify({'error': 'Teacher not found'}), 404

        # Generate unique join code
        join_code = generate_join_code()
        logger.info(f"Generated join code | code: {join_code}")

        classroom_doc = {
            '_id': str(ObjectId()),
            'teacher_id': data['teacher_id'],
            'class_name': data['class_name'],
            'section': data.get('section', ''),
            'subject': data.get('subject', ''),
            'room': data.get('room', ''),
            'description': data.get('description', ''),
            'join_code': join_code,
            'is_active': True,
            'theme_color': data.get('theme_color', '#4285f4'),
            'grade_level': data.get('grade_level'),
            'max_students': data.get('max_students', 100),
            'schedule': data.get('schedule', {'days': [], 'time': ''}),
            'settings': {
                'allow_student_posts': data.get('allow_student_posts', True),
                'allow_student_comments': data.get('allow_student_comments', True),
                'show_class_code': data.get('show_class_code', True),
                'enable_notifications': data.get('enable_notifications', True)
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'archived_at': None
        }

        classroom_id = insert_one(CLASSROOMS, classroom_doc)
        logger.info(f"Classroom created | classroom_id: {classroom_id} | join_code: {join_code}")

        return jsonify({
            'classroom_id': classroom_id,
            'join_code': join_code,
            'message': 'Classroom created successfully'
        }), 201

    except Exception as e:
        logger.info(f"Classroom creation exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/classrooms/<classroom_id>', methods=['GET'])
def get_classroom_details(classroom_id):
    """Get detailed classroom information"""
    try:
        logger.info(f"Classroom details request | classroom_id: {classroom_id}")

        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            logger.info(f"Classroom not found | classroom_id: {classroom_id}")
            return jsonify({'error': 'Classroom not found'}), 404

        teacher = find_one(TEACHERS, {'_id': classroom['teacher_id']})
        student_count = count_documents(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom_id, 'is_active': True, 'role': 'student'}
        )
        post_count = count_documents(CLASSROOM_POSTS, {'classroom_id': classroom_id})

        logger.info(f"Classroom details retrieved | classroom_id: {classroom_id} | students: {student_count}")

        return jsonify({
            'classroom_id': classroom_id,
            'class_name': classroom.get('class_name'),
            'section': classroom.get('section'),
            'subject': classroom.get('subject'),
            'room': classroom.get('room'),
            'subject': classroom.get('subject'),
            'room': classroom.get('room'),
            'schedule': classroom.get('schedule'),
            'description': classroom.get('description'),
            'join_code': classroom.get('join_code') if classroom.get('settings', {}).get('show_class_code', True) else None,
            'is_active': classroom.get('is_active'),
            'theme_color': classroom.get('theme_color'),
            'grade_level': classroom.get('grade_level'),
            'teacher': {
                'teacher_id': teacher.get('_id') if teacher else None,
                'name': f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}" if teacher else 'Unknown',
                'subject_area': teacher.get('subject_area') if teacher else None
            },
            'student_count': student_count,
            'post_count': post_count,
            'settings': classroom.get('settings', {}),
            'created_at': classroom.get('created_at').isoformat() if classroom.get('created_at') else None
        }), 200

    except Exception as e:
        logger.info(f"Get classroom exception | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/classrooms/<classroom_id>', methods=['PUT'])
def update_classroom(classroom_id):
    try:
        data = request.json
        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404

        update_data = {}
        if 'class_name' in data:
            update_data['class_name'] = data['class_name']
        if 'section' in data:
            update_data['section'] = data['section']
        if 'subject' in data:
            update_data['subject'] = data['subject']
        if 'room' in data:
            update_data['room'] = data['room']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'theme_color' in data:
            update_data['theme_color'] = data['theme_color']
        if 'grade_level' in data:
            update_data['grade_level'] = data['grade_level']
        if 'schedule' in data:
            update_data['schedule'] = data['schedule']

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            update_one(CLASSROOMS, {'_id': classroom_id}, {'$set': update_data})
            return jsonify({'message': 'Classroom updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/classrooms/<classroom_id>', methods=['DELETE'])
def delete_classroom(classroom_id):
    try:
        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404

        update_one(CLASSROOMS, {'_id': classroom_id}, {'$set': {'is_active': False, 'archived_at': datetime.utcnow()}})
        return jsonify({'message': 'Classroom archived successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/classrooms/<classroom_id>/students/<student_id>', methods=['DELETE'])
def remove_student_from_classroom(classroom_id, student_id):
    try:
        result = update_one(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom_id, 'student_id': student_id},
            {'$set': {'is_active': False, 'left_at': datetime.utcnow()}}
        )
        if result:
            return jsonify({'message': 'Student removed from classroom'}), 200
        return jsonify({'error': 'Membership not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/classrooms/join', methods=['POST'])
def join_classroom():
    """
    Student joins classroom using join code

    Request body:
    {
        "student_id": "student_user_id",
        "join_code": "ABC123"
    }
    """
    try:
        data = request.json
        logger.info(f"Classroom join request | student_id: {data.get('student_id')} | code: {data.get('join_code')}")

        if not data.get('student_id') or not data.get('join_code'):
            logger.info("Join failed | error: Missing required fields")
            return jsonify({'error': 'student_id and join_code are required'}), 400

        # Find classroom by join code
        classroom = find_one(CLASSROOMS, {'join_code': data['join_code'].upper(), 'is_active': True})
        if not classroom:
            logger.info(f"Join failed | code: {data.get('join_code')} | error: Invalid or inactive classroom")
            return jsonify({'error': 'Invalid or inactive join code'}), 404

        # Verify student exists
        student = find_one(STUDENTS, {'_id': data['student_id']})
        if not student:
            logger.info(f"Join failed | student_id: {data.get('student_id')} | error: Student not found")
            return jsonify({'error': 'Student not found'}), 404

        # Check if already a member
        existing = find_one(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom['_id'], 'student_id': data['student_id']}
        )

        if existing and existing.get('is_active'):
            logger.info(f"Join failed | student_id: {data.get('student_id')} | error: Already a member")
            return jsonify({'error': 'Already a member of this classroom'}), 400

        # Check max students limit
        current_count = count_documents(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom['_id'], 'is_active': True}
        )
        if current_count >= classroom.get('max_students', 100):
            logger.info(f"Join failed | classroom_id: {classroom['_id']} | error: Classroom full")
            return jsonify({'error': 'Classroom is full'}), 400

        # Create or reactivate membership
        if existing:
            update_one(
                CLASSROOM_MEMBERSHIPS,
                {'_id': existing['_id']},
                {'$set': {'is_active': True, 'joined_at': datetime.utcnow(), 'left_at': None}}
            )
            membership_id = existing['_id']
        else:
            membership_doc = {
                '_id': str(ObjectId()),
                'classroom_id': classroom['_id'],
                'student_id': data['student_id'],
                'role': 'student',
                'is_active': True,
                'joined_at': datetime.utcnow(),
                'left_at': None,
                'muted': False
            }
            membership_id = insert_one(CLASSROOM_MEMBERSHIPS, membership_doc)

        # Create notification for teacher
        create_notification(
            user_id=classroom['teacher_id'],
            classroom_id=classroom['_id'],
            notification_type='student_joined',
            title='New Student Joined',
            message=f"{student.get('first_name', '')} {student.get('last_name', '')} joined {classroom['class_name']}",
            link=f"/classroom/{classroom['_id']}/people"
        )

        logger.info(f"Student joined classroom | student_id: {data['student_id']} | classroom_id: {classroom['_id']}")

        return jsonify({
            'membership_id': membership_id,
            'classroom_id': classroom['_id'],
            'class_name': classroom['class_name'],
            'message': 'Successfully joined classroom'
        }), 201

    except Exception as e:
        logger.info(f"Join classroom exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/teacher/<teacher_id>/classrooms', methods=['GET'])
def get_teacher_classrooms(teacher_id):
    """Get all classrooms for a teacher"""
    try:
        logger.info(f"Teacher classrooms request | teacher_id: {teacher_id}")

        query = {'teacher_id': teacher_id}
        if request.args.get('active_only') == 'true':
            query['is_active'] = True

        classrooms = find_many(CLASSROOMS, query, sort=[('created_at', -1)])

        formatted_classrooms = []
        for classroom in classrooms:
            student_count = count_documents(
                CLASSROOM_MEMBERSHIPS,
                {'classroom_id': classroom['_id'], 'is_active': True}
            )

            formatted_classrooms.append({
                'classroom_id': classroom['_id'],
                'class_name': classroom.get('class_name'),
                'section': classroom.get('section'),
                'subject': classroom.get('subject'),
                'section': classroom.get('section'),
                'subject': classroom.get('subject'),
                'schedule': classroom.get('schedule'),
                'join_code': classroom.get('join_code'),
                'student_count': student_count,
                'is_active': classroom.get('is_active'),
                'theme_color': classroom.get('theme_color'),
                'created_at': classroom.get('created_at').isoformat() if classroom.get('created_at') else None
            })

        logger.info(f"Teacher classrooms retrieved | teacher_id: {teacher_id} | count: {len(formatted_classrooms)}")
        return jsonify(formatted_classrooms), 200

    except Exception as e:
        logger.info(f"Get teacher classrooms exception | teacher_id: {teacher_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/classrooms/student/<student_id>', methods=['GET'])
def get_student_classrooms(student_id):
    """Get all classrooms a student is enrolled in"""
    try:
        logger.info(f"Student classrooms request | student_id: {student_id}")

        # Get active memberships
        memberships = find_many(
            CLASSROOM_MEMBERSHIPS,
            {'student_id': student_id, 'is_active': True},
            sort=[('joined_at', -1)]
        )

        formatted_classrooms = []
        for membership in memberships:
            classroom = find_one(CLASSROOMS, {'_id': membership['classroom_id']})
            if classroom:
                teacher = find_one(TEACHERS, {'_id': classroom['teacher_id']})

                formatted_classrooms.append({
                    'classroom_id': classroom['_id'],
                    'class_name': classroom.get('class_name'),
                    'section': classroom.get('section'),
                    'section': classroom.get('section'),
                    'subject': classroom.get('subject'),
                    'room': classroom.get('room'),
                    'schedule': classroom.get('schedule'),
                    'teacher_name': f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}" if teacher else 'Unknown',
                    'theme_color': classroom.get('theme_color'),
                    'joined_at': membership.get('joined_at').isoformat() if membership.get('joined_at') else None
                })

        logger.info(f"Student classrooms retrieved | student_id: {student_id} | count: {len(formatted_classrooms)}")
        return jsonify(formatted_classrooms), 200

    except Exception as e:
        logger.info(f"Get student classrooms exception | student_id: {student_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/classrooms/<classroom_id>/students', methods=['GET'])
def get_classroom_students(classroom_id):
    """Get all students in a classroom"""
    try:
        logger.info(f"Classroom students request | classroom_id: {classroom_id}")

        memberships = find_many(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom_id, 'is_active': True, 'role': 'student'},
            sort=[('joined_at', 1)]
        )

        formatted_students = []
        for membership in memberships:
            student = find_one(STUDENTS, {'_id': membership['student_id']})
            if student:
                formatted_students.append({
                    'student_id': student['_id'],
                    'name': f"{student.get('first_name', '')} {student.get('last_name', '')}",
                    'grade_level': student.get('grade_level'),
                    'joined_at': membership.get('joined_at').isoformat() if membership.get('joined_at') else None
                })

        logger.info(f"Classroom students retrieved | classroom_id: {classroom_id} | count: {len(formatted_students)}")
        return jsonify(formatted_students), 200

    except Exception as e:
        logger.info(f"Get classroom students exception | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/classrooms/<classroom_id>/leave', methods=['POST'])
def leave_classroom(classroom_id):
    """
    Student leaves a classroom

    Request body:
    {
        "student_id": "student_user_id"
    }
    """
    try:
        data = request.json
        logger.info(f"Leave classroom request | classroom_id: {classroom_id} | student_id: {data.get('student_id')}")

        if not data.get('student_id'):
            return jsonify({'error': 'student_id is required'}), 400

        result = update_one(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom_id, 'student_id': data['student_id']},
            {'$set': {'is_active': False, 'left_at': datetime.utcnow()}}
        )

        if result:
            logger.info(f"Student left classroom | classroom_id: {classroom_id} | student_id: {data['student_id']}")
            return jsonify({'message': 'Successfully left classroom'}), 200
        else:
            return jsonify({'error': 'Membership not found'}), 404

    except Exception as e:
        logger.info(f"Leave classroom exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


# ============================================================================
# CLASSROOM POSTS & STREAM ROUTES
# ============================================================================

@classroom_bp.route('/classrooms/<classroom_id>/posts', methods=['POST'])
def create_post(classroom_id):
    """
    Create a new post (announcement, assignment, material, question)

    Request body:
    {
        "author_id": "user_id",
        "author_role": "teacher|student",
        "post_type": "announcement|assignment|material|question",
        "title": "Post title",
        "content": "Post content",
        "attachments": [...],
        "assignment_details": {...} // if post_type is assignment
    }
    """
    try:
        data = request.json
        logger.info(f"Create post request | classroom_id: {classroom_id} | type: {data.get('post_type')} | author: {data.get('author_id')}")

        # Validate required fields
        if not data.get('author_id') or not data.get('post_type'):
            return jsonify({'error': 'author_id and post_type are required'}), 400

        post_doc = {
            '_id': str(ObjectId()),
            'classroom_id': classroom_id,
            'author_id': data['author_id'],
            'author_role': data.get('author_role', 'teacher'),
            'post_type': data['post_type'],
            'title': data.get('title', ''),
            'content': data.get('content', ''),
            'attachments': data.get('attachments', []),
            'assignment_details': data.get('assignment_details'),
            'is_pinned': data.get('is_pinned', False),
            'comment_count': 0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'scheduled_at': None,
            'published': True
        }

        post_id = insert_one(CLASSROOM_POSTS, post_doc)

        # If assignment, create submission records for all students
        if data['post_type'] == 'assignment':
            memberships = find_many(
                CLASSROOM_MEMBERSHIPS,
                {'classroom_id': classroom_id, 'is_active': True, 'role': 'student'}
            )

            for membership in memberships:
                submission_doc = {
                    '_id': str(ObjectId()),
                    'assignment_id': post_id,
                    'student_id': membership['student_id'],
                    'status': 'assigned',
                    'submission_text': '',
                    'attachments': [],
                    'grade': None,
                    'teacher_feedback': '',
                    'submitted_at': None,
                    'graded_at': None,
                    'returned_at': None,
                    'is_late': False,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                insert_one(CLASSROOM_SUBMISSIONS, submission_doc)

                # Notify student
                create_notification(
                    user_id=membership['student_id'],
                    classroom_id=classroom_id,
                    notification_type='new_post',
                    title='New Assignment Posted',
                    message=data.get('title', 'New assignment in class'),
                    link=f"/classroom/{classroom_id}/assignment/{post_id}"
                )

        logger.info(f"Post created | post_id: {post_id} | classroom_id: {classroom_id} | type: {data['post_type']}")
        return jsonify({'post_id': post_id, 'message': 'Post created successfully'}), 201

    except Exception as e:
        logger.info(f"Create post exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/classrooms/<classroom_id>/stream', methods=['GET'])
def get_classroom_stream(classroom_id):
    """Get all posts in classroom stream (announcements, assignments, materials)"""
    try:
        logger.info(f"Classroom stream request | classroom_id: {classroom_id}")

        # Get query parameters
        post_type = request.args.get('post_type')  # Filter by type
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))

        query = {'classroom_id': classroom_id, 'published': True}
        if post_type:
            query['post_type'] = post_type

        # Get posts sorted by pinned first, then by date
        posts = find_many(
            CLASSROOM_POSTS,
            query,
            sort=[('is_pinned', -1), ('created_at', -1)]
        )[offset:offset+limit]

        formatted_posts = []
        for post in posts:
            # Get author info
            author = find_one(USERS, {'_id': post['author_id']})
            author_name = 'Unknown'
            if author:
                if post['author_role'] == 'teacher':
                    teacher = find_one(TEACHERS, {'user_id': post['author_id']})
                    if teacher:
                        author_name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
                else:
                    student = find_one(STUDENTS, {'user_id': post['author_id']})
                    if student:
                        author_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"

            post_data = {
                'post_id': post['_id'],
                'post_type': post.get('post_type'),
                'title': post.get('title'),
                'content': post.get('content'),
                'author': {
                    'author_id': post.get('author_id'),
                    'author_name': author_name,
                    'author_role': post.get('author_role')
                },
                'attachments': post.get('attachments', []),
                'assignment_details': post.get('assignment_details'),
                'is_pinned': post.get('is_pinned'),
                'comment_count': post.get('comment_count', 0),
                'created_at': post.get('created_at').isoformat() if post.get('created_at') else None
            }

            # If user is student, check for submission
            user_id, role = get_current_user_id()
            if user_id and role == 'student' and post.get('post_type') == 'assignment':
                submission = find_one(CLASSROOM_SUBMISSIONS, {
                    'assignment_id': post['_id'],
                    'student_id': user_id
                })
                if submission:
                    post_data['current_user_submission'] = {
                        'status': submission.get('status'),
                        'grade': submission.get('grade'),
                        'submitted_at': submission.get('submitted_at').isoformat() if submission.get('submitted_at') else None,
                        'is_late': submission.get('is_late')
                    }

            formatted_posts.append(post_data)

        logger.info(f"Classroom stream retrieved | classroom_id: {classroom_id} | posts: {len(formatted_posts)}")
        return jsonify(formatted_posts), 200

    except Exception as e:
        logger.info(f"Get classroom stream exception | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/posts/<post_id>/comments', methods=['POST'])
def add_comment(post_id):
    """
    Add comment to a post

    Request body:
    {
        "author_id": "user_id",
        "author_role": "teacher|student",
        "content": "Comment text",
        "attachments": [...]
    }
    """
    try:
        data = request.json
        logger.info(f"Add comment request | post_id: {post_id} | author: {data.get('author_id')}")

        if not data.get('author_id') or not data.get('content'):
            return jsonify({'error': 'author_id and content are required'}), 400

        comment_doc = {
            '_id': str(ObjectId()),
            'post_id': post_id,
            'author_id': data['author_id'],
            'author_role': data.get('author_role', 'student'),
            'content': data['content'],
            'attachments': data.get('attachments', []),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        comment_id = insert_one(CLASSROOM_COMMENTS, comment_doc)

        # Increment comment count on post
        update_one(
            CLASSROOM_POSTS,
            {'_id': post_id},
            {'$inc': {'comment_count': 1}}
        )

        logger.info(f"Comment added | comment_id: {comment_id} | post_id: {post_id}")
        return jsonify({'comment_id': comment_id, 'message': 'Comment added successfully'}), 201

    except Exception as e:
        logger.info(f"Add comment exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/posts/<post_id>/comments', methods=['GET'])
def get_post_comments(post_id):
    """Get all comments for a post"""
    try:
        logger.info(f"Get comments request | post_id: {post_id}")

        comments = find_many(
            CLASSROOM_COMMENTS,
            {'post_id': post_id},
            sort=[('created_at', 1)]
        )

        formatted_comments = []
        for comment in comments:
            author = find_one(USERS, {'_id': comment['author_id']})
            author_name = 'Unknown'
            if author:
                if comment['author_role'] == 'teacher':
                    teacher = find_one(TEACHERS, {'user_id': comment['author_id']})
                    if teacher:
                        author_name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
                else:
                    student = find_one(STUDENTS, {'user_id': comment['author_id']})
                    if student:
                        author_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"

            formatted_comments.append({
                'comment_id': comment['_id'],
                'author': {
                    'author_id': comment.get('author_id'),
                    'author_name': author_name,
                    'author_role': comment.get('author_role')
                },
                'content': comment.get('content'),
                'attachments': comment.get('attachments', []),
                'created_at': comment.get('created_at').isoformat() if comment.get('created_at') else None
            })

        logger.info(f"Comments retrieved | post_id: {post_id} | count: {len(formatted_comments)}")
        return jsonify(formatted_comments), 200

    except Exception as e:
        logger.info(f"Get comments exception | post_id: {post_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


# ============================================================================
# ASSIGNMENT & SUBMISSION ROUTES
# ============================================================================

@classroom_bp.route('/classrooms/<classroom_id>/assignments', methods=['POST'])
def create_assignment(classroom_id):
    try:
        data = request.json

        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400

        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404

        assignment_post = {
            '_id': str(ObjectId()),
            'classroom_id': classroom_id,
            'author_id': data.get('teacher_id'),
            'post_type': 'assignment',
            'title': data['title'],
            'content': data.get('description', ''),
            'assignment_details': {
                'assignment_type': data.get('assignment_type', 'homework'),
                'due_date': datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
                'points': data.get('total_points', 100),
                'attachments': data.get('attachments', [])
            },
            'is_pinned': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        assignment_id = insert_one(CLASSROOM_POSTS, assignment_post)

        members = find_many(CLASSROOM_MEMBERSHIPS, {'classroom_id': classroom_id, 'is_active': True})
        for member in members:
            create_notification(
                member['student_id'],
                classroom_id,
                'assignment',
                f"New Assignment: {data['title']}",
                f"Due: {data.get('due_date', 'No deadline')}",
                f"/classroom/{classroom_id}/assignments/{assignment_id}"
            )

        logger.info(f"Assignment created | classroom_id: {classroom_id} | assignment_id: {assignment_id}")
        return jsonify({'assignment_id': assignment_id, 'message': 'Assignment created successfully'}), 201

    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/classrooms/<classroom_id>/assignments', methods=['GET'])
def get_classroom_assignments(classroom_id):
    try:
        assignments = find_many(CLASSROOM_POSTS, {'classroom_id': classroom_id, 'post_type': 'assignment'}, sort=[('created_at', -1)])
        result = []
        for assignment in assignments:
            submissions = find_many(CLASSROOM_SUBMISSIONS, {'assignment_id': assignment['_id']})
            result.append({
                'assignment_id': assignment['_id'],
                'title': assignment.get('title'),
                'due_date': assignment.get('assignment_details', {}).get('due_date').isoformat() if assignment.get('assignment_details', {}).get('due_date') else None,
                'points': assignment.get('assignment_details', {}).get('points', 100),
                'submissions_count': len(submissions),
                'created_at': assignment.get('created_at').isoformat() if assignment.get('created_at') else None
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/assignments/<assignment_id>', methods=['GET'])
def get_assignment(assignment_id):
    try:
        assignment = find_one(CLASSROOM_POSTS, {'_id': assignment_id, 'post_type': 'assignment'})
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404

        teacher = find_one(TEACHERS, {'_id': assignment.get('author_id')})
        classroom = find_one(CLASSROOMS, {'_id': assignment.get('classroom_id')})

        result = {
            'assignment_id': assignment['_id'],
            'title': assignment.get('title'),
            'content': assignment.get('content'),
            'classroom_id': assignment.get('classroom_id'),
            'classroom_name': classroom.get('class_name') if classroom else None,
            'teacher_id': assignment.get('author_id'),
            'teacher_name': teacher.get('name') if teacher else None,
            'assignment_details': assignment.get('assignment_details', {}),
            'attachments': assignment.get('attachments', []),
            'created_at': assignment.get('created_at').isoformat() if hasattr(assignment.get('created_at'), 'isoformat') else assignment.get('created_at'),
            'due_date': assignment.get('assignment_details', {}).get('due_date').isoformat() if hasattr(assignment.get('assignment_details', {}).get('due_date'), 'isoformat') else assignment.get('assignment_details', {}).get('due_date'),
            'points': assignment.get('assignment_details', {}).get('points', 100)
        }

        # If user is student, check for submission
        user_id, role = get_current_user_id()
        if user_id and role == 'student':
            submission = find_one(CLASSROOM_SUBMISSIONS, {
                'assignment_id': assignment_id,
                'student_id': user_id
            })
            if submission:
                result['current_user_submission'] = {
                    'submission_id': submission.get('_id'),
                    'status': submission.get('status'),
                    'submission_text': submission.get('submission_text'),
                    'attachments': submission.get('attachments', []),
                    'grade': submission.get('grade'),
                    'teacher_feedback': submission.get('teacher_feedback'),
                    'submitted_at': submission.get('submitted_at').isoformat() if submission.get('submitted_at') else None,
                    'is_late': submission.get('is_late')
                }

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/assignments/<assignment_id>', methods=['PUT'])
def update_assignment(assignment_id):
    try:
        data = request.json
        assignment = find_one(CLASSROOM_POSTS, {'_id': assignment_id, 'post_type': 'assignment'})
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404

        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'content' in data:
            update_data['content'] = data['content']
        if 'attachments' in data:
            update_data['attachments'] = data['attachments']
        if 'assignment_details' in data:
            update_data['assignment_details'] = data['assignment_details']

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            update_one(CLASSROOM_POSTS, {'_id': assignment_id}, {'$set': update_data})
            return jsonify({'message': 'Assignment updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/assignments/<assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    try:
        assignment = find_one(CLASSROOM_POSTS, {'_id': assignment_id, 'post_type': 'assignment'})
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404

        update_one(CLASSROOM_POSTS, {'_id': assignment_id}, {'$set': {'published': False}})
        return jsonify({'message': 'Assignment deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/assignments/<assignment_id>/submit', methods=['POST'])
def submit_assignment(assignment_id):
    try:
        data = request.json
        logger.info(f"Assignment submission | assignment_id: {assignment_id} | student_id: {data.get('student_id')}")

        if not data.get('student_id'):
            return jsonify({'error': 'student_id is required'}), 400

        assignment = find_one(CLASSROOM_POSTS, {'_id': assignment_id, 'post_type': 'assignment'})
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404

        is_late = False
        if assignment.get('assignment_details', {}).get('due_date'):
            due_date = assignment['assignment_details']['due_date']
            # Ensure due_date is a datetime object
            # DEBUG LOG
            logger.info(f"DEBUG: due_date type: {type(due_date)}, value: {due_date}")

            if isinstance(due_date, str):
                try:
                    due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                except ValueError:
                    logger.warning(f"Failed to parse due_date: {due_date}")
                    pass
            
            if isinstance(due_date, datetime):
                try:
                    is_late = datetime.utcnow() > due_date
                except TypeError as e:
                    logger.error(f"Date comparison failed: {e}")
                    is_late = False

        submission = find_one(CLASSROOM_SUBMISSIONS, {'assignment_id': assignment_id, 'student_id': data['student_id']})

        if submission:
            # Update existing submission
            update_one(
                CLASSROOM_SUBMISSIONS,
                {'_id': submission['_id']},
                {
                    '$set': {
                        'status': 'turned_in',
                        'submission_text': data.get('submission_text', ''),
                        'attachments': data.get('attachments', []),
                        'submitted_at': datetime.utcnow(),
                        'is_late': is_late,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            submission_id = submission['_id']
        else:
            # Create new submission record
            submission_doc = {
                '_id': str(ObjectId()),
                'assignment_id': assignment_id,
                'student_id': data['student_id'],
                'status': 'turned_in',
                'submission_text': data.get('submission_text', ''),
                'attachments': data.get('attachments', []),
                'submitted_at': datetime.utcnow(),
                'is_late': is_late,
                'grade': None,
                'feedback': '',
                'graded_at': None,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            submission_id = insert_one(CLASSROOM_SUBMISSIONS, submission_doc)

        logger.info(f"Assignment submitted | assignment_id: {assignment_id} | student_id: {data['student_id']} | late: {is_late}")
        return jsonify({'submission_id': submission_id, 'message': 'Assignment submitted successfully', 'is_late': is_late}), 200

    except Exception as e:
        logger.info(f"Submit assignment exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/submissions/<submission_id>', methods=['GET'])
def get_submission(submission_id):
    try:
        submission = find_one(CLASSROOM_SUBMISSIONS, {'_id': submission_id})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404

        student = find_one(STUDENTS, {'_id': submission['student_id']})
        assignment = find_one(CLASSROOM_POSTS, {'_id': submission['assignment_id']})

        return jsonify({
            'submission_id': submission['_id'],
            'assignment_id': submission['assignment_id'],
            'assignment_title': assignment.get('title') if assignment else None,
            'student_id': submission['student_id'],
            'student_name': f"{student.get('first_name', '')} {student.get('last_name', '')}" if student else None,
            'status': submission.get('status'),
            'submission_text': submission.get('submission_text'),
            'attachments': submission.get('attachments', []),
            'grade': submission.get('grade'),
            'teacher_feedback': submission.get('teacher_feedback'),
            'is_late': submission.get('is_late'),
            'submitted_at': submission.get('submitted_at').isoformat() if submission.get('submitted_at') else None,
            'graded_at': submission.get('graded_at').isoformat() if submission.get('graded_at') else None
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@classroom_bp.route('/submissions/<submission_id>', methods=['PUT'])
def update_submission(submission_id):
    try:
        data = request.json
        submission = find_one(CLASSROOM_SUBMISSIONS, {'_id': submission_id})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404

        update_data = {}
        if 'submission_text' in data:
            update_data['submission_text'] = data['submission_text']
        if 'attachments' in data:
            update_data['attachments'] = data['attachments']

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            update_one(CLASSROOM_SUBMISSIONS, {'_id': submission_id}, {'$set': update_data})
            return jsonify({'message': 'Submission updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/assignments/<assignment_id>/submissions', methods=['GET'])
def get_assignment_submissions(assignment_id):
    """Get all submissions for an assignment (teacher view)"""
    try:
        logger.info(f"Get submissions request | assignment_id: {assignment_id}")

        status_filter = request.args.get('status')  # assigned, turned_in, graded, returned

        query = {'assignment_id': assignment_id}
        if status_filter:
            query['status'] = status_filter

        submissions = find_many(CLASSROOM_SUBMISSIONS, query, sort=[('submitted_at', -1)])

        formatted_submissions = []
        for submission in submissions:
            student = find_one(STUDENTS, {'_id': submission['student_id']})

            formatted_submissions.append({
                'submission_id': submission['_id'],
                'student': {
                    'student_id': submission['student_id'],
                    'name': f"{student.get('first_name', '')} {student.get('last_name', '')}" if student else 'Unknown'
                },
                'status': submission.get('status'),
                'submission_text': submission.get('submission_text'),
                'attachments': submission.get('attachments', []),
                'grade': submission.get('grade'),
                'teacher_feedback': submission.get('teacher_feedback'),
                'is_late': submission.get('is_late'),
                'submitted_at': submission.get('submitted_at').isoformat() if submission.get('submitted_at') else None,
                'graded_at': submission.get('graded_at').isoformat() if submission.get('graded_at') else None
            })

        logger.info(f"Submissions retrieved | assignment_id: {assignment_id} | count: {len(formatted_submissions)}")
        return jsonify(formatted_submissions), 200

    except Exception as e:
        logger.info(f"Get submissions exception | assignment_id: {assignment_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/submissions/<submission_id>/grade', methods=['POST'])
def grade_submission(submission_id):
    """
    Teacher grades a submission

    Request body:
    {
        "grade": 95,
        "teacher_feedback": "Great work!",
        "return_to_student": true
    }
    """
    try:
        # submission_id is passed as argument
        data = request.json
        logger.info(f"Grade submission | submission_id: {submission_id} | grade: {data.get('grade')}")

        update_data = {
            'grade': data.get('grade'),
            'teacher_feedback': data.get('teacher_feedback', ''),
            'status': 'returned' if data.get('return_to_student') else 'graded',
            'graded_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        if data.get('return_to_student'):
            update_data['returned_at'] = datetime.utcnow()

        result = update_one(
            CLASSROOM_SUBMISSIONS,
            {'_id': submission_id},
            {'$set': update_data}
        )

        if result:
            # Get submission and create notification
            submission = find_one(CLASSROOM_SUBMISSIONS, {'_id': submission_id})
            if submission and data.get('return_to_student'):
                assignment = find_one(CLASSROOM_POSTS, {'_id': submission['assignment_id']})
                if assignment:
                    create_notification(
                        user_id=submission['student_id'],
                        classroom_id=assignment['classroom_id'],
                        notification_type='grade_posted',
                        title='Assignment Graded',
                        message=f"Your grade: {data.get('grade')}",
                        link=f"/classroom/{assignment['classroom_id']}/assignment/{submission['assignment_id']}"
                    )

            logger.info(f"Submission graded | submission_id: {submission_id} | grade: {data.get('grade')}")
            return jsonify({'message': 'Submission graded successfully'}), 200
        else:
            return jsonify({'error': 'Submission not found'}), 404

    except Exception as e:
        logger.info(f"Grade submission exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/students/<student_id>/assignments', methods=['GET'])
def get_student_assignments(student_id):
    """Get all assignments for a student across all classrooms"""
    try:
        logger.info(f"Student assignments request | student_id: {student_id}")

        status_filter = request.args.get('status')

        query = {'student_id': student_id}
        if status_filter:
            query['status'] = status_filter

        submissions = find_many(CLASSROOM_SUBMISSIONS, query, sort=[('created_at', -1)])

        formatted_assignments = []
        for submission in submissions:
            assignment = find_one(CLASSROOM_POSTS, {'_id': submission['assignment_id']})
            if assignment:
                classroom = find_one(CLASSROOMS, {'_id': assignment['classroom_id']})

                formatted_assignments.append({
                    'assignment_id': assignment['_id'],
                    'title': assignment.get('title'),
                    'classroom': {
                        'classroom_id': classroom.get('_id') if classroom else None,
                        'class_name': classroom.get('class_name') if classroom else 'Unknown'
                    },
                    'due_date': assignment.get('assignment_details', {}).get('due_date').isoformat() if assignment.get('assignment_details', {}).get('due_date') else None,
                    'points': assignment.get('assignment_details', {}).get('points'),
                    'status': submission.get('status'),
                    'grade': submission.get('grade'),
                    'is_late': submission.get('is_late'),
                    'submitted_at': submission.get('submitted_at').isoformat() if hasattr(submission.get('submitted_at'), 'isoformat') else submission.get('submitted_at')
                })

        logger.info(f"Student assignments retrieved | student_id: {student_id} | count: {len(formatted_assignments)}")
        return jsonify(formatted_assignments), 200

    except Exception as e:
        logger.info(f"Get student assignments exception | student_id: {student_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


# ============================================================================
# NOTIFICATIONS ROUTES
# ============================================================================

@classroom_bp.route('/notifications/<user_id>', methods=['GET'])
def get_user_notifications(user_id):
    """Get all notifications for a user"""
    try:
        logger.info(f"User notifications request | user_id: {user_id}")

        unread_only = request.args.get('unread_only') == 'true'
        limit = int(request.args.get('limit', 50))

        query = {'user_id': user_id}
        if unread_only:
            query['is_read'] = False

        notifications = find_many(
            CLASSROOM_NOTIFICATIONS,
            query,
            sort=[('created_at', -1)]
        )[:limit]

        formatted_notifications = []
        for notification in notifications:
            formatted_notifications.append({
                'notification_id': notification['_id'],
                'notification_type': notification.get('notification_type'),
                'title': notification.get('title'),
                'message': notification.get('message'),
                'link': notification.get('link'),
                'is_read': notification.get('is_read'),
                'created_at': notification.get('created_at').isoformat() if notification.get('created_at') else None
            })

        logger.info(f"Notifications retrieved | user_id: {user_id} | count: {len(formatted_notifications)}")
        return jsonify(formatted_notifications), 200

    except Exception as e:
        logger.info(f"Get notifications exception | user_id: {user_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@classroom_bp.route('/notifications/<notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        result = update_one(
            CLASSROOM_NOTIFICATIONS,
            {'_id': notification_id},
            {'$set': {'is_read': True, 'read_at': datetime.utcnow()}}
        )

        if result:
            logger.info(f"Notification marked read | notification_id: {notification_id}")
            return jsonify({'message': 'Notification marked as read'}), 200
        else:
            return jsonify({'error': 'Notification not found'}), 404

    except Exception as e:
        logger.info(f"Mark notification read exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500
