
from pymongo import MongoClient
from datetime import datetime
import datetime as dt

try:
    # Use a dummy client/collection that doesn't actually connect or mocks it
    # But to test encoding, we usually need the library to try encoding it.
    # A simpler way is to check bson encoding directly if available.
    import bson
    
    try:
        data = {"date": datetime.utcnow().date()}
        bson.BSON.encode(data)
        print("Success: datetime.date is supported")
    except Exception as e:
        print(f"Failure: {e}")

except ImportError:
    print("pymongo/bson not installed")
