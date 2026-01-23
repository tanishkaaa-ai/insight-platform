
import os
import sys
import datetime
import random
from pymongo import MongoClient
from bson import ObjectId

# Setup connection - use localhost as default
try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['insight_platform']
    print("Connected to MongoDB.")
except Exception as e:
    print(f"Failed to connect: {e}")
    sys.exit(1)

SOFT_SKILL_DIMENSIONS = {
    'COLLABORATION': {'name': 'Collaboration', 'weight': 1.0},
    'COMMUNICATION': {'name': 'Communication', 'weight': 1.0},
    'CRITICAL_THINKING': {'name': 'Critical Thinking', 'weight': 1.0},
    'CREATIVITY': {'name': 'Creativity', 'weight': 1.0},
    'LEADERSHIP': {'name': 'Leadership', 'weight': 1.0}
}

def seed_data():
    print("Finding a student...")
    
    # Try to find a student - prioritize one with an existing profile
    student = db.users.find_one({'role': 'student'})
    
    if not student:
        print("No student found. Creating a dummy student...")
        student_id = str(ObjectId())
        student = {
            '_id': student_id,
            'email': 'student@example.com',
            'password': 'hashedpassword',
            'role': 'student',
            'profile': {'first_name': 'Test', 'last_name': 'Student'},
            'created_at': datetime.datetime.utcnow()
        }
        db.users.insert_one(student)
    else:
        student_id = student['_id']
    
    print(f"Target Student: {student.get('profile', {}).get('first_name', 'Unknown')} ({student_id})")

    # Find or create a team
    team = db.teams.find_one({'members': student_id})
    if not team:
        print("No team found. Creating a dummy team...")
        team_id = str(ObjectId())
        team = {
            '_id': team_id,
            'team_name': 'Dream Team',
            'members': [student_id],
            'project_id': 'dummy_project_id',
            'created_at': datetime.datetime.utcnow()
        }
        db.teams.insert_one(team)
    else:
        team_id = team['_id']
        
    print(f"Target Team: {team.get('team_name', 'Unnamed Team')} ({team_id})")

    print("[INFO] Clearing existing peer reviews for this student to ensure clean state...")
    db.peer_reviews.delete_many({'reviewee_id': student_id})

    print("Generating peer reviews...")
    
    # Create 3-5 dummy reviews
    reviewers = []
    
    # Create dummy reviewers if needed
    for i in range(3):
        reviewer_id = str(ObjectId())
        
        ratings = {}
        for dim in SOFT_SKILL_DIMENSIONS.keys():
            # Random score between 3 and 5
            score = random.choice([3, 4, 4, 5, 5]) 
            ratings[dim] = score
            
        review = {
            '_id': str(ObjectId()),
            'team_id': team_id,
            'reviewer_id': reviewer_id, # Simplified: these are just random IDs
            'reviewee_id': student_id,
            'review_type': 'peer',
            'ratings': ratings,
            'comments': f"Great work on {random.choice(list(SOFT_SKILL_DIMENSIONS.keys()))}!",
            'submitted_at': datetime.datetime.utcnow(),
            'is_self_review': False
        }
        
        db.peer_reviews.insert_one(review)
        print(f"Inserted review {i+1}/3")

    # Insert a self review too
    self_ratings = {dim: 4 for dim in SOFT_SKILL_DIMENSIONS.keys()}
    self_review = {
        '_id': str(ObjectId()),
        'team_id': team_id,
        'reviewer_id': student_id,
        'reviewee_id': student_id,
        'review_type': 'peer',
        'ratings': self_ratings,
        'comments': "I think I did okay.",
        'submitted_at': datetime.datetime.utcnow(),
        'is_self_review': True
    }
    db.peer_reviews.insert_one(self_review)
    print("Inserted self-review.")

    print("Done! Refresh the Soft Skills page.")

if __name__ == '__main__':
    seed_data()
