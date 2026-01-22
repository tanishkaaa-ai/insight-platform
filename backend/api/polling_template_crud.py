from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
from models.database import db, find_one, find_many, insert_one, update_one, delete_one
from utils.logger import get_logger

poll_template_crud_bp = Blueprint('poll_template_crud', __name__)
logger = get_logger(__name__)

POLLS = 'live_polls'
POLL_RESPONSES = 'poll_responses'
TEMPLATES = 'curriculum_templates'
TEMPLATE_RATINGS = 'template_ratings'

@poll_template_crud_bp.route('/polls/<poll_id>', methods=['PUT'])
def update_poll(poll_id):
    try:
        data = request.json
        poll = find_one(POLLS, {'_id': poll_id})
        if not poll:
            return jsonify({'error': 'Poll not found'}), 404

        update_data = {}
        if 'question' in data:
            if poll.get('is_active'):
                return jsonify({'error': 'Cannot update question on active poll. Close it first.'}), 400
            update_data['question'] = data['question']
        if 'options' in data:
            if poll.get('is_active'):
                return jsonify({'error': 'Cannot update options on active poll. Close it first.'}), 400
            update_data['options'] = data['options']
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']
            if data['is_active']:
                update_data['reopened_at'] = datetime.utcnow()
            else:
                update_data['closed_at'] = datetime.utcnow()

        if update_data:
            update_one(POLLS, {'_id': poll_id}, {'$set': update_data})
            return jsonify({'message': 'Poll updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/polls/<poll_id>', methods=['DELETE'])
def delete_poll(poll_id):
    try:
        poll = find_one(POLLS, {'_id': poll_id})
        if not poll:
            return jsonify({'error': 'Poll not found'}), 404

        delete_one(POLLS, {'_id': poll_id})
        delete_one(POLL_RESPONSES, {'poll_id': poll_id})
        return jsonify({'message': 'Poll deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@poll_template_crud_bp.route('/polls/<poll_id>/responses/<student_id>', methods=['GET'])
def get_student_poll_response(poll_id, student_id):
    try:
        response = find_one(POLL_RESPONSES, {'poll_id': poll_id, 'student_id': student_id})
        if not response:
            return jsonify({'error': 'Response not found'}), 404

        return jsonify({
            'response_id': response['_id'],
            'poll_id': response.get('poll_id'),
            'student_id': response.get('student_id'),
            'response': response.get('response'),
            'is_correct': response.get('is_correct'),
            'responded_at': response.get('responded_at').isoformat() if response.get('responded_at') else None
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/polls/<poll_id>/responses/<student_id>', methods=['PUT'])
def update_student_poll_response(poll_id, student_id):
    try:
        data = request.json
        poll = find_one(POLLS, {'_id': poll_id})
        if not poll:
            return jsonify({'error': 'Poll not found'}), 404

        if not poll.get('is_active'):
            return jsonify({'error': 'Poll is closed'}), 400

        response = find_one(POLL_RESPONSES, {'poll_id': poll_id, 'student_id': student_id})
        if not response:
            return jsonify({'error': 'Original response not found'}), 404

        update_data = {
            'response': data.get('response'),
            'updated_at': datetime.utcnow()
        }

        if poll.get('poll_type') == 'quiz' and poll.get('correct_answer'):
            update_data['is_correct'] = data.get('response') == poll['correct_answer']

        update_one(POLL_RESPONSES, {'_id': response['_id']}, {'$set': update_data})
        return jsonify({'message': 'Response updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/templates/<template_id>', methods=['PUT'])
def update_template(template_id):
    try:
        data = request.json
        template = find_one(TEMPLATES, {'_id': template_id})
        if not template:
            return jsonify({'error': 'Template not found'}), 404

        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'learning_objectives' in data:
            update_data['learning_objectives'] = data['learning_objectives']
        if 'assessment_rubric' in data:
            update_data['assessment_rubric'] = data['assessment_rubric']
        if 'resources' in data:
            update_data['resources'] = data['resources']
        if 'content' in data:
            update_data['content'] = data['content']

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            update_one(TEMPLATES, {'_id': template_id}, {'$set': update_data})
            return jsonify({'message': 'Template updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/templates/<template_id>', methods=['DELETE'])
def delete_template(template_id):
    try:
        template = find_one(TEMPLATES, {'_id': template_id})
        if not template:
            return jsonify({'error': 'Template not found'}), 404

        update_one(TEMPLATES, {'_id': template_id}, {'$set': {'is_deleted': True, 'deleted_at': datetime.utcnow()}})
        return jsonify({'message': 'Template deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/templates/<template_id>/use', methods=['POST'])
def use_template(template_id):
    try:
        data = request.json
        template = find_one(TEMPLATES, {'_id': template_id})
        if not template:
            return jsonify({'error': 'Template not found'}), 404

        update_one(TEMPLATES, {'_id': template_id}, {'$inc': {'usage_count': 1}})

        usage_doc = {
            '_id': str(ObjectId()),
            'template_id': template_id,
            'teacher_id': data.get('teacher_id'),
            'classroom_id': data.get('classroom_id'),
            'assignment_id': data.get('assignment_id'),
            'used_at': datetime.utcnow()
        }
        insert_one('template_usage', usage_doc)

        updated_template = find_one(TEMPLATES, {'_id': template_id})
        return jsonify({
            'message': 'Template usage recorded',
            'usage_count': updated_template.get('usage_count', 1)
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/templates/<template_id>/ratings/<rating_id>', methods=['DELETE'])
def delete_rating(template_id, rating_id):
    try:
        rating = find_one(TEMPLATE_RATINGS, {'_id': rating_id, 'template_id': template_id})
        if not rating:
            return jsonify({'error': 'Rating not found'}), 404

        delete_one(TEMPLATE_RATINGS, {'_id': rating_id})

        ratings = find_many(TEMPLATE_RATINGS, {'template_id': template_id})
        if ratings:
            new_avg_rating = sum([r.get('rating', 0) for r in ratings]) / len(ratings)
        else:
            new_avg_rating = 0

        update_one(TEMPLATES, {'_id': template_id}, {'$set': {'average_rating': new_avg_rating, 'rating_count': len(ratings)}})
        return jsonify({'message': 'Rating deleted successfully', 'new_average_rating': new_avg_rating}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/interventions/<intervention_id>', methods=['GET'])
def get_intervention(intervention_id):
    try:
        intervention = find_one('interventions', {'_id': intervention_id})
        if not intervention:
            return jsonify({'error': 'Intervention not found'}), 404

        return jsonify({
            'intervention_id': intervention['_id'],
            'teacher_id': intervention.get('teacher_id'),
            'student_id': intervention.get('student_id'),
            'intervention_type': intervention.get('intervention_type'),
            'description': intervention.get('description'),
            'status': intervention.get('status'),
            'outcome': intervention.get('outcome'),
            'created_at': intervention.get('timestamp').isoformat() if intervention.get('timestamp') else None
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/interventions/<intervention_id>', methods=['PUT'])
def update_intervention(intervention_id):
    try:
        data = request.json
        intervention = find_one('interventions', {'_id': intervention_id})
        if not intervention:
            return jsonify({'error': 'Intervention not found'}), 404

        update_data = {}
        if 'description' in data:
            update_data['description'] = data['description']
        if 'intervention_type' in data:
            update_data['intervention_type'] = data['intervention_type']
        if 'status' in data:
            update_data['status'] = data['status']
        if 'outcome' in data:
            update_data['outcome'] = data['outcome']
            update_data['completed_at'] = datetime.utcnow()
            if 'status' not in data:
                update_data['status'] = 'completed'
        if 'outcome_notes' in data:
            update_data['outcome_notes'] = data['outcome_notes']

        if update_data:
            update_one('interventions', {'_id': intervention_id}, {'$set': update_data})
            return jsonify({'message': 'Intervention updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/interventions/<intervention_id>', methods=['DELETE'])
def delete_intervention(intervention_id):
    try:
        intervention = find_one('interventions', {'_id': intervention_id})
        if not intervention:
            return jsonify({'error': 'Intervention not found'}), 404

        delete_one('interventions', {'_id': intervention_id})
        return jsonify({'message': 'Intervention deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/notifications', methods=['POST'])
def create_notification():
    try:
        data = request.json

        if not data.get('user_id') or not data.get('title'):
            return jsonify({'error': 'user_id and title are required'}), 400

        notification_doc = {
            '_id': str(ObjectId()),
            'user_id': data['user_id'],
            'classroom_id': data.get('classroom_id'),
            'notification_type': data.get('notification_type', 'general'),
            'title': data['title'],
            'message': data.get('message', ''),
            'link': data.get('link'),
            'is_read': False,
            'created_at': datetime.utcnow(),
            'read_at': None
        }

        notification_id = insert_one('classroom_notifications', notification_doc)
        return jsonify({'notification_id': notification_id, 'message': 'Notification created successfully'}), 201
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/notifications', methods=['DELETE'])
def delete_notifications():
    try:
        notification_id = request.args.get('notification_id')
        user_id = request.args.get('user_id')
        older_than_days = request.args.get('older_than_days')

        if notification_id:
            notification = find_one('classroom_notifications', {'_id': notification_id})
            if not notification:
                return jsonify({'error': 'Notification not found'}), 404
            delete_one('classroom_notifications', {'_id': notification_id})
            return jsonify({'message': 'Notification deleted successfully'}), 200

        if user_id and older_than_days:
            cutoff_date = datetime.utcnow() - timedelta(days=int(older_than_days))
            result = db['classroom_notifications'].delete_many({
                'user_id': user_id,
                'created_at': {'$lt': cutoff_date}
            })
            return jsonify({'message': f'Deleted {result.deleted_count} notifications', 'deleted_count': result.deleted_count}), 200

        return jsonify({'error': 'Either notification_id or (user_id and older_than_days) are required'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@poll_template_crud_bp.route('/alerts', methods=['POST'])
def create_alert():
    try:
        data = request.json

        if not data.get('student_id'):
            return jsonify({'error': 'student_id is required'}), 400

        alert_doc = {
            '_id': str(ObjectId()),
            'student_id': data['student_id'],
            'engagement_score': data.get('engagement_score', 0),
            'engagement_level': data.get('engagement_level', 'unknown'),
            'severity': data.get('severity', 'medium'),
            'detected_behaviors': data.get('detected_behaviors', []),
            'recommendation': data.get('recommendation', ''),
            'timestamp': datetime.utcnow(),
            'resolved': False,
            'acknowledged': False
        }

        alert_id = insert_one('disengagement_alerts', alert_doc)
        return jsonify({'alert_id': alert_id, 'message': 'Alert created successfully'}), 201
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500
