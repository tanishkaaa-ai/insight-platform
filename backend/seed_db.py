
import sys
import os
import bcrypt
from datetime import datetime
from bson import ObjectId

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.database import db, USERS, TEACHERS, STUDENTS, insert_one, find_one

def hash_password(password):
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

def seed_users():
    print("Seeding Users...")
    
    # Teacher
    teacher_email = "teacher@amep.edu"
    if not find_one(USERS, {'email': teacher_email}):
        print(f"Creating teacher: {teacher_email}")
        user_id = str(ObjectId())
        insert_one(USERS, {
            '_id': user_id,
            'email': teacher_email,
            'username': 'teacher_demo',
            'password_hash': hash_password('demo123'),
            'role': 'teacher',
            'created_at': datetime.utcnow()
        })
        insert_one(TEACHERS, {
            '_id': user_id,
            'user_id': user_id,
            'first_name': 'Demo',
            'last_name': 'Teacher',
            'subject_area': 'Mathematics',
            'department': 'Science',
            'created_at': datetime.utcnow()
        })
    else:
        print(f"Teacher {teacher_email} already exists")

    # Student
    student_email = "student1@amep.edu"
    if not find_one(USERS, {'email': student_email}):
        print(f"Creating student: {student_email}")
        user_id = str(ObjectId())
        insert_one(USERS, {
            '_id': user_id,
            'email': student_email,
            'username': 'student_demo',
            'password_hash': hash_password('demo123'),
            'role': 'student',
            'created_at': datetime.utcnow()
        })
        insert_one(STUDENTS, {
            '_id': user_id,
            'user_id': user_id,
            'first_name': 'Demo',
            'last_name': 'Student',
            'grade_level': 10,
            'section': 'A',
            'enrollment_date': datetime.utcnow(),
            'created_at': datetime.utcnow()
        })
    else:
        print(f"Student {student_email} already exists")

    # Concepts
    from models.database import CONCEPTS
    concept_id = "concept_001"
    if not find_one(CONCEPTS, {'_id': concept_id}):
        print(f"Creating concept: {concept_id}")
        insert_one(CONCEPTS, {
            '_id': concept_id,
            'concept_name': 'Linear Equations',
            'subject_area': 'Mathematics',
            'difficulty_level': 0.5
        })
    else:
        print(f"Concept {concept_id} already exists")

if __name__ == "__main__":
    seed_users()
