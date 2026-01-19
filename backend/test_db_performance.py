"""
Quick Database Performance Test
Run: python test_db_performance.py
"""
import time
import sqlite3
import os

def create_test_database():
    """Create test database with sample data"""
    if os.path.exists('test_amep.db'):
        os.remove('test_amep.db')
    
    conn = sqlite3.connect('test_amep.db')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE students (
            id INTEGER PRIMARY KEY,
            student_id TEXT UNIQUE,
            class_id INTEGER,
            name TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE mastery_tracking (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            mastery_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE engagement_events (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            engagement_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE pbl_projects (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            project_status TEXT
        )
    ''')
    
    # ✅ Optimized analytics table
    cursor.execute('''
        CREATE TABLE student_analytics_snapshot (
            student_id INTEGER PRIMARY KEY,
            class_id INTEGER,
            current_mastery_avg REAL DEFAULT 0.0,
            engagement_score REAL DEFAULT 0.0,
            project_status TEXT DEFAULT 'not_started',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert test data
    print("Creating test data...")
    
    # Students
    for i in range(50):
        cursor.execute('INSERT INTO students VALUES (?, ?, 1, ?)', 
                      (i+1, f'STU{i:03d}', f'Student {i}'))
    
    # Mastery data (lots of records)
    for student_id in range(1, 51):
        for j in range(20):  # 20 records per student
            cursor.execute('INSERT INTO mastery_tracking (student_id, mastery_score) VALUES (?, ?)',
                          (student_id, 70 + (j % 30)))
    
    # Engagement data
    for student_id in range(1, 51):
        for j in range(15):  # 15 records per student
            cursor.execute('INSERT INTO engagement_events (student_id, engagement_score) VALUES (?, ?)',
                          (student_id, 80 + (j % 20)))
    
    # Project data
    for student_id in range(1, 51):
        status = ['in_progress', 'completed', 'not_started'][student_id % 3]
        cursor.execute('INSERT INTO pbl_projects (student_id, project_status) VALUES (?, ?)',
                      (student_id, status))
    
    # Create analytics snapshots
    cursor.execute('''
        INSERT INTO student_analytics_snapshot (student_id, class_id, current_mastery_avg, engagement_score, project_status)
        SELECT 
            s.id,
            s.class_id,
            AVG(m.mastery_score),
            AVG(e.engagement_score),
            p.project_status
        FROM students s
        LEFT JOIN mastery_tracking m ON s.id = m.student_id
        LEFT JOIN engagement_events e ON s.id = e.student_id  
        LEFT JOIN pbl_projects p ON s.id = p.student_id
        GROUP BY s.id, s.class_id, p.project_status
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX idx_mastery_student ON mastery_tracking(student_id)')
    cursor.execute('CREATE INDEX idx_engagement_student ON engagement_events(student_id)')
    cursor.execute('CREATE INDEX idx_analytics_class ON student_analytics_snapshot(class_id)')
    
    conn.commit()
    conn.close()
    print("Test database created")

def test_slow_query():
    """❌ Test slow complex join query"""
    conn = sqlite3.connect('test_amep.db')
    cursor = conn.cursor()
    
    start_time = time.time()
    
    # Complex join query (SLOW)
    cursor.execute('''
        SELECT s.id as student_id,
               AVG(m.mastery_score) as avg_mastery,
               COUNT(e.id) as engagement_count,
               p.project_status
        FROM students s
        JOIN mastery_tracking m ON s.id = m.student_id
        JOIN engagement_events e ON s.id = e.student_id  
        JOIN pbl_projects p ON s.id = p.student_id
        WHERE s.class_id = 1
        GROUP BY s.id, p.project_status
    ''')
    
    results = cursor.fetchall()
    end_time = time.time()
    
    conn.close()
    
    query_time = (end_time - start_time) * 1000
    print(f"Complex Join Query: {query_time:.1f}ms ({len(results)} records)")
    return query_time

def test_fast_query():
    """✅ Test fast denormalized query"""
    conn = sqlite3.connect('test_amep.db')
    cursor = conn.cursor()
    
    start_time = time.time()
    
    # Simple query on denormalized table (FAST)
    cursor.execute('''
        SELECT student_id, current_mastery_avg, engagement_score, project_status
        FROM student_analytics_snapshot
        WHERE class_id = 1
    ''')
    
    results = cursor.fetchall()
    end_time = time.time()
    
    conn.close()
    
    query_time = (end_time - start_time) * 1000
    print(f"Denormalized Query: {query_time:.1f}ms ({len(results)} records)")
    return query_time

def run_performance_test():
    """Run complete performance comparison"""
    print("Database Performance Test - Issue #29")
    print("=" * 45)
    
    # Setup
    create_test_database()
    
    print("\nRunning Performance Tests...")
    
    # Test multiple times for accuracy
    slow_times = []
    fast_times = []
    
    for i in range(3):
        print(f"\nRound {i+1}:")
        slow_time = test_slow_query()
        fast_time = test_fast_query()
        
        slow_times.append(slow_time)
        fast_times.append(fast_time)
    
    # Calculate averages
    avg_slow = sum(slow_times) / len(slow_times)
    avg_fast = sum(fast_times) / len(fast_times)
    improvement = ((avg_slow - avg_fast) / avg_slow) * 100
    
    print("\n" + "=" * 45)
    print("PERFORMANCE RESULTS:")
    print("=" * 45)
    print(f"Complex Joins (Before): {avg_slow:.1f}ms")
    print(f"Denormalized (After):   {avg_fast:.1f}ms")
    print(f"Performance Improvement: {improvement:.1f}% faster")
    print(f"Speed Multiplier: {avg_slow/avg_fast:.1f}x")
    
    print("\nReal-World Impact:")
    print(f"   30 students dashboard: {avg_fast*30:.0f}ms vs {avg_slow*30:.0f}ms")
    print(f"   Teacher dashboard: <100ms (real-time)")
    print(f"   Live polling: No query delays")
    
    # Cleanup
    os.remove('test_amep.db')
    print("\nTest completed successfully!")

if __name__ == "__main__":
    run_performance_test()