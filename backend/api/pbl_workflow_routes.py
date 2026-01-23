"""
AMEP PBL Workflow Routes - Enhanced Version
Complete 5-stage PBL workflow with team management, milestone tracking,
peer review, and 4D soft skills assessment

Location: backend/api/pbl_workflow_routes.py

Research Validation:
- Paper 11.pdf: 5-stage PBL process + 4D framework (Cronbach α > 0.97)
- Paper 17.pdf: PBL workflow challenges and solutions
- Paper 10.pdf: Team performance prediction using soft skills

BR5: Objective Soft-Skill Assessment
BR9: Centralized PBL Workspace
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
import logging
import statistics

# Import MongoDB helper functions
from models.database import (
    db,
    PROJECTS,
    TEAMS,
    TEAM_MEMBERSHIPS,
    PROJECT_MILESTONES,
    PROJECT_ARTIFACTS,
    SOFT_SKILL_ASSESSMENTS,
    STUDENTS,
    TEACHERS,
    CLASSROOMS,
    PROJECT_TASKS,
    PROJECT_DELIVERABLES,
    PEER_REVIEWS,
    PROJECT_GRADES,
    TEAM_ACHIEVEMENTS,
    TEAM_PROGRESS,
    find_one,
    find_many,
    insert_one,
    update_one,
    delete_one,
    aggregate
)

# Import logging
from utils.logger import get_logger

# Create blueprint
pbl_workflow_bp = Blueprint('pbl_workflow', __name__)

# Initialize logger
logger = get_logger(__name__)

# ============================================================================
# 5-STAGE PBL WORKFLOW CONSTANTS
# ============================================================================

ACHIEVEMENT_TYPES = {
    'MILESTONE_COMPLETED': {'name': 'Milestone Completed', 'xp': 100, 'icon': '🎯'},
    'FIRST_MILESTONE': {'name': 'Getting Started', 'xp': 50, 'icon': '🚀'},
    'HALFWAY_POINT': {'name': 'Halfway There', 'xp': 150, 'icon': '⭐'},
    'ALL_MILESTONES': {'name': 'Milestone Master', 'xp': 300, 'icon': '🏆'},
    'EARLY_COMPLETION': {'name': 'Speed Demon', 'xp': 200, 'icon': '⚡'},
    'PERFECT_ATTENDANCE': {'name': 'Team Player', 'xp': 100, 'icon': '🤝'},
    'QUALITY_WORK': {'name': 'Excellence Award', 'xp': 250, 'icon': '💎'},
    'STAGE_COMPLETE': {'name': 'Stage Master', 'xp': 150, 'icon': '✨'}
}

MILESTONE_XP_BASE = 100
MILESTONE_BONUS_PER_LEVEL = 50

PBL_STAGES = {
    'QUESTIONING': {
        'order': 1,
        'description': 'Brainstorm and identify problems to solve',
        'tools': ['SWOT analysis', 'Brainstorming templates'],
        'soft_skills': ['Creativity', 'Critical Thinking']
    },
    'DEFINE': {
        'order': 2,
        'description': 'Define project scope, roles, and goals',
        'tools': ['SMART goal wizard', 'Role assignment matrix', 'Project charter'],
        'soft_skills': ['Planning', 'Leadership']
    },
    'RESEARCH': {
        'order': 3,
        'description': 'Gather information and resources',
        'tools': ['Resource library', 'Citation manager', 'Knowledge sharing'],
        'soft_skills': ['Information literacy', 'Collaboration']
    },
    'CREATE_IMPROVE': {
        'order': 4,
        'description': 'Build solution iteratively',
        'tools': ['Milestone tracking', 'Gantt chart', 'Version control'],
        'soft_skills': ['Execution', 'Adaptability', 'Communication']
    },
    'PRESENT_EVALUATE': {
        'order': 5,
        'description': 'Present and receive evaluation',
        'tools': ['Presentation upload', 'Multi-stakeholder rubrics', 'Reflection journal'],
        'soft_skills': ['Communication', 'Professionalism']
    }
}

# 4D Soft Skills Framework (Paper 11.pdf)
SOFT_SKILL_DIMENSIONS = {
    'TEAM_DYNAMICS': {
        'name': 'Team Dynamics (TD)',
        'description': 'Quality of interpersonal interactions',
        'criteria': [
            'Open and clear communication',
            'Mutual support and encouragement',
            'Climate of trust',
            'Active listening'
        ]
    },
    'TEAM_STRUCTURE': {
        'name': 'Team Structure (TS)',
        'description': 'Organization and coordination effectiveness',
        'criteria': [
            'Clear roles and responsibilities',
            'Efficient task scheduling',
            'Effective decision-making',
            'Constructive conflict resolution'
        ]
    },
    'TEAM_MOTIVATION': {
        'name': 'Team Motivation (TM)',
        'description': 'Drive and commitment to goals',
        'criteria': [
            'Clear sense of purpose',
            'SMART goals established',
            'Passion and dedication',
            'Team synergy'
        ]
    },
    'TEAM_EXCELLENCE': {
        'name': 'Team Excellence (TE)',
        'description': 'Quality of output and continuous improvement',
        'criteria': [
            'Growth mindset',
            'Commitment to high-quality work',
            'Self-monitoring',
            'Reflective practice'
        ]
    }
}


# ============================================================================
# PROJECT MANAGEMENT
# ============================================================================

@pbl_workflow_bp.route('/projects', methods=['POST'])
def create_project():
    """
    BR9: Create new PBL project

    POST /api/pbl-workflow/projects
    """
    try:
        data = request.json
        logger.info(f"[CREATE_PROJECT] Request received | teacher_id: {data.get('teacher_id')} | classroom_id: {data.get('classroom_id')} | title: {data.get('title')}")

        # Validate required fields
        required = ['title', 'classroom_id', 'teacher_id', 'stage', 'deadline']
        for field in required:
            if field not in data:
                logger.warning(f"[CREATE_PROJECT] Missing required field: {field} | teacher_id: {data.get('teacher_id')}")
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Validate stage
        if data['stage'] not in PBL_STAGES:
            logger.warning(f"[CREATE_PROJECT] Invalid stage: {data['stage']} | teacher_id: {data.get('teacher_id')}")
            return jsonify({'error': f'Invalid stage. Must be one of: {list(PBL_STAGES.keys())}'}), 400

        logger.info(f"[CREATE_PROJECT] Validation passed | creating project document")
        project_doc = {
            '_id': str(ObjectId()),
            'title': data['title'],
            'description': data.get('description', ''),
            'classroom_id': data['classroom_id'],
            'teacher_id': data['teacher_id'],
            'stage': data['stage'],
            'stage_order': PBL_STAGES[data['stage']]['order'],
            'deadline': datetime.fromisoformat(data['deadline']),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'status': 'active',  # active, completed, archived
            'project_type': data.get('project_type', 'team'),  # team, individual
            'learning_objectives': data.get('learning_objectives', []),
            'resources': data.get('resources', []),
            'rubric': data.get('rubric', {}),
            'deliverables': data.get('deliverables', []),
            'settings': {
                'enable_peer_review': data.get('enable_peer_review', True),
                'peer_review_schedule': data.get('peer_review_schedule', ['mid-project', 'final']),
                'team_size_min': data.get('team_size_min', 1),
                'team_size_max': data.get('team_size_max', 5),
                'allow_self_team_formation': data.get('allow_self_team_formation', True)
            }
        }

        project_id = insert_one(PROJECTS, project_doc)

        logger.info(f"[CREATE_PROJECT] SUCCESS | project_id: {project_id} | title: {data['title']} | stage: {data['stage']} | teacher_id: {data['teacher_id']} | classroom_id: {data['classroom_id']}")

        return jsonify({
            'project_id': project_id,
            'message': 'Project created successfully',
            'stage': data['stage'],
            'stage_info': PBL_STAGES[data['stage']]
        }), 201

    except Exception as e:
        logger.error(f"[CREATE_PROJECT] ERROR | error: {str(e)} | teacher_id: {data.get('teacher_id') if data else 'unknown'}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    """
    Get project details

    GET /api/pbl-workflow/projects/{project_id}
    """
    try:
        logger.info(f"[GET_PROJECT] Request received | project_id: {project_id}")
        project = find_one(PROJECTS, {'_id': project_id})

        if not project:
            logger.warning(f"[GET_PROJECT] Project not found | project_id: {project_id}")
            return jsonify({'error': 'Project not found'}), 404

        logger.info(f"[GET_PROJECT] Project found | project_id: {project_id} | title: {project.get('title')} | stage: {project.get('stage')}")

        # Get teams for this project
        teams = find_many(TEAMS, {'project_id': project_id})
        logger.info(f"[GET_PROJECT] Teams retrieved | project_id: {project_id} | team_count: {len(teams)}")

        # Get milestones
        milestones = find_many(PROJECT_MILESTONES, {'project_id': project_id}, sort=[('due_date', 1)])
        logger.info(f"[GET_PROJECT] Milestones retrieved | project_id: {project_id} | milestone_count: {len(milestones)}")

        # Format response
        project_data = {
            'project_id': project['_id'],
            'title': project.get('title'),
            'description': project.get('description'),
            'classroom_id': project.get('classroom_id'),
            'teacher_id': project.get('teacher_id'),
            'stage': project.get('stage'),
            'stage_info': PBL_STAGES.get(project.get('stage'), {}),
            'deadline':(project.get('deadline').isoformat() if hasattr(project.get('deadline'), 'isoformat') else project.get('deadline')) if project.get('deadline') else None,
            'status': project.get('status'),
            'learning_objectives': project.get('learning_objectives', []),
            'teams': [
                {
                    'team_id': team['_id'],
                    'team_name': team.get('team_name'),
                    'member_count': len(team.get('members', [])),
                    'members': [
                        {
                            'student_id': m_id,
                            'student_name': f"{(find_one(STUDENTS, {'_id': m_id}) or {}).get('first_name', '')} {(find_one(STUDENTS, {'_id': m_id}) or {}).get('last_name', '')}".strip() or 'Unknown'
                        }
                        for m_id in team.get('members', [])
                    ]
                }
                for team in teams
            ],
            'milestones': [
                {
                    'milestone_id': m['_id'],
                    'title': m.get('title'),
                    'due_date': (m.get('due_date').isoformat() if hasattr(m.get('due_date'), 'isoformat') else m.get('due_date')) if m.get('due_date') else None,
                    'is_completed': m.get('is_completed', False),
                    'pending_approval': m.get('pending_approval', False),
                    'submission_notes': m.get('submission_notes'),
                    'report_url': m.get('report_url'),
                    'zip_url': m.get('zip_url'),
                    'submitted_at': (m.get('submitted_at').isoformat() if hasattr(m.get('submitted_at'), 'isoformat') else m.get('submitted_at')) if m.get('submitted_at') else None
                }
                for m in milestones
            ],
            'settings': project.get('settings', {})
        }

        return jsonify(project_data), 200

    except Exception as e:
        logger.error(f"Error fetching project | project_id: {project_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/projects/<project_id>/stage', methods=['PUT'])
def update_project_stage(project_id):
    """
    BR9: Move project to next stage

    PUT /api/pbl-workflow/projects/{project_id}/stage
    """
    try:
        data = request.json

        if 'new_stage' not in data:
            return jsonify({'error': 'Missing required field: new_stage'}), 400

        if data['new_stage'] not in PBL_STAGES:
            return jsonify({'error': f'Invalid stage. Must be one of: {list(PBL_STAGES.keys())}'}), 400

        update_data = {
            'stage': data['new_stage'],
            'stage_order': PBL_STAGES[data['new_stage']]['order'],
            'updated_at': datetime.utcnow()
        }

        result = update_one(PROJECTS, {'_id': project_id}, {'$set': update_data})

        if result == 0:
            return jsonify({'error': 'Project not found'}), 404

        logger.info(f"Project stage updated | project_id: {project_id} | new_stage: {data['new_stage']}")

        return jsonify({
            'message': 'Project stage updated successfully',
            'new_stage': data['new_stage'],
            'stage_info': PBL_STAGES[data['new_stage']]
        }), 200

    except Exception as e:
        logger.error(f"Error updating project stage | project_id: {project_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/projects/classroom/<classroom_id>', methods=['GET'])
def get_classroom_projects(classroom_id):
    """
    Get all projects for a classroom

    GET /api/pbl-workflow/projects/classroom/{classroom_id}
    """
    try:
        projects = find_many(
            PROJECTS,
            {'classroom_id': classroom_id},
            sort=[('created_at', -1)]
        )

        projects_list = []
        for project in projects:
            projects_list.append({
                'project_id': project['_id'],
                'title': project.get('title'),
                'stage': project.get('stage'),
                'stage_order': project.get('stage_order'),
                'deadline': (project.get('deadline').isoformat() if hasattr(project.get('deadline'), 'isoformat') else project.get('deadline')) if project.get('deadline') else None,
                'status': project.get('status'),
                'created_at': (project.get('created_at').isoformat() if hasattr(project.get('created_at'), 'isoformat') else project.get('created_at')) if project.get('created_at') else None
            })

        return jsonify({
            'classroom_id': classroom_id,
            'projects': projects_list,
            'total_projects': len(projects_list)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching classroom projects | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# TEAM MANAGEMENT
# ============================================================================

@pbl_workflow_bp.route('/projects/<project_id>/teams', methods=['POST'])
def create_team(project_id):
    """
    BR9: Create team for project

    POST /api/pbl-workflow/projects/{project_id}/teams
    """
    try:
        data = request.json
        logger.info(f"[CREATE_TEAM] Request received | project_id: {project_id} | team_name: {data.get('team_name')} | member_count: {len(data.get('members', []))}")

        # Validate project exists
        project = find_one(PROJECTS, {'_id': project_id})
        if not project:
            logger.warning(f"[CREATE_TEAM] Project not found | project_id: {project_id}")
            return jsonify({'error': 'Project not found'}), 404

        logger.info(f"[CREATE_TEAM] Project found | project_id: {project_id} | title: {project.get('title')}")

        # Validate team size
        team_size = len(data.get('members', []))
        # min_size = project.get('settings', {}).get('team_size_min', 1) # Force 1 for testing
        min_size = 1  # Forced override for development environment
        max_size = project.get('settings', {}).get('team_size_max', 5)

        logger.info(f"[CREATE_TEAM] Validating team size | project_id: {project_id} | team_size: {team_size} | min: {min_size} | max: {max_size}")

        if team_size < min_size or team_size > max_size:
            logger.warning(f"[CREATE_TEAM] Invalid team size | project_id: {project_id} | team_size: {team_size} | required: {min_size}-{max_size}")
            return jsonify({'error': f'Team size must be between {min_size} and {max_size}'}), 400

        team_doc = {
            '_id': str(ObjectId()),
            'project_id': project_id,
            'team_name': data.get('team_name', f'Team {ObjectId()}'),
            'members': data.get('members', []),  # List of student_ids
            'roles': data.get('roles', {}),  # {student_id: role}
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'status': 'active'
        }

        team_id = insert_one(TEAMS, team_doc)
        logger.info(f"[CREATE_TEAM] Team document inserted | team_id: {team_id} | project_id: {project_id}")

        initialize_team_progress(team_id, project_id)
        logger.info(f"[CREATE_TEAM] Team progress initialized | team_id: {team_id} | project_id: {project_id}")

        logger.info(f"[CREATE_TEAM] SUCCESS | team_id: {team_id} | project_id: {project_id} | team_name: {team_doc['team_name']} | member_count: {team_size} | members: {data.get('members')}")

        return jsonify({
            'team_id': team_id,
            'message': 'Team created successfully',
            'team_name': team_doc['team_name']
        }), 201

    except Exception as e:
        logger.error(f"[CREATE_TEAM] ERROR | project_id: {project_id} | error: {str(e)} | team_data: {data if data else 'none'}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/teams/<team_id>/members', methods=['POST'])
def add_team_member(team_id):
    """
    Add member to team

    POST /api/pbl-workflow/teams/{team_id}/members
    """
    try:
        data = request.json

        if 'student_id' not in data:
            return jsonify({'error': 'Missing required field: student_id'}), 400

        team = find_one(TEAMS, {'_id': team_id})
        if not team:
            return jsonify({'error': 'Team not found'}), 404

        # Check team size limit
        project = find_one(PROJECTS, {'_id': team['project_id']})
        max_size = project.get('settings', {}).get('team_size_max', 5)

        if len(team.get('members', [])) >= max_size:
            return jsonify({'error': f'Team is full (max {max_size} members)'}), 400

        # Add member
        result = update_one(
            TEAMS,
            {'_id': team_id},
            {
                '$addToSet': {'members': data['student_id']},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )

        # Optionally set role
        if 'role' in data:
            update_one(
                TEAMS,
                {'_id': team_id},
                {'$set': {f'roles.{data["student_id"]}': data['role']}}
            )

        logger.info(f"Member added to team | team_id: {team_id} | student_id: {data['student_id']}")

        return jsonify({'message': 'Member added successfully'}), 200

    except Exception as e:
        logger.error(f"Error adding team member | team_id: {team_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/teams/<team_id>', methods=['GET'])
def get_team(team_id):
    """
    Get team details with member information

    GET /api/pbl-workflow/teams/{team_id}
    """
    try:
        team = find_one(TEAMS, {'_id': team_id})

        if not team:
            return jsonify({'error': 'Team not found'}), 404

        # Get member details
        members_data = []
        for student_id in team.get('members', []):
            student = find_one(STUDENTS, {'_id': student_id})
            if student:
                members_data.append({
                    'student_id': student_id,
                    'student_name': f"{student.get('first_name', '')} {student.get('last_name', '')}".strip(),
                    'email': student.get('email'),
                    'role': team.get('roles', {}).get(student_id, 'Member')
                })

        team_data = {
            'team_id': team['_id'],
            'project_id': team.get('project_id'),
            'team_name': team.get('team_name'),
            'members': members_data,
            'member_count': len(members_data),
            'status': team.get('status'),
            'created_at': (team.get('created_at').isoformat() if hasattr(team.get('created_at'), 'isoformat') else team.get('created_at')) if team.get('created_at') else None,
            'progress': 0, # Placeholder - implement real calculation based on tasks/milestones
            'completed_milestones': [], # Placeholder
            'next_milestone': None
        }

        # Calculate progress based on tasks
        tasks = find_many(PROJECT_TASKS, {'team_id': team_id})
        if tasks:
            completed_tasks = [t for t in tasks if t.get('status') == 'completed']
            team_data['progress'] = int((len(completed_tasks) / len(tasks)) * 100)
            
        # Get milestones status (simplistic approach: assuming milestones are linked to tasks or manual check)
        # For now, just return project milestones as "pending" for the team unless we have specific team-milestone records
        pass

        return jsonify(team_data), 200

    except Exception as e:
        logger.error(f"Error fetching team | team_id: {team_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# TASK & MILESTONE MANAGEMENT
# ============================================================================

@pbl_workflow_bp.route('/projects/<project_id>/milestones', methods=['POST'])
def create_milestone(project_id):
    """
    BR9: Create project milestone

    POST /api/pbl-workflow/projects/{project_id}/milestones
    """
    try:
        data = request.json

        required = ['title', 'due_date']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        milestone_doc = {
            '_id': str(ObjectId()),
            'project_id': project_id,
            'title': data['title'],
            'description': data.get('description', ''),
            'due_date': datetime.fromisoformat(data['due_date']),
            'created_at': datetime.utcnow(),
            'is_completed': False,
            'completed_at': None,
            'deliverables': data.get('deliverables', [])
        }

        milestone_id = insert_one(PROJECT_MILESTONES, milestone_doc)

        logger.info(f"Milestone created | milestone_id: {milestone_id} | project_id: {project_id}")

        return jsonify({
            'milestone_id': milestone_id,
            'message': 'Milestone created successfully'
        }), 201

    except Exception as e:
        logger.error(f"Error creating milestone | project_id: {project_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/teams/<team_id>/tasks', methods=['POST'])
def create_task(team_id):
    """
    BR9: Create task for team

    POST /api/pbl-workflow/teams/{team_id}/tasks
    """
    try:
        data = request.json

        required = ['title', 'assigned_to']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        task_doc = {
            '_id': str(ObjectId()),
            'team_id': team_id,
            'title': data['title'],
            'description': data.get('description', ''),
            'assigned_to': data['assigned_to'],  # student_id
            'due_date': datetime.fromisoformat(data['due_date']) if 'due_date' in data else None,
            'priority': data.get('priority', 'medium'),  # low, medium, high
            'status': data.get('status', 'todo'),  # todo, in_progress, completed
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'completed_at': None
        }

        task_id = insert_one(PROJECT_TASKS, task_doc)

        logger.info(f"Task created | task_id: {task_id} | team_id: {team_id} | assigned_to: {data['assigned_to']}")

        return jsonify({
            'task_id': task_id,
            'message': 'Task created successfully'
        }), 201

    except Exception as e:
        logger.error(f"Error creating task | team_id: {team_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/teams/<team_id>/tasks', methods=['GET'])
def get_team_tasks(team_id):
    """
    Get all tasks for a team

    GET /api/pbl-workflow/teams/{team_id}/tasks
    """
    try:
        tasks = find_many(PROJECT_TASKS, {'team_id': team_id}, sort=[('due_date', 1)])

        tasks_list = []
        for task in tasks:
            # Get assigned student name
            student = find_one(STUDENTS, {'_id': task.get('assigned_to')})

            tasks_list.append({
                'task_id': task['_id'],
                'title': task.get('title'),
                'description': task.get('description'),
                'assigned_to': task.get('assigned_to'),
                'assigned_to_name': student.get('name', 'Unknown') if student else 'Unknown',
                'due_date': (task.get('due_date').isoformat() if hasattr(task.get('due_date'), 'isoformat') else task.get('due_date')) if task.get('due_date') else None,
                'priority': task.get('priority'),
                'status': task.get('status'),
                'created_at': (task.get('created_at').isoformat() if hasattr(task.get('created_at'), 'isoformat') else task.get('created_at')) if task.get('created_at') else None
            })

        return jsonify({
            'team_id': team_id,
            'tasks': tasks_list,
            'total_tasks': len(tasks_list),
            'completed_tasks': len([t for t in tasks_list if t['status'] == 'completed'])
        }), 200

    except Exception as e:
        logger.error(f"Error fetching team tasks | team_id: {team_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# PEER REVIEW & 4D SOFT SKILLS ASSESSMENT (BR5)
# ============================================================================

@pbl_workflow_bp.route('/teams/<team_id>/peer-reviews', methods=['POST'])
def submit_peer_review(team_id):
    """
    BR5: Submit peer review using 4D framework

    POST /api/pbl-workflow/teams/{team_id}/peer-reviews
    """
    try:
        data = request.json

        required = ['reviewer_id', 'reviewee_id', 'review_type', 'ratings']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Validate review type
        valid_types = ['mid-project', 'final']
        if data['review_type'] not in valid_types:
            return jsonify({'error': f'Invalid review_type. Must be one of: {valid_types}'}), 400

        # Validate ratings include all 4 dimensions
        ratings = data['ratings']
        for dimension in SOFT_SKILL_DIMENSIONS.keys():
            if dimension not in ratings:
                return jsonify({'error': f'Missing rating for dimension: {dimension}'}), 400

            # Validate rating is 1-5 (5-point Likert scale)
            if not (1 <= ratings[dimension] <= 5):
                return jsonify({'error': f'Rating for {dimension} must be between 1 and 5'}), 400

        review_doc = {
            '_id': str(ObjectId()),
            'team_id': team_id,
            'reviewer_id': data['reviewer_id'],
            'reviewee_id': data['reviewee_id'],
            'review_type': data['review_type'],
            'ratings': ratings,  # {TEAM_DYNAMICS: 4, TEAM_STRUCTURE: 5, ...}
            'comments': data.get('comments', {}),  # {dimension: comment}
            'submitted_at': datetime.utcnow(),
            'is_self_review': data['reviewer_id'] == data['reviewee_id']
        }

        review_id = insert_one(PEER_REVIEWS, review_doc)

        logger.info(f"Peer review submitted | review_id: {review_id} | team_id: {team_id} | reviewer: {data['reviewer_id']} | reviewee: {data['reviewee_id']}")

        return jsonify({
            'review_id': review_id,
            'message': 'Peer review submitted successfully'
        }), 201

    except Exception as e:
        logger.error(f"Error submitting peer review | team_id: {team_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/students/<student_id>/soft-skills', methods=['GET'])
def get_student_soft_skills(student_id):
    """
    BR5: Get aggregated soft skills assessment for student

    GET /api/pbl-workflow/students/{student_id}/soft-skills?team_id={team_id}
    """
    try:
        team_id = request.args.get('team_id')

        if not team_id:
            # If no team_id provided, get aggregate across all teams
            query = {'reviewee_id': student_id}
            
            # Find all projects/teams this student is part of
            # This is optional context, but good for logging
            pass
        else:
            query = {
                'team_id': team_id,
                'reviewee_id': student_id
            }

        # Get all peer reviews for this student (as reviewee)
        reviews = find_many(PEER_REVIEWS, query)

        if not reviews:
            return jsonify({
                'student_id': student_id,
                'team_id': team_id,
                'message': 'No peer reviews found for this student',
                'overall_soft_skills_score': 0,
                'dimension_scores': {},
                'total_reviews_received': 0,
                'has_self_review': False,
                'self_vs_peer_discrepancy': None,
                'soft_skills': {} # Backwards compat
            }), 200

        # Aggregate ratings by dimension (outlier-resistant)
        dimension_scores = {}

        for dimension in SOFT_SKILL_DIMENSIONS.keys():
            ratings = [review['ratings'].get(dimension, 0) for review in reviews if dimension in review.get('ratings', {})]

            if ratings:
                # Remove outliers (Paper 11.pdf: "outlier-resistant aggregation")
                ratings_sorted = sorted(ratings)
                # Remove top and bottom 10% if enough data
                if len(ratings) >= 5:
                    trim_count = max(1, len(ratings) // 10)
                    ratings_trimmed = ratings_sorted[trim_count:-trim_count]
                else:
                    ratings_trimmed = ratings_sorted

                avg_rating = statistics.mean(ratings_trimmed)
                std_dev = statistics.stdev(ratings_trimmed) if len(ratings_trimmed) > 1 else 0

                dimension_scores[dimension] = {
                    'average_rating': round(avg_rating, 2),
                    'std_deviation': round(std_dev, 2),
                    'review_count': len(ratings),
                    'rating_out_of_100': round((avg_rating / 5) * 100, 1),
                    'level': 'HIGH' if avg_rating >= 4 else 'MODERATE' if avg_rating >= 3 else 'LOW',
                    'dimension_name': SOFT_SKILL_DIMENSIONS[dimension]['name']
                }

        # Calculate overall soft skills score (average across dimensions)
        overall_score = sum(d['rating_out_of_100'] for d in dimension_scores.values()) / len(dimension_scores) if dimension_scores else 0

        # Get self-review for comparison
        self_query = {
            'reviewer_id': student_id,
            'reviewee_id': student_id
        }
        if team_id:
            self_query['team_id'] = team_id
            
        self_reviews = find_many(PEER_REVIEWS, self_query)
        
        # If multiple self-reviews (cross-team), average them or pick most recent?
        # For simplicity, let's take the most recent one to compare against current perception
        self_review = self_reviews[-1] if self_reviews else None

        response = {
            'student_id': student_id,
            'team_id': team_id,
            'overall_soft_skills_score': round(overall_score, 1),
            'dimension_scores': dimension_scores,
            'total_reviews_received': len(reviews),
            'has_self_review': self_review is not None,
            'self_vs_peer_discrepancy': None
        }

        # Calculate self vs peer discrepancy
        if self_review:
            discrepancies = {}
            for dimension in SOFT_SKILL_DIMENSIONS.keys():
                self_rating = self_review['ratings'].get(dimension, 0)
                peer_avg = dimension_scores.get(dimension, {}).get('average_rating', 0)
                discrepancies[dimension] = round(self_rating - peer_avg, 2)

            response['self_vs_peer_discrepancy'] = discrepancies

        logger.info(f"Soft skills retrieved | student_id: {student_id} | team_id: {team_id} | overall_score: {overall_score}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error fetching soft skills | student_id: {student_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/teams/<team_id>/soft-skills-summary', methods=['GET'])
def get_team_soft_skills_summary(team_id):
    """
    BR5: Get soft skills summary for entire team

    GET /api/pbl-workflow/teams/{team_id}/soft-skills-summary
    """
    try:
        # Get team members
        team = find_one(TEAMS, {'_id': team_id})

        if not team:
            return jsonify({'error': 'Team not found'}), 404

        members = team.get('members', [])

        team_summary = []

        for student_id in members:
            student = find_one(STUDENTS, {'_id': student_id})

            # Get peer reviews for this student
            reviews = find_many(
                PEER_REVIEWS,
                {
                    'team_id': team_id,
                    'reviewee_id': student_id
                }
            )

            # Calculate aggregate scores
            dimension_scores = {}
            for dimension in SOFT_SKILL_DIMENSIONS.keys():
                ratings = [review['ratings'].get(dimension, 0) for review in reviews if dimension in review.get('ratings', {})]

                if ratings:
                    avg_rating = statistics.mean(ratings)
                    dimension_scores[dimension] = round((avg_rating / 5) * 100, 1)
                else:
                    dimension_scores[dimension] = 0

            overall_score = sum(dimension_scores.values()) / len(dimension_scores) if dimension_scores else 0

            team_summary.append({
                'student_id': student_id,
                'student_name': student.get('name', 'Unknown') if student else 'Unknown',
                'overall_soft_skills_score': round(overall_score, 1),
                'dimension_scores': dimension_scores,
                'review_count': len(reviews)
            })

        # Sort by overall score (lowest first for intervention prioritization)
        team_summary.sort(key=lambda x: x['overall_soft_skills_score'])

        response = {
            'team_id': team_id,
            'team_name': team.get('team_name'),
            'member_count': len(members),
            'team_summary': team_summary,
            'team_average_score': round(
                sum(m['overall_soft_skills_score'] for m in team_summary) / len(team_summary), 1
            ) if team_summary else 0
        }

        logger.info(f"Team soft skills summary generated | team_id: {team_id} | members: {len(members)}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error fetching team soft skills summary | team_id: {team_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/classrooms/<classroom_id>/soft-skills-summary', methods=['GET'])
def get_classroom_soft_skills_summary(classroom_id):
    """
    BR5: Get aggregate soft skills summary for an entire classroom
    
    GET /api/pbl-workflow/classrooms/{classroom_id}/soft-skills-summary
    """
    try:
        # Get classroom
        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404
            
        # Get all projects for this classroom
        projects = find_many(PROJECTS, {'classroom_id': classroom_id})
        project_ids = [p['_id'] for p in projects]
        
        # Get all teams in these projects
        teams = find_many(TEAMS, {'project_id': {'$in': project_ids}})
        team_ids = [t['_id'] for t in teams]
        
        # Get all peer reviews for these teams
        all_reviews = find_many(PEER_REVIEWS, {'team_id': {'$in': team_ids}})
        
        # Aggregate scores by dimension
        dimension_totals = {}
        dimension_counts = {}
        
        for dimension in SOFT_SKILL_DIMENSIONS.keys():
            dimension_totals[dimension] = 0
            dimension_counts[dimension] = 0
            
        for review in all_reviews:
            ratings = review.get('ratings', {})
            for dim, score in ratings.items():
                if dim in dimension_totals:
                    dimension_totals[dim] += score
                    dimension_counts[dim] += 1
        
        # Calculate averages (out of 100)
        dimension_scores = []
        for dim, total in dimension_totals.items():
            count = dimension_counts[dim]
            avg_rating = total / count if count > 0 else 0
            score_out_of_100 = round((avg_rating / 5) * 100, 1)
            
            dimension_scores.append({
                'skill': SOFT_SKILL_DIMENSIONS[dim]['name'],
                'dimension': dim,
                'score': score_out_of_100,
                'review_count': count,
                'color': SOFT_SKILL_DIMENSIONS[dim].get('color', 'text-gray-500')
            })
            
        # Add class average score
        class_average = sum(d['score'] for d in dimension_scores) / len(dimension_scores) if dimension_scores else 0

        return jsonify({
            'classroom_id': classroom_id,
            'total_reviews': len(all_reviews),
            'dimension_scores': dimension_scores,
            'class_average_score': round(class_average, 1)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching classroom soft skills | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# PBL STAGE INFORMATION
# ============================================================================

@pbl_workflow_bp.route('/stages', methods=['GET'])
def get_pbl_stages():
    """
    Get information about 5-stage PBL workflow

    GET /api/pbl-workflow/stages
    """
    try:
        return jsonify({
            'stages': PBL_STAGES,
            'total_stages': len(PBL_STAGES),
            'research_source': 'Paper 11.pdf: Five-stage PBL process'
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/dimensions', methods=['GET'])
def get_soft_skill_dimensions():
    """
    Get information about 4D soft skills framework

    GET /api/pbl-workflow/dimensions
    """
    try:
        return jsonify({
            'dimensions': SOFT_SKILL_DIMENSIONS,
            'total_dimensions': len(SOFT_SKILL_DIMENSIONS),
            'validation': {
                'cronbach_alpha': '0.972 - 0.980',
                'inter_dimension_correlation': '>0.82',
                'research_source': 'Paper 11.pdf: Team Effectiveness Diagnostic'
            }
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_workflow_bp.route('/students/<student_id>/projects', methods=['GET'])
def get_student_projects(student_id):
    try:
        memberships = find_many(TEAMS, {'members': student_id})
        project_ids = list(set([m['project_id'] for m in memberships]))
        projects = find_many(PROJECTS, {'_id': {'$in': project_ids}}, sort=[('created_at', -1)])

        result = []
        for project in projects:
            team = find_one(TEAMS, {'project_id': project['_id'], 'members': student_id})
            result.append({
                'project_id': project['_id'],
                'title': project.get('title'),
                'stage': project.get('stage'),
                'deadline': project.get('deadline').isoformat() if project.get('deadline') else None,
                'status': project.get('status'),
                'team_id': team['_id'] if team else None,
                'team_name': team.get('team_name') if team else None
            })

        return jsonify({'student_id': student_id, 'projects': result, 'total': len(result)}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/students/<student_id>/teams', methods=['GET'])
def get_student_teams(student_id):
    try:
        logger.info(f"[GET_STUDENT_TEAMS] Request received | student_id: {student_id}")

        teams = find_many(TEAMS, {'members': student_id})
        logger.info(f"[GET_STUDENT_TEAMS] Teams found | student_id: {student_id} | count: {len(teams)}")

        result = []
        for team in teams:
            project = find_one(PROJECTS, {'_id': team['project_id']})
            team_data = {
                'team_id': team['_id'],
                'team_name': team.get('team_name'),
                'project_id': team.get('project_id'),
                'project_title': project.get('title') if project else None,
                'member_count': len(team.get('members', [])),
                'role': team.get('roles', {}).get(student_id, 'Member'),
                'status': team.get('status', 'active')
            }
            result.append(team_data)
            logger.info(f"[GET_STUDENT_TEAMS] Team processed | team_id: {team['_id']} | project_title: {team_data['project_title']}")

        logger.info(f"[GET_STUDENT_TEAMS] SUCCESS | student_id: {student_id} | teams_count: {len(result)}")
        return jsonify({'student_id': student_id, 'teams': result, 'total': len(result)}), 200
    except Exception as e:
        logger.error(f"[GET_STUDENT_TEAMS] ERROR | student_id: {student_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/projects/<project_id>/deliverable', methods=['POST'])
def submit_deliverable(project_id):
    try:
        data = request.json
        required = ['team_id', 'submitted_by', 'deliverable_type', 'file_url']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        deliverable_doc = {
            '_id': str(ObjectId()),
            'project_id': project_id,
            'team_id': data['team_id'],
            'submitted_by': data['submitted_by'],
            'deliverable_type': data['deliverable_type'],
            'file_url': data['file_url'],
            'title': data.get('title', 'Project Deliverable'),
            'description': data.get('description', ''),
            'submitted_at': datetime.utcnow(),
            'graded': False,
            'grade': None
        }

        deliverable_id = insert_one(PROJECT_DELIVERABLES, deliverable_doc)
        logger.info(f"Deliverable submitted | project_id: {project_id} | team_id: {data['team_id']}")

        return jsonify({'deliverable_id': deliverable_id, 'message': 'Deliverable submitted successfully'}), 201
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/projects/<project_id>/grade', methods=['POST'])
def grade_project(project_id):
    try:
        data = request.json
        required = ['team_id', 'teacher_id', 'grade', 'feedback']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        grade_doc = {
            '_id': str(ObjectId()),
            'project_id': project_id,
            'team_id': data['team_id'],
            'teacher_id': data['teacher_id'],
            'grade': data['grade'],
            'feedback': data['feedback'],
            'rubric_scores': data.get('rubric_scores', {}),
            'graded_at': datetime.utcnow()
        }

        grade_id = insert_one(PROJECT_GRADES, grade_doc)
        update_one(PROJECTS, {'_id': project_id}, {'$set': {'status': 'graded', 'final_grade': data['grade']}})

        logger.info(f"Project graded | project_id: {project_id} | grade: {data['grade']}")

        return jsonify({'grade_id': grade_id, 'message': 'Project graded successfully'}), 201
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/teams/<team_id>/members/<student_id>', methods=['DELETE'])
def remove_team_member(team_id, student_id):
    try:
        team = find_one(TEAMS, {'_id': team_id})
        if not team:
            return jsonify({'error': 'Team not found'}), 404

        update_one(TEAMS, {'_id': team_id}, {'$pull': {'members': student_id}, '$unset': {f'roles.{student_id}': ''}})
        logger.info(f"Member removed | team_id: {team_id} | student_id: {student_id}")

        return jsonify({'message': 'Member removed successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/teams/<team_id>', methods=['PUT'])
def update_team(team_id):
    try:
        data = request.json
        update_data = {}
        if 'team_name' in data:
            update_data['team_name'] = data['team_name']
        if 'status' in data:
            update_data['status'] = data['status']

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            result = update_one(TEAMS, {'_id': team_id}, {'$set': update_data})
            if result == 0:
                return jsonify({'error': 'Team not found'}), 404

            logger.info(f"Team updated | team_id: {team_id}")
            return jsonify({'message': 'Team updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    try:
        data = request.json
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'assigned_to' in data:
            update_data['assigned_to'] = data['assigned_to']
        if 'due_date' in data:
            update_data['due_date'] = datetime.fromisoformat(data['due_date'])
        if 'priority' in data:
            update_data['priority'] = data['priority']
        if 'status' in data:
            valid_statuses = ['todo', 'in_progress', 'completed']
            if data['status'] not in valid_statuses:
                return jsonify({'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
            update_data['status'] = data['status']
            if data['status'] == 'completed':
                update_data['completed_at'] = datetime.utcnow()

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            result = update_one(PROJECT_TASKS, {'_id': task_id}, {'$set': update_data})
            if result == 0:
                return jsonify({'error': 'Task not found'}), 404

            logger.info(f"Task updated | task_id: {task_id}")
            return jsonify({'message': 'Task updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/teams/<team_id>/peer-reviews', methods=['GET'])
def get_team_peer_reviews(team_id):
    try:
        reviews = find_many(PEER_REVIEWS, {'team_id': team_id}, sort=[('submitted_at', -1)])
        result = []
        for review in reviews:
            reviewer = find_one(STUDENTS, {'_id': review['reviewer_id']})
            reviewee = find_one(STUDENTS, {'_id': review['reviewee_id']})
            result.append({
                'review_id': review['_id'],
                'reviewer_id': review['reviewer_id'],
                'reviewer_name': reviewer.get('name') if reviewer else 'Unknown',
                'reviewee_id': review['reviewee_id'],
                'reviewee_name': reviewee.get('name') if reviewee else 'Unknown',
                'review_type': review.get('review_type'),
                'ratings': review.get('ratings'),
                'is_self_review': review.get('is_self_review', False),
                'submitted_at': review.get('submitted_at').isoformat() if review.get('submitted_at') else None
            })

        return jsonify({'team_id': team_id, 'reviews': result, 'total': len(result)}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

def award_achievement(team_id, achievement_type):
    try:
        if achievement_type not in ACHIEVEMENT_TYPES:
            return None

        achievement_info = ACHIEVEMENT_TYPES[achievement_type]

        existing = find_one(TEAM_ACHIEVEMENTS, {
            'team_id': team_id,
            'achievement_type': achievement_type
        })
        if existing:
            return None

        achievement_doc = {
            '_id': str(ObjectId()),
            'team_id': team_id,
            'achievement_type': achievement_type,
            'name': achievement_info['name'],
            'xp': achievement_info['xp'],
            'icon': achievement_info['icon'],
            'earned_at': datetime.utcnow()
        }

        achievement_id = insert_one(TEAM_ACHIEVEMENTS, achievement_doc)

        progress = find_one(TEAM_PROGRESS, {'team_id': team_id})
        if progress:
            update_one(
                TEAM_PROGRESS,
                {'team_id': team_id},
                {'$inc': {'total_xp': achievement_info['xp']}}
            )

        logger.info(f"Achievement awarded | team_id: {team_id} | type: {achievement_type} | xp: {achievement_info['xp']}")
        return achievement_id
    except Exception as e:
        logger.error(f"Error awarding achievement | error: {str(e)}")
        return None

def initialize_team_progress(team_id, project_id):
    try:
        existing = find_one(TEAM_PROGRESS, {'team_id': team_id})
        if existing:
            return existing['_id']

        progress_doc = {
            '_id': str(ObjectId()),
            'team_id': team_id,
            'project_id': project_id,
            'current_level': 1,
            'total_xp': 0,
            'milestones_completed': 0,
            'current_milestone_index': 0,
            'unlocked_milestones': [],
            'locked_milestones': [],
            'completion_percentage': 0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        progress_id = insert_one(TEAM_PROGRESS, progress_doc)
        logger.info(f"Team progress initialized | team_id: {team_id} | project_id: {project_id}")
        return progress_id
    except Exception as e:
        logger.error(f"Error initializing team progress | error: {str(e)}")
        return None

@pbl_workflow_bp.route('/projects/<project_id>/milestones/<milestone_id>/submit', methods=['POST'])
def submit_milestone_for_approval(project_id, milestone_id):
    try:
        data = request.json
        logger.info(f"[SUBMIT_MILESTONE] Request received | project_id: {project_id} | milestone_id: {milestone_id} | team_id: {data.get('team_id')}")

        if 'team_id' not in data:
            logger.warning(f"[SUBMIT_MILESTONE] Missing team_id | project_id: {project_id} | milestone_id: {milestone_id}")
            return jsonify({'error': 'Missing required field: team_id'}), 400

        team_id = data['team_id']

        milestone = find_one(PROJECT_MILESTONES, {'_id': milestone_id, 'project_id': project_id})
        if not milestone:
            logger.warning(f"[SUBMIT_MILESTONE] Milestone not found | project_id: {project_id} | milestone_id: {milestone_id}")
            return jsonify({'error': 'Milestone not found'}), 404

        logger.info(f"[SUBMIT_MILESTONE] Milestone found | milestone_id: {milestone_id} | title: {milestone.get('title')} | is_completed: {milestone.get('is_completed')}")

        if milestone.get('is_completed'):
            logger.warning(f"[SUBMIT_MILESTONE] Milestone already completed | milestone_id: {milestone_id} | team_id: {team_id}")
            return jsonify({'error': 'Milestone already completed'}), 400

        progress = find_one(TEAM_PROGRESS, {'team_id': team_id})
        if not progress:
            logger.info(f"[SUBMIT_MILESTONE] Team progress not found, initializing | team_id: {team_id} | project_id: {project_id}")
            initialize_team_progress(team_id, project_id)
            progress = find_one(TEAM_PROGRESS, {'team_id': team_id})

        milestones = find_many(
            PROJECT_MILESTONES,
            {'project_id': project_id},
            sort=[('due_date', 1)]
        )
        logger.info(f"[SUBMIT_MILESTONE] Milestones retrieved | project_id: {project_id} | total_milestones: {len(milestones)}")

        milestone_order = {m['_id']: idx for idx, m in enumerate(milestones)}
        current_index = milestone_order.get(milestone_id, 0)
        logger.info(f"[SUBMIT_MILESTONE] Milestone order | milestone_id: {milestone_id} | current_index: {current_index} | total: {len(milestones)}")

        if current_index > 0:
            prev_milestone = milestones[current_index - 1]
            if not prev_milestone.get('is_completed'):
                logger.warning(f"[SUBMIT_MILESTONE] Sequential validation failed | milestone_id: {milestone_id} | prev_milestone_id: {prev_milestone['_id']} | prev_completed: {prev_milestone.get('is_completed')}")
                return jsonify({'error': 'Previous milestone must be completed first'}), 400

        logger.info(f"[SUBMIT_MILESTONE] Sequential validation passed | milestone_id: {milestone_id} | team_id: {team_id}")

        update_one(
            PROJECT_MILESTONES,
            {'_id': milestone_id},
            {'$set': {
                'pending_approval': True,
                'submitted_by_team': team_id,
                'submitted_at': datetime.utcnow(),
                'submission_notes': data.get('notes', ''),
                'report_url': data.get('report_url'),
                'zip_url': data.get('zip_url')
            }}
        )

        logger.info(f"[SUBMIT_MILESTONE] SUCCESS | milestone_id: {milestone_id} | team_id: {team_id} | project_id: {project_id} | status: pending_approval | notes_length: {len(data.get('notes', ''))}")

        return jsonify({
            'message': 'Milestone submitted for teacher approval',
            'milestone_id': milestone_id,
            'status': 'pending_approval'
        }), 200

    except Exception as e:
        logger.error(f"[SUBMIT_MILESTONE] ERROR | project_id: {project_id} | milestone_id: {milestone_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/projects/<project_id>/milestones/<milestone_id>/approve', methods=['POST'])
def approve_milestone(project_id, milestone_id):
    try:
        data = request.json
        teacher_id = data.get('teacher_id')
        logger.info(f"[APPROVE_MILESTONE] Request received | project_id: {project_id} | milestone_id: {milestone_id} | teacher_id: {teacher_id}")

        if not teacher_id:
            logger.warning(f"[APPROVE_MILESTONE] Missing teacher_id | project_id: {project_id} | milestone_id: {milestone_id}")
            return jsonify({'error': 'Missing required field: teacher_id'}), 400

        milestone = find_one(PROJECT_MILESTONES, {'_id': milestone_id, 'project_id': project_id})
        if not milestone:
            logger.warning(f"[APPROVE_MILESTONE] Milestone not found | project_id: {project_id} | milestone_id: {milestone_id}")
            return jsonify({'error': 'Milestone not found'}), 404

        logger.info(f"[APPROVE_MILESTONE] Milestone found | milestone_id: {milestone_id} | title: {milestone.get('title')} | pending_approval: {milestone.get('pending_approval')}")

        if not milestone.get('pending_approval'):
            logger.warning(f"[APPROVE_MILESTONE] Milestone not pending approval | milestone_id: {milestone_id} | pending_approval: {milestone.get('pending_approval')}")
            return jsonify({'error': 'Milestone not pending approval'}), 400

        team_id = milestone.get('submitted_by_team')
        if not team_id:
            logger.warning(f"[APPROVE_MILESTONE] No team associated | milestone_id: {milestone_id}")
            return jsonify({'error': 'No team associated with this submission'}), 404

        logger.info(f"[APPROVE_MILESTONE] Validation passed | milestone_id: {milestone_id} | team_id: {team_id}")

        update_one(
            PROJECT_MILESTONES,
            {'_id': milestone_id},
            {'$set': {
                'is_completed': True,
                'completed_at': datetime.utcnow(),
                'approved_by': teacher_id,
                'pending_approval': False,
                'teacher_feedback': data.get('feedback', '')
            }}
        )
        logger.info(f"[APPROVE_MILESTONE] Milestone marked as completed | milestone_id: {milestone_id} | approved_by: {teacher_id}")

        progress = find_one(TEAM_PROGRESS, {'team_id': team_id})
        if not progress:
            logger.info(f"[APPROVE_MILESTONE] Team progress not found, initializing | team_id: {team_id} | project_id: {project_id}")
            initialize_team_progress(team_id, project_id)
            progress = find_one(TEAM_PROGRESS, {'team_id': team_id})

        logger.info(f"[APPROVE_MILESTONE] Team progress retrieved | team_id: {team_id} | current_level: {progress.get('current_level')} | total_xp: {progress.get('total_xp')}")

        milestones = find_many(
            PROJECT_MILESTONES,
            {'project_id': project_id},
            sort=[('due_date', 1)]
        )

        completed_count = sum(1 for m in milestones if m.get('is_completed'))
        milestone_order = {m['_id']: idx for idx, m in enumerate(milestones)}
        current_index = milestone_order.get(milestone_id, 0)

        logger.info(f"[APPROVE_MILESTONE] Calculating XP and level | milestone_id: {milestone_id} | completed_count: {completed_count} | current_index: {current_index} | total_milestones: {len(milestones)}")

        xp_earned = MILESTONE_XP_BASE + (current_index * MILESTONE_BONUS_PER_LEVEL)

        new_level = (completed_count // 3) + 1
        completion_pct = round((completed_count / len(milestones)) * 100, 1) if milestones else 0

        logger.info(f"[APPROVE_MILESTONE] XP and level calculated | team_id: {team_id} | xp_earned: {xp_earned} | new_level: {new_level} | completion_pct: {completion_pct}%")

        unlocked = [m['_id'] for idx, m in enumerate(milestones) if idx <= current_index + 1]
        locked = [m['_id'] for idx, m in enumerate(milestones) if idx > current_index + 1]
        logger.info(f"[APPROVE_MILESTONE] Milestone locks calculated | team_id: {team_id} | unlocked_count: {len(unlocked)} | locked_count: {len(locked)}")

        update_one(
            TEAM_PROGRESS,
            {'team_id': team_id},
            {'$set': {
                'current_level': new_level,
                'milestones_completed': completed_count,
                'current_milestone_index': current_index + 1,
                'unlocked_milestones': unlocked,
                'locked_milestones': locked,
                'completion_percentage': completion_pct,
                'updated_at': datetime.utcnow()
            }, '$inc': {
                'total_xp': xp_earned
            }}
        )
        logger.info(f"[APPROVE_MILESTONE] Team progress updated | team_id: {team_id} | new_level: {new_level} | completed: {completed_count} | xp_added: {xp_earned}")

        award_achievement(team_id, 'MILESTONE_COMPLETED')
        logger.info(f"[APPROVE_MILESTONE] Achievement awarded: MILESTONE_COMPLETED | team_id: {team_id}")

        if completed_count == 1:
            award_achievement(team_id, 'FIRST_MILESTONE')
            logger.info(f"[APPROVE_MILESTONE] Achievement awarded: FIRST_MILESTONE | team_id: {team_id}")

        if completed_count == len(milestones) // 2:
            award_achievement(team_id, 'HALFWAY_POINT')
            logger.info(f"[APPROVE_MILESTONE] Achievement awarded: HALFWAY_POINT | team_id: {team_id}")

        if completed_count == len(milestones):
            award_achievement(team_id, 'ALL_MILESTONES')
            logger.info(f"[APPROVE_MILESTONE] Achievement awarded: ALL_MILESTONES | team_id: {team_id}")

        days_early = 0
        if milestone.get('due_date'):
            days_early = (milestone['due_date'] - datetime.utcnow()).days
            if days_early > 2:
                award_achievement(team_id, 'EARLY_COMPLETION')
                logger.info(f"[APPROVE_MILESTONE] Achievement awarded: EARLY_COMPLETION | team_id: {team_id} | days_early: {days_early}")

        logger.info(f"[APPROVE_MILESTONE] SUCCESS | milestone_id: {milestone_id} | team_id: {team_id} | xp_earned: {xp_earned} | new_level: {new_level} | completion: {completion_pct}% | unlocked_next: {current_index + 1 < len(milestones)}")

        return jsonify({
            'message': 'Milestone approved successfully',
            'milestone_id': milestone_id,
            'xp_earned': xp_earned,
            'team_level': new_level,
            'completion_percentage': completion_pct,
            'next_milestone_unlocked': current_index + 1 < len(milestones)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/projects/<project_id>/milestones/<milestone_id>/reject', methods=['POST'])
def reject_milestone(project_id, milestone_id):
    try:
        data = request.json
        teacher_id = data.get('teacher_id')

        if not teacher_id:
            return jsonify({'error': 'Missing required field: teacher_id'}), 400

        milestone = find_one(PROJECT_MILESTONES, {'_id': milestone_id, 'project_id': project_id})
        if not milestone:
            return jsonify({'error': 'Milestone not found'}), 404

        update_one(
            PROJECT_MILESTONES,
            {'_id': milestone_id},
            {'$set': {
                'pending_approval': False,
                'rejected_at': datetime.utcnow(),
                'rejected_by': teacher_id,
                'rejection_reason': data.get('reason', 'Does not meet requirements'),
                'teacher_feedback': data.get('feedback', '')
            }}
        )

        logger.info(f"Milestone rejected | milestone_id: {milestone_id} | teacher_id: {teacher_id}")

        return jsonify({
            'message': 'Milestone rejected',
            'milestone_id': milestone_id,
            'feedback': data.get('feedback', '')
        }), 200

    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/teams/<team_id>/progress', methods=['GET'])
def get_team_progress(team_id):
    try:
        logger.info(f"[GET_TEAM_PROGRESS] Request received | team_id: {team_id}")
        progress = find_one(TEAM_PROGRESS, {'team_id': team_id})
        
        # Lazy Initialization: If progress doesn't exist, create it on the fly
        if not progress:
            logger.info(f"[GET_TEAM_PROGRESS] Progress missing, attempting lazy init | team_id: {team_id}")
            team = find_one(TEAMS, {'_id': team_id})
            if not team:
                return jsonify({'error': 'Team not found'}), 404
                
            project_id = team.get('project_id')
            if project_id:
                initialize_team_progress(team_id, project_id)
                progress = find_one(TEAM_PROGRESS, {'team_id': team_id})
                logger.info(f"[GET_TEAM_PROGRESS] Lazy init successful | team_id: {team_id} | project_id: {project_id}")
            else:
                logger.warning(f"[GET_TEAM_PROGRESS] Cannot lazy init: Team has no project_id | team_id: {team_id}")

        if not progress:
            logger.warning(f"[GET_TEAM_PROGRESS] Team progress not found (after init attempt) | team_id: {team_id}")
            return jsonify({'error': 'Team progress not found'}), 404

        logger.info(f"[GET_TEAM_PROGRESS] Progress found | team_id: {team_id} | level: {progress.get('current_level')} | xp: {progress.get('total_xp')} | completion: {progress.get('completion_percentage')}%")

        achievements = find_many(TEAM_ACHIEVEMENTS, {'team_id': team_id}, sort=[('earned_at', -1)])
        logger.info(f"[GET_TEAM_PROGRESS] Achievements retrieved | team_id: {team_id} | achievement_count: {len(achievements)}")

        milestones = find_many(
            PROJECT_MILESTONES,
            {'project_id': progress['project_id']},
            sort=[('due_date', 1)]
        )
        logger.info(f"[GET_TEAM_PROGRESS] Milestones retrieved | team_id: {team_id} | project_id: {progress['project_id']} | total_milestones: {len(milestones)}")

        unlocked_data = []
        locked_data = []

        for idx, milestone in enumerate(milestones):
            milestone_data = {
                'milestone_id': milestone['_id'],
                'title': milestone.get('title'),
                'order': idx + 1,
                'is_completed': milestone.get('is_completed', False),
                'pending_approval': milestone.get('pending_approval', False),
                'due_date': milestone.get('due_date').isoformat() if milestone.get('due_date') else None
            }

            if idx <= progress.get('current_milestone_index', 0):
                unlocked_data.append(milestone_data)
            else:
                locked_data.append(milestone_data)

        logger.info(f"[GET_TEAM_PROGRESS] SUCCESS | team_id: {team_id} | unlocked: {len(unlocked_data)} | locked: {len(locked_data)} | level: {progress.get('current_level')} | xp: {progress.get('total_xp')}")

        return jsonify({
            'team_id': team_id,
            'project_id': progress['project_id'],
            'current_level': progress.get('current_level', 1),
            'total_xp': progress.get('total_xp', 0),
            'milestones_completed': progress.get('milestones_completed', 0),
            'completion_percentage': progress.get('completion_percentage', 0),
            'unlocked_milestones': unlocked_data,
            'locked_milestones': locked_data,
            'achievements': [
                {
                    'achievement_id': a['_id'],
                    'name': a.get('name'),
                    'icon': a.get('icon'),
                    'xp': a.get('xp'),
                    'earned_at': a.get('earned_at').isoformat() if a.get('earned_at') else None
                }
                for a in achievements
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@pbl_workflow_bp.route('/teams/<team_id>/achievements', methods=['GET'])
def get_team_achievements(team_id):
    try:
        achievements = find_many(TEAM_ACHIEVEMENTS, {'team_id': team_id}, sort=[('earned_at', -1)])

        total_xp = sum(a.get('xp', 0) for a in achievements)

        return jsonify({
            'team_id': team_id,
            'total_achievements': len(achievements),
            'total_xp': total_xp,
            'achievements': [
                {
                    'achievement_id': a['_id'],
                    'type': a.get('achievement_type'),
                    'name': a.get('name'),
                    'icon': a.get('icon'),
                    'xp': a.get('xp'),
                    'earned_at': a.get('earned_at').isoformat() if a.get('earned_at') else None
                }
                for a in achievements
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

logger.info("PBL Workflow routes initialized successfully")
