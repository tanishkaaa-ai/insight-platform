"""
AMEP Main Flask Application
Entry point for the backend server

Location: backend/app.py
"""

# Graceful degradation - Library now installed
# import sklearn  # Temporarily commented out for testing

from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from datetime import datetime
import os

# Import configuration
from config import Config

# Import logging
from utils.logger import get_logger, log_request_middleware

# Import database
from models.database import init_db

# Setup logger
logger = get_logger(__name__)

# ============================================================================
# APP INITIALIZATION
# ============================================================================

def create_app(config_class=Config):
    """Application factory pattern"""
    logger.info("=" * 60)
    logger.info("AMEP Application Initialization Starting...")
    logger.info("=" * 60)

    app = Flask(__name__)
    app.config.from_object(config_class)

    logger.info(f"Environment: {app.config['ENV']}")
    logger.info(f"Debug Mode: {app.config['DEBUG']}")

    # Enable CORS
    CORS(app, origins=app.config["CORS_ORIGINS"])
    logger.info(f"CORS enabled for origins: {app.config['CORS_ORIGINS']}")

    # Initialize SocketIO
    socketio = SocketIO(
        app,
        cors_allowed_origins=app.config["CORS_ORIGINS"],
        async_mode="threading"  # safer than eventlet unless explicitly installed
    )
    logger.info("SocketIO initialized with threading mode")

    # Make socketio accessible in blueprints
    app.extensions["socketio"] = socketio

    # Initialize database
    logger.info("Initializing database connection...")
    init_db(app)
    logger.info("Database initialized successfully")

    # Setup request logging middleware
    log_request_middleware(app)
    logger.info("Request logging middleware enabled")

    # Register blueprints
    register_blueprints(app)

    # Register WebSocket events
    register_socketio_events(socketio)

    # Register error handlers
    register_error_handlers(app)

    logger.info("=" * 60)
    logger.info("AMEP Application Initialization Complete")
    logger.info("=" * 60)

    return app, socketio


# ============================================================================
# BLUEPRINT REGISTRATION
# ============================================================================

def register_blueprints(app):
    """Register all API route blueprints"""
    logger.info("Registering API blueprints...")

    from api.auth_routes import auth_bp
    from api.mastery_routes import mastery_bp
    from api.mastery_concepts_routes import concepts_bp
    from api.engagement_routes import engagement_bp
    from api.classroom_routes import classroom_bp
    from api.live_polling_routes import live_polling_bp
    from api.template_routes import template_bp
    from api.dashboard_routes import dashboard_bp
    from api.pbl_workflow_routes import pbl_workflow_bp
    from api.pbl_crud_extensions import pbl_crud_bp
    from api.polling_template_crud import poll_template_crud_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    logger.info("Registered: /api/auth")

    app.register_blueprint(mastery_bp, url_prefix="/api/mastery")
    logger.info("Registered: /api/mastery")

    app.register_blueprint(concepts_bp, url_prefix="/api/mastery")
    logger.info("Registered: /api/mastery (concepts & items)")

    app.register_blueprint(classroom_bp, url_prefix="/api/classroom")
    logger.info("Registered: /api/classroom")

    app.register_blueprint(engagement_bp, url_prefix="/api/engagement")
    logger.info("Registered: /api/engagement")

    app.register_blueprint(live_polling_bp, url_prefix="/api/polling")
    logger.info("Registered: /api/polling")

    # Register poll_template_crud_bp only once for its specific CRUD operations
    # Note: This blueprint contains mixed CRUD operations for polls, templates, interventions, etc.
    # It's registered at /api/polling for backward compatibility with existing routes
    app.register_blueprint(poll_template_crud_bp, url_prefix="/api/polling")
    logger.info("Registered: /api/polling (CRUD extensions)")

    app.register_blueprint(template_bp, url_prefix="/api/templates")
    logger.info("Registered: /api/templates")

    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    logger.info("Registered: /api/dashboard")

    app.register_blueprint(pbl_workflow_bp, url_prefix="/api/pbl")
    logger.info("Registered: /api/pbl")

    app.register_blueprint(pbl_crud_bp, url_prefix="/api/pbl")
    logger.info("Registered: /api/pbl (CRUD extensions)")

    logger.info("All blueprints registered successfully")


# ============================================================================
# WEBSOCKET EVENTS
# ============================================================================

def register_socketio_events(socketio):
    """Register all SocketIO event handlers"""
    logger.info("Registering SocketIO events...")

    @socketio.on("connect")
    def handle_connect():
        logger.info("WebSocket: Client connected")
        emit("connected", {
            "message": "Connected to AMEP server",
            "timestamp": datetime.utcnow().isoformat()
        })

    @socketio.on("disconnect")
    def handle_disconnect(*args):
        logger.info(f"WebSocket: Client disconnected | Args: {args}")

    @socketio.on("join_class")
    def handle_join_class(data):
        from flask_socketio import join_room

        class_id = data.get("class_id")
        user_id = data.get("user_id")
        role = data.get("role", "student")

        join_room(class_id)
        logger.info(f"WebSocket: User {user_id} ({role}) joined class {class_id}")

        emit(
            "user_joined",
            {
                "user_id": user_id,
                "role": role,
                "timestamp": datetime.utcnow().isoformat()
            },
            room=class_id,
            skip_sid=True
        )

    @socketio.on("leave_class")
    def handle_leave_class(data):
        from flask_socketio import leave_room

        class_id = data.get("class_id")
        user_id = data.get("user_id")

        leave_room(class_id)
        logger.info(f"WebSocket: User {user_id} left class {class_id}")

    @socketio.on("poll_response_submitted")
    def handle_poll_response(data):
        poll_id = data.get("poll_id")
        class_id = data.get("class_id")
        logger.info(f"WebSocket: Poll response submitted | Poll: {poll_id} | Class: {class_id}")

        emit(
            "poll_updated",
            {
                "poll_id": poll_id,
                "total_responses": data.get("total_responses", 0),
                "timestamp": datetime.utcnow().isoformat()
            },
            room=class_id,
            broadcast=True
        )

    @socketio.on("engagement_alert")
    def handle_engagement_alert(data):
        class_id = data.get("class_id")
        student_id = data.get("student_id")
        severity = data.get("severity")

        logger.info(f"WebSocket: Engagement alert | Student: {student_id} | Severity: {severity} | Class: {class_id}")

        emit(
            "engagement_alert_received",
            {
                "student_id": student_id,
                "alert_type": data.get("alert_type"),
                "severity": severity,
                "message": data.get("message"),
                "timestamp": datetime.utcnow().isoformat()
            },
            room=f"teachers_{class_id}"
        )

    logger.info("All SocketIO events registered")


# ============================================================================
# HEALTH CHECK & ERROR HANDLERS
# ============================================================================

def register_error_handlers(app):
    """Register error handlers and health check routes"""
    from utils.error_handlers import register_error_handlers as register_handlers
    from utils.error_handlers import register_custom_error_handlers

    @app.route("/")
    def index():
        return jsonify({
            "name": "AMEP API",
            "version": "1.0.0",
            "status": "running",
            "endpoints": {
                "auth": "/api/auth",
                "mastery": "/api/mastery",
                "engagement": "/api/engagement",
                "pbl": "/api/pbl",
                "analytics": "/api/analytics",
                "classroom": "/api/classroom",
                "polling": "/api/polling",
                "templates": "/api/templates",
                "dashboard": "/api/dashboard",
                "health": "/api/health"
            }
        })

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected"
        }), 200

    # Register comprehensive error handlers
    register_handlers(app)
    register_custom_error_handlers(app)

    logger.info("Error handlers registered")


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    app, socketio = create_app()

    print("\n" + "=" * 60)
    print("[STARTED] AMEP Backend Server Starting...")
    print("="*60)
    print(f"Environment: {app.config['ENV']}")
    print(f"Debug Mode: {app.config['DEBUG']}")
    print(f"Database: {app.config['MONGODB_URI'][:30]}...")
    print(f"Port: {app.config['PORT']}")
    print("="*60 + "\n")
    
    # Run with SocketIO
    socketio.run(
        app,
        host=app.config.get("HOST", "0.0.0.0"),
        port=app.config.get("PORT", 5000),
        debug=app.config.get("DEBUG", False),
        use_reloader=False
    )
