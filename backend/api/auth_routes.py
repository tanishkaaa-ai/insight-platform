from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
import re

from models.database import db, USERS, STUDENTS, TEACHERS
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    jwt_required,
    get_current_user
)

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        email = data.get("email", "").strip().lower()
        username = data.get("username", "").strip()
        password = data.get("password", "")
        role = data.get("role", "student")
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()

        if not email or not username or not password:
            return jsonify({"error": "Email, username and password are required"}), 400

        if not EMAIL_REGEX.match(email):
            return jsonify({"error": "Invalid email format"}), 400

        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400

        if role not in ["student", "teacher", "admin"]:
            return jsonify({"error": "Invalid role"}), 400

        if db[USERS].find_one({"email": email}):
            return jsonify({"error": "Email already registered"}), 409

        if db[USERS].find_one({"username": username}):
            return jsonify({"error": "Username already taken"}), 409

        user_id = str(ObjectId())
        user_doc = {
            "_id": user_id,
            "email": email,
            "username": username,
            "password_hash": hash_password(password),
            "role": role,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        db[USERS].insert_one(user_doc)

        if role == "student":
            student_doc = {
                "_id": str(ObjectId()),
                "user_id": user_id,
                "first_name": first_name or username,
                "last_name": last_name or "",
                "grade_level": data.get("grade_level"),
                "section": data.get("section"),
                "enrollment_date": datetime.utcnow(),
                "learning_style": None,
                "created_at": datetime.utcnow()
            }
            db[STUDENTS].insert_one(student_doc)

        elif role == "teacher":
            teacher_doc = {
                "_id": str(ObjectId()),
                "user_id": user_id,
                "first_name": first_name or username,
                "last_name": last_name or "",
                "subject_area": data.get("subject_area"),
                "department": data.get("department"),
                "years_experience": data.get("years_experience"),
                "created_at": datetime.utcnow()
            }
            db[TEACHERS].insert_one(teacher_doc)

        access_token = create_access_token(user_id, role)
        refresh_token = create_refresh_token(user_id)

        return jsonify({
            "message": "Registration successful",
            "user": {
                "id": user_id,
                "email": email,
                "username": username,
                "role": role,
                "first_name": first_name or username,
                "last_name": last_name
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = db[USERS].find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401

    user_id = user["_id"]
    role = user["role"]

    access_token = create_access_token(user_id, role)
    refresh_token = create_refresh_token(user_id)

    profile = None
    if role == "student":
        profile = db[STUDENTS].find_one({"user_id": user_id})
    elif role == "teacher":
        profile = db[TEACHERS].find_one({"user_id": user_id})

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user_id,
            "email": user["email"],
            "username": user["username"],
            "role": role,
            "first_name": profile.get("first_name") if profile else None,
            "last_name": profile.get("last_name") if profile else None
        },
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    data = request.get_json()
    refresh_token = data.get("refresh_token", "")

    if not refresh_token:
        return jsonify({"error": "Refresh token is required"}), 400

    payload = decode_token(refresh_token)
    if not payload:
        return jsonify({"error": "Invalid or expired refresh token"}), 401

    if payload.get("type") != "refresh":
        return jsonify({"error": "Invalid token type"}), 401

    user_id = payload["sub"]
    user = db[USERS].find_one({"_id": user_id})

    if not user:
        return jsonify({"error": "User not found"}), 404

    access_token = create_access_token(user_id, user["role"])

    return jsonify({
        "access_token": access_token
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required
def get_me():
    current_user = get_current_user()
    user_id = current_user["user_id"]

    user = db[USERS].find_one({"_id": user_id}, {"password_hash": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404

    role = user["role"]
    profile = None

    if role == "student":
        profile = db[STUDENTS].find_one({"user_id": user_id})
    elif role == "teacher":
        profile = db[TEACHERS].find_one({"user_id": user_id})

    response = {
        "id": user["_id"],
        "email": user["email"],
        "username": user["username"],
        "role": role,
        "created_at": user.get("created_at")
    }

    if profile:
        response["first_name"] = profile.get("first_name")
        response["last_name"] = profile.get("last_name")

        if role == "student":
            response["grade_level"] = profile.get("grade_level")
            response["section"] = profile.get("section")
        elif role == "teacher":
            response["subject_area"] = profile.get("subject_area")
            response["department"] = profile.get("department")

    return jsonify(response), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required
def logout():
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required
def change_password():
    current_user = get_current_user()
    data = request.get_json()

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({"error": "Current and new password are required"}), 400

    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    user = db[USERS].find_one({"_id": current_user["user_id"]})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not verify_password(current_password, user["password_hash"]):
        return jsonify({"error": "Current password is incorrect"}), 401

    db[USERS].update_one(
        {"_id": current_user["user_id"]},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "updated_at": datetime.utcnow()
            }
        }
    )

    return jsonify({"message": "Password changed successfully"}), 200
