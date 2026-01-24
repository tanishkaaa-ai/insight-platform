"""
AMEP Engagement Routes - MongoDB Version with Real-time Data
API endpoints for BR4, BR6 (Engagement Detection & Teacher Feedback)

Location: backend/api/engagement_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId

# Import MongoDB helper functions
from models.database import (
    db,
    ENGAGEMENT_SESSIONS,
    ENGAGEMENT_LOGS,
    DISENGAGEMENT_ALERTS,
    LIVE_POLLS,
    POLL_RESPONSES,
    STUDENT_RESPONSES,
    CLASSROOM_SUBMISSIONS,
    STUDENTS,
    find_one,
    find_many,
    insert_one,
    update_one,
    aggregate,
    count_documents
)

# Import AI engines
from ai_engine.engagement_detection import (
    EngagementDetectionEngine,
    ImplicitSignals,
    ExplicitSignals
)

# Import logging
from utils.logger import get_logger

engagement_bp = Blueprint('engagement', __name__)

# Initialize logger
logger = get_logger(__name__)

# Initialize engine
logger.info("Initializing Engagement Detection Engine")
engagement_engine = EngagementDetectionEngine()

# ============================================================================
# ENGAGEMENT ROUTES (BR4, BR6)
# ============================================================================

@engagement_bp.route('/analyze', methods=['POST'])
def analyze_engagement():
    """
    BR4: Analyze student engagement from implicit/explicit signals
    """
    try:
        data = request.json

        student_id = data['student_id']
        logger.info(f"Engagement analysis request | student_id: {student_id}")
        
        # Get recent responses from MongoDB
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_responses = find_many(
            STUDENT_RESPONSES,
            {
                'student_id': student_id,
                'submitted_at': {'$gte': week_ago}
            },
            sort=[('submitted_at', -1)]
        )
        
        # Build implicit signals from data or use provided
        if 'implicit_signals' in data:
            implicit = ImplicitSignals(**data['implicit_signals'])
        else:
            # Calculate from actual data
            implicit = _calculate_implicit_signals(student_id)
        
        # Build explicit signals from data or use provided
        if 'explicit_signals' in data:
            explicit = ExplicitSignals(**data['explicit_signals'])
        else:
            # Calculate from actual data
            explicit = _calculate_explicit_signals(student_id)
        
        # Detect disengagement behaviors
        behaviors = engagement_engine.detect_disengagement_behaviors(
            student_id,
            recent_responses,
            implicit
        )
        
        # Convert Enum types to strings for JSON serialization
        for b in behaviors:
            if hasattr(b['type'], 'value'):
                b['type'] = b['type'].value
        
        # Calculate engagement score
        logger.info(f"Calculating engagement score | student_id: {student_id}")
        result = engagement_engine.calculate_engagement_score(
            implicit,
            explicit,
            behaviors
        )
        logger.info(f"Engagement calculated | student_id: {student_id} | score: {result['engagement_score']} | level: {result['engagement_level']}")

        # Save engagement session
        session_doc = {
            '_id': str(ObjectId()),
            'student_id': student_id,
            'engagement_score': result['engagement_score'],
            'engagement_level': result['engagement_level'],
            'implicit_component': result['implicit_component'],
            'explicit_component': result['explicit_component'],
            'behaviors_detected': behaviors,
            'recommendations': result['recommendations'],
            'analyzed_at': datetime.utcnow()
        }
        
        insert_one(ENGAGEMENT_SESSIONS, session_doc)
        
        # Create alerts for at-risk students
        if result['engagement_level'] in ['AT_RISK', 'CRITICAL']:
            alert_doc = {
                '_id': str(ObjectId()),
                'student_id': student_id,
                'engagement_score': result['engagement_score'],
                'engagement_level': result['engagement_level'],
                'severity': result['engagement_level'],
                'behaviors': behaviors,
                'recommendations': result['recommendations'],
                'detected_at': datetime.utcnow(),
                'acknowledged': False
            }
            insert_one(DISENGAGEMENT_ALERTS, alert_doc)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@engagement_bp.route('/class/<class_id>', methods=['GET'])
def get_class_engagement(class_id):
    """
    BR6: Get class-level engagement metrics for teacher dashboard
    """
    try:
        # Get all students in the class
        students = find_many(STUDENTS, {'section': class_id})
        student_ids = [s['_id'] for s in students]
        
        # Get latest engagement session for each student
        student_engagements = []
        
        for student_id in student_ids:
            latest_session = find_one(
                ENGAGEMENT_SESSIONS,
                {'student_id': student_id},
                sort=[('analyzed_at', -1)]
            )
            
            if latest_session:
                student_engagements.append({
                    'student_id': student_id,
                    'engagement_score': latest_session.get('engagement_score', 0),
                    'engagement_level': latest_session.get('engagement_level', 'MONITOR'),
                    'recommendations': latest_session.get('recommendations', [])
                })
            else:
                # Default for students without engagement data
                student_engagements.append({
                    'student_id': student_id,
                    'engagement_score': 50,
                    'engagement_level': 'MONITOR',
                    'recommendations': ['Initial assessment needed']
                })
        
        # Aggregate class metrics
        class_metrics = engagement_engine.analyze_class_engagement(student_engagements)
        
        # Get students needing attention with details
        students_needing_attention = []
        for student_eng in class_metrics['students_needing_attention']:
            student = find_one(STUDENTS, {'_id': student_eng['student_id']})
            if student:
                students_needing_attention.append({
                    'student_id': student_eng['student_id'],
                    'name': f"{student.get('first_name', '')} {student.get('last_name', '')}",
                    'engagement_score': student_eng['engagement_score'],
                    'engagement_level': student_eng['engagement_level'],
                    'recommendations': student_eng.get('recommendations', [])
                })
        
        class_data = {
            'class_id': class_id,
            'class_engagement_index': class_metrics['class_engagement_index'],
            'distribution': class_metrics['distribution'],
            'alert_count': class_metrics['alert_count'],
            'students_needing_attention': students_needing_attention,
            'trend': class_metrics['trend'],
            'engagement_rate': class_metrics['engagement_rate'],
            'class_size': class_metrics['class_size']
        }
        
        return jsonify(class_data), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@engagement_bp.route('/student/<student_id>/history', methods=['GET'])
def get_student_engagement_history(student_id):
    """
    BR6: Get engagement history for a student
    """
    try:
        days = request.args.get('days', default=30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        sessions = find_many(
            ENGAGEMENT_SESSIONS,
            {
                'student_id': student_id,
                'analyzed_at': {'$gte': start_date}
            },
            sort=[('analyzed_at', 1)]
        )
        
        history = []
        for session in sessions:
            history.append({
                'date': session.get('analyzed_at').isoformat() if session.get('analyzed_at') else None,
                'engagement_score': session.get('engagement_score'),
                'engagement_level': session.get('engagement_level'),
                'behaviors_count': len(session.get('behaviors_detected', []))
            })
        
        return jsonify({
            'student_id': student_id,
            'history': history,
            'days': days
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@engagement_bp.route('/student/<student_id>/gamification', methods=['GET'])
def get_gamification_profile(student_id):
    """
    Get gamification profile (XP, Level, Badges) based on engagement history
    """
    try:
        # Get engagement sessions
        sessions = find_many(
            ENGAGEMENT_SESSIONS,
            {'student_id': student_id}
        )
        
        # Calculate total XP (sum of engagement scores)
        total_xp = sum(session.get('engagement_score', 0) for session in sessions)
        
        # Calculate Level (1000 XP per level)
        level = int(total_xp / 1000) + 1
        current_level_xp = total_xp % 1000
        next_level_xp = 1000
        
        # Calculate streaks (consecutive days with activity)
        # Sort sessions by date
        sorted_dates = sorted(list(set(
            session['analyzed_at'].date() 
            for session in sessions 
            if session.get('analyzed_at')
        )))
        
        streak = 0
        if sorted_dates:
            current_date = datetime.utcnow().date()
            # Check if active today
            if sorted_dates[-1] == current_date:
                streak = 1
                check_date = current_date - timedelta(days=1)
                for i in range(len(sorted_dates) - 2, -1, -1):
                    if sorted_dates[i] == check_date:
                        streak += 1
                        check_date -= timedelta(days=1)
                    else:
                        break
            # Check if active yesterday (streak still alive)
            elif sorted_dates[-1] == current_date - timedelta(days=1):
                streak = 1
                check_date = current_date - timedelta(days=2)
                for i in range(len(sorted_dates) - 2, -1, -1):
                    if sorted_dates[i] == check_date:
                        streak += 1
                        check_date -= timedelta(days=1)
                    else:
                        break
                
        return jsonify({
            'student_id': student_id,
            'level': level,
            'xp': total_xp,
            'current_level_xp': current_level_xp,
            'next_level_xp': next_level_xp,
            'streak': streak,
            'badges': [] # Placeholder for future badge system
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# LIVE POLLING ROUTES (BR4)
# ============================================================================

@engagement_bp.route('/polls/create', methods=['POST'])
def create_poll():
    """
    BR4: Create anonymous live poll
    """
    try:
        data = request.json
        
        poll_doc = {
            '_id': str(ObjectId()),
            'teacher_id': data['teacher_id'],
            'question': data['question'],
            'options': data['options'],
            'poll_type': data.get('poll_type', 'multiple_choice'),
            'correct_answer': data.get('correct_answer'),
            'created_at': datetime.utcnow(),
            'closed_at': None,
            'is_active': True
        }
        
        poll_id = insert_one(LIVE_POLLS, poll_doc)
        
        # Broadcast poll to all students via WebSocket (would be implemented separately)
        # socketio.emit('new_poll', poll_doc, room=class_id)
        
        return jsonify({
            'poll_id': poll_id,
            'teacher_id': data['teacher_id'],
            'question': data['question'],
            'options': data['options'],
            'poll_type': poll_doc['poll_type'],
            'created_at': poll_doc['created_at'].isoformat(),
            'is_active': True
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@engagement_bp.route('/polls/<poll_id>/respond', methods=['POST'])
def respond_to_poll(poll_id):
    """
    BR4: Submit anonymous poll response
    """
    try:
        data = request.json
        
        # Check if poll exists and is active
        poll = find_one(LIVE_POLLS, {'_id': poll_id})
        
        if not poll:
            return jsonify({'error': 'Poll not found'}), 404
        
        if not poll.get('is_active'):
            return jsonify({'error': 'Poll is no longer active'}), 400
        
        # Check if student already responded
        existing_response = find_one(
            POLL_RESPONSES,
            {
                'poll_id': poll_id,
                'student_id': data['student_id']
            }
        )
        
        if existing_response:
            return jsonify({'error': 'Already responded to this poll'}), 400
        
        # Create response
        response_doc = {
            '_id': str(ObjectId()),
            'poll_id': poll_id,
            'student_id': data['student_id'],
            'selected_option': data['selected_option'],
            'response_time': data.get('response_time'),
            'submitted_at': datetime.utcnow()
        }
        
        response_id = insert_one(POLL_RESPONSES, response_doc)
        
        # Update poll results in real-time via WebSocket
        # socketio.emit('poll_update', {poll_id, response_count}, room=poll.teacher_id)
        
        return jsonify({
            'response_id': response_id,
            'poll_id': poll_id,
            'message': 'Response recorded successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@engagement_bp.route('/polls/<poll_id>', methods=['GET'])
def get_poll_results(poll_id):
    """
    BR6: Get aggregated poll results for teacher
    """
    try:
        poll = find_one(LIVE_POLLS, {'_id': poll_id})
        
        if not poll:
            return jsonify({'error': 'Poll not found'}), 404
        
        # Aggregate responses
        pipeline = [
            {'$match': {'poll_id': poll_id}},
            {
                '$group': {
                    '_id': '$selected_option',
                    'count': {'$sum': 1}
                }
            }
        ]
        
        aggregated_responses = aggregate(POLL_RESPONSES, pipeline)
        
        # Format responses
        total_responses = sum(r['count'] for r in aggregated_responses)
        
        formatted_responses = []
        for option in poll['options']:
            count = next((r['count'] for r in aggregated_responses if r['_id'] == option), 0)
            percentage = (count / total_responses * 100) if total_responses > 0 else 0
            
            formatted_responses.append({
                'option': option,
                'count': count,
                'percentage': round(percentage, 1)
            })
        
        # Get class size (would need class_id from poll)
        class_size = total_responses  # Placeholder
        participation_rate = (total_responses / class_size * 100) if class_size > 0 else 0
        
        results = {
            'poll_id': poll_id,
            'question': poll.get('question'),
            'poll_type': poll.get('poll_type'),
            'responses': formatted_responses,
            'total_responses': total_responses,
            'class_size': class_size,
            'participation_rate': round(participation_rate, 1),
            'is_active': poll.get('is_active'),
            'created_at': poll.get('created_at').isoformat() if poll.get('created_at') else None
        }
        
        return jsonify(results), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500




@engagement_bp.route('/alerts', methods=['GET'])
def get_engagement_alerts():
    """
    BR6: Get unacknowledged engagement alerts for teachers
    """
    try:
        teacher_id = request.args.get('teacher_id')
        severity = request.args.get('severity')
        
        query = {'acknowledged': False}
        
        if severity:
            query['severity'] = severity
        
        alerts = find_many(
            DISENGAGEMENT_ALERTS,
            query,
            sort=[('detected_at', -1)]
        )
        
        formatted_alerts = []
        for alert in alerts:
            student = find_one(STUDENTS, {'_id': alert['student_id']})
            
            formatted_alerts.append({
                'alert_id': alert['_id'],
                'student_id': alert['student_id'],
                'student_name': f"{student.get('first_name', '')} {student.get('last_name', '')}" if student else 'Unknown',
                'engagement_score': alert.get('engagement_score'),
                'engagement_level': alert.get('engagement_level'),
                'severity': alert.get('severity'),
                'behaviors': alert.get('behaviors', []),
                'recommendations': alert.get('recommendations', []),
                'detected_at': alert.get('detected_at').isoformat() if alert.get('detected_at') else None
            })
        
        return jsonify(formatted_alerts), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@engagement_bp.route('/alerts/<alert_id>', methods=['GET'])
def get_alert(alert_id):
    try:
        alert = find_one(DISENGAGEMENT_ALERTS, {'_id': alert_id})
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404

        student = find_one(STUDENTS, {'_id': alert.get('student_id')})

        result = {
            'alert_id': alert['_id'],
            'student_id': alert.get('student_id'),
            'student_name': student.get('name') if student else 'Unknown',
            'engagement_score': alert.get('engagement_score'),
            'engagement_level': alert.get('engagement_level'),
            'severity': alert.get('severity'),
            'detected_behaviors': alert.get('detected_behaviors', []),
            'recommendation': alert.get('recommendation'),
            'timestamp': alert.get('timestamp').isoformat() if alert.get('timestamp') else None,
            'resolved': alert.get('resolved', False),
            'acknowledged': alert.get('acknowledged', False),
            'acknowledged_at': alert.get('acknowledged_at').isoformat() if alert.get('acknowledged_at') else None
        }

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@engagement_bp.route('/alerts/<alert_id>', methods=['PUT'])
def update_alert(alert_id):
    try:
        data = request.json
        update_data = {}

        if 'severity' in data:
            update_data['severity'] = data['severity']
        if 'notes' in data:
            update_data['notes'] = data['notes']
        if 'recommendation' in data:
            update_data['recommendation'] = data['recommendation']
        if 'resolved' in data:
            update_data['resolved'] = data['resolved']
            if data['resolved']:
                update_data['resolved_at'] = datetime.utcnow()

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            result = update_one(DISENGAGEMENT_ALERTS, {'_id': alert_id}, {'$set': update_data})
            if result == 0:
                return jsonify({'error': 'Alert not found'}), 404

            return jsonify({'message': 'Alert updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@engagement_bp.route('/alerts/<alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    try:
        result = update_one(DISENGAGEMENT_ALERTS, {'_id': alert_id}, {'$set': {'resolved': True, 'resolved_at': datetime.utcnow(), 'dismissed': True}})
        if result == 0:
            return jsonify({'error': 'Alert not found'}), 404

        logger.info(f"Alert dismissed | alert_id: {alert_id}")
        return jsonify({'message': 'Alert dismissed successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@engagement_bp.route('/alerts/<alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    try:
        update_one(DISENGAGEMENT_ALERTS, {'_id': alert_id}, {'$set': {'acknowledged': True, 'acknowledged_at': datetime.utcnow()}})
        return jsonify({'message': 'Alert acknowledged'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _calculate_implicit_signals(student_id):
    """Calculate implicit signals from student activity data"""
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Get engagement logs
    logs = find_many(
        ENGAGEMENT_LOGS,
        {
            'student_id': student_id,
            'timestamp': {'$gte': week_ago}
        }
    )
    
    # Calculate metrics
    login_frequency = len(set(log.get('timestamp').date() for log in logs if log.get('event_type') == 'login'))
    
    # Session durations
    sessions = find_many(
        ENGAGEMENT_SESSIONS,
        {
            'student_id': student_id,
            'analyzed_at': {'$gte': week_ago}
        }
    )
    
    session_durations = [s.get('duration', 0) for s in sessions if s.get('duration')]
    avg_session_duration = sum(session_durations) / len(session_durations) if session_durations else 10.0
    
    # Get responses
    responses = find_many(
        STUDENT_RESPONSES,
        {
            'student_id': student_id,
            'submitted_at': {'$gte': week_ago}
        }
    )

    # Get assignment submissions
    submissions = find_many(
        CLASSROOM_SUBMISSIONS,
        {
            'student_id': student_id,
            'submitted_at': {'$gte': week_ago},
            'status': {'$in': ['turned_in', 'graded', 'returned']}
        }
    )
    
    response_times = [r.get('response_time', 0) for r in responses if r.get('response_time')]
    interaction_count = len(responses) + len(submissions)
    
    correct_count = sum(1 for r in responses if r.get('is_correct'))
    # Task completion: For assignments, turned_in counts as complete.
    total_tasks = len(responses) + len(submissions)
    task_completion_rate = (correct_count + len(submissions)) / total_tasks if total_tasks > 0 else 0.5
    
    return ImplicitSignals(
        login_frequency=login_frequency,
        avg_session_duration=avg_session_duration,
        time_on_task=sum(session_durations),
        interaction_count=interaction_count,
        response_times=response_times,
        task_completion_rate=task_completion_rate,
        reattempt_rate=0.1,  # Placeholder
        optional_resource_usage=0,  # Placeholder
        discussion_participation=0  # Placeholder
    )


def _calculate_explicit_signals(student_id):
    """Calculate explicit signals from polls and assessments"""
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Count poll responses
    poll_responses = count_documents(
        POLL_RESPONSES,
        {
            'student_id': student_id,
            'submitted_at': {'$gte': week_ago}
        }
    )
    
    # Get quiz accuracy
    responses = find_many(
        STUDENT_RESPONSES,
        {
            'student_id': student_id,
            'submitted_at': {'$gte': week_ago}
        }
    )
    
    correct_count = sum(1 for r in responses if r.get('is_correct'))
    quiz_accuracy = correct_count / len(responses) if responses else 0.5
    
    return ExplicitSignals(
        poll_responses=poll_responses,
        understanding_level=3.0,  # Placeholder - would come from self-reports
        participation_rate=0.75,  # Placeholder
        quiz_accuracy=quiz_accuracy
    )