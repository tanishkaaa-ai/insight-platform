
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.database import db, USERS, STUDENTS, TEACHERS

def reset_auth_data():
    print("Resetting Authentication Data...")
    
    # Drop collections
    db[USERS].drop()
    print(f"[OK] Dropped {USERS} collection")
    
    db[STUDENTS].drop()
    print(f"[OK] Dropped {STUDENTS} collection")
    
    db[TEACHERS].drop()
    print(f"[OK] Dropped {TEACHERS} collection")
    
    print("Reset complete. Please run seed_db.py to recreate users.")

if __name__ == "__main__":
    confirm = input("This will DELETE ALL USERS. Are you sure? (y/N): ")
    if confirm.lower() == 'y':
        reset_auth_data()
    else:
        print("Operation cancelled")
