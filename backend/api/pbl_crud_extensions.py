from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from models.database import (
    find_one, find_many, insert_one, update_one, delete_one,
    PROJECTS,
    TEAMS,
    PROJECT_MILESTONES,
    PROJECT_DELIVERABLES,
    PROJECT_TASKS,
    PEER_REVIEWS,
    PROJECT_GRADES
)
from utils.logger import get_logger

pbl_crud_bp = Blueprint('pbl_crud', __name__)
logger = get_logger(__name__)

@pbl_crud_bp.route('/projects/<project_id>/milestones', methods=['GET'])
def get_project_milestones(project_id):
    try:
        milestones = find_many(PROJECT_MILESTONES, {'project_id': project_id}, sort=[('due_date', 1)])
        result = []
        for milestone in milestones:
            team_name = None
            if milestone.get('submitted_by_team'):
                team = find_one(TEAMS, {'_id': milestone.get('submitted_by_team')})
                if team:
                    team_name = team.get('team_name')

            result.append({
                'milestone_id': milestone['_id'],
                'project_id': milestone.get('project_id'),
                'title': milestone.get('title'),
                'description': milestone.get('description'),
                'due_date': milestone.get('due_date').isoformat() if milestone.get('due_date') else None,
                'is_completed': milestone.get('is_completed', False),
                'completed_at': milestone.get('completed_at').isoformat() if milestone.get('completed_at') else None,
                'pending_approval': milestone.get('pending_approval', False),
                'submitted_by_team': milestone.get('submitted_by_team'),
                'team_name': team_name,
                'submission_notes': milestone.get('submission_notes', ''),
                'submitted_at': milestone.get('submitted_at').isoformat() if milestone.get('submitted_at') else None
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/milestones/<milestone_id>', methods=['GET'])
def get_milestone(milestone_id):
    try:
        milestone = find_one(PROJECT_MILESTONES, {'_id': milestone_id})
        if not milestone:
            return jsonify({'error': 'Milestone not found'}), 404

        return jsonify({
            'milestone_id': milestone['_id'],
            'project_id': milestone.get('project_id'),
            'title': milestone.get('title'),
            'description': milestone.get('description'),
            'due_date': milestone.get('due_date').isoformat() if milestone.get('due_date') else None,
            'is_completed': milestone.get('is_completed', False),
            'completed_at': milestone.get('completed_at').isoformat() if milestone.get('completed_at') else None
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/milestones/<milestone_id>', methods=['PUT'])
def update_milestone(milestone_id):
    try:
        data = request.json
        milestone = find_one(PROJECT_MILESTONES, {'_id': milestone_id})
        if not milestone:
            return jsonify({'error': 'Milestone not found'}), 404

        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'due_date' in data:
            update_data['due_date'] = datetime.fromisoformat(data['due_date'])
        if 'is_completed' in data:
            update_data['is_completed'] = data['is_completed']
            if data['is_completed']:
                update_data['completed_at'] = datetime.utcnow()

        if update_data:
            update_one(PROJECT_MILESTONES, {'_id': milestone_id}, {'$set': update_data})
            return jsonify({'message': 'Milestone updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/milestones/<milestone_id>', methods=['DELETE'])
def delete_milestone(milestone_id):
    try:
        milestone = find_one(PROJECT_MILESTONES, {'_id': milestone_id})
        if not milestone:
            return jsonify({'error': 'Milestone not found'}), 404

        delete_one(PROJECT_MILESTONES, {'_id': milestone_id})
        return jsonify({'message': 'Milestone deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/projects/<project_id>/deliverables', methods=['GET'])
def get_project_deliverables(project_id):
    try:
        deliverables = find_many(PROJECT_DELIVERABLES, {'project_id': project_id}, sort=[('submitted_at', -1)])
        result = []
        for deliverable in deliverables:
            result.append({
                'deliverable_id': deliverable['_id'],
                'project_id': deliverable.get('project_id'),
                'team_id': deliverable.get('team_id'),
                'deliverable_type': deliverable.get('deliverable_type'),
                'file_url': deliverable.get('file_url'),
                'title': deliverable.get('title'),
                'submitted_at': deliverable.get('submitted_at').isoformat() if deliverable.get('submitted_at') else None,
                'graded': deliverable.get('graded', False),
                'grade': deliverable.get('grade')
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/deliverables/<deliverable_id>', methods=['GET'])
def get_deliverable(deliverable_id):
    try:
        deliverable = find_one(PROJECT_DELIVERABLES, {'_id': deliverable_id})
        if not deliverable:
            return jsonify({'error': 'Deliverable not found'}), 404

        return jsonify({
            'deliverable_id': deliverable['_id'],
            'project_id': deliverable.get('project_id'),
            'team_id': deliverable.get('team_id'),
            'deliverable_type': deliverable.get('deliverable_type'),
            'file_url': deliverable.get('file_url'),
            'title': deliverable.get('title'),
            'description': deliverable.get('description'),
            'submitted_at': deliverable.get('submitted_at').isoformat() if deliverable.get('submitted_at') else None,
            'graded': deliverable.get('graded', False),
            'grade': deliverable.get('grade')
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/deliverables/<deliverable_id>', methods=['PUT'])
def update_deliverable(deliverable_id):
    try:
        data = request.json
        deliverable = find_one(PROJECT_DELIVERABLES, {'_id': deliverable_id})
        if not deliverable:
            return jsonify({'error': 'Deliverable not found'}), 404

        update_data = {}
        if 'file_url' in data:
            update_data['file_url'] = data['file_url']
        if 'title' in data:
            update_data['title'] = data['title']
        if 'description' in data:
            update_data['description'] = data['description']

        if update_data:
            update_one(PROJECT_DELIVERABLES, {'_id': deliverable_id}, {'$set': update_data})
            return jsonify({'message': 'Deliverable updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/deliverables/<deliverable_id>', methods=['DELETE'])
def delete_deliverable(deliverable_id):
    try:
        deliverable = find_one(PROJECT_DELIVERABLES, {'_id': deliverable_id})
        if not deliverable:
            return jsonify({'error': 'Deliverable not found'}), 404

        delete_one(PROJECT_DELIVERABLES, {'_id': deliverable_id})
        return jsonify({'message': 'Deliverable deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/deliverables/<deliverable_id>/grade', methods=['GET'])
def get_deliverable_grade(deliverable_id):
    try:
        deliverable = find_one(PROJECT_DELIVERABLES, {'_id': deliverable_id})
        if not deliverable:
            return jsonify({'error': 'Deliverable not found'}), 404

        return jsonify({
            'deliverable_id': deliverable_id,
            'grade': deliverable.get('grade'),
            'feedback': deliverable.get('feedback'),
            'graded_by': deliverable.get('graded_by'),
            'graded_at': deliverable.get('graded_at').isoformat() if deliverable.get('graded_at') else None
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/deliverables/<deliverable_id>/grade', methods=['PUT'])
def update_deliverable_grade(deliverable_id):
    try:
        data = request.json
        deliverable = find_one(PROJECT_DELIVERABLES, {'_id': deliverable_id})
        if not deliverable:
            return jsonify({'error': 'Deliverable not found'}), 404

        update_data = {
            'grade': data.get('grade'),
            'feedback': data.get('feedback', ''),
            'graded': True,
            'graded_at': datetime.utcnow()
        }

        update_one(PROJECT_DELIVERABLES, {'_id': deliverable_id}, {'$set': update_data})
        return jsonify({'message': 'Grade updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/teams/<team_id>/grades', methods=['GET'])
def get_team_grades(team_id):
    try:
        deliverables = find_many(PROJECT_DELIVERABLES, {'team_id': team_id, 'graded': True}, sort=[('graded_at', -1)])
        result = []
        for deliverable in deliverables:
            result.append({
                'deliverable_id': deliverable['_id'],
                'deliverable_type': deliverable.get('deliverable_type'),
                'grade': deliverable.get('grade'),
                'feedback': deliverable.get('feedback'),
                'graded_at': deliverable.get('graded_at').isoformat() if deliverable.get('graded_at') else None
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/peer-reviews/<review_id>', methods=['GET'])
def get_peer_review(review_id):
    try:
        review = find_one(PEER_REVIEWS, {'_id': review_id})
        if not review:
            return jsonify({'error': 'Peer review not found'}), 404

        return jsonify({
            'review_id': review['_id'],
            'team_id': review.get('team_id'),
            'reviewer_id': review.get('reviewer_id'),
            'reviewee_id': review.get('reviewee_id'),
            'review_type': review.get('review_type'),
            'ratings': review.get('ratings', {}),
            'created_at': review.get('created_at').isoformat() if review.get('created_at') else None
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/peer-reviews/<review_id>', methods=['PUT'])
def update_peer_review(review_id):
    try:
        data = request.json
        review = find_one(PEER_REVIEWS, {'_id': review_id})
        if not review:
            return jsonify({'error': 'Peer review not found'}), 404

        if 'ratings' in data:
            update_one(PEER_REVIEWS, {'_id': review_id}, {'$set': {'ratings': data['ratings']}})
            return jsonify({'message': 'Peer review updated successfully'}), 200

        return jsonify({'error': 'No ratings provided'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/peer-reviews/<review_id>', methods=['DELETE'])
def delete_peer_review(review_id):
    try:
        review = find_one(PEER_REVIEWS, {'_id': review_id})
        if not review:
            return jsonify({'error': 'Peer review not found'}), 404

        delete_one(PEER_REVIEWS, {'_id': review_id})
        return jsonify({'message': 'Peer review deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    try:
        project = find_one(PROJECTS, {'_id': project_id})
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        update_one(PROJECTS, {'_id': project_id}, {'$set': {'is_active': False}})
        return jsonify({'message': 'Project archived successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/teams/<team_id>', methods=['DELETE'])
def delete_team(team_id):
    try:
        team = find_one(TEAMS, {'_id': team_id})
        if not team:
            return jsonify({'error': 'Team not found'}), 404

        update_one(TEAMS, {'_id': team_id}, {'$set': {'status': 'archived'}})
        return jsonify({'message': 'Team archived successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_crud_bp.route('/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        task = find_one(PROJECT_TASKS, {'_id': task_id})
        if not task:
            return jsonify({'error': 'Task not found'}), 404

        delete_one(PROJECT_TASKS, {'_id': task_id})
        return jsonify({'message': 'Task deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500
