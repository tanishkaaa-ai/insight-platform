"""
AMEP Dashboard Routes - MongoDB Version
API endpoints for BR6, BR8 (Real-time teacher dashboards and unified analytics)

Location: backend/api/dashboard_routes.py

Step 4: Advanced Analytics & Dashboards
- Real-time class engagement index
- Student attention map visualization
- Mastery heatmap generation
- Engagement trends over time
- Post-intervention tracking
- Unified institutional metrics

Research Validation:
- Paper 62379RAE2024_11.pdf: Real-time feedback improves teaching
- Paper 6.pdf: Implicit engagement indicators
- Paper 2105_15106v4.pdf: KAT framework for affect and knowledge tracking
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
import logging

# Import MongoDB helper functions
from models.database import (
    db,
    CLASSROOMS,
    STUDENTS,
    STUDENT_CONCEPT_MASTERY,
    ENGAGEMENT_SESSIONS,
    ENGAGEMENT_LOGS,
    DISENGAGEMENT_ALERTS,
    TEACHER_INTERVENTIONS,
    INSTITUTIONAL_METRICS,
    CONCEPTS,
    CLASSROOM_MEMBERSHIPS,
    find_one,
    find_many,
    insert_one,
    update_one,
    aggregate
)

# Import AI engines
from ai_engine.engagement_detection import EngagementDetectionEngine

# Import logging
from utils.logger import get_logger

# Create blueprint
dashboard_bp = Blueprint('dashboard', __name__)

# Initialize logger
logger = get_logger(__name__)

# Initialize engagement detector
engagement_detector = EngagementDetectionEngine()

# ============================================================================
# CLASS ENGAGEMENT INDEX (BR6)
# ============================================================================

@dashboard_bp.route('/class-engagement/<classroom_id>', methods=['GET'])
def get_class_engagement_index(classroom_id):
    """
    BR6: Real-time class engagement index
    
    GET /api/dashboard/class-engagement/{classroom_id}
    
    Returns:
    - Overall class engagement score (0-100)
    - Distribution by engagement level
    - Students needing attention
    - Alert counts
    - Real-time recommendations
    """
    try:
        logger.info(f"Fetching class engagement index | classroom_id: {classroom_id}")

        # Validate classroom exists
        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404
        
        # Get all students in classroom
        memberships = find_many(
            CLASSROOM_MEMBERSHIPS, 
            {'classroom_id': classroom_id, 'role': 'student'}
        )
        
        student_ids = [m['user_id'] for m in memberships]
        
        if not student_ids:
            return jsonify({
                'classroom_id': classroom_id,
                'classroom_name': classroom.get('name', 'Unknown'),
                'class_engagement_index': 0,
                'total_students': 0,
                'distribution': {},
                'students_needing_attention': [],
                'alert_counts': {},
                'recommendation': 'No students enrolled yet'
            }), 200

        # Gather engagement data for all students
        student_engagements = []
        for sid in student_ids:
            # Get latest session
            latest_session = find_one(
                ENGAGEMENT_SESSIONS,
                {'student_id': sid},
                sort=[('session_start', -1)]
            )
            
            # Get active alerts to determine status overrides
            active_alert = find_one(
                DISENGAGEMENT_ALERTS,
                {'student_id': sid, 'resolved': False},
                sort=[('timestamp', -1)]
            )
            
            if active_alert:
                 student_engagements.append({
                    'student_id': sid,
                    'engagement_score': active_alert.get('engagement_score', 50),
                    'engagement_level': active_alert.get('engagement_level', 'MONITOR') # Should be computed severity mapped to level if needed
                 })
            elif latest_session:
                student_engagements.append({
                    'student_id': sid,
                    'engagement_score': latest_session.get('engagement_score', 75),
                    'engagement_level': latest_session.get('engagement_level', 'ENGAGED')
                })
            else:
                 # Default for no data
                 student_engagements.append({
                    'student_id': sid,
                    'engagement_score': 50, # Neutral
                    'engagement_level': 'MONITOR'
                 })

        # Calculate class-level engagement
        result = engagement_detector.analyze_class_engagement(
            student_engagements=student_engagements
        )

        # Get active alerts
        active_alerts = find_many(
            DISENGAGEMENT_ALERTS,
            {
                'student_id': {'$in': student_ids},
                'resolved': False
            }
        )

        # Count alerts by severity
        alert_counts = {
            'CRITICAL': 0,
            'AT_RISK': 0,
            'MONITOR': 0
        }

        for alert in active_alerts:
            severity = alert.get('severity', 'MONITOR')
            alert_counts[severity] = alert_counts.get(severity, 0) + 1

        # Get students needing attention (CRITICAL and AT_RISK)
        students_needing_attention = []

        for alert in active_alerts:
            if alert.get('severity') in ['CRITICAL', 'AT_RISK']:
                student = find_one(STUDENTS, {'_id': alert['student_id']})
                if student:
                    students_needing_attention.append({
                        'student_id': alert['student_id'],
                        'student_name': student.get('name', 'Unknown'),
                        'engagement_level': alert.get('engagement_level', 'UNKNOWN'),
                        'severity': alert.get('severity'),
                        'detected_behaviors': alert.get('detected_behaviors', []),
                        'recommendation': alert.get('recommendation', 'Monitor closely'),
                        'days_since_alert': (datetime.utcnow() - alert.get('timestamp', datetime.utcnow())).days
                    })

        # Generate class-level recommendation
        cei = result['class_engagement_index']
        if cei >= 80:
            recommendation = "✅ Excellent class engagement - maintain current strategies"
        elif cei >= 70:
            recommendation = "✅ Good class engagement - consider interactive activities for passive students"
        elif cei >= 60:
            recommendation = "⚠️ Moderate engagement - review teaching methods and increase interaction"
        elif cei >= 50:
            recommendation = "⚠️ Below average engagement - conduct class feedback session"
        else:
            recommendation = "❌ Low class engagement - urgent intervention needed, consider one-on-one check-ins"

        response = {
            'classroom_id': classroom_id,
            'classroom_name': classroom.get('name', 'Unknown'),
            'class_engagement_index': round(cei, 2),
            'total_students': result['total_students'],
            'distribution': result['distribution'],
            'students_needing_attention': sorted(
                students_needing_attention,
                key=lambda x: 0 if x['severity'] == 'CRITICAL' else 1
            ),
            'alert_counts': alert_counts,
            'recommendation': recommendation,
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info(f"Class engagement calculated | classroom_id: {classroom_id} | CEI: {cei}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error calculating class engagement | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# STUDENT ATTENTION MAP (BR6)
# ============================================================================

@dashboard_bp.route('/attention-map/<classroom_id>', methods=['GET'])
def get_student_attention_map(classroom_id):
    """
    BR6: Visual representation of student engagement states

    GET /api/dashboard/attention-map/{classroom_id}

    Returns grid/map of students with their current engagement state:
    - ENGAGED (green)
    - PASSIVE (yellow)
    - MONITOR (orange)
    - AT_RISK (red)
    - CRITICAL (dark red)
    """
    try:
        logger.info(f"Generating student attention map | classroom_id: {classroom_id}")

        # Get classroom
        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404

        # Get all students
        memberships = find_many(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom_id, 'role': 'student'}
        )

        student_ids = [m['user_id'] for m in memberships]

        attention_map = []

        for student_id in student_ids:
            student = find_one(STUDENTS, {'_id': student_id})

            # Get latest engagement session
            latest_session = find_one(
                ENGAGEMENT_SESSIONS,
                {'student_id': student_id},
                sort=[('session_start', -1)]
            )

            # Get active alerts
            active_alert = find_one(
                DISENGAGEMENT_ALERTS,
                {
                    'student_id': student_id,
                    'resolved': False
                },
                sort=[('timestamp', -1)]
            )

            # Determine current state
            if active_alert:
                engagement_level = active_alert.get('engagement_level', 'MONITOR')
                engagement_score = active_alert.get('engagement_score', 50)
                detected_behaviors = active_alert.get('detected_behaviors', [])
            elif latest_session:
                engagement_score = latest_session.get('engagement_score', 75)
                detected_behaviors = latest_session.get('detected_behaviors', [])

                # Determine level from score
                if engagement_score >= 75:
                    engagement_level = 'ENGAGED'
                elif engagement_score >= 65:
                    engagement_level = 'PASSIVE'
                elif engagement_score >= 50:
                    engagement_level = 'MONITOR'
                elif engagement_score >= 30:
                    engagement_level = 'AT_RISK'
                else:
                    engagement_level = 'CRITICAL'
            else:
                engagement_level = 'UNKNOWN'
                engagement_score = 0
                detected_behaviors = []

            # Get last activity timestamp
            last_activity = None
            if latest_session:
                last_activity = latest_session.get('session_start')

            # Map to color
            color_map = {
                'ENGAGED': '#22c55e',      # green
                'PASSIVE': '#eab308',      # yellow
                'MONITOR': '#f97316',      # orange
                'AT_RISK': '#ef4444',      # red
                'CRITICAL': '#991b1b',     # dark red
                'UNKNOWN': '#6b7280'       # gray
            }

            attention_map.append({
                'student_id': student_id,
                'student_name': student.get('name', 'Unknown') if student else 'Unknown',
                'engagement_level': engagement_level,
                'engagement_score': round(engagement_score, 1),
                'color': color_map.get(engagement_level, '#6b7280'),
                'detected_behaviors': detected_behaviors,
                'last_activity': last_activity.isoformat() if last_activity else None,
                'needs_attention': engagement_level in ['AT_RISK', 'CRITICAL']
            })

        # Sort: CRITICAL first, then AT_RISK, then by engagement score
        priority_order = {'CRITICAL': 0, 'AT_RISK': 1, 'MONITOR': 2, 'PASSIVE': 3, 'ENGAGED': 4, 'UNKNOWN': 5}
        attention_map.sort(key=lambda x: (priority_order.get(x['engagement_level'], 5), -x['engagement_score']))

        response = {
            'classroom_id': classroom_id,
            'classroom_name': classroom.get('name', 'Unknown'),
            'total_students': len(attention_map),
            'attention_map': attention_map,
            'summary': {
                'engaged': len([s for s in attention_map if s['engagement_level'] == 'ENGAGED']),
                'passive': len([s for s in attention_map if s['engagement_level'] == 'PASSIVE']),
                'monitor': len([s for s in attention_map if s['engagement_level'] == 'MONITOR']),
                'at_risk': len([s for s in attention_map if s['engagement_level'] == 'AT_RISK']),
                'critical': len([s for s in attention_map if s['engagement_level'] == 'CRITICAL'])
            },
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info(f"Attention map generated | classroom_id: {classroom_id} | students: {len(attention_map)}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error generating attention map | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# MASTERY HEATMAP (BR1, BR6)
# ============================================================================

@dashboard_bp.route('/mastery-heatmap/<classroom_id>', methods=['GET'])
def get_mastery_heatmap(classroom_id):
    """
    BR1, BR6: Concept-level mastery visualization for entire class

    GET /api/dashboard/mastery-heatmap/{classroom_id}?subject_area=Mathematics

    Returns grid showing mastery scores for all students across all concepts
    """
    try:
        logger.info(f"Generating mastery heatmap | classroom_id: {classroom_id}")

        subject_area = request.args.get('subject_area')

        # Get classroom
        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404

        # Get students
        memberships = find_many(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom_id, 'role': 'student'}
        )

        student_ids = [m['user_id'] for m in memberships]

        # Get concepts (filtered by subject if provided)
        concept_query = {}
        if subject_area:
            concept_query['subject_area'] = subject_area

        concepts = find_many(CONCEPTS, concept_query)

        if not concepts:
            return jsonify({
                'error': 'No concepts found',
                'message': f'No concepts available for subject: {subject_area}' if subject_area else 'No concepts in system'
            }), 404

        # Build heatmap data structure
        heatmap_data = []

        for student_id in student_ids:
            student = find_one(STUDENTS, {'_id': student_id})
            student_row = {
                'student_id': student_id,
                'student_name': student.get('name', 'Unknown') if student else 'Unknown',
                'concepts': {}
            }

            for concept in concepts:
                concept_id = concept['_id']

                # Get mastery record
                mastery_record = find_one(
                    STUDENT_CONCEPT_MASTERY,
                    {
                        'student_id': student_id,
                        'concept_id': concept_id
                    }
                )

                if mastery_record:
                    mastery_score = mastery_record.get('mastery_score', 0)
                else:
                    mastery_score = 0

                # Determine color based on mastery level
                if mastery_score >= 85:
                    color = '#22c55e'  # green - mastered
                elif mastery_score >= 70:
                    color = '#84cc16'  # light green - proficient
                elif mastery_score >= 60:
                    color = '#eab308'  # yellow - developing
                elif mastery_score >= 40:
                    color = '#f97316'  # orange - struggling
                else:
                    color = '#ef4444'  # red - needs help

                student_row['concepts'][concept_id] = {
                    'mastery_score': round(mastery_score, 1),
                    'color': color
                }

            # Calculate student average
            avg_mastery = sum(c['mastery_score'] for c in student_row['concepts'].values()) / len(concepts) if concepts else 0
            student_row['average_mastery'] = round(avg_mastery, 1)

            heatmap_data.append(student_row)

        # Calculate concept averages (class-level mastery per concept)
        concept_averages = []

        for concept in concepts:
            concept_id = concept['_id']
            mastery_scores = []

            for student_row in heatmap_data:
                mastery_scores.append(student_row['concepts'][concept_id]['mastery_score'])

            avg = sum(mastery_scores) / len(mastery_scores) if mastery_scores else 0

            concept_averages.append({
                'concept_id': concept_id,
                'concept_name': concept.get('concept_name', 'Unknown'),
                'average_mastery': round(avg, 1),
                'students_mastered': len([s for s in mastery_scores if s >= 85]),
                'students_struggling': len([s for s in mastery_scores if s < 60])
            })

        # Sort students by average mastery (lowest first - needs most help)
        heatmap_data.sort(key=lambda x: x['average_mastery'])

        # Sort concepts by average mastery (lowest first - needs focus)
        concept_averages.sort(key=lambda x: x['average_mastery'])

        response = {
            'classroom_id': classroom_id,
            'classroom_name': classroom.get('name', 'Unknown'),
            'subject_area': subject_area,
            'total_students': len(heatmap_data),
            'total_concepts': len(concepts),
            'heatmap': heatmap_data,
            'concept_averages': concept_averages,
            'class_average_mastery': round(
                sum(s['average_mastery'] for s in heatmap_data) / len(heatmap_data), 1
            ) if heatmap_data else 0,
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info(f"Mastery heatmap generated | classroom_id: {classroom_id} | concepts: {len(concepts)}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error generating mastery heatmap | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# ENGAGEMENT TRENDS (BR6, BR8)
# ============================================================================

@dashboard_bp.route('/engagement-trends/<classroom_id>', methods=['GET'])
def get_engagement_trends(classroom_id):
    """
    BR6, BR8: Historical engagement data for visualization

    GET /api/dashboard/engagement-trends/{classroom_id}?days=30

    Returns time-series data showing engagement trends over time
    """
    try:
        days = request.args.get('days', default=30, type=int)
        logger.info(f"Fetching engagement trends | classroom_id: {classroom_id} | days: {days}")

        # Get classroom
        classroom = find_one(CLASSROOMS, {'_id': classroom_id})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404

        # Get students
        memberships = find_many(
            CLASSROOM_MEMBERSHIPS,
            {'classroom_id': classroom_id, 'role': 'student'}
        )

        student_ids = [m['user_id'] for m in memberships]

        # Get engagement sessions for the time period
        start_date = datetime.utcnow() - timedelta(days=days)

        sessions = find_many(
            ENGAGEMENT_SESSIONS,
            {
                'student_id': {'$in': student_ids},
                'session_start': {'$gte': start_date}
            },
            sort=[('session_start', 1)]
        )

        # Group by day
        daily_data = {}

        for session in sessions:
            date_key = session['session_start'].date().isoformat()

            if date_key not in daily_data:
                daily_data[date_key] = {
                    'date': date_key,
                    'engagement_scores': [],
                    'session_count': 0,
                    'total_duration': 0,
                    'behaviors_detected': []
                }

            daily_data[date_key]['engagement_scores'].append(session.get('engagement_score', 0))
            daily_data[date_key]['session_count'] += 1
            daily_data[date_key]['total_duration'] += session.get('session_duration', 0)
            daily_data[date_key]['behaviors_detected'].extend(session.get('detected_behaviors', []))

        # Calculate daily averages
        trends = []

        for date_key in sorted(daily_data.keys()):
            data = daily_data[date_key]
            avg_engagement = sum(data['engagement_scores']) / len(data['engagement_scores']) if data['engagement_scores'] else 0
            avg_duration = data['total_duration'] / data['session_count'] if data['session_count'] > 0 else 0

            # Count behavior types
            behavior_counts = {}
            for behavior in data['behaviors_detected']:
                behavior_counts[behavior] = behavior_counts.get(behavior, 0) + 1

            trends.append({
                'date': date_key,
                'average_engagement': round(avg_engagement, 1),
                'session_count': data['session_count'],
                'average_duration_minutes': round(avg_duration / 60, 1) if avg_duration > 0 else 0,
                'behavior_counts': behavior_counts
            })

        # Calculate overall trend (improving, stable, declining)
        if len(trends) >= 2:
            first_week = trends[:7] if len(trends) >= 7 else trends[:len(trends)//2]
            last_week = trends[-7:] if len(trends) >= 7 else trends[len(trends)//2:]

            first_avg = sum(t['average_engagement'] for t in first_week) / len(first_week)
            last_avg = sum(t['average_engagement'] for t in last_week) / len(last_week)

            change = last_avg - first_avg

            if change > 5:
                trend_direction = 'improving'
            elif change < -5:
                trend_direction = 'declining'
            else:
                trend_direction = 'stable'
        else:
            trend_direction = 'insufficient_data'
            change = 0

        response = {
            'classroom_id': classroom_id,
            'classroom_name': classroom.get('name', 'Unknown'),
            'period_days': days,
            'trends': trends,
            'trend_direction': trend_direction,
            'trend_change': round(change, 1),
            'total_sessions': sum(t['session_count'] for t in trends),
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info(f"Engagement trends calculated | classroom_id: {classroom_id} | trend: {trend_direction}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error calculating engagement trends | classroom_id: {classroom_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# POST-INTERVENTION TRACKING (BR6)
# ============================================================================

@dashboard_bp.route('/interventions', methods=['POST'])
def create_intervention():
    """
    BR6: Record teacher intervention for at-risk student

    POST /api/dashboard/interventions
    """
    try:
        data = request.json

        # Validate required fields
        required = ['teacher_id', 'student_id', 'intervention_type', 'description']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        intervention_doc = {
            '_id': str(ObjectId()),
            'teacher_id': data['teacher_id'],
            'student_id': data['student_id'],
            'classroom_id': data.get('classroom_id'),
            'intervention_type': data['intervention_type'],  # one_on_one, parent_contact, resource_provided, etc.
            'description': data['description'],
            'target_behaviors': data.get('target_behaviors', []),
            'timestamp': datetime.utcnow(),
            'follow_up_date': datetime.utcnow() + timedelta(days=data.get('follow_up_days', 7)),
            'status': 'active',
            'outcome': None
        }

        intervention_id = insert_one(TEACHER_INTERVENTIONS, intervention_doc)

        logger.info(f"Intervention created | intervention_id: {intervention_id} | student_id: {data['student_id']}")

        return jsonify({
            'intervention_id': intervention_id,
            'message': 'Intervention recorded successfully',
            'follow_up_date': intervention_doc['follow_up_date'].isoformat()
        }), 201

    except Exception as e:
        logger.error(f"Error creating intervention | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@dashboard_bp.route('/interventions/<intervention_id>/outcome', methods=['PUT'])
def update_intervention_outcome(intervention_id):
    """
    BR6: Update intervention outcome after follow-up

    PUT /api/dashboard/interventions/{intervention_id}/outcome
    """
    try:
        data = request.json

        if 'outcome' not in data:
            return jsonify({'error': 'Missing required field: outcome'}), 400

        update_data = {
            'outcome': data['outcome'],  # improved, no_change, declined
            'outcome_notes': data.get('outcome_notes', ''),
            'completed_at': datetime.utcnow(),
            'status': 'completed'
        }

        result = update_one(
            TEACHER_INTERVENTIONS,
            {'_id': intervention_id},
            {'$set': update_data}
        )

        if result == 0:
            return jsonify({'error': 'Intervention not found'}), 404

        logger.info(f"Intervention outcome updated | intervention_id: {intervention_id} | outcome: {data['outcome']}")

        return jsonify({
            'message': 'Intervention outcome updated successfully',
            'outcome': data['outcome']
        }), 200

    except Exception as e:
        logger.error(f"Error updating intervention outcome | intervention_id: {intervention_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@dashboard_bp.route('/interventions/student/<student_id>', methods=['GET'])
def get_student_interventions(student_id):
    """
    BR6: Get intervention history for a student

    GET /api/dashboard/interventions/student/{student_id}
    """
    try:
        interventions = find_many(
            TEACHER_INTERVENTIONS,
            {'student_id': student_id},
            sort=[('timestamp', -1)]
        )

        formatted_interventions = []

        for intervention in interventions:
            formatted_interventions.append({
                'intervention_id': intervention['_id'],
                'teacher_id': intervention.get('teacher_id'),
                'intervention_type': intervention.get('intervention_type'),
                'description': intervention.get('description'),
                'timestamp': intervention.get('timestamp').isoformat() if intervention.get('timestamp') else None,
                'status': intervention.get('status'),
                'outcome': intervention.get('outcome'),
                'outcome_notes': intervention.get('outcome_notes'),
                'follow_up_date': intervention.get('follow_up_date').isoformat() if intervention.get('follow_up_date') else None
            })

        logger.info(f"Retrieved intervention history | student_id: {student_id} | count: {len(formatted_interventions)}")

        return jsonify({
            'student_id': student_id,
            'interventions': formatted_interventions,
            'total_interventions': len(formatted_interventions)
        }), 200

    except Exception as e:
        logger.error(f"Error retrieving interventions | student_id: {student_id} | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# UNIFIED INSTITUTIONAL METRICS (BR8)
# ============================================================================

@dashboard_bp.route('/institutional-metrics', methods=['GET'])
def get_institutional_metrics():
    """
    BR8: Unified data reporting across institution

    GET /api/dashboard/institutional-metrics

    Consolidated metrics for administrators
    """
    try:
        logger.info("Fetching institutional metrics")

        # Get all classrooms
        all_classrooms = find_many(CLASSROOMS, {})
        classroom_ids = [c['_id'] for c in all_classrooms]

        # Get all students and teachers
        all_students = find_many(STUDENTS, {})

        # Calculate overall engagement
        recent_sessions = find_many(
            ENGAGEMENT_SESSIONS,
            {
                'session_start': {'$gte': datetime.utcnow() - timedelta(days=7)}
            }
        )

        avg_engagement = sum(s.get('engagement_score', 0) for s in recent_sessions) / len(recent_sessions) if recent_sessions else 0

        # Count active alerts
        active_alerts = find_many(DISENGAGEMENT_ALERTS, {'resolved': False})

        alert_breakdown = {
            'CRITICAL': len([a for a in active_alerts if a.get('severity') == 'CRITICAL']),
            'AT_RISK': len([a for a in active_alerts if a.get('severity') == 'AT_RISK']),
            'MONITOR': len([a for a in active_alerts if a.get('severity') == 'MONITOR'])
        }

        # Calculate average mastery across institution
        all_mastery = find_many(STUDENT_CONCEPT_MASTERY, {})
        avg_mastery = sum(m.get('mastery_score', 0) for m in all_mastery) / len(all_mastery) if all_mastery else 0

        # Count recent interventions
        recent_interventions = find_many(
            TEACHER_INTERVENTIONS,
            {
                'timestamp': {'$gte': datetime.utcnow() - timedelta(days=30)}
            }
        )

        intervention_outcomes = {
            'improved': len([i for i in recent_interventions if i.get('outcome') == 'improved']),
            'no_change': len([i for i in recent_interventions if i.get('outcome') == 'no_change']),
            'declined': len([i for i in recent_interventions if i.get('outcome') == 'declined']),
            'pending': len([i for i in recent_interventions if i.get('status') == 'active'])
        }

        response = {
            'institution_summary': {
                'total_classrooms': len(all_classrooms),
                'total_students': len(all_students),
                'average_engagement': round(avg_engagement, 1),
                'average_mastery': round(avg_mastery, 1)
            },
            'engagement_alerts': {
                'total_active': len(active_alerts),
                'breakdown': alert_breakdown
            },
            'interventions_30_days': {
                'total': len(recent_interventions),
                'outcomes': intervention_outcomes
            },
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info("Institutional metrics calculated successfully")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error calculating institutional metrics | error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# TALK TIME RATIO (BR6)
# ============================================================================

@dashboard_bp.route('/talk-time/<classroom_id>', methods=['GET'])
def get_talk_time_ratio(classroom_id):
    """
    BR6: Teacher-to-student talk time ratio analytics

    GET /api/dashboard/talk-time/{classroom_id}?session_date=2026-01-21

    Note: Requires integration with speech recognition or manual logging
    This is a placeholder that returns structure for future implementation
    """
    try:
        session_date = request.args.get('session_date')

        # In production, this would analyze audio/video or manual logs
        # For now, return placeholder structure

        response = {
            'classroom_id': classroom_id,
            'session_date': session_date,
            'talk_time_data': {
                'teacher_talk_percentage': 0,
                'student_talk_percentage': 0,
                'silence_percentage': 0,
                'teacher_minutes': 0,
                'student_minutes': 0,
                'total_minutes': 0
            },
            'recommendation': 'This feature requires audio/video integration or manual time logging',
            'status': 'not_implemented',
            'note': 'Placeholder endpoint for future speech analytics integration'
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@dashboard_bp.route('/interventions/track', methods=['POST'])
def track_intervention():
    try:
        data = request.json
        mastery_before = data.get('mastery_before')
        if not mastery_before:
            mastery_records = find_many(STUDENT_CONCEPT_MASTERY, {'student_id': {'$in': data['target_students']}, 'concept_id': data['concept_id']})
            mastery_before = sum(r.get('mastery_score', 0) for r in mastery_records) / len(mastery_records) if mastery_records else 0

        intervention_effectiveness = {'one_on_one_tutoring': 0.15, 'small_group_review': 0.10, 'homework_assignment': 0.05, 'peer_teaching': 0.12, 'adaptive_practice': 0.18}
        intervention_type = data['intervention_type']
        expected_improvement = intervention_effectiveness.get(intervention_type, 0.08) * 100
        predicted_mastery_after = min(100, mastery_before + expected_improvement)

        intervention_doc = {'_id': str(ObjectId()), 'teacher_id': data['teacher_id'], 'concept_id': data['concept_id'], 'intervention_type': intervention_type, 'target_students': data['target_students'], 'description': data.get('description'), 'mastery_before': mastery_before, 'mastery_after': None, 'improvement': None, 'predicted_improvement': round(expected_improvement, 2), 'predicted_mastery_after': round(predicted_mastery_after, 2), 'confidence': 0.75, 'performed_at': datetime.utcnow(), 'measured_at': None}
        intervention_id = insert_one(TEACHER_INTERVENTIONS, intervention_doc)

        return jsonify({'intervention_id': intervention_id, 'teacher_id': data['teacher_id'], 'concept_id': data['concept_id'], 'intervention_type': intervention_type, 'mastery_before': mastery_before, 'predicted_improvement': round(expected_improvement, 2), 'predicted_mastery_after': round(predicted_mastery_after, 2), 'performed_at': intervention_doc['performed_at'].isoformat()}), 201
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@dashboard_bp.route('/interventions/<intervention_id>/measure', methods=['POST'])
def measure_intervention_impact(intervention_id):
    try:
        intervention = find_one(TEACHER_INTERVENTIONS, {'_id': intervention_id})
        if not intervention:
            return jsonify({'error': 'Intervention not found'}), 404

        mastery_records = find_many(STUDENT_CONCEPT_MASTERY, {'student_id': {'$in': intervention['target_students']}, 'concept_id': intervention['concept_id']})
        mastery_after = sum(r.get('mastery_score', 0) for r in mastery_records) / len(mastery_records) if mastery_records else intervention['mastery_before']
        actual_improvement = mastery_after - intervention['mastery_before']
        predicted_improvement = intervention.get('predicted_improvement', 0)
        prediction_error = abs(actual_improvement - predicted_improvement)
        prediction_accuracy = max(0, 100 - (prediction_error / predicted_improvement * 100)) if predicted_improvement > 0 else 0

        update_one(TEACHER_INTERVENTIONS, {'_id': intervention_id}, {'$set': {'mastery_after': mastery_after, 'improvement': actual_improvement, 'prediction_accuracy': round(prediction_accuracy, 2), 'prediction_error': round(prediction_error, 2), 'measured_at': datetime.utcnow()}})

        effectiveness_rating = 'highly_effective' if actual_improvement > predicted_improvement * 1.2 else 'effective' if actual_improvement > predicted_improvement * 0.8 else 'moderately_effective' if actual_improvement > 0 else 'ineffective'

        return jsonify({'intervention_id': intervention_id, 'mastery_before': intervention['mastery_before'], 'mastery_after': round(mastery_after, 2), 'actual_improvement': round(actual_improvement, 2), 'predicted_improvement': predicted_improvement, 'prediction_accuracy': round(prediction_accuracy, 2), 'effectiveness_rating': effectiveness_rating, 'measured_at': datetime.utcnow().isoformat()}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@dashboard_bp.route('/interventions/teacher/<teacher_id>', methods=['GET'])
def get_teacher_interventions(teacher_id):
    try:
        interventions = find_many(TEACHER_INTERVENTIONS, {'teacher_id': teacher_id}, sort=[('performed_at', -1)])
        formatted_interventions = []
        total_predicted_improvement = 0
        total_actual_improvement = 0
        measured_count = 0

        for intervention in interventions:
            formatted_interventions.append({'intervention_id': intervention['_id'], 'concept_id': intervention.get('concept_id'), 'intervention_type': intervention.get('intervention_type'), 'target_students_count': len(intervention.get('target_students', [])), 'mastery_before': intervention.get('mastery_before'), 'mastery_after': intervention.get('mastery_after'), 'improvement': intervention.get('improvement'), 'predicted_improvement': intervention.get('predicted_improvement'), 'prediction_accuracy': intervention.get('prediction_accuracy'), 'performed_at': intervention.get('performed_at').isoformat() if intervention.get('performed_at') else None, 'measured_at': intervention.get('measured_at').isoformat() if intervention.get('measured_at') else None})
            if intervention.get('measured_at'):
                measured_count += 1
                total_actual_improvement += intervention.get('improvement', 0)
                total_predicted_improvement += intervention.get('predicted_improvement', 0)

        avg_actual_improvement = total_actual_improvement / measured_count if measured_count > 0 else 0
        teacher_effectiveness = {'total_interventions': len(interventions), 'measured_interventions': measured_count, 'avg_improvement': round(avg_actual_improvement, 2), 'effectiveness_rating': 'excellent' if avg_actual_improvement > 12 else 'good' if avg_actual_improvement > 8 else 'satisfactory' if avg_actual_improvement > 5 else 'needs_improvement'}

        return jsonify({'teacher_id': teacher_id, 'interventions': formatted_interventions, 'teacher_effectiveness': teacher_effectiveness}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@dashboard_bp.route('/interventions/recommendations/<teacher_id>', methods=['GET'])
def get_intervention_recommendations(teacher_id):
    try:
        past_interventions = find_many(TEACHER_INTERVENTIONS, {'teacher_id': teacher_id, 'measured_at': {'$ne': None}})
        intervention_effectiveness = {}

        for intervention in past_interventions:
            intervention_type = intervention.get('intervention_type')
            improvement = intervention.get('improvement', 0)
            if intervention_type not in intervention_effectiveness:
                intervention_effectiveness[intervention_type] = []
            intervention_effectiveness[intervention_type].append(improvement)

        recommendations = []
        for intervention_type, improvements in intervention_effectiveness.items():
            avg_improvement = sum(improvements) / len(improvements)
            effectiveness_rating = 'highly_recommended' if avg_improvement > 12 else 'recommended' if avg_improvement > 8 else 'consider' if avg_improvement > 5 else 'not_recommended'
            recommendations.append({'intervention_type': intervention_type, 'avg_improvement': round(avg_improvement, 2), 'effectiveness_rating': effectiveness_rating, 'times_used': len(improvements)})

        recommendations.sort(key=lambda x: x['avg_improvement'], reverse=True)
        return jsonify({'teacher_id': teacher_id, 'recommendations': recommendations}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@dashboard_bp.route('/unified', methods=['GET'])
def get_unified_analytics():
    try:
        metric_date = request.args.get('date', datetime.utcnow().date().isoformat())

        all_students = find_many(STUDENTS, {})
        total_students = len(all_students)
        mastery_records = find_many(STUDENT_CONCEPT_MASTERY, {})
        students_mastered = len([r for r in mastery_records if r.get('mastery_score', 0) >= 70])
        mastery_rate = (students_mastered / total_students * 100) if total_students > 0 else 0

        all_teachers = find_many(TEACHERS, {})
        active_sessions = find_many(ENGAGEMENT_SESSIONS, {'session_start': {'$gte': datetime.utcnow() - timedelta(days=7)}})
        active_teachers = len(set(s.get('teacher_id') for s in active_sessions if s.get('teacher_id')))
        teacher_adoption_rate = (active_teachers / len(all_teachers) * 100) if all_teachers else 0

        data_completeness = (len(mastery_records) / (total_students * 10) * 100) if total_students > 0 else 0
        admin_confidence_score = min(100, data_completeness * 0.5 + mastery_rate * 0.3 + teacher_adoption_rate * 0.2)

        return jsonify({'metric_date': metric_date, 'mastery_rate': round(mastery_rate, 2), 'teacher_adoption_rate': round(teacher_adoption_rate, 2), 'admin_confidence_score': round(admin_confidence_score, 2), 'total_students': total_students, 'total_teachers': len(all_teachers)}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@dashboard_bp.route('/unified/trends', methods=['GET'])
def get_unified_trends():
    try:
        days = request.args.get('days', default=30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)

        sessions = find_many(ENGAGEMENT_SESSIONS, {'session_start': {'$gte': start_date}}, sort=[('session_start', 1)])
        daily_engagement = {}
        for session in sessions:
            date_key = session['session_start'].date().isoformat()
            if date_key not in daily_engagement:
                daily_engagement[date_key] = []
            daily_engagement[date_key].append(session.get('engagement_score', 0))

        trends = {'mastery_rate': [], 'engagement_score': []}
        for date_key in sorted(daily_engagement.keys()):
            avg_engagement = sum(daily_engagement[date_key]) / len(daily_engagement[date_key])
            trends['engagement_score'].append({'date': date_key, 'value': round(avg_engagement, 1)})

        trend_direction = 'improving' if len(trends['engagement_score']) > 1 and trends['engagement_score'][-1]['value'] > trends['engagement_score'][0]['value'] else 'stable'

        return jsonify({'has_data': len(trends['engagement_score']) > 0, 'trends': trends, 'trend_directions': {'engagement': trend_direction}}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

logger.info("Dashboard routes initialized successfully")
