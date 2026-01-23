"""
AMEP Live Polling Routes
Google Classroom-style live polls with real-time WebSocket updates

Solves: BR4 (Inclusive Engagement Capture - Anonymous polling for 100% participation)
        BR6 (Actionable Teacher Feedback - Real-time class understanding)

Research Source: Paper 8h.pdf - "Impact of Live Polling Quizzes"

Key Features:
- Anonymous polling (no fear of judgment)
- Real-time result aggregation
- Instant feedback to teacher
- Multiple question types (understanding, fact-based, multiple choice)
- WebSocket push notifications

Location: backend/api/live_polling_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
import random

# Import MongoDB helpers
from models.database import (
    db,
    find_one,
    find_many,
    insert_one,
    update_one,
    delete_one,
    count_documents,
    LIVE_POLLS,
    POLL_RESPONSES,
    CLASSROOMS,
    CLASSROOM_MEMBERSHIPS,
    STUDENTS
)

# Import logging
from utils.logger import get_logger

# Import SocketIO for real-time updates
from flask import current_app

live_polling_bp = Blueprint('live_polling', __name__)
logger = get_logger(__name__)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_socketio():
    """Get SocketIO instance from app extensions"""
    return current_app.extensions.get('socketio')


def broadcast_poll_update(poll_id: str, classroom_id: str, data: dict):
    """
    Broadcast poll updates to all students in classroom via WebSocket

    BR4: Real-time feedback for inclusive engagement
    """
    socketio = get_socketio()
    if socketio:
        room = f"classroom_{classroom_id}"
        socketio.emit('poll_update', {
            'poll_id': poll_id,
            **data
        }, room=room)
        logger.info(f"Poll update broadcasted | poll_id: {poll_id} | classroom: {classroom_id}")


def broadcast_results_update(poll_id: str, classroom_id: str, results: dict):
    """
    Broadcast updated poll results to teacher and students

    BR6: Instant feedback on class understanding
    """
    socketio = get_socketio()
    if socketio:
        # Send to teacher room
        teacher_room = f"classroom_{classroom_id}_teacher"
        socketio.emit('poll_results', {
            'poll_id': poll_id,
            'results': results
        }, room=teacher_room)

        logger.info(f"Results broadcasted | poll_id: {poll_id} | responses: {results.get('total_responses', 0)}")


# ============================================================================
# LIVE POLL MANAGEMENT ROUTES
# ============================================================================

@live_polling_bp.route('/polls', methods=['POST'])
def create_poll():
    """
    Teacher creates a new live poll

    Request body:
    {
        "teacher_id": "teacher_user_id",
        "classroom_id": "classroom_id",  // Optional - can be general
        "question": "Do you understand the concept?",
        "poll_type": "understanding|fact_based|multiple_choice",
        "options": ["Yes", "Partially", "No"],  // For multiple choice
        "correct_answer": "Answer",  // Optional - for fact-based
        "duration": 300,  // seconds, optional
        "anonymous": true
    }
    """
    try:
        data = request.json
        logger.info(f"Create poll request | teacher: {data.get('teacher_id')} | classroom: {data.get('classroom_id')}")

        # Validate required fields
        if not data.get('teacher_id') or not data.get('question'):
            logger.info("Create poll failed | error: Missing required fields")
            return jsonify({'error': 'teacher_id and question are required'}), 400

        # Validate poll type
        valid_types = ['understanding', 'fact_based', 'multiple_choice', 'slider', 'yes_no']
        if data.get('poll_type', 'understanding') not in valid_types:
            return jsonify({'error': f'poll_type must be one of: {valid_types}'}), 400

        # Auto-generate options for common types
        poll_type = data.get('poll_type', 'understanding')
        options = data.get('options', [])

        if not options:
            if poll_type == 'understanding':
                options = ['Fully understand', 'Partially understand', 'Don\'t understand']
            elif poll_type == 'yes_no':
                options = ['Yes', 'No']
            elif poll_type == 'slider':
                options = ['1', '2', '3', '4', '5']  # 1-5 scale

        poll_doc = {
            '_id': str(ObjectId()),
            'teacher_id': data['teacher_id'],
            'classroom_id': data.get('classroom_id'),
            'question': data['question'],
            'poll_type': poll_type,
            'options': options,
            'correct_answer': data.get('correct_answer'),
            'duration': data.get('duration', 300),  # 5 minutes default
            'anonymous': data.get('anonymous', True),
            'is_active': True,
            'created_at': datetime.utcnow(),
            'closed_at': None,
            'response_count': 0
        }

        poll_id = insert_one(LIVE_POLLS, poll_doc)
        logger.info(f"Poll created | poll_id: {poll_id} | type: {poll_type}")

        # Broadcast to classroom if specified
        if data.get('classroom_id'):
            broadcast_poll_update(poll_id, data['classroom_id'], {
                'event': 'new_poll',
                'question': data['question'],
                'options': options,
                'poll_type': poll_type
            })

        return jsonify({
            'poll_id': poll_id,
            'message': 'Poll created successfully',
            'is_active': True
        }), 201

    except Exception as e:
        logger.info(f"Create poll exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@live_polling_bp.route('/polls/<poll_id>', methods=['GET'])
def get_poll(poll_id):
    """Get poll details"""
    try:
        logger.info(f"Get poll request | poll_id: {poll_id}")

        poll = find_one(LIVE_POLLS, {'_id': poll_id})
        if not poll:
            logger.info(f"Poll not found | poll_id: {poll_id}")
            return jsonify({'error': 'Poll not found'}), 404

        # Get response count
        response_count = count_documents(POLL_RESPONSES, {'poll_id': poll_id})

        return jsonify({
            'poll_id': poll['_id'],
            'question': poll.get('question'),
            'poll_type': poll.get('poll_type'),
            'options': poll.get('options', []),
            'is_active': poll.get('is_active'),
            'anonymous': poll.get('anonymous'),
            'response_count': response_count,
            'created_at': poll.get('created_at').isoformat() if poll.get('created_at') else None,
            'closed_at': poll.get('closed_at').isoformat() if poll.get('closed_at') else None
        }), 200

    except Exception as e:
        logger.info(f"Get poll exception | poll_id: {poll_id} | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@live_polling_bp.route('/polls/<poll_id>/respond', methods=['POST'])
def respond_to_poll(poll_id):
    """
    Student responds to a poll (anonymous)

    BR4: Ensures 100% participation through anonymous responses

    Request body:
    {
        "student_id": "student_user_id",
        "response": "Yes"  // Or index for multiple choice
    }
    """
    try:
        data = request.json
        logger.info(f"Poll response | poll_id: {poll_id} | student: {data.get('student_id')}")

        if not data.get('student_id') or 'response' not in data:
            return jsonify({'error': 'student_id and response are required'}), 400

        # Check if poll exists and is active
        poll = find_one(LIVE_POLLS, {'_id': poll_id})
        if not poll:
            return jsonify({'error': 'Poll not found'}), 404

        if not poll.get('is_active'):
            logger.info(f"Poll response failed | poll_id: {poll_id} | error: Poll closed")
            return jsonify({'error': 'Poll is closed'}), 400

        # Check if student already responded
        existing = find_one(POLL_RESPONSES, {
            'poll_id': poll_id,
            'student_id': data['student_id']
        })

        if existing:
            logger.info(f"Poll response failed | poll_id: {poll_id} | student: {data['student_id']} | error: Already responded")
            return jsonify({'error': 'You have already responded to this poll'}), 400

        # Validate response
        response_value = data['response']
        if poll.get('options') and response_value not in poll['options']:
            return jsonify({'error': f'Invalid response. Must be one of: {poll["options"]}'}), 400

        # Check correctness if fact-based
        is_correct = None
        if poll.get('correct_answer'):
            is_correct = (response_value == poll['correct_answer'])

        # Store response
        response_doc = {
            '_id': str(ObjectId()),
            'poll_id': poll_id,
            'student_id': data['student_id'],
            'response': response_value,
            'is_correct': is_correct,
            'submitted_at': datetime.utcnow(),
            'response_time': data.get('response_time', 0)  # How long to answer
        }

        insert_one(POLL_RESPONSES, response_doc)

        # Update poll response count
        update_one(
            LIVE_POLLS,
            {'_id': poll_id},
            {'$inc': {'response_count': 1}}
        )

        logger.info(f"Poll response recorded | poll_id: {poll_id} | response: {response_value}")

        # Broadcast updated results to teacher (BR6)
        if poll.get('classroom_id'):
            results = calculate_poll_results(poll_id)
            broadcast_results_update(poll_id, poll['classroom_id'], results)

        return jsonify({
            'message': 'Response recorded successfully',
            'is_correct': is_correct
        }), 201

    except Exception as e:
        logger.info(f"Poll response exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500




@live_polling_bp.route('/polls/<poll_id>/results', methods=['GET'])
def get_poll_results(poll_id):
    """
    Get poll results (teacher view)

    BR6: Real-time feedback on class understanding

    Returns aggregated results while maintaining anonymity
    """
    try:
        logger.info(f"Get poll results | poll_id: {poll_id}")

        poll = find_one(LIVE_POLLS, {'_id': poll_id})
        if not poll:
            return jsonify({'error': 'Poll not found'}), 404

        results = calculate_poll_results(poll_id)

        return jsonify(results), 200

    except Exception as e:
        logger.info(f"Get poll results exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


def calculate_poll_results(poll_id: str) -> dict:
    """
    Calculate aggregated poll results

    BR4: Anonymous aggregation ensures student privacy
    BR6: Provides actionable insights to teacher
    """
    poll = find_one(LIVE_POLLS, {'_id': poll_id})
    if not poll:
        return {}

    # Get all responses
    responses = find_many(POLL_RESPONSES, {'poll_id': poll_id})

    total_responses = len(responses)

    # Aggregate by response value
    response_counts = {}
    for option in poll.get('options', []):
        response_counts[option] = 0

    for response in responses:
        value = response.get('response')
        if value in response_counts:
            response_counts[value] += 1
        else:
            response_counts[value] = 1

    # Calculate percentages
    response_percentages = {}
    if total_responses > 0:
        for option, count in response_counts.items():
            response_percentages[option] = round((count / total_responses) * 100, 1)

    # Calculate accuracy if fact-based
    accuracy = None
    if poll.get('correct_answer'):
        correct_count = sum(1 for r in responses if r.get('is_correct'))
        accuracy = round((correct_count / total_responses * 100), 1) if total_responses > 0 else 0

    # Calculate average response time
    response_times = [r.get('response_time', 0) for r in responses if r.get('response_time')]
    avg_response_time = round(sum(response_times) / len(response_times), 2) if response_times else 0

    # Understanding level interpretation
    understanding_level = None
    if poll.get('poll_type') == 'understanding':
        if 'Fully understand' in response_percentages:
            understanding_level = response_percentages['Fully understand']
        elif 'Yes' in response_percentages:
            understanding_level = response_percentages['Yes']

    # Generate recommendation
    recommendation = generate_teaching_recommendation(
        poll.get('poll_type'),
        response_percentages,
        total_responses,
        understanding_level
    )

    return {
        'poll_id': poll_id,
        'question': poll.get('question'),
        'poll_type': poll.get('poll_type'),
        'total_responses': total_responses,
        'response_counts': response_counts,
        'response_percentages': response_percentages,
        'accuracy': accuracy,
        'avg_response_time': avg_response_time,
        'understanding_level': understanding_level,
        'recommendation': recommendation,
        'is_active': poll.get('is_active'),
        'created_at': poll.get('created_at').isoformat() if poll.get('created_at') else None
    }


def generate_teaching_recommendation(
    poll_type: str,
    percentages: dict,
    total_responses: int,
    understanding_level: float
) -> str:
    """
    BR6: Generate actionable recommendation based on poll results

    Research from Paper 8h.pdf: "Immediate feedback allows lecturers
    to gauge student understanding in real-time and adjust teaching timely"
    """
    if total_responses == 0:
        return "No responses yet - wait for more participation"

    if poll_type == 'understanding':
        if understanding_level is not None:
            if understanding_level >= 80:
                return "✅ Strong understanding - proceed with next topic"
            elif understanding_level >= 60:
                return "⚠️ Moderate understanding - quick review recommended"
            elif understanding_level >= 40:
                return "⚠️ Low understanding - re-explain key points before moving on"
            else:
                return "❌ Very low understanding - consider alternative teaching approach"

    elif poll_type == 'fact_based':
        # Look for correct answer percentage
        if percentages:
            max_percent = max(percentages.values())
            if max_percent >= 80:
                return "✅ Most students answered correctly - concept is clear"
            elif max_percent >= 60:
                return "⚠️ Some confusion - clarify misconceptions"
            else:
                return "❌ Widespread confusion - reteach this concept"

    return "Review responses and adjust teaching as needed"


@live_polling_bp.route('/classrooms/<classroom_id>/polls', methods=['GET'])
def get_classroom_polls(classroom_id):
    """Get all polls for a classroom"""
    try:
        logger.info(f"Get classroom polls | classroom_id: {classroom_id}")

        # Query parameters
        active_only = request.args.get('active_only') == 'true'
        limit = int(request.args.get('limit', 20))

        query = {'classroom_id': classroom_id}
        if active_only:
            query['is_active'] = True

        polls = find_many(
            LIVE_POLLS,
            query,
            sort=[('created_at', -1)]
        )[:limit]

        formatted_polls = []
        for poll in polls:
            # Calculate full results for each poll to show history
            poll_data = calculate_poll_results(poll['_id'])
            formatted_polls.append(poll_data)

        logger.info(f"Classroom polls retrieved | classroom_id: {classroom_id} | count: {len(formatted_polls)}")
        return jsonify(formatted_polls), 200

    except Exception as e:
        logger.info(f"Get classroom polls exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


# ============================================================================
# WEBSOCKET EVENT HANDLERS
# ============================================================================

def register_polling_socketio_events(socketio):
    """
    Register WebSocket events for live polling

    Call this from app.py during initialization
    """

    @socketio.on('join_poll')
    def handle_join_poll(data):
        """Student/teacher joins poll room for real-time updates"""
        from flask_socketio import join_room

        poll_id = data.get('poll_id')
        user_id = data.get('user_id')
        role = data.get('role', 'student')

        # Join poll-specific room
        room = f"poll_{poll_id}"
        join_room(room)

        logger.info(f"WebSocket: User joined poll room | poll_id: {poll_id} | user: {user_id} | role: {role}")

        # Send current poll state
        poll = find_one(LIVE_POLLS, {'_id': poll_id})
        if poll:
            socketio.emit('poll_state', {
                'poll_id': poll_id,
                'is_active': poll.get('is_active'),
                'response_count': poll.get('response_count', 0)
            }, room=room)


# ============================================================================
# EXAMPLE USAGE & TESTING
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("AMEP Live Polling System - Example Usage")
    print("=" * 60)
    print()
    print("1. Create Poll:")
    print("   POST /api/polling/polls")
    print("   {\"teacher_id\": \"...\", \"question\": \"Do you understand?\", \"poll_type\": \"understanding\"}")
    print()
    print("2. Student Responds (Anonymous):")
    print("   POST /api/polling/polls/{poll_id}/respond")
    print("   {\"student_id\": \"...\", \"response\": \"Yes\"}")
    print()
    print("3. View Results (Teacher):")
    print("   GET /api/polling/polls/{poll_id}/results")
    print()
    print("4. Real-time Updates via WebSocket:")
    print("   socket.emit('join_poll', {poll_id: '...', user_id: '...'})")
    print("   socket.on('poll_update', callback)")
    print()
    print("=" * 60)
