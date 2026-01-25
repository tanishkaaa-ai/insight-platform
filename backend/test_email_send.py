
import requests
import json
from models.database import mongo, STUDENTS, TEACHERS, find_one
from flask import Flask

app = Flask(__name__)

def test_email_endpoint():
    # 1. Get a student and teacher
    with app.app_context():
        student = find_one(STUDENTS, {})
        teacher = find_one(TEACHERS, {})
        
        if not student or not teacher:
            print("Error: Missing seed data")
            return

        print(f"Testing with Teacher: {teacher.get('first_name')} (ID: {teacher['_id']})")
        print(f"Testing with Student: {student.get('first_name')} (ID: {student['_id']})")

        payload = {
            "teacher_id": str(teacher['_id']),
            "reports": [
                {
                    "student_id": str(student['_id']),
                    "engagement_score": 85,
                    "mastery_score": 90,
                    "attendance_pct": 95,
                    "alert_count": 0,
                    "mastered_concepts": 5,
                    "remark": "Excellent work this week!"
                }
            ]
        }
        
        # 2. Call the API (assuming localhost:5000)
        try:
            response = requests.post(
                "http://localhost:5001/api/dashboard/reports/send-batch",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
        except Exception as e:
            print(f"Request failed: {e}")
            print("Note: Ensure backend is running. If not, this test only verifies data prep.")

if __name__ == "__main__":
    test_email_endpoint()
