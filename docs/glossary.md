# AMEP Glossary — Key Terms & Concepts

> I have made a concise glossary to help new contributors (and reviewers) quickly understand core terms used in this project.

---

## Mastery Score

**Definition:**
A numeric score (usually 0–100) representing how well a student understands a particular concept.

**Notes:**
Mastery is often updated after each assessment or interaction. In early baseline implementations this can be a simple increment/decrement value; later implementations may use probabilistic models (BKT, DKT).

**Example:**
`mastery("fractions") = 85` → student likely needs light review only.

---

## Engagement

**Definition:**
A measure of how actively a student participates in learning activities.

**Typical explicit signals:**

* Poll responses
* Quiz answers
* Form submissions

**Typical implicit signals:**

* Time-on-task
* Frequency of interactions
* Re-attempts
* Response time patterns

---

## PBL (Project-Based Learning)

**Definition:**
Instructional approach where students learn by actively engaging in meaningful projects.

**AMEP flow (example):**
Question → Define → Research → Create → Present

---

## ZPD (Zone of Proximal Development)

**Definition:**
The range of difficulty where tasks are challenging but achievable with guidance — optimal for learning progress.

**Usage:**
Adaptive practice engines try to keep tasks within a learner’s ZPD.

---

## Soft Skills Dimensions (used for peer / teacher evaluation)

* **TD — Team Dynamics:** Communication, mutual support, listening
* **TS — Team Structure:** Role clarity, task scheduling, responsibility
* **TM — Team Motivation:** Enthusiasm, engagement, persistence
* **TE — Team Excellence:** Quality of output, reflective practice, continuous improvement

---

## BKT (Bayesian Knowledge Tracing)

**Definition:**
An interpretable probabilistic model used to estimate a student’s knowledge state for a given skill using parameters like learning probability and guess/slip rates.

**When to use:**
Good for baseline, explainable mastery estimations.

---

## DKT (Deep Knowledge Tracing)

**Definition:**
A sequence model (e.g., LSTM) approach that learns student knowledge dynamics from interaction sequences.

**When to use:**
Useful where richer temporal patterns are needed; less interpretable than BKT.

---

## DKVMN (Dynamic Key-Value Memory Network)

**Definition:**
A memory-augmented model for tracking knowledge items and their relationships; useful for complex concept maps and forgetting/retention modeling.

---

## Explicit Indicators

**Definition:**
Signals directly provided by learners (e.g., quiz answers, poll participation).

**Use:**
High confidence signals for immediate feedback.

---

## Implicit Indicators

**Definition:**
Behavioral signals derived from activity logs (e.g., response time, revisits, navigation patterns).

**Use:**
Helpful for passive engagement estimation and disengagement detection.

---

## At-Risk / Monitor / Engaged Labels

**Definition:**
Simple categorical flags used by dashboards to highlight learner state.

**Example heuristic:**

* `AT_RISK` if multiple disengagement signals detected
* `MONITOR` for borderline behavior
* `ENGAGED` for expected patterns

---

## Event Schema (Example)

**Purpose:**
Standardize how interaction events are represented across frontend/backend for analytics.

```json
{
  "student_id": "S001",
  "timestamp": "2026-01-10T10:23:45Z",
  "event_type": "attempt",
  "concept": "fractions.addition",
  "correct": true,
  "response_time_sec": 12,
  "metadata": {
    "attempt_no": 1,
    "session_id": "sess_abc123"
  }
}
```

---

## Engagement Signals

Data points used to infer student participation and involvement.

**Examples:**

* Quiz response times
* Number of resource interactions
* Poll responses
* Assignment completion patterns

---

## Knowledge Tracing

A method of estimating a student's understanding over time based on their learning interactions.

**Future implementations in AMEP may include:**

* Bayesian Knowledge Tracing (BKT)
* Deep Knowledge Tracing (DKT)
* Memory-based models

---

## Baseline Implementation

A simple, interpretable first version of a feature used as a foundation before introducing advanced ML techniques.

**Example:**
A rule-based mastery update before implementing neural models.

---

## Analytics Engine

The system responsible for transforming raw learning data into meaningful insights such as mastery trends, engagement scores, and teacher dashboards.

---

## Event Data

Structured records of learner interactions such as:

* Question attempts
* Correct/incorrect responses
* Time spent
* Hint usage

Event data forms the foundation of all analytics in AMEP.

---

## Common Abbreviations

* **API** — Application Programming Interface
* **EDA** — Exploratory Data Analysis
* **ML** — Machine Learning
* **DB** — Database

---

## Where to Learn More in This Repo

* `docs/architecture.md` — high-level system architecture and data flow
* `docs/CONTRIBUTING.md` — how to propose changes or open issues
* `backend/` — location for analytic models and server logic (baseline modules)

---

## Why This Glossary Exists

AMEP uses interdisciplinary concepts from education, data science, and software engineering.
This glossary ensures contributors share a common understanding and can collaborate effectively.

If you feel a term is missing, contributions are welcome.

---

