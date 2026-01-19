from celery import Celery
import os
import logging
from kombu import Queue

logger = logging.getLogger(__name__)

# Celery configuration
app = Celery('amep')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
app.conf.broker_url = REDIS_URL
app.conf.result_backend = REDIS_URL

# Task routing
app.conf.task_routes = {
    'celery_app.process_mastery_update': {'queue': 'ml_processing'},
    'celery_app.update_engagement_metrics': {'queue': 'analytics'},
}

# Queue configuration
app.conf.task_default_queue = 'default'
app.conf.task_queues = (
    Queue('ml_processing', routing_key='ml_processing'),
    Queue('analytics', routing_key='analytics'),
    Queue('default', routing_key='default'),
)

@app.task(bind=True, max_retries=3)
def process_mastery_update(self, student_id, response_data):
    """Process ML computations asynchronously"""
    try:
        from ml_models import calculate_mastery_score
        
        # Run heavy ML computation
        mastery_score = calculate_mastery_score(student_id, response_data)
        
        # Update database
        from database import update_student_mastery
        update_student_mastery(student_id, mastery_score)
        
        return {"student_id": student_id, "mastery_score": mastery_score}
    
    except Exception as exc:
        logger.error(f"Mastery update failed for student {student_id}: {exc}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@app.task(bind=True, max_retries=3)
def update_engagement_metrics(self, student_id, engagement_data):
    """Update engagement analytics"""
    try:
        from analytics import calculate_engagement_score
        
        engagement_score = calculate_engagement_score(student_id, engagement_data)
        
        from database import update_engagement_analytics
        update_engagement_analytics(student_id, engagement_score)
        
        return engagement_score
    
    except Exception as exc:
        logger.error(f"Engagement update failed for student {student_id}: {exc}")
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))

if __name__ == '__main__':
    app.start()