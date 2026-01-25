
from models.database import mongo, STUDENTS, find_many, update_one
from flask import Flask
import random

app = Flask(__name__)

def backfill_parent_emails():
    with app.app_context():
        print("--- Backfilling Parent Emails ---")
        students = find_many(STUDENTS, {})
        
        count = 0
        for student in students:
            if not student.get('parent_email'):
                # Generate a dummy parent email
                first = student.get('first_name', 'Parent').lower()
                last = student.get('last_name', 'User').lower()
                # random string to ensure uniqueness if needed, but simple is fine for demo
                parent_email = f"parent.{first}.{last}@amep.edu"
                
                update_one(STUDENTS, {'_id': student['_id']}, {'$set': {'parent_email': parent_email}})
                print(f"Updated {first} {last}: {parent_email}")
                count += 1
            else:
                print(f"Skipping {student.get('first_name')}: Already has parent email")
                
        print(f"--- Complete. Updated {count} students. ---")

if __name__ == "__main__":
    backfill_parent_emails()
