"""
Simple test without heavy dependencies
Run: python test_simple.py
"""
import time
import threading
from queue import Queue

# Mock Redis/Celery with Python Queue
task_queue = Queue()
results = {}
results_lock = threading.Lock()

def mock_ml_processing(student_id, response_data):
    """Simulate heavy ML computation"""
    print(f"Processing student {student_id}...")
    time.sleep(2)  # Simulate 2-second ML computation
    score = 75 + (student_id % 25)  # Mock score
    with results_lock:
        results[student_id] = score
    print(f"Student {student_id} completed: {score}")
    return score

def worker():
    """Background worker thread"""
    while True:
        try:
            task = task_queue.get(timeout=1)
            if task is None:
                task_queue.task_done()
                break
            mock_ml_processing(task['student_id'], task['response_data'])
            task_queue.task_done()
        except Exception as e:
            print(f"Worker error: {e}")
            continue

def submit_response(student_id, response_data):
    """Non-blocking submission"""
    start_time = time.time()
    
    # Add to queue (non-blocking)
    task_queue.put({
        'student_id': student_id,
        'response_data': response_data
    })
    
    end_time = time.time()
    print(f"API Response for student {student_id}: {(end_time - start_time)*1000:.1f}ms")
    return {"status": "accepted", "student_id": student_id}
def get_status(student_id):
    """Check if processing is done"""
    with results_lock:
        if student_id in results:
            return {"status": "completed", "score": results[student_id]}
        else:
            return {"status": "processing"}
        return {"status": "processing"}

if __name__ == "__main__":
    print("🚀 Testing Async Processing...")
    
    # Start background worker
    worker_thread = threading.Thread(target=worker, daemon=True)
    worker_thread.start()
    
    print("\n📝 Test 1: Single Student")
    submit_response(1, {"correct": True})
    
    print("\n📝 Test 2: Multiple Students (Concurrent)")
    start = time.time()
    
    # Simulate 10 students submitting at once
    threads = []
    for i in range(10):
        t = threading.Thread(target=submit_response, args=(i, {"correct": True}))
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    
    end = time.time()
    print(f"\n✅ All 10 submissions completed in: {(end-start)*1000:.1f}ms")
    print("   (Without async: would take 20+ seconds)")
    
    print("\n📊 Checking Status...")
    time.sleep(1)
    for i in range(3):
        status = get_status(i)
        print(f"Student {i}: {status}")
    
    print("\n⏳ Waiting for all processing to complete...")
    task_queue.join()
    
    print("\n🎉 Final Results:")
    for student_id in sorted(results.keys()):
        print(f"Student {student_id}: Score {results[student_id]}")
    
    print("\n✅ Test Complete - Async processing working!")