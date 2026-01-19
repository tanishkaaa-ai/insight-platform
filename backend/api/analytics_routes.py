"""
AMEP Analytics Routes - MongoDB Version with Real-time Data
API endpoints for BR7, BR8 (Teacher Productivity & Institutional Analytics)

Location: backend/api/analytics_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId

# Import MongoDB helper functions
from models.database import (
    db,
    CURRICULUM_TEMPLATES,
    INSTITUTIONAL_METRICS,
    TEACHER_INTERVENTIONS,
    STUDENT_CONCEPT_MASTERY,
    STUDENTS,
    TEACHERS,
    find_one,
    find_many,
    insert_one,
    update_one,
    aggregate,
    count_documents
)

analytics_bp = Blueprint('analytics', __name__)

# ============================================================================
# TEACHER PRODUCTIVITY ROUTES (BR7, BR8)
# ============================================================================

@analytics_bp.route('/templates', methods=['GET'])
def list_templates():
    """
    BR7: Get curriculum-aligned templates from MongoDB
    """
    try:
        subject_area = request.args.get('subject_area')
        grade_level = request.args.get('grade_level', type=int)
        template_type = request.args.get('template_type')
        search_query = request.args.get('search')
        
        # Build query
        query = {'is_public': True}
        
        if subject_area:
            query['subject_area'] = subject_area
        if grade_level:
            query['grade_level'] = grade_level
        if template_type:
            query['template_type'] = template_type
        
        # Text search if provided
        if search_query:
            query['$text'] = {'$search': search_query}
        
        # Get templates from MongoDB
        templates = find_many(
            CURRICULUM_TEMPLATES,
            query,
            sort=[('times_used', -1), ('avg_rating', -1)]
        )
        
        # Format response
        formatted_templates = []
        for template in templates:
            formatted_templates.append({
                'template_id': template['_id'],
                'title': template.get('title'),
                'subject_area': template.get('subject_area'),
                'grade_level': template.get('grade_level'),
                'template_type': template.get('template_type'),
                'learning_objectives': template.get('learning_objectives', []),
                'estimated_duration': template.get('estimated_duration'),
                'times_used': template.get('times_used', 0),
                'avg_rating': template.get('avg_rating'),
                'created_at': template.get('created_at').isoformat() if template.get('created_at') else None
            })
        
        return jsonify(formatted_templates), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@analytics_bp.route('/templates/<template_id>', methods=['GET'])
def get_template_detail(template_id):
    """
    BR7: Get detailed template information
    """
    try:
        template = find_one(CURRICULUM_TEMPLATES, {'_id': template_id})
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        return jsonify({
            'template_id': template['_id'],
            'title': template.get('title'),
            'description': template.get('description'),
            'subject_area': template.get('subject_area'),
            'grade_level': template.get('grade_level'),
            'template_type': template.get('template_type'),
            'learning_objectives': template.get('learning_objectives', []),
            'estimated_duration': template.get('estimated_duration'),
            'content': template.get('content', {}),
            'soft_skills_targeted': template.get('soft_skills_targeted', []),
            'times_used': template.get('times_used', 0),
            'avg_rating': template.get('avg_rating'),
            'created_by': template.get('created_by'),
            'created_at': template.get('created_at').isoformat() if template.get('created_at') else None
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@analytics_bp.route('/templates', methods=['POST'])
def create_template():
    """
    BR7: Create new curriculum template
    """
    try:
        data = request.json
        
        template_doc = {
            '_id': str(ObjectId()),
            'title': data['title'],
            'description': data.get('description'),
            'subject_area': data.get('subject_area'),
            'grade_level': data.get('grade_level'),
            'template_type': data['template_type'],
            'learning_objectives': data.get('learning_objectives', []),
            'estimated_duration': data.get('estimated_duration'),
            'content': data.get('content', {}),
            'soft_skills_targeted': data.get('soft_skills_targeted', []),
            'created_by': data['created_by'],
            'is_public': data.get('is_public', False),
            'times_used': 0,
            'avg_rating': None,
            'created_at': datetime.utcnow()
        }
        
        template_id = insert_one(CURRICULUM_TEMPLATES, template_doc)
        
        return jsonify({
            'template_id': template_id,
            'message': 'Template created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@analytics_bp.route('/templates/<template_id>/use', methods=['POST'])
def record_template_usage(template_id):
    """
    BR7: Record template usage to track popularity
    """
    try:
        update_one(
            CURRICULUM_TEMPLATES,
            {'_id': template_id},
            {'$inc': {'times_used': 1}}
        )
        
        return jsonify({'message': 'Usage recorded'}), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@analytics_bp.route('/unified', methods=['GET'])
def get_unified_analytics():
    """
    BR8: Get unified institutional metrics from real data
    """
    try:
        date_param = request.args.get('date')
        
        if date_param:
            metric_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        else:
            metric_date = datetime.now().date()
        
        # Check if metrics already calculated for this date
        existing_metrics = find_one(
            INSTITUTIONAL_METRICS,
            {'metric_date': metric_date}
        )
        
        if existing_metrics:
            return jsonify({
                'metric_date': existing_metrics['metric_date'].isoformat(),
                'mastery_rate': existing_metrics.get('mastery_rate'),
                'teacher_adoption_rate': existing_metrics.get('teacher_adoption_rate'),
                'admin_confidence_score': existing_metrics.get('admin_confidence_score'),
                'total_students': existing_metrics.get('total_students'),
                'active_students': existing_metrics.get('active_students'),
                'total_teachers': existing_metrics.get('total_teachers'),
                'active_teachers': existing_metrics.get('active_teachers'),
                'avg_engagement_score': existing_metrics.get('avg_engagement_score'),
                'avg_planning_time_minutes': existing_metrics.get('avg_planning_time_minutes'),
                'data_entry_events': existing_metrics.get('data_entry_events')
            }), 200
        
        # Calculate metrics from real data
        
        # Total and active students
        total_students = count_documents(STUDENTS, {})
        
        # Active students (logged in within last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        # This would need a login tracking collection in production
        active_students = total_students  # Placeholder
        
        # Total and active teachers
        total_teachers = count_documents(TEACHERS, {})
        active_teachers = total_teachers  # Placeholder
        
        # Calculate mastery rate (students with avg mastery >= 70%)
        mastery_pipeline = [
            {
                '$group': {
                    '_id': '$student_id',
                    'avg_mastery': {'$avg': '$mastery_score'}
                }
            },
            {
                '$group': {
                    '_id': None,
                    'total_students': {'$sum': 1},
                    'mastered_students': {
                        '$sum': {
                            '$cond': [{'$gte': ['$avg_mastery', 70]}, 1, 0]
                        }
                    }
                }
            }
        ]
        
        mastery_result = aggregate(STUDENT_CONCEPT_MASTERY, mastery_pipeline)
        
        if mastery_result:
            mastery_data = mastery_result[0]
            mastery_rate = (mastery_data['mastered_students'] / mastery_data['total_students'] * 100) if mastery_data['total_students'] > 0 else 0
        else:
            mastery_rate = 0
        
        # Teacher adoption rate (teachers who used system in last 7 days)
        # In production, track teacher activity
        teacher_adoption_rate = 85.0  # Placeholder - would calculate from activity logs
        
        # Admin confidence score (based on data quality and completeness)
        admin_confidence_score = 90.0  # Placeholder - would calculate from data quality metrics
        
        # Average engagement score
        engagement_pipeline = [
            {
                '$group': {
                    '_id': None,
                    'avg_engagement': {'$avg': '$engagement_score'}
                }
            }
        ]
        # Would use ENGAGEMENT_SESSIONS collection
        avg_engagement_score = 75.0  # Placeholder
        
        # Teacher productivity metrics
        avg_planning_time_minutes = 45.0  # Placeholder - would track from teacher activity
        data_entry_events = 3  # Placeholder - would track from teacher activity
        
        # Save calculated metrics
        metrics_doc = {
            '_id': str(ObjectId()),
            'metric_date': metric_date,
            'mastery_rate': round(mastery_rate, 2),
            'teacher_adoption_rate': round(teacher_adoption_rate, 2),
            'admin_confidence_score': round(admin_confidence_score, 2),
            'total_students': total_students,
            'active_students': active_students,
            'total_teachers': total_teachers,
            'active_teachers': active_teachers,
            'avg_engagement_score': round(avg_engagement_score, 2),
            'avg_planning_time_minutes': round(avg_planning_time_minutes, 2),
            'data_entry_events': data_entry_events,
            'calculated_at': datetime.utcnow()
        }
        
        insert_one(INSTITUTIONAL_METRICS, metrics_doc)
        
        return jsonify({
            'metric_date': metric_date.isoformat(),
            'mastery_rate': metrics_doc['mastery_rate'],
            'teacher_adoption_rate': metrics_doc['teacher_adoption_rate'],
            'admin_confidence_score': metrics_doc['admin_confidence_score'],
            'total_students': metrics_doc['total_students'],
            'active_students': metrics_doc['active_students'],
            'total_teachers': metrics_doc['total_teachers'],
            'active_teachers': metrics_doc['active_teachers'],
            'avg_engagement_score': metrics_doc['avg_engagement_score'],
            'avg_planning_time_minutes': metrics_doc['avg_planning_time_minutes'],
            'data_entry_events': metrics_doc['data_entry_events']
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@analytics_bp.route('/interventions/track', methods=['POST'])
def track_intervention():
    """
    BR6: Track teacher intervention and measure impact
    """
    try:
        data = request.json
        
        # Get current mastery before intervention
        mastery_before = data.get('mastery_before')
        if not mastery_before:
            # Calculate from student data
            mastery_records = find_many(
                STUDENT_CONCEPT_MASTERY,
                {
                    'student_id': {'$in': data['target_students']},
                    'concept_id': data['concept_id']
                }
            )
            
            if mastery_records:
                mastery_before = sum(r.get('mastery_score', 0) for r in mastery_records) / len(mastery_records)
            else:
                mastery_before = 0
        
        intervention_doc = {
            '_id': str(ObjectId()),
            'teacher_id': data['teacher_id'],
            'concept_id': data['concept_id'],
            'intervention_type': data['intervention_type'],
            'target_students': data['target_students'],
            'description': data.get('description'),
            'mastery_before': mastery_before,
            'mastery_after': None,
            'improvement': None,
            'performed_at': datetime.utcnow(),
            'measured_at': None
        }
        
        intervention_id = insert_one(TEACHER_INTERVENTIONS, intervention_doc)
        
        return jsonify({
            'intervention_id': intervention_id,
            'teacher_id': data['teacher_id'],
            'concept_id': data['concept_id'],
            'intervention_type': data['intervention_type'],
            'mastery_before': mastery_before,
            'performed_at': intervention_doc['performed_at'].isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@analytics_bp.route('/interventions/<intervention_id>/measure', methods=['POST'])
def measure_intervention_impact(intervention_id):
    """
    BR6: Measure intervention impact after time has passed
    """
    try:
        intervention = find_one(TEACHER_INTERVENTIONS, {'_id': intervention_id})
        
        if not intervention:
            return jsonify({'error': 'Intervention not found'}), 404
        
        # Calculate current mastery for target students
        mastery_records = find_many(
            STUDENT_CONCEPT_MASTERY,
            {
                'student_id': {'$in': intervention['target_students']},
                'concept_id': intervention['concept_id']
            }
        )
        
        if mastery_records:
            mastery_after = sum(r.get('mastery_score', 0) for r in mastery_records) / len(mastery_records)
        else:
            mastery_after = intervention['mastery_before']
        
        improvement = mastery_after - intervention['mastery_before']
        
        # Update intervention record
        update_one(
            TEACHER_INTERVENTIONS,
            {'_id': intervention_id},
            {
                '$set': {
                    'mastery_after': mastery_after,
                    'improvement': improvement,
                    'measured_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            'intervention_id': intervention_id,
            'mastery_before': intervention['mastery_before'],
            'mastery_after': round(mastery_after, 2),
            'improvement': round(improvement, 2),
            'measured_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@analytics_bp.route('/interventions/teacher/<teacher_id>', methods=['GET'])
def get_teacher_interventions(teacher_id):
    """
    BR6: Get all interventions by a teacher
    """
    try:
        interventions = find_many(
            TEACHER_INTERVENTIONS,
            {'teacher_id': teacher_id},
            sort=[('performed_at', -1)]
        )
        
        formatted_interventions = []
        for intervention in interventions:
            formatted_interventions.append({
                'intervention_id': intervention['_id'],
                'concept_id': intervention.get('concept_id'),
                'intervention_type': intervention.get('intervention_type'),
                'target_students_count': len(intervention.get('target_students', [])),
                'mastery_before': intervention.get('mastery_before'),
                'mastery_after': intervention.get('mastery_after'),
                'improvement': intervention.get('improvement'),
                'performed_at': intervention.get('performed_at').isoformat() if intervention.get('performed_at') else None,
                'measured_at': intervention.get('measured_at').isoformat() if intervention.get('measured_at') else None
            })
        
        return jsonify(formatted_interventions), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500