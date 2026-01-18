"""
AMEP Main Flask Application
Entry point for the backend server

Location: backend/app.py
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from datetime import datetime
import os

# Import configuration
from config import Config


# Import database
from models.database import init_db

# ============================================================================
# APP INITIALIZATION
# ============================================================================

def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS
    CORS(app, origins=app.config["CORS_ORIGINS"])

    # Initialize SocketIO
    socketio = SocketIO(
        app,
        cors_allowed_origins=app.config["CORS_ORIGINS"],
        async_mode="threading"  # safer than eventlet unless explicitly installed
    )

    # Make socketio accessible in blueprints
    app.extensions["socketio"] = socketio

    # Initialize database
    init_db(app)

    # Register blueprints
    register_blueprints(app)

    # Register WebSocket events
    register_socketio_events(socketio)

    # Register error handlers
    register_error_handlers(app)

    return app, socketio


# ============================================================================
# BLUEPRINT REGISTRATION
# ============================================================================

def register_blueprints(app):
    """Register all API route blueprints"""
    from api.auth_routes import auth_bp
    from api.mastery_routes import mastery_bp
    from api.engagement_routes import engagement_bp
    from api.pbl_routes import pbl_bp
    from api.analytics_routes import analytics_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(mastery_bp, url_prefix="/api/mastery")
    app.register_blueprint(engagement_bp, url_prefix="/api/engagement")
    app.register_blueprint(pbl_bp, url_prefix="/api/pbl")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    print("✓ All blueprints registered")


# ============================================================================
# WEBSOCKET EVENTS
# ============================================================================

def register_socketio_events(socketio):
    """Register all SocketIO event handlers"""

    @socketio.on("connect")
    def handle_connect():
        print("✓ Client connected")
        emit("connected", {
            "message": "Connected to AMEP server",
            "timestamp": datetime.utcnow().isoformat()
        })

    @socketio.on("disconnect")
    def handle_disconnect():
        print("✗ Client disconnected")

    @socketio.on("join_class")
    def handle_join_class(data):
        from flask_socketio import join_room

        class_id = data.get("class_id")
        user_id = data.get("user_id")
        role = data.get("role", "student")

        join_room(class_id)

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

        print(f"✓ User {user_id} joined class {class_id}")

    @socketio.on("leave_class")
    def handle_leave_class(data):
        from flask_socketio import leave_room

        class_id = data.get("class_id")
        user_id = data.get("user_id")

        leave_room(class_id)
        print(f"✗ User {user_id} left class {class_id}")

    @socketio.on("poll_response_submitted")
    def handle_poll_response(data):
        emit(
            "poll_updated",
            {
                "poll_id": data.get("poll_id"),
                "total_responses": data.get("total_responses", 0),
                "timestamp": datetime.utcnow().isoformat()
            },
            room=data.get("class_id"),
            broadcast=True
        )

    @socketio.on("engagement_alert")
    def handle_engagement_alert(data):
        class_id = data.get("class_id")

        emit(
            "engagement_alert_received",
            {
                "student_id": data.get("student_id"),
                "alert_type": data.get("alert_type"),
                "severity": data.get("severity"),
                "message": data.get("message"),
                "timestamp": datetime.utcnow().isoformat()
            },
            room=f"teachers_{class_id}"
        )

    print("✓ All SocketIO events registered")


# ============================================================================
# HEALTH CHECK & ERROR HANDLERS
# ============================================================================

def register_error_handlers(app):

    @app.route("/")
    def index():
        return jsonify({
            "name": "AMEP API",
            "version": "1.0.0",
            "status": "running"
        })

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat()
        }), 200

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal server error",
            "message": str(error) if app.config["DEBUG"] else "An error occurred"
        }), 500

    print("✓ Error handlers registered")


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    app, socketio = create_app()

    print("\n" + "=" * 60)
    print("🚀 AMEP Backend Server Starting...")
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
        debug=app.config.get("DEBUG", False)
    )
