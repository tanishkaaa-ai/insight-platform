
from models.database import mongo, STUDENTS, update_one, find_one
from flask import Flask

app = Flask(__name__)

def clear_demo_parent_email():
    with app.app_context():
        print("--- Clearing Demo Student Parent Email ---")
        # Find the demo student (usually student_demo user)
        # We can find by username in USERS and then link, or just find by name in STUDENTS
        
        # Strategies to find demo student:
        # 1. First name "Demo"
        student = find_one(STUDENTS, {'first_name': 'Demo', 'last_name': 'Student'})
        
        if student:
            print(f"Found student: {student.get('first_name')} {student.get('last_name')}")
            # Unset the parent_email field
            update_one(STUDENTS, {'_id': student['_id']}, {'$unset': {'parent_email': ""}})
            print("Cleared parent_email.")
        else:
            print("Demo student not found.")

if __name__ == "__main__":
    clear_demo_parent_email()
