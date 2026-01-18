from functools import wraps
from datetime import datetime, timedelta
import jwt
import hashlib
from flask import request, jsonify, current_app
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    # Pre-hash with SHA256 to handle passwords longer than 72 bytes
    prehash = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(prehash)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    prehash = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(prehash, hashed_password)


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_header():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Missing authorization token"}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        if payload.get("type") != "access":
            return jsonify({"error": "Invalid token type"}), 401

        request.current_user = {
            "user_id": payload["sub"],
            "role": payload["role"]
        }
        return f(*args, **kwargs)
    return decorated


def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = get_token_from_header()
            if not token:
                return jsonify({"error": "Missing authorization token"}), 401

            payload = decode_token(token)
            if not payload:
                return jsonify({"error": "Invalid or expired token"}), 401

            if payload.get("type") != "access":
                return jsonify({"error": "Invalid token type"}), 401

            user_role = payload.get("role")
            if user_role not in allowed_roles:
                return jsonify({"error": "Insufficient permissions"}), 403

            request.current_user = {
                "user_id": payload["sub"],
                "role": user_role
            }
            return f(*args, **kwargs)
        return decorated
    return decorator


def get_current_user():
    return getattr(request, "current_user", None)
