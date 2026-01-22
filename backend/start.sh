#!/bin/bash

echo "Starting AMEP Backend with async processing..."

# Start Redis (if not using Docker)
# redis-server &

# Start Celery worker for ML processing (high priority)
celery -A celery_app worker --loglevel=info --queues=ml_processing --concurrency=2 --hostname=ml_worker@%h &

# Start Celery worker for analytics (normal priority)  
celery -A celery_app worker --loglevel=info --queues=analytics --concurrency=4 --hostname=analytics_worker@%h &

# Start Celery worker for default tasks
celery -A celery_app worker --loglevel=info --queues=default --concurrency=2 --hostname=default_worker@%h &

# Start Flower monitoring (optional - requires FLOWER_BASIC_AUTH to be set)
if [ -n "$FLOWER_BASIC_AUTH" ]; then
    celery -A celery_app flower --port=5555 --basic_auth=${FLOWER_BASIC_AUTH} &
else
    echo "Warning: FLOWER_BASIC_AUTH not set, skipping Flower monitoring"
fi

echo "Background services started. Starting Flask app..."

# Start Flask app (this runs in foreground)
python app.py