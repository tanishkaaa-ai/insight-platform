# AMEP API Endpoint Reference

Complete backend API documentation with request/response formats.

---

## 1. Authentication (`/api/auth`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/register` | POST | `{email, username, password, role, first_name, last_name}` | `{message, token, user: {user_id, email, role}}` |
| `/login` | POST | `{email, password}` | `{message, token, user: {user_id, role, profile}}` |
| `/verify` | GET | Header: `Authorization: Bearer <token>` | `{valid, user: {user_id, role}}` |
| `/change-password` | POST | `{old_password, new_password}` + Auth | `{message}` |

---

## 2. Mastery & Adaptive Practice (`/api/mastery`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/calculate` | POST | `{student_id, concept_id, is_correct, response_time, current_mastery?}` | `{mastery_score, bkt_component, dkt_component, confidence, learning_velocity}` |
| `/student/{student_id}` | GET | Query: `?subject_area&min_mastery` | `{student_id, concepts: [{concept_id, mastery_score}], overall_mastery}` |
| `/concept/{concept_id}/class/{class_id}` | GET | - | `{concept_id, average_mastery, students_mastered, students_struggling, distribution}` |
| `/practice/generate` | POST | `{student_id, session_duration}` | `{session_id, recommended_items, estimated_duration}` |
| `/response/submit` | POST | `{student_id, item_id, concept_id, is_correct, response_time}` | `{response_id, message}` |
| `/history/{student_id}/{concept_id}` | GET | Query: `?days` | `{student_id, concept_id, history, trend, velocity}` |
| `/recommendations/{student_id}` | GET | - | `{student_id, recommendations: [{concept_id, current_mastery, recommendation, priority}]}` |
| `/concepts` | GET | Query: `?subject_area&grade_level` | `[{concept_id, name, subject_area, grade_level, description, prerequisites}]` |
| `/concepts` | POST | `{name, subject_area, grade_level?, description?, prerequisites?}` | `{concept_id, message}` |
| `/concepts/{concept_id}` | GET | - | `{concept_id, name, subject_area, grade_level, description, prerequisites}` |
| `/concepts/{concept_id}` | PUT | `{name?, description?, prerequisites?, difficulty_level?}` | `{message}` |
| `/concepts/{concept_id}` | DELETE | - | `{message}` |
| `/items` | GET | Query: `?concept_id&difficulty` | `[{item_id, concept_id, item_type, difficulty, question, options}]` |
| `/items` | POST | `{concept_id, question, item_type?, difficulty?, options?, correct_answer?}` | `{item_id, message}` |
| `/items/{item_id}` | GET | - | `{item_id, concept_id, question, options, correct_answer, explanation}` |
| `/items/{item_id}` | PUT | `{question?, options?, correct_answer?, difficulty?, explanation?}` | `{message}` |
| `/items/{item_id}` | DELETE | - | `{message}` |

**Note:** `current_mastery` is optional in `/calculate`. If not provided, defaults to 50.0 for initial calculation.

---

## 3. Engagement Detection (`/api/engagement`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/analyze` | POST | `{student_id, implicit_signals, explicit_signals}` | `{engagement_score, engagement_level, recommendations}` |
| `/class/{class_id}` | GET | - | `{class_id, class_engagement_index, distribution, students_needing_attention}` |
| `/student/{student_id}/history` | GET | Query: `?days` | `{student_id, history: [{date, engagement_score, engagement_level}]}` |
| `/alerts` | GET | Query: `?teacher_id&severity` | `[{alert_id, student_id, engagement_score, severity, behaviors, recommendations}]` |
| `/alerts` | POST | `{student_id, engagement_score?, engagement_level?, severity?, detected_behaviors?, recommendation?}` | `{alert_id, message}` |
| `/alerts/{alert_id}` | GET | - | `{alert_id, student_id, engagement_score, severity, detected_behaviors, resolved, acknowledged}` |
| `/alerts/{alert_id}` | PUT | `{severity?, notes?, recommendation?, resolved?}` | `{message}` |
| `/alerts/{alert_id}` | DELETE | - | `{message}` |
| `/alerts/{alert_id}/acknowledge` | POST | - | `{message}` |
| `/student/{student_id}/gamification` | GET | - | `{student_id, total_xp, level, badges_earned, achievements}` |

---

## 4. Classroom Management (`/api/classroom`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/classrooms` | POST | `{teacher_id, class_name, section, subject}` | `{classroom_id, join_code, message}` |
| `/classrooms/{classroom_id}` | GET | - | `{classroom_id, class_name, teacher, student_count, join_code}` |
| `/classrooms/{classroom_id}` | PUT | `{class_name?, section?, subject?, room?, description?, theme_color?, grade_level?}` | `{message}` |
| `/classrooms/{classroom_id}` | DELETE | - | `{message}` |
| `/classrooms/join` | POST | `{student_id, join_code}` | `{membership_id, classroom_id, message}` |
| `/teacher/{teacher_id}/classrooms` | GET | Query: `?active_only` | `[{classroom_id, class_name, student_count, join_code}]` |
| `/classrooms/student/{student_id}` | GET | - | `[{classroom_id, class_name, subject, teacher_name}]` |
| `/classrooms/{classroom_id}/students` | GET | - | `[{student_id, name, grade_level, joined_at}]` |
| `/classrooms/{classroom_id}/students/{student_id}` | DELETE | - | `{message}` |
| `/classrooms/{classroom_id}/leave` | POST | `{student_id}` | `{message}` |
| `/classrooms/{classroom_id}/posts` | POST | `{author_id, post_type, title, content, assignment_details?}` | `{post_id, message}` |
| `/classrooms/{classroom_id}/stream` | GET | Query: `?post_type&limit&offset` | `[{post_id, post_type, title, content, author, created_at}]` |
| `/classrooms/{classroom_id}/assignments` | GET | - | `[{assignment_id, title, due_date, points, submissions_count}]` |
| `/posts/{post_id}/comments` | POST | `{author_id, content}` | `{comment_id, message}` |
| `/posts/{post_id}/comments` | GET | - | `[{comment_id, author, content, created_at}]` |
| `/assignments/{assignment_id}` | GET | - | `{assignment_id, title, content, classroom_id, teacher_id, assignment_details, due_date, points}` |
| `/assignments/{assignment_id}` | PUT | `{title?, content?, attachments?, assignment_details?}` | `{message}` |
| `/assignments/{assignment_id}` | DELETE | - | `{message}` |
| `/assignments/{assignment_id}/submit` | POST | `{student_id, submission_text, attachments}` | `{submission_id, message, is_late}` |
| `/assignments/{assignment_id}/submissions` | GET | Query: `?status` | `[{submission_id, student, status, grade, submitted_at}]` |
| `/submissions/{submission_id}` | GET | - | `{submission_id, assignment_id, student_id, status, grade, submission_text, attachments}` |
| `/submissions/{submission_id}` | PUT | `{submission_text?, attachments?}` | `{message}` |
| `/submissions/{submission_id}/grade` | POST | `{grade, teacher_feedback, return_to_student}` | `{message}` |
| `/students/{student_id}/assignments` | GET | Query: `?status` | `[{assignment_id, title, classroom, due_date, status, grade}]` |
| `/notifications/{user_id}` | GET | Query: `?unread_only&limit` | `[{notification_id, notification_type, title, message, is_read}]` |
| `/notifications` | POST | `{user_id, title, message, notification_type?, classroom_id?, link?}` | `{notification_id, message}` |
| `/notifications` | DELETE | Query: `?notification_id` OR `?user_id&older_than_days` | `{message, deleted_count?}` |
| `/notifications/{notification_id}/read` | POST | - | `{message}` |

**Note:** Assignments are created via `/classrooms/{classroom_id}/posts` with `post_type: "assignment"`

---

## 5. Live Polling (`/api/polling`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/polls` | POST | `{teacher_id, classroom_id, question, poll_type, options}` | `{poll_id, message, is_active}` |
| `/polls/{poll_id}` | GET | - | `{poll_id, question, poll_type, options, is_active, response_count}` |
| `/polls/{poll_id}` | PUT | `{question?, options?, is_active?}` | `{message}` |
| `/polls/{poll_id}` | DELETE | - | `{message}` |
| `/polls/{poll_id}/respond` | POST | `{student_id, response}` | `{message, is_correct}` |
| `/polls/{poll_id}/results` | GET | - | `{poll_id, total_responses, response_percentages, accuracy, recommendation}` |
| `/polls/{poll_id}/responses/{student_id}` | GET | - | `{response_id, poll_id, student_id, response, is_correct, responded_at}` |
| `/polls/{poll_id}/responses/{student_id}` | PUT | `{response}` | `{message}` |
| `/classrooms/{classroom_id}/polls` | GET | Query: `?active_only&limit` | `[{poll_id, question, poll_type, is_active, response_count}]` |

**Note:** Poll question/options can only be updated when closed. Use `{is_active: false}` to close, `{is_active: true}` to reopen.

---

## 6. Curriculum Templates (`/api/templates`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/templates` | POST | `{teacher_id, title, subject_area, grade_level, template_type}` | `{template_id, message}` |
| `/templates/search` | GET | Query: `?subject&grade_level&template_type&q&tags&limit&offset` | `{templates, total, limit, offset}` |
| `/templates/{template_id}` | GET | - | `{template_id, title, learning_objectives, assessment_rubric, resources, usage_count, rating}` |
| `/templates/{template_id}` | PUT | `{title?, description?, learning_objectives?, assessment_rubric?, resources?, content?}` | `{message}` |
| `/templates/{template_id}` | DELETE | - | `{message}` |
| `/templates/{template_id}/rate` | POST | `{teacher_id, rating}` | `{message, new_rating, rating_count}` |
| `/templates/{template_id}/ratings/{rating_id}` | DELETE | - | `{new_average_rating, message}` |
| `/templates/{template_id}/use` | POST | `{teacher_id, classroom_id?, assignment_id?}` | `{usage_count, message}` |
| `/teachers/{teacher_id}/templates` | GET | Query: `?include_private` | `[{template_id, title, template_type, usage_count, rating}]` |
| `/templates/popular` | GET | Query: `?limit` | `[{template_id, title, subject_area, usage_count, rating}]` |
| `/templates/seed` | POST | - | `{message, templates_created}` |

---

## 7. Dashboard, Analytics & Interventions (`/api/dashboard`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/class-engagement/{classroom_id}` | GET | - | `{classroom_id, class_engagement_index, distribution, students_needing_attention, alert_counts, recommendation}` |
| `/attention-map/{classroom_id}` | GET | - | `{classroom_id, attention_map: [{student_id, engagement_level, engagement_score, color}], summary}` |
| `/mastery-heatmap/{classroom_id}` | GET | Query: `?subject_area` | `{classroom_id, heatmap, concept_averages, class_average_mastery}` |
| `/engagement-trends/{classroom_id}` | GET | Query: `?days` | `{classroom_id, trends, trend_direction, total_sessions}` |
| `/interventions` | POST | `{teacher_id, student_id, intervention_type, description, alert_id?}` | `{intervention_id, message, follow_up_date}` |
| `/interventions/{intervention_id}` | GET | - | `{intervention_id, teacher_id, student_id, intervention_type, description, status, outcome}` |
| `/interventions/{intervention_id}` | PUT | `{description?, intervention_type?, status?, outcome?, outcome_notes?}` | `{message}` |
| `/interventions/{intervention_id}` | DELETE | - | `{message}` |
| `/interventions/student/{student_id}` | GET | - | `{student_id, interventions, total_interventions}` |
| `/interventions/track` | POST | `{teacher_id, concept_id, intervention_type, target_students}` | `{intervention_id, predicted_improvement, predicted_mastery_after}` |
| `/interventions/{intervention_id}/measure` | POST | - | `{intervention_id, mastery_before, mastery_after, actual_improvement, effectiveness_rating}` |
| `/interventions/teacher/{teacher_id}` | GET | - | `{teacher_id, interventions, teacher_effectiveness}` |
| `/interventions/recommendations/{teacher_id}` | GET | - | `{teacher_id, recommendations: [{intervention_type, avg_improvement, effectiveness_rating}]}` |
| `/institutional-metrics` | GET | - | `{institution_summary, engagement_alerts, interventions_30_days}` |
| `/unified` | GET | Query: `?date` | `{metric_date, mastery_rate, teacher_adoption_rate, admin_confidence_score, total_students}` |
| `/unified/trends` | GET | Query: `?days` | `{has_data, trends: {mastery_rate, engagement_score}, trend_directions}` |
| `/talk-time/{classroom_id}` | GET | - | `{classroom_id, talk_time_distribution, teacher_talk_percentage, student_talk_percentage}` |
| `/student/{student_id}` | GET | - | `{student_id, overall_mastery, engagement_score, active_projects, recent_assignments}` |
| `/teacher/{teacher_id}/overview` | GET | - | `{teacher_id, total_classrooms, total_students, active_projects, total_projects, active_polls, total_polls}` |

---

## 8. PBL Projects - 5 Stage Workflow (`/api/pbl`)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/projects` | POST | `{title, classroom_id, teacher_id, stage, deadline}` | `{project_id, message, stage_info}` |
| `/projects/{project_id}` | GET | - | `{project_id, title, stage, stage_info, teams, milestones, settings}` |
| `/projects/{project_id}` | DELETE | - | `{message}` |
| `/projects/{project_id}/stage` | PUT | `{new_stage}` | `{message, new_stage, stage_info}` |
| `/projects/{project_id}/deliverable` | POST | `{team_id, submitted_by, deliverable_type, file_url, title?, description?}` | `{deliverable_id, message}` |
| `/projects/{project_id}/grade` | POST | `{teacher_id, deliverable_id, grade, feedback}` | `{message}` |
| `/projects/classroom/{classroom_id}` | GET | - | `{classroom_id, projects, total_projects}` |
| `/students/{student_id}/projects` | GET | - | `{student_id, projects: [{project_id, title, stage, deadline, status, team_id, team_name}], total}` |
| `/students/{student_id}/teams` | GET | - | `{student_id, teams: [{team_id, project_id, team_name, project_title, role, status}], total}` |
| `/projects/{project_id}/teams` | POST | `{team_name, members, roles}` | `{team_id, message, team_name}` |
| `/teams/{team_id}` | GET | - | `{team_id, project_id, team_name, members, status}` |
| `/teams/{team_id}` | PUT | `{team_name?, status?}` | `{message}` |
| `/teams/{team_id}` | DELETE | - | `{message}` |
| `/teams/{team_id}/members` | POST | `{student_id, role}` | `{message}` |
| `/teams/{team_id}/members/{student_id}` | DELETE | - | `{message}` |
| `/teams/{team_id}/grades` | GET | - | `[{deliverable_id, deliverable_type, grade, feedback, graded_at}]` |
| `/projects/{project_id}/milestones` | GET | - | `[{milestone_id, title, description, due_date, is_completed}]` |
| `/projects/{project_id}/milestones` | POST | `{title, due_date, description?}` | `{milestone_id, message}` |
| `/milestones/{milestone_id}` | GET | - | `{milestone_id, project_id, title, description, due_date, is_completed}` |
| `/milestones/{milestone_id}` | PUT | `{title?, description?, due_date?, is_completed?}` | `{message}` |
| `/milestones/{milestone_id}` | DELETE | - | `{message}` |
| `/deliverables/{deliverable_id}` | GET | - | `{deliverable_id, project_id, team_id, deliverable_type, file_url, title, graded, grade}` |
| `/deliverables/{deliverable_id}` | PUT | `{file_url?, title?, description?}` | `{message}` |
| `/deliverables/{deliverable_id}` | DELETE | - | `{message}` |
| `/deliverables/{deliverable_id}/grade` | GET | - | `{deliverable_id, grade, feedback, graded_by, graded_at}` |
| `/deliverables/{deliverable_id}/grade` | PUT | `{grade, feedback}` | `{message}` |
| `/projects/{project_id}/deliverables` | GET | - | `[{deliverable_id, team_id, deliverable_type, file_url, submitted_at, graded, grade}]` |
| `/teams/{team_id}/tasks` | POST | `{title, assigned_to, due_date}` | `{task_id, message}` |
| `/teams/{team_id}/tasks` | GET | - | `{team_id, tasks, total_tasks, completed_tasks}` |
| `/tasks/{task_id}` | PUT | `{title?, assigned_to?, due_date?, status?}` | `{message}` |
| `/tasks/{task_id}` | DELETE | - | `{message}` |
| `/teams/{team_id}/peer-reviews` | POST | `{reviewer_id, reviewee_id, review_type, ratings}` | `{review_id, message}` |
| `/teams/{team_id}/peer-reviews` | GET | - | `{team_id, reviews: [{review_id, reviewer, reviewee, review_type, ratings, created_at}], total}` |
| `/peer-reviews/{review_id}` | GET | - | `{review_id, team_id, reviewer_id, reviewee_id, review_type, ratings}` |
| `/peer-reviews/{review_id}` | PUT | `{ratings}` | `{message}` |
| `/peer-reviews/{review_id}` | DELETE | - | `{message}` |
| `/students/{student_id}/soft-skills` | GET | Query: `?team_id` | `{student_id, overall_soft_skills_score, dimension_scores, total_reviews_received}` |
| `/teams/{team_id}/soft-skills-summary` | GET | - | `{team_id, team_summary, team_average_score}` |
| `/stages` | GET | - | `{stages: {QUESTIONING, DEFINE, RESEARCH, CREATE_IMPROVE, PRESENT_EVALUATE}, total_stages}` |
| `/dimensions` | GET | - | `{dimensions: {TEAM_DYNAMICS, TEAM_STRUCTURE, TEAM_MOTIVATION, TEAM_EXCELLENCE}, validation}` |
| `/projects/{project_id}/milestones/{milestone_id}/submit` | POST | `{team_id, notes?}` | `{message, milestone_id, status}` |
| `/projects/{project_id}/milestones/{milestone_id}/approve` | POST | `{teacher_id, feedback?}` | `{message, xp_earned, team_level, completion_percentage, next_milestone_unlocked}` |
| `/projects/{project_id}/milestones/{milestone_id}/reject` | POST | `{teacher_id, reason?, feedback?}` | `{message, milestone_id, feedback}` |
| `/teams/{team_id}/progress` | GET | - | `{team_id, project_id, current_level, total_xp, milestones_completed, completion_percentage, unlocked_milestones, locked_milestones, achievements}` |
| `/teams/{team_id}/achievements` | GET | - | `{team_id, total_achievements, total_xp, achievements}` |

**5 PBL Stages:** QUESTIONING → DEFINE → RESEARCH → CREATE_IMPROVE → PRESENT_EVALUATE
**4D Soft Skills:** Team Dynamics, Team Structure, Team Motivation, Team Excellence (Cronbach α > 0.97)

**Gamification System:**
- **Achievement Badges:** 8 types (🎯 Milestone Completed, 🚀 First Milestone, ⭐ Halfway There, 🏆 Milestone Master, ⚡ Early Completion, 🤝 Team Player, 💎 Excellence Award, ✨ Stage Master)
- **XP System:** Base 100 XP per milestone + 50 XP bonus per level
- **Level Progression:** 1 level per 3 milestones completed
- **Sequential Unlocking:** Teams must complete milestones in order (can't skip ahead)
- **Teacher Approval:** All milestone completions require teacher approval before unlocking next milestone

---

---

## Summary

**Total Endpoints:** 150 endpoints across 11 blueprints

**Blueprints:**
1. `auth_routes.py` - 4 endpoints (authentication, excluding test endpoints)
2. `dashboard_routes.py` - 17 endpoints (dashboards, interventions, analytics)
3. `live_polling_routes.py` - 5 endpoints (live polling)
4. `engagement_routes.py` - 12 endpoints (engagement tracking, gamification)
5. `pbl_workflow_routes.py` - 29 endpoints (PBL workflows + gamification)
6. `pbl_crud_extensions.py` - 18 endpoints (PBL CRUD)
7. `polling_template_crud.py` - 14 endpoints (polling/template CRUD)
8. `template_routes.py` - 8 endpoints (curriculum templates)
9. `classroom_routes.py` - 26 endpoints (classroom management)
10. `mastery_concepts_routes.py` - 10 endpoints (mastery concepts/items)
11. `mastery_routes.py` - 7 endpoints (mastery system)

**Recent Consolidations (Merged 7 endpoints):**
- ✅ Task status merged into task update (removed `/tasks/{id}/status`)
- ✅ Intervention outcome merged into intervention update (removed `/interventions/{id}/outcome`)
- ✅ Milestone complete merged into milestone update (removed `/milestones/{id}/complete`)
- ✅ Poll close/reopen merged into poll update with `is_active` field (removed `/polls/{id}/close`, `/polls/{id}/reopen`)
- ✅ Notification deletions merged into single endpoint with query params (removed `/notifications/{id}`, `/notifications/user/{user_id}`)

**Major Improvements:**
- ✅ All 4 critical blockers fixed (assignment, concept, item, submission)
- ✅ 42 missing CRUD operations implemented
- ✅ Circular dependency resolved (mastery calculation)
- ✅ 7 redundant endpoints merged for cleaner API
- ✅ 100% workflow completeness achieved

**Previous:** 138 endpoints with 88 issues (39% problematic) → 200+ after fixes → 140 after consolidation → 145 after gamification → 150 after adding missing endpoints
**Current:** 150 endpoints, fully functional, no duplicates, with milestone progression gamification

**See:** [CRITICAL_FIXES_SUMMARY.md](CRITICAL_FIXES_SUMMARY.md) for detailed implementation notes
