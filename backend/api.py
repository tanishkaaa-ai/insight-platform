from flask import Flask, request, jsonify
from celery_app import process_mastery_update, update_engagement_metrics
import redis
import json
import os
import logging

logger = logging.getLogger(__name__)

app = Flask(__name__)
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
redis_client = redis.from_url(REDIS_URL)

def validate_json_request(required_fields):
    """Validate JSON request and required fields"""
    if not request.is_json:
        return None, {"error": "Content-Type must be application/json"}, 400
    
    data = request.get_json()
    if data is None:
        return None, {"error": "Invalid JSON"}, 400
    
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return None, {"error": f"Missing required fields: {missing_fields}"}, 400
    
    return data, None, None

@app.route('/api/submit_response', methods=['POST'])
def submit_response():
    """Non-blocking response submission"""
    data, error_response, status_code = validate_json_request(['student_id', 'response'])
    if error_response:
        return jsonify(error_response), status_code
    
    student_id = data['student_id']
    response_data = data['response']
    
    # Queue ML processing task (non-blocking)
    task = process_mastery_update.delay(student_id, response_data)
    
    # Store task ID for status checking
    redis_client.setex(f"task:{student_id}", 300, task.id)
    
    return jsonify({
        "status": "accepted",
        "task_id": task.id,
        "message": "Response processing started"
    }), 202

@app.route('/api/mastery_status/<student_id>', methods=['GET'])
def get_mastery_status(student_id):
    """Check processing status"""
    task_id = redis_client.get(f"task:{student_id}")
    
    if not task_id:
        return jsonify({"status": "no_pending_tasks"}), 200
    
    task = process_mastery_update.AsyncResult(task_id.decode())
    
    if task.ready():
        if task.successful():
            result = task.result
            return jsonify({
                "status": "completed",
                "mastery_score": result["mastery_score"]
            })
        else:
            logger.error(f"Task failed for student {student_id}: {task.info}")
            return jsonify({
                "status": "failed",
                "error": "Processing failed. Please try again."
            }), 500
    else:
        return jsonify({"status": "processing"}), 202

@app.route('/api/engagement_event', methods=['POST'])
def log_engagement():
    """Log engagement event asynchronously"""
    data, error_response, status_code = validate_json_request(['student_id', 'engagement_data'])
    if error_response:
        return jsonify(error_response), status_code
    
    student_id = data['student_id']
    engagement_data = data['engagement_data']
    
    # Queue analytics update (fire and forget)
    update_engagement_metrics.delay(student_id, engagement_data)
    
    return jsonify({"status": "logged"}), 200

@app.route('/api/live_poll_response', methods=['POST'])
def live_poll_response():
    """Handle live polling with immediate response"""
    data, error_response, status_code = validate_json_request(['student_id', 'response'])
    if error_response:
        return jsonify(error_response), status_code
    
    student_id = data['student_id']
    poll_response = data['response']
    
    # Store response immediately for live results
    from database import store_poll_response
    store_poll_response(student_id, poll_response)
    
    # Queue engagement analysis
    engagement_data = {
        "type": "poll_participation",
        "response_time": data.get('response_time'),
        "timestamp": data.get('timestamp')
    }
    update_engagement_metrics.delay(student_id, engagement_data)
    
    return jsonify({"status": "recorded"}), 200

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode)