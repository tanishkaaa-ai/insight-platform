# Student UI Endpoint Reference

This document lists API endpoints used by the Student Portal.

---

## 1. Authentication (`/api/auth`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/login` | POST | `{email, password}` | `{message, token, user: {user_id, role, profile}}` |
| `/verify` | GET | Header: `Authorization: Bearer <token>` | `{valid, user: {user_id, role}}` |
| `/change-password` | POST | `{old_password, new_password}` | `{message}` |

---

## 2. Mastery & Adaptive Practice (`/api/mastery`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/calculate` | POST | Submit answer & calculate mastery (internal usage mostly) |
| `/student/{student_id}` | GET | Get overall mastery & concept progress |
| `/practice/generate` | POST | Generate adaptive practice session |
| `/response/submit` | POST | Submit answer for a practice item |
| `/history/{student_id}/{concept_id}` | GET | View learning history/velocity |
| `/recommendations/{student_id}` | GET | Get recommended concepts to practice |

---

## 3. Classroom & Assignments (`/api/classroom`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/classrooms/join` | POST | Join a class with code |
| `/classrooms/student/{student_id}` | GET | List my classes |
| `/classrooms/{classroom_id}` | GET | Get class details |
| `/classrooms/{classroom_id}/stream` | GET | View class feed (announcements/assignments) |
| `/classrooms/{classroom_id}/leave` | POST | Leave a class |
| `/assignments/{assignment_id}` | GET | View assignment details |
| `/assignments/{assignment_id}/submit` | POST | Submit assignment |
| `/students/{student_id}/assignments` | GET | View my assignments (ToDo/Done) |
| `/submissions/{submission_id}` | GET | View my submission & grade |
| `/submissions/{submission_id}` | PUT | Edit my submission (if allowed) |
| `/posts/{post_id}/comments` | POST | Comment on a post |

---

## 4. Live Polling (`/api/polling`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/classrooms/{classroom_id}/polls` | GET | List active polls in class |
| `/polls/{poll_id}` | GET | Get poll details (question/options) |
| `/polls/{poll_id}/respond` | POST | Submit anonymous vote |

---

## 5. PBL Projects (`/api/pbl`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/students/{student_id}/projects` | GET | List my active projects |
| `/students/{student_id}/teams` | GET | List my teams |
| `/teams/{team_id}` | GET | View team dashboard |
| `/projects/{project_id}/deliverable` | POST | Submit project deliverable |
| `/teams/{team_id}/tasks` | GET | View team tasks |
| `/tasks/{task_id}/status` | PUT | Update task status (e.g., to DONE) |
| `/teams/{team_id}/peer-reviews` | POST | Submit peer review |
| `/students/{student_id}/soft-skills` | GET | View my soft skills profile |

---

## 6. Engagement & Notifications

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/api/classroom/notifications/{user_id}` | GET | Get my notifications |
| `/api/engagement/student/{student_id}/history` | GET | View my engagement trends (Gamification) |
