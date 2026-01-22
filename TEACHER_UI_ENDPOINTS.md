# Teacher UI Endpoint Reference

This document lists API endpoints used by the Teacher Portal.

---

## 1. Authentication (`/api/auth`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/register` | POST | `{email, username, password, role...}` | `{token, user}` |
| `/login` | POST | `{email, password}` | `{token, user}` |
| `/verify` | GET | - | `{valid, user}` |

---

## 2. Classroom Management (`/api/classroom`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/classrooms` | POST | Create new class |
| `/classrooms/teacher/{teacher_id}` | GET | List my classes |
| `/classrooms/{classroom_id}` | PUT/DELETE | Manage class settings |
| `/classrooms/{classroom_id}/students` | GET | List enrolled students |
| `/classrooms/{classroom_id}/posts` | POST | Create Announcement/Assignment |
| `/assignments/{assignment_id}/submissions` | GET | View student submissions |
| `/submissions/{submission_id}/grade` | POST | Grade submission |

---

## 3. Engagement & Analytics (`/api/dashboard`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/class-engagement/{classroom_id}` | GET | Get class engagement overview |
| `/attention-map/{classroom_id}` | GET | View real-time attention map |
| `/mastery-heatmap/{classroom_id}` | GET | View mastery heatmap |
| `/engagement-trends/{classroom_id}` | GET | View trends over time |
| `/interventions` | POST | Create intervention |
| `/interventions/teacher/{teacher_id}` | GET | Track my interventions |
| `/institutional-metrics` | GET | View high-level metrics |

## Engagement Detection (`/api/engagement`)
| Endpoint | Method | Usage |
|----------|--------|-------|
| `/alerts` | GET | Get engagement alerts |
| `/alerts/{alert_id}/acknowledge` | POST | Acknowledge alert |

---

## 4. Mastery Management (`/api/mastery`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/concept/{concept_id}/class/{class_id}` | GET | View concept mastery stats for class |
| `/concepts` | POST/PUT | Manage curriculum concepts |
| `/items` | POST/PUT | Manage question bank items |

---

## 5. Live Polling (`/api/polling`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/polls` | POST | Create & Launch new poll |
| `/polls/{poll_id}/close` | POST | End poll |
| `/polls/{poll_id}/results` | GET | Get live results |
| `/classrooms/{classroom_id}/polls` | GET | View poll history |

---

## 6. Curriculum Templates (`/api/templates`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/templates/search` | GET | Find templates |
| `/templates` | POST | Create new template |
| `/templates/{template_id}/use` | POST | Apply template to class |

---

## 7. PBL Management (`/api/pbl`)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/projects` | POST | Create new PBL project |
| `/projects/{project_id}/grade` | POST | Grade project deliverable |
| `/projects/classroom/{classroom_id}` | GET | View class projects |
| `/projects/{project_id}/teams` | POST | Form teams |
| `/teams/{team_id}/soft-skills-summary` | GET | View team dynamic stats |
