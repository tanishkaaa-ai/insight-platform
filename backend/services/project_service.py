PROJECTS = [
    {
        'project_id': 'p1',
        'title': 'Sustainable Energy Solutions',
        'current_stage': 'research',
        'start_date': '2025-01-06',
        'end_date': '2025-02-14',
        'team_count': 3,
        'status': 'on_track',
        'teacher_id': 't1',
        'student_ids': ['s1', 's2', 's3']
    }
]

def get_projects(teacher_id=None, student_id=None):
    """
    Fetch projects filtered by teacher or student.
    """
    if teacher_id:
        return [p for p in PROJECTS if p.get('teacher_id') == teacher_id]

    if student_id:
        return [p for p in PROJECTS if student_id in p.get('student_ids', [])]

    return list(PROJECTS)

