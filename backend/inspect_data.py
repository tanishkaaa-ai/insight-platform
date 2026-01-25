
from models.database import mongo, STUDENTS, USERS, find_one, find_many
from flask import Flask
import os

app = Flask(__name__)

def inspect_student_data():
    with app.app_context():
        print("--- Inspecting Student Data ---")
        # Get one student
        student = find_one(STUDENTS, {})
        if not student:
            print("No students found.")
            return

        print(f"Student ID: {student.get('_id')}")
        print(f"User ID: {student.get('user_id')}")
        print(f"Name: {student.get('first_name')} {student.get('last_name')}")
        print(f"Keys in STUDENT doc: {list(student.keys())}")
        
        # Check User doc
        user = find_one(USERS, {'_id': student.get('user_id')})
        if user:
            print(f"Keys in USER doc: {list(user.keys())}")
            print(f"User Email: {user.get('email')}")
        else:
            print("User doc not found.")

        print("-" * 20)
        print(f"Student 'email' field: {student.get('email')}")
        print(f"Student 'parent_email' field: {student.get('parent_email')}")

if __name__ == "__main__":
    inspect_student_data()
