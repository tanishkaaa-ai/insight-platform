# AMEP Backend API Documentation

This document lists all available API endpoints in the backend system, organized by module (Blueprint).

## Base URL
All endpoints are prefixed with the base URL of the server (e.g., `http://localhost:5000`).

## 1. Authentication
**Base URL:** `/api/auth`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new user (student or teacher) | `email`, `username`, `password`, `role`, `first_name`, `last_name`, `grade_level` (student only), `subject_area` (teacher only) | User data, Token |
| `POST` | `/login` | Login user and return JWT token | `email`, `password` | User data, Token |
| `GET` | `/verify` | Verify JWT token validity | headers: `Authorization: Bearer <token>` | Valid status, User info |
| `POST` | `/change-password` | Change user password | `old_password`, `new_password` | Success message |

## 2. Mastery & Adaptive Practice (BR1, BR2, BR3)
**Base URL:** `/api/mastery`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/calculate` | Calculate mastery score for a concept (uses KT Engine) | `student_id`, `concept_id`, `is_correct`, `response_time`, `related_concepts` | Mastery score, Components |
| `GET` | `/student/<student_id>` | Get all concept mastery scores for a student | - | List of concepts and scores |
| `GET` | `/concept/<concept_id>/class/<class_id>` | Get class-level mastery stats for a concept | - | Average mastery, Student counts |
| `POST` | `/practice/generate` | Generate adaptive practice session | `student_id`, `session_duration` | List of content items |
| `POST` | `/response/submit` | Record student response to practice item | `student_id`, `item_id`, `concept_id`, `is_correct`, `response_time`, etc. | Response ID |
| `GET` | `/history/<student_id>/<concept_id>` | Get mastery history trend | query: `days` | History data points, Trend |
| `GET` | `/recommendations/<student_id>` | Get practice recommendations | - | List of recommended concepts |

## 3. Classroom Management (Google Classroom-like)
**Base URL:** `/api/classroom`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/classrooms` | Create a new classroom | `teacher_id`, `class_name`, `section`, `subject`, etc. | Classroom ID, Join Code |
| `GET` | `/classrooms/<classroom_id>` | Get classroom details | - | Classroom info, Stats |
| `POST` | `/classrooms/join` | Student joins classroom | `student_id`, `join_code` | Membership ID |
| `GET` | `/classrooms/teacher/<teacher_id>` | Get teacher's classrooms | query: `active_only` | List of classrooms |
| `GET` | `/classrooms/student/<student_id>` | Get student's classrooms | - | List of classrooms |
| `GET` | `/classrooms/<classroom_id>/students` | Get all students in a classroom | - | List of students |
| `POST` | `/classrooms/<classroom_id>/leave` | Student leaves classroom | `student_id` | Success message |
| `POST` | `/classrooms/<classroom_id>/posts` | Create post (announcement, assignment, etc.) | `author_id`, `post_type`, `title`, `content`, `assignment_details` | Post ID |
| `GET` | `/classrooms/<classroom_id>/stream` | Get classroom stream posts | query: `limit`, `offset` | List of posts |
| `POST` | `/posts/<post_id>/comments` | Add comment to post | `author_id`, `content` | Comment ID |
| `GET` | `/posts/<post_id>/comments` | Get comments for a post | - | List of comments |
| `POST` | `/assignments/<assignment_id>/submit` | Submit assignment | `student_id`, `submission_text`, `attachments` | Success message |
| `GET` | `/assignments/<assignment_id>/submissions` | Get assignment submissions (Teacher) | query: `status` | List of submissions |
| `POST` | `/submissions/<submission_id>/grade` | Grade a submission | `grade`, `teacher_feedback`, `return_to_student` | Success message |
| `GET` | `/students/<student_id>/assignments` | Get all assignments for student | query: `status` | List of assignments |
| `GET` | `/notifications/<user_id>` | Get user notifications | query: `unread_only` | List of notifications |
| `POST` | `/notifications/<notification_id>/read` | Mark notification as read | - | Success message |

## 4. Engagement Detection (BR4, BR6)
**Base URL:** `/api/engagement`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/analyze` | Analyze student engagement (AI Engine) | `student_id`, `implicit_signals` (opt), `explicit_signals` (opt) | Engagement score, Level, Recommendations |
| `GET` | `/class/<class_id>` | Get class-level engagement metrics | - | Class engagement index, Students needing attention |
| `GET` | `/student/<student_id>/history` | Get engagement history | query: `days` | History data points |
| `POST` | `/polls/create` | Create anonymous poll (Engagement Context) | `teacher_id`, `question`, `options` | Poll ID |
| `POST` | `/polls/<poll_id>/respond` | Respond to poll (Engagement Context) | `student_id`, `selected_option` | Response ID |
| `GET` | `/polls/<poll_id>` | Get poll results (Engagement Context) | - | Poll stats |
| `POST` | `/polls/<poll_id>/close` | Close poll (Engagement Context) | - | Success message |
| `GET` | `/alerts` | Get engagement alerts (Teacher) | query: `severity`, `teacher_id` | List of alerts |
| `POST` | `/alerts/<alert_id>/acknowledge` | Acknowledge alert | - | Success message |

## 5. Live Polling System (BR4)
**Base URL:** `/api/polling`
*Specific blueprint for comprehensive polling features*

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/polls` | Create new live poll | `teacher_id`, `question`, `poll_type`, `options`, `anonymous` | Poll ID |
| `GET` | `/polls/<poll_id>` | Get poll details | - | Poll info |
| `POST` | `/polls/<poll_id>/respond` | Submit poll response | `student_id`, `response` | Success message |
| `POST` | `/polls/<poll_id>/close` | Close poll | - | Success message |
| `GET` | `/polls/<poll_id>/results` | Get aggregated results | - | Results, Charts data |
| `GET` | `/classrooms/<classroom_id>/polls` | Get polls for a classroom | query: `active_only` | List of polls |

## 6. Project-Based Learning (BR5, BR9)
**Base URL:** `/api/pbl`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/projects` | Get projects | query: `teacher_id` or `student_id` | List of projects |
| `POST` | `/projects` | Create new project | `teacher_id`, `title`, `start_date`, `end_date` | Project ID |
| `GET` | `/projects/<project_id>` | Get project details (stages, teams) | - | Project info |
| `PUT` | `/projects/<project_id>/stage` | Update project stage | `stage` | Success message |
| `POST` | `/teams` | Create project team | `project_id`, `team_name`, `members` | Team ID |
| `POST` | `/teams/<team_id>/members` | Add member to team | `student_id`, `role` | Membership ID |
| `POST` | `/milestones` | Create milestone | `project_id`, `title`, `due_date` | Milestone ID |
| `POST` | `/milestones/<milestone_id>/complete` | Mark milestone complete | - | Success message |
| `POST` | `/soft-skills/assess` | Submit assessment (Peer/Self) | `team_id`, `assessed_student_id`, `ratings` | Assessment ID, AI validation |
| `GET` | `/soft-skills/team/<team_id>/analysis` | Get team soft skills analysis (AI) | - | Dimension scores, Predictions |
| `GET` | `/soft-skills/student/<student_id>` | Get student soft skills profile | - | List of assessments |
| `GET` | `/soft-skills/rubric` | Generate peer review rubric | query: `student_name` | Rubric structure |
| `POST` | `/artifacts` | Upload project artifact | `team_id`, `file_url`, `artifact_type` | Artifact ID |
| `GET` | `/artifacts/team/<team_id>` | Get team artifacts | - | List of artifacts |

## 7. Analytics & Reporting (BR7, BR8)
**Base URL:** `/api/analytics`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/templates` | List curriculum templates | query: `subject`, `grade` | List of templates |
| `GET` | `/templates/<template_id>` | Get template detailed info | - | Template details |
| `POST` | `/templates` | Create template | `title`, `content`, `type` | Template ID |
| `POST` | `/templates/<template_id>/use` | Record template usage | - | Success |
| `GET` | `/unified` | Get unified institutional metrics | query: `date` | Mastery, Engagement, Adoption stats |
| `GET` | `/unified/trends` | Get historical metric trends | query: `days` | Trend data |
| `POST` | `/interventions/track` | Track teacher intervention | `student_id`, `intervention_type` | Intervention ID, AI Prediction |
| `POST` | `/interventions/<intervention_id>/measure` | Measure intervention impact | - | Actual vs Predicted impact |
| `GET` | `/interventions/teacher/<teacher_id>` | Get teacher's interventions | - | List of interventions |
| `GET` | `/interventions/recommendations/<teacher_id>` | Get intervention recommendations | - | List of recommendations |

## 8. Curriculum Templates
**Base URL:** `/api/templates`
*Comprehensive template repository features*

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/templates` | Create template | `title`, `type`, `subject`, `content` | Template ID |
| `GET` | `/templates/search` | Search templates | query: `q`, `subject`, `grade` | Search results |
| `GET` | `/templates/<template_id>` | Get template details | - | Template info |
| `POST` | `/templates/<template_id>/rate` | Rate a template | `rating`, `review` | Success |
| `GET` | `/teachers/<teacher_id>/templates` | Get teacher's templates | - | List of templates |
| `GET` | `/templates/popular` | Get popular templates | query: `limit` | List of templates |
| `POST` | `/templates/seed` | Seed sample templates | - | Success |

## 9. Dashboard (Real-time)
**Base URL:** `/api/dashboard`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/class-engagement/<classroom_id>` | Get real-time class engagement index | - | CEI Score, Alerts |
| `GET` | `/attention-map/<classroom_id>` | Get student attention map | - | Grid of student states |
| `GET` | `/mastery-heatmap/<classroom_id>` | Get mastery heatmap | query: `subject` | Grid of mastery scores |
| `GET` | `/engagement-trends/<classroom_id>` | Get engagement trends | query: `days` | Trend data |
| `POST` | `/interventions` | Create intervention | `student_id`, `type` | Intervention ID |
| `PUT` | `/interventions/<intervention_id>/outcome` | Update intervention outcome | `outcome` | Success |
| `GET` | `/interventions/student/<student_id>` | Get student intervention history | - | List of interventions |
| `GET` | `/institutional-metrics` | Get consolidated institutional metrics | - | Metrics summary |
