import os
from pymongo import MongoClient
import datetime
from bson import ObjectId

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['amep_db']
concepts_collection = db['concepts']

# Define sample concepts
concepts = [
    {
        "concept_name": "Data Structures Basics",
        "subject_area": "Computer Science",
        "difficulty_level": 0.3,
        "weight": 1.0,
        "prerequisites": [],
        "created_at": datetime.datetime.utcnow()
    },
    {
        "concept_name": "Arrays & Linked Lists",
        "subject_area": "Computer Science",
        "difficulty_level": 0.4,
        "weight": 1.0,
        "prerequisites": [], # In reality, would link to DS Basics ID
        "created_at": datetime.datetime.utcnow()
    },
    {
        "concept_name": "Stacks & Queues",
        "subject_area": "Computer Science",
        "difficulty_level": 0.5,
        "weight": 1.0,
        "prerequisites": [],
        "created_at": datetime.datetime.utcnow()
    },
    {
        "concept_name": "Trees & Graphs",
        "subject_area": "Computer Science",
        "difficulty_level": 0.7,
        "weight": 1.2,
        "prerequisites": [],
        "created_at": datetime.datetime.utcnow()
    },
    {
        "concept_name": "Sorting Algorithms",
        "subject_area": "Computer Science",
        "difficulty_level": 0.6,
        "weight": 1.1,
        "prerequisites": [],
        "created_at": datetime.datetime.utcnow()
    }
]

# Insert if empty
if concepts_collection.count_documents({}) == 0:
    print("Seeding concepts...")
    result = concepts_collection.insert_many(concepts)
    print(f"Inserted {len(result.inserted_ids)} concepts.")
else:
    print("Concepts already exist. Skipping seed.")
    # Print existing count
    print(f"Count: {concepts_collection.count_documents({})}")
