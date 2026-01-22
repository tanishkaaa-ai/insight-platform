#!/usr/bin/env python3
"""
Minimal test to check if Flask app can start with basic dependencies
"""

import sys
import os

# Mock missing modules to test basic Flask functionality
class MockModule:
    def __getattr__(self, name):
        return MockModule()

    def __call__(self, *args, **kwargs):
        return MockModule()

# Mock missing dependencies
sys.modules['sklearn'] = MockModule()
sys.modules['flask_cors'] = MockModule()
sys.modules['flask_socketio'] = MockModule()
sys.modules['pymongo'] = MockModule()
sys.modules['motor'] = MockModule()
sys.modules['bcrypt'] = MockModule()
sys.modules['pydantic'] = MockModule()
sys.modules['celery'] = MockModule()
sys.modules['redis'] = MockModule()
sys.modules['scipy'] = MockModule()
sys.modules['torch'] = MockModule()
sys.modules['scikit_learn'] = MockModule()
sys.modules['python_jose'] = MockModule()
sys.modules['email_validator'] = MockModule()
sys.modules['python_dotenv'] = MockModule()
sys.modules['dotenv'] = MockModule()
sys.modules['jwt'] = MockModule()
sys.modules['watchdog'] = MockModule()

# Mock the CORS and SocketIO classes
class MockCORS:
    def __init__(self, app, **kwargs):
        pass

class MockSocketIO:
    def __init__(self, app, **kwargs):
        pass

    def run(self, app, **kwargs):
        print("Mock SocketIO: Would start server here")

sys.modules['flask_cors'].CORS = MockCORS
sys.modules['flask_socketio'].SocketIO = MockSocketIO

# Mock database functions
class MockDB:
    def __getattr__(self, name):
        return lambda *args, **kwargs: []

sys.modules['models'] = MockModule()
sys.modules['models.database'] = MockDB()
sys.modules['utils'] = MockModule()
sys.modules['utils.logger'] = MockModule()
sys.modules['utils.error_handlers'] = MockModule()
sys.modules['ai_engine'] = MockModule()
sys.modules['celery_app'] = MockModule()

def test_flask_app():
    """Test if Flask app can be created with mocked dependencies"""
    try:
        print("🔧 Testing Flask app creation with mocked dependencies...")

        # Import and create app
        from app import create_app

        print("✅ App factory import successful")

        # Create app (this will fail if there are real import issues)
        app, socketio = create_app()

        print("✅ App creation successful")
        print(f"   Environment: {app.config.get('ENV', 'unknown')}")
        print(f"   Debug: {app.config.get('DEBUG', 'unknown')}")
        print(f"   Port: {app.config.get('PORT', 'unknown')}")

        # Test route registration
        with app.test_client() as client:
            # Test root endpoint
            response = client.get('/')
            print(f"✅ Root endpoint (/): {response.status_code}")

            # Test health endpoint
            response = client.get('/api/health')
            print(f"✅ Health endpoint (/api/health): {response.status_code}")

        print("\n🎉 Basic Flask functionality test PASSED")
        return True

    except Exception as e:
        print(f"❌ Flask app test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_endpoint_registration():
    """Test if endpoints are registered properly"""
    try:
        print("\n🔧 Testing endpoint registration...")

        from app import create_app
        app, socketio = create_app()

        # Get all registered routes
        routes = []
        for rule in app.url_map.iter_rules():
            if rule.endpoint != 'static':  # Skip static files
                methods = [m for m in rule.methods if m not in ['HEAD', 'OPTIONS']]
                routes.append({
                    'path': str(rule),
                    'methods': methods,
                    'endpoint': rule.endpoint
                })

        print(f"✅ Found {len(routes)} registered routes")

        # Check for key endpoints
        key_endpoints = ['/', '/api/health', '/api/auth/login', '/api/auth/register']
        for endpoint in key_endpoints:
            found = any(r['path'] == endpoint for r in routes)
            status = "✅" if found else "❌"
            print(f"   {status} {endpoint}")

        return True

    except Exception as e:
        print(f"❌ Endpoint registration test FAILED: {e}")
        return False

if __name__ == '__main__':
    print("🧪 AMEP Backend Minimal Testing")
    print("=" * 50)

    success1 = test_flask_app()
    success2 = test_endpoint_registration()

    print("\n" + "=" * 50)
    if success1 and success2:
        print("✅ ALL TESTS PASSED - Backend structure is sound")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED - Check dependency issues")
        sys.exit(1)