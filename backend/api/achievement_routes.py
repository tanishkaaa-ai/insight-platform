"""
AMEP Achievement Routes
API endpoints for managing student external achievements
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from models.database import (
    db,
    EXTERNAL_ACHIEVEMENTS,
    find_many,
    find_one,
    insert_one,
    update_one,
    delete_one,
    CLASSROOMS,
    CLASSROOM_MEMBERSHIPS,
    STUDENTS
)
from utils.logger import get_logger

achievement_bp = Blueprint('achievements', __name__)
logger = get_logger(__name__)

@achievement_bp.route('/external', methods=['POST'])
def add_external_achievement():
    """
    Add a new external achievement
    """
    try:
        data = request.json
        student_id = data.get('student_id')
        title = data.get('title')
        
        if not student_id or not title:
            return jsonify({'error': 'Missing required fields'}), 400

        achievement_doc = {
            '_id': str(ObjectId()),
            'student_id': student_id,
            'title': title,
            'description': data.get('description', ''),
            'date': data.get('date'),
            'category': data.get('category', 'Competition'),
            'proof_link': data.get('proof_link', ''),
            'created_at': datetime.utcnow()
        }

        achievement_id = insert_one(EXTERNAL_ACHIEVEMENTS, achievement_doc)
        logger.info(f"External achievement added for student {student_id}")

        return jsonify({'message': 'Achievement added successfully', 'id': achievement_id, 'achievement': achievement_doc}), 201

    except Exception as e:
        logger.error(f"Error adding achievement: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@achievement_bp.route('/student/<student_id>', methods=['GET'])
def get_student_achievements(student_id):
    """
    Get all external achievements for a student
    """
    try:
        achievements = find_many(
            EXTERNAL_ACHIEVEMENTS,
            {'student_id': student_id},
            sort=[('date', -1)]
        )
        return jsonify(achievements), 200
    except Exception as e:
        logger.error(f"Error fetching achievements: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@achievement_bp.route('/teacher/<teacher_id>/students', methods=['GET'])
def get_teacher_students_achievements(teacher_id):
    """
    Get achievements for all students enrolled in any of the teacher's classes.
    Includes class name for context.
    """
    try:
        # 1. Get all classrooms for the teacher
        classrooms = find_many(CLASSROOMS, {'teacher_id': teacher_id})
        classroom_ids = [str(c['_id']) for c in classrooms]
        # Create a map of classroom_id -> class_name for easy lookup
        class_map = {str(c['_id']): c.get('class_name', 'Unknown Class') for c in classrooms}

        # 2. Get all student memberships for these classrooms to identify relevant students
        memberships = find_many(CLASSROOM_MEMBERSHIPS, {'classroom_id': {'$in': classroom_ids}, 'is_active': True})
        
        # 3. Collect unique student doc IDs and map student doc ID to classes
        student_class_map = {} # student_doc_id -> [class_names]
        student_doc_ids = set()
        
        for m in memberships:
            sid = m['student_id'] # This is Student Document ID
            cid = m['classroom_id']
            student_doc_ids.add(sid)
            if sid not in student_class_map:
                student_class_map[sid] = []
            if cid in class_map and class_map[cid] not in student_class_map[sid]:
                 student_class_map[sid].append(class_map[cid])

        # 4. Get Student documents to get user_ids
        student_docs = find_many(STUDENTS, {'_id': {'$in': list(student_doc_ids)}})
        
        user_id_map = {} # user_id -> student_doc_id
        student_info_map = {} # user_id -> {name, classes}
        
        for s in student_docs:
            uid = s.get('user_id')
            sid = str(s['_id'])
            if uid:
                user_id_map[uid] = sid
                student_info_map[uid] = {
                    'name': f"{s.get('first_name', '')} {s.get('last_name', '')}".strip(),
                    'classes': student_class_map.get(sid, [])
                }
        
        relevant_user_ids = list(user_id_map.keys())

        # 5. Fetch achievements for these students using user_ids
        achievements = find_many(
            EXTERNAL_ACHIEVEMENTS,
            {'student_id': {'$in': relevant_user_ids}},
            sort=[('date', -1)]
        )

        # 6. Enrich achievements with student info and class info
        enriched_achievements = []
        for ach in achievements:
            uid = ach['student_id']
            info = student_info_map.get(uid, {})
            enriched_achievements.append({
                **ach,
                'student_name': info.get('name', 'Unknown Student'),
                'classes': info.get('classes', [])
            })

        return jsonify(enriched_achievements), 200

    except Exception as e:
        logger.error(f"Error fetching teacher students achievements: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@achievement_bp.route('/external/<achievement_id>', methods=['DELETE'])
def delete_external_achievement(achievement_id):
    """
    Delete an external achievement
    """
    try:
        result = delete_one(EXTERNAL_ACHIEVEMENTS, {'_id': achievement_id})
        if result == 0:
            return jsonify({'error': 'Achievement not found'}), 404
            
        return jsonify({'message': 'Achievement deleted'}), 200
    except Exception as e:
        logger.error(f"Error deleting achievement: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
