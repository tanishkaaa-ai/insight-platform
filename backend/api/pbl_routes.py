"""
AMEP PBL Routes - MongoDB Version with Real-time Data
API endpoints for BR5, BR9 (Project-Based Learning & Soft Skills)

Location: backend/api/pbl_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId

# Import MongoDB helper functions
from models.database import (
    db,
    PROJECTS,
    TEAMS,
    TEAM_MEMBERSHIPS,
    SOFT_SKILL_ASSESSMENTS,
    PROJECT_MILESTONES,
    PROJECT_ARTIFACTS,
    STUDENTS,
    find_one,
    find_many,
    insert_one,
    update_one,
    aggregate,
    count_documents
)

pbl_bp = Blueprint('pbl', __name__)

# ============================================================================
# PBL ROUTES (BR5, BR9)
# ============================================================================

@pbl_bp.route('/projects', methods=['GET'])
def list_projects():
    """
    BR9: Get all projects for a teacher or student
    """
    try:
        teacher_id = request.args.get('teacher_id')
        student_id = request.args.get('student_id')
        
        query = {}
        
        if teacher_id:
            query['teacher_id'] = teacher_id
        elif student_id:
            # Get teams the student is in
            memberships = find_many(TEAM_MEMBERSHIPS, {'student_id': student_id})
            team_ids = [m['team_id'] for m in memberships]
            
            # Get projects for those teams
            teams = find_many(TEAMS, {'_id': {'$in': team_ids}})
            project_ids = list(set(t['project_id'] for t in teams))
            
            query['_id'] = {'$in': project_ids}
        
        projects = find_many(PROJECTS, query, sort=[('start_date', -1)])
        
        formatted_projects = []
        for project in projects:
            # Count teams
            team_count = count_documents(TEAMS, {'project_id': project['_id']})
            
            formatted_projects.append({
                'project_id': project['_id'],
                'title': project.get('title'),
                'description': project.get('description'),
                'current_stage': project.get('current_stage'),
                'start_date': project.get('start_date').isoformat() if project.get('start_date') else None,
                'end_date': project.get('end_date').isoformat() if project.get('end_date') else None,
                'team_count': team_count,
                'created_at': project.get('created_at').isoformat() if project.get('created_at') else None
            })
        
        return jsonify(formatted_projects), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/projects', methods=['POST'])
def create_project():
    """
    BR9: Create new project
    """
    try:
        data = request.json
        
        project_doc = {
            '_id': str(ObjectId()),
            'teacher_id': data['teacher_id'],
            'title': data['title'],
            'description': data.get('description'),
            'start_date': datetime.fromisoformat(data['start_date']),
            'end_date': datetime.fromisoformat(data['end_date']),
            'current_stage': data.get('current_stage', 'questioning'),
            'curriculum_alignment': data.get('curriculum_alignment'),
            'created_at': datetime.utcnow()
        }
        
        project_id = insert_one(PROJECTS, project_doc)
        
        return jsonify({
            'project_id': project_id,
            'message': 'Project created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/projects/<project_id>', methods=['GET'])
def get_project_details(project_id):
    """
    BR9: Get detailed project information
    """
    try:
        project = find_one(PROJECTS, {'_id': project_id})
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get stages (hardcoded for now, could be in DB)
        stages = [
            {
                'id': 'questioning',
                'name': 'Questioning',
                'status': 'completed' if project['current_stage'] != 'questioning' else 'in_progress'
            },
            {
                'id': 'define',
                'name': 'Define',
                'status': 'completed' if project['current_stage'] not in ['questioning', 'define'] else 
                         'in_progress' if project['current_stage'] == 'define' else 'pending'
            },
            {
                'id': 'research',
                'name': 'Research',
                'status': 'completed' if project['current_stage'] not in ['questioning', 'define', 'research'] else 
                         'in_progress' if project['current_stage'] == 'research' else 'pending'
            },
            {
                'id': 'create',
                'name': 'Create',
                'status': 'completed' if project['current_stage'] == 'present' else 
                         'in_progress' if project['current_stage'] == 'create' else 'pending'
            },
            {
                'id': 'present',
                'name': 'Present',
                'status': 'in_progress' if project['current_stage'] == 'present' else 'pending'
            }
        ]
        
        # Get milestones
        milestones = find_many(
            PROJECT_MILESTONES,
            {'project_id': project_id},
            sort=[('due_date', 1)]
        )
        
        formatted_milestones = []
        for milestone in milestones:
            formatted_milestones.append({
                'milestone_id': milestone['_id'],
                'title': milestone.get('title'),
                'description': milestone.get('description'),
                'due_date': milestone.get('due_date').isoformat() if milestone.get('due_date') else None,
                'status': milestone.get('status'),
                'completed_at': milestone.get('completed_at').isoformat() if milestone.get('completed_at') else None
            })
        
        # Get teams
        teams = find_many(TEAMS, {'project_id': project_id})
        
        formatted_teams = []
        for team in teams:
            # Get team members
            memberships = find_many(TEAM_MEMBERSHIPS, {'team_id': team['_id']})
            member_ids = [m['student_id'] for m in memberships]
            
            formatted_teams.append({
                'team_id': team['_id'],
                'team_name': team.get('team_name'),
                'member_count': len(member_ids)
            })
        
        return jsonify({
            'project_id': project_id,
            'title': project.get('title'),
            'description': project.get('description'),
            'current_stage': project.get('current_stage'),
            'start_date': project.get('start_date').isoformat() if project.get('start_date') else None,
            'end_date': project.get('end_date').isoformat() if project.get('end_date') else None,
            'stages': stages,
            'milestones': formatted_milestones,
            'teams': formatted_teams
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/projects/<project_id>/stage', methods=['PUT'])
def update_project_stage(project_id):
    """
    BR9: Update project stage
    """
    try:
        data = request.json
        new_stage = data['stage']
        
        update_one(
            PROJECTS,
            {'_id': project_id},
            {'$set': {'current_stage': new_stage}}
        )
        
        return jsonify({'message': 'Project stage updated'}), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/teams', methods=['POST'])
def create_team():
    """
    BR9: Create new team for a project
    """
    try:
        data = request.json
        
        team_doc = {
            '_id': str(ObjectId()),
            'project_id': data['project_id'],
            'team_name': data['team_name'],
            'created_at': datetime.utcnow()
        }
        
        team_id = insert_one(TEAMS, team_doc)
        
        # Add team members if provided
        if 'members' in data:
            for member in data['members']:
                membership_doc = {
                    '_id': str(ObjectId()),
                    'team_id': team_id,
                    'student_id': member['student_id'],
                    'role': member.get('role'),
                    'joined_at': datetime.utcnow()
                }
                insert_one(TEAM_MEMBERSHIPS, membership_doc)
        
        return jsonify({
            'team_id': team_id,
            'message': 'Team created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/teams/<team_id>/members', methods=['POST'])
def add_team_member(team_id):
    """
    BR9: Add member to team
    """
    try:
        data = request.json
        
        # Check if already a member
        existing = find_one(
            TEAM_MEMBERSHIPS,
            {
                'team_id': team_id,
                'student_id': data['student_id']
            }
        )
        
        if existing:
            return jsonify({'error': 'Student already in team'}), 400
        
        membership_doc = {
            '_id': str(ObjectId()),
            'team_id': team_id,
            'student_id': data['student_id'],
            'role': data.get('role'),
            'joined_at': datetime.utcnow()
        }
        
        membership_id = insert_one(TEAM_MEMBERSHIPS, membership_doc)
        
        return jsonify({
            'membership_id': membership_id,
            'message': 'Member added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/milestones', methods=['POST'])
def create_milestone():
    """
    BR9: Create project milestone
    """
    try:
        data = request.json
        
        milestone_doc = {
            '_id': str(ObjectId()),
            'project_id': data['project_id'],
            'team_id': data.get('team_id'),
            'title': data['title'],
            'description': data.get('description'),
            'due_date': datetime.fromisoformat(data['due_date']),
            'status': data.get('status', 'pending'),
            'created_at': datetime.utcnow()
        }
        
        milestone_id = insert_one(PROJECT_MILESTONES, milestone_doc)
        
        return jsonify({
            'milestone_id': milestone_id,
            'message': 'Milestone created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/milestones/<milestone_id>/complete', methods=['POST'])
def complete_milestone(milestone_id):
    """
    BR9: Mark milestone as completed
    """
    try:
        update_one(
            PROJECT_MILESTONES,
            {'_id': milestone_id},
            {
                '$set': {
                    'status': 'completed',
                    'completed_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({'message': 'Milestone marked as completed'}), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# SOFT SKILLS ASSESSMENT ROUTES (BR5)
# ============================================================================

@pbl_bp.route('/soft-skills/assess', methods=['POST'])
def submit_soft_skill_assessment():
    """
    BR5: Submit peer review or self-assessment
    """
    try:
        data = request.get_json(silent=True)
        
        if not data or not isinstance(data, dict):
            return jsonify({'error': 'Invalid or missing JSON body'}), 400
        
        required_fields = ['team_id', 'assessed_student_id', 'ratings']
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            return jsonify({'error': f'Missing required fields: {missing}'}), 400
        
        ratings = data.get('ratings')
        if not isinstance(ratings, dict):
            return jsonify({'error': 'Invalid ratings structure: ratings must be a dictionary'}), 400
        
        # Helper function to average valid ratings (1-5 scale)
        def average_valid(values):
            valid = [v for v in values if isinstance(v, (int, float)) and 1 <= v <= 5]
            return round(sum(valid) / len(valid), 2) if valid else None
        
        # Calculate dimension averages
        td_avg = average_valid([
            ratings.get('td_communication'),
            ratings.get('td_mutual_support'),
            ratings.get('td_trust'),
            ratings.get('td_active_listening')
        ])
        
        ts_avg = average_valid([
            ratings.get('ts_clear_roles'),
            ratings.get('ts_task_scheduling'),
            ratings.get('ts_decision_making'),
            ratings.get('ts_conflict_resolution')
        ])
        
        tm_avg = average_valid([
            ratings.get('tm_clear_purpose'),
            ratings.get('tm_smart_goals'),
            ratings.get('tm_passion'),
            ratings.get('tm_synergy')
        ])
        
        te_avg = average_valid([
            ratings.get('te_growth_mindset'),
            ratings.get('te_quality_work'),
            ratings.get('te_self_monitoring'),
            ratings.get('te_reflective_practice')
        ])
        
        # Calculate overall score
        overall_components = [td_avg, ts_avg, tm_avg, te_avg]
        valid_components = [v for v in overall_components if v is not None]
        overall_score = round(sum(valid_components) / len(valid_components), 2) if valid_components else None
        
        # Create assessment document
        assessment_doc = {
            '_id': str(ObjectId()),
            'team_id': data['team_id'],
            'assessed_student_id': data['assessed_student_id'],
            'assessor_student_id': data.get('assessor_student_id'),
            'assessment_type': data.get('assessment_type', 'peer_review'),
            'ratings': ratings,
            'overall_td_score': td_avg,
            'overall_ts_score': ts_avg,
            'overall_tm_score': tm_avg,
            'overall_te_score': te_avg,
            'overall_score': overall_score,
            'comments': data.get('comments'),
            'assessed_at': datetime.utcnow()
        }
        
        assessment_id = insert_one(SOFT_SKILL_ASSESSMENTS, assessment_doc)
        
        return jsonify({
            'assessment_id': assessment_id,
            'team_id': data['team_id'],
            'assessed_student_id': data['assessed_student_id'],
            'overall_td_score': td_avg,
            'overall_ts_score': ts_avg,
            'overall_tm_score': tm_avg,
            'overall_te_score': te_avg,
            'overall_score': overall_score,
            'assessed_at': assessment_doc['assessed_at'].isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/soft-skills/team/<team_id>', methods=['GET'])
def get_team_soft_skills(team_id):
    """
    BR5: Get aggregated soft skill scores for a team
    """
    try:
        # Get all assessments for the team
        assessments = find_many(
            SOFT_SKILL_ASSESSMENTS,
            {'team_id': team_id},
            sort=[('assessed_at', -1)]
        )
        
        if not assessments:
            return jsonify({
                'team_id': team_id,
                'team_name': 'Unknown',
                'current_scores': {
                    'td': None,
                    'ts': None,
                    'tm': None,
                    'te': None
                },
                'trend_data': [],
                'assessment_count': 0
            }), 200
        
        # Get team name
        team = find_one(TEAMS, {'_id': team_id})
        team_name = team.get('team_name', 'Unknown') if team else 'Unknown'
        
        # Calculate current averages (most recent assessments)
        recent_assessments = assessments[:10]  # Last 10 assessments
        
        def safe_average(values):
            valid = [v for v in values if v is not None]
            return round(sum(valid) / len(valid), 2) if valid else None
        
        current_scores = {
            'td': safe_average([a.get('overall_td_score') for a in recent_assessments]),
            'ts': safe_average([a.get('overall_ts_score') for a in recent_assessments]),
            'tm': safe_average([a.get('overall_tm_score') for a in recent_assessments]),
            'te': safe_average([a.get('overall_te_score') for a in recent_assessments])
        }
        
        # Build trend data (group by week)
        trend_data = []
        
        # Group assessments by week
        from collections import defaultdict
        weeks = defaultdict(list)
        
        for assessment in assessments:
            assessed_at = assessment.get('assessed_at')
            if assessed_at:
                week_num = assessed_at.isocalendar()[1]
                week_key = f"Week {week_num}"
                weeks[week_key].append(assessment)
        
        # Calculate averages for each week
        for week_key in sorted(weeks.keys()):
            week_assessments = weeks[week_key]
            trend_data.append({
                'week': week_key,
                'td': safe_average([a.get('overall_td_score') for a in week_assessments]),
                'ts': safe_average([a.get('overall_ts_score') for a in week_assessments]),
                'tm': safe_average([a.get('overall_tm_score') for a in week_assessments]),
                'te': safe_average([a.get('overall_te_score') for a in week_assessments])
            })
        
        return jsonify({
            'team_id': team_id,
            'team_name': team_name,
            'current_scores': current_scores,
            'trend_data': trend_data[-4:],  # Last 4 weeks
            'assessment_count': len(assessments)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/soft-skills/student/<student_id>', methods=['GET'])
def get_student_soft_skills(student_id):
    """
    BR5: Get soft skill assessments for a student
    """
    try:
        team_id = request.args.get('team_id')
        
        query = {'assessed_student_id': student_id}
        if team_id:
            query['team_id'] = team_id
        
        assessments = find_many(
            SOFT_SKILL_ASSESSMENTS,
            query,
            sort=[('assessed_at', -1)]
        )
        
        formatted_assessments = []
        for assessment in assessments:
            formatted_assessments.append({
                'assessment_id': assessment['_id'],
                'team_id': assessment.get('team_id'),
                'assessment_type': assessment.get('assessment_type'),
                'overall_td_score': assessment.get('overall_td_score'),
                'overall_ts_score': assessment.get('overall_ts_score'),
                'overall_tm_score': assessment.get('overall_tm_score'),
                'overall_te_score': assessment.get('overall_te_score'),
                'overall_score': assessment.get('overall_score'),
                'comments': assessment.get('comments'),
                'assessed_at': assessment.get('assessed_at').isoformat() if assessment.get('assessed_at') else None
            })
        
        return jsonify({
            'student_id': student_id,
            'assessments': formatted_assessments,
            'total_assessments': len(assessments)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/artifacts', methods=['POST'])
def upload_artifact():
    """
    BR9: Upload project artifact
    """
    try:
        data = request.json
        
        # Get current version for this artifact type
        existing_artifacts = find_many(
            PROJECT_ARTIFACTS,
            {
                'team_id': data['team_id'],
                'artifact_type': data['artifact_type']
            }
        )
        version = len(existing_artifacts) + 1
        
        artifact_doc = {
            '_id': str(ObjectId()),
            'team_id': data['team_id'],
            'project_id': data['project_id'],
            'artifact_type': data['artifact_type'],
            'file_name': data['file_name'],
            'file_url': data['file_url'],
            'uploaded_by': data['uploaded_by'],
            'version': version,
            'uploaded_at': datetime.utcnow()
        }
        
        artifact_id = insert_one(PROJECT_ARTIFACTS, artifact_doc)
        
        return jsonify({
            'artifact_id': artifact_id,
            'version': version,
            'message': 'Artifact uploaded successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/artifacts/team/<team_id>', methods=['GET'])
def get_team_artifacts(team_id):
    """
    BR9: Get all artifacts for a team
    """
    try:
        artifacts = find_many(
            PROJECT_ARTIFACTS,
            {'team_id': team_id},
            sort=[('uploaded_at', -1)]
        )
        
        formatted_artifacts = []
        for artifact in artifacts:
            formatted_artifacts.append({
                'artifact_id': artifact['_id'],
                'artifact_type': artifact.get('artifact_type'),
                'file_name': artifact.get('file_name'),
                'file_url': artifact.get('file_url'),
                'version': artifact.get('version'),
                'uploaded_by': artifact.get('uploaded_by'),
                'uploaded_at': artifact.get('uploaded_at').isoformat() if artifact.get('uploaded_at') else None
            })
        
        return jsonify(formatted_artifacts), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500