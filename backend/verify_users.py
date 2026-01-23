
import sys
import os
from pprint import pprint

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.database import db, USERS

def verify_users():
    print("Verifying Users in DB...")
    users = list(db[USERS].find({}, {'_id': 1, 'email': 1, 'role': 1, 'password_hash': 1}))
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"User: {user.get('email')}, Role: {user.get('role')}, Hash Length: {len(user.get('password_hash', ''))}")

if __name__ == "__main__":
    verify_users()
