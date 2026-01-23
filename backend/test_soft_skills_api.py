
import requests
import json
from bson import ObjectId

BASE_URL = "http://localhost:5000/api"

def test_api():
    print("Fetching soft skills for the seeded student...")
    
    # We need to find the student first
    # This is a bit tricky without knowing the exact ID from the previous run
    # but we can try to guess it from the most recent user or just hardcode if we know it.
    # Alternatively, let's just use the known endpoint and see if it returns data.
    
    # Since I don't have the ID handy (it was random), I'll just assume the student ID 
    # from the previous script run or look it up if I could.
    # Actually, the previous script printed the ID. Let's try to find it in the db again.

    from pymongo import MongoClient
    client = MongoClient('mongodb://localhost:27017/')
    db = client['insight_platform']
    student = db.users.find_one({'role': 'student'})
    
    if not student:
        print("Error: No student found in DB.")
        return

    student_id = student['_id']
    print(f"Testing for Student ID: {student_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/pbl/students/{student_id}/soft-skills")
        if response.status_code == 200:
            data = response.json()
            print("API Success!")
            print(f"Overall Score: {data.get('overall_soft_skills_score')}")
            print(f"Dimensions: {list(data.get('dimension_scores', {}).keys())}")
            print(f"Total Reviews: {data.get('total_reviews_received')}")
            
            if data.get('total_reviews_received') > 0:
                print("Test PASSED: Data successfully retrieved and aggregated.")
            else:
                print("Test FAILED: No reviews found for student.")
        else:
            print(f"API Failed with status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Request failed: {e}")

    # Test 2: Empty state for a random ID
    print("\nTesting empty state for a random student ID...")
    random_id = str(ObjectId())
    try:
        response = requests.get(f"{BASE_URL}/pbl/students/{random_id}/soft-skills")
        if response.status_code == 200:
            data = response.json()
            print("Empty State API Success!")
            print(f"Overall Score: {data.get('overall_soft_skills_score')}")
            print(f"Total Reviews: {data.get('total_reviews_received')}")
            print(f"Has Self Review: {data.get('has_self_review')}")
            
            if 'overall_soft_skills_score' in data and data['total_reviews_received'] == 0:
                print("Test PASSED: Empty state correctly initialized.")
            else:
                print("Test FAILED: Missing fields in empty state.")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api()
