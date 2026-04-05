# AMEP Algorithms & Analytics Logic

This document describes the **conceptual algorithms and baseline logic** that guide how the Adaptive Mastery & Engagement Platform (AMEP) processes learner data, derives insights, and supports adaptive decision-making.

This is **design-level documentation**, not implementation code.  
Its purpose is to establish a shared understanding of system behavior for contributors and maintainers.

---

## 1. Purpose of Algorithmic Logic in AMEP

AMEP is designed to go beyond content delivery and instead provide:
- Adaptive feedback to learners  
- Actionable insights to instructors  
- Meaningful analytics from learning interactions  

To achieve this, the system interprets learner interaction data (events) using:
- Baseline heuristic algorithms (current focus)  
- More advanced ML-based models (future roadmap)

This document defines the **baseline logic** that future implementations should align with.

---

## 2. Event Processing Model

All analytics in AMEP are driven by **events** — structured records of learner interactions.

Typical event examples:
- Question attempt  
- Poll response  
- Resource view  
- Assignment submission  
- Hint usage  

A simplified conceptual flow:

```
Frontend Interaction  
      ↓  
API Layer (event received)  
      ↓  
Event Store (database/logs)  
      ↓  
Analytics Engine  
      ↓  
Dashboards / Insights / Recommendations
```

Consistency of event structure is essential for reliable analytics.

---

## 3. Baseline Mastery Calculation (Rule-Based)

Each learner is associated with a **mastery score per concept**, typically on a 0–100 scale.

### Design Goals
- Interpretable  
- Simple enough to debug  
- Suitable for early-stage system behavior  
- Extendable toward probabilistic models later  

### Example Baseline Logic

- Correct answer: +5 mastery points  
- Incorrect answer: −3 mastery points  
- Very fast correct response: +1 bonus  
- Multiple repeated attempts: diminishing gains  
- Mastery clamped between 0 and 100  

Example:
- Student answers correctly → mastery increases  
- Student repeatedly struggles → mastery decreases slightly  

This provides a **reasonable baseline** before advanced models (e.g., BKT, DKT) are introduced.

---

## 4. Engagement Scoring (Heuristic Approach)

Engagement measures how actively a learner is participating in learning activities.

### Signals Considered

**Explicit signals:**
- Quiz submissions  
- Poll participation  
- Assignment completion  

**Implicit signals:**
- Time on task  
- Session frequency  
- Re-attempt behavior  
- Response latency  

### Example Conceptual Formula

```
engagement_score = weighted(
  activity_frequency,
  session_recency,
  completion_rate,
  response_consistency
)
```

This score does not need to be perfectly precise initially; its purpose is to:
- Identify disengagement early  
- Support instructor dashboards  
- Enable simple learner-state classification  

---

## 5. Learner State Classification

Based on mastery and engagement, learners may be categorized for monitoring purposes.

### Example categories

- **ENGAGED**
  - Stable or improving mastery  
  - Regular activity  
  - Consistent participation  

- **MONITOR**
  - Irregular engagement  
  - Mixed mastery trends  
  - Occasional disengagement signals  

- **AT_RISK**
  - Declining mastery  
  - Low recent activity  
  - Many abandoned attempts or inactivity  

These labels are intended to support:
- Instructor awareness  
- Targeted interventions  
- Adaptive system behaviors  

---

## 6. Instructor & Dashboard-Level Metrics

At an aggregate level, AMEP dashboards may compute:

- Average class mastery per concept  
- Distribution of learner states (Engaged / Monitor / At-risk)  
- Engagement trends over time  
- Most challenging concepts  
- Most active learning periods  

These metrics are derived from the same underlying event-driven analytics logic.

---

## 7. Roadmap: Advanced Algorithmic Approaches

While the baseline system relies on heuristics, AMEP is designed to evolve toward more sophisticated models, such as:

- **Bayesian Knowledge Tracing (BKT)**  
  Interpretable probabilistic mastery estimation  

- **Deep Knowledge Tracing (DKT)**  
  Sequence-based modeling using neural networks  

- **DKVMN (Dynamic Key-Value Memory Networks)**  
  Memory-augmented learner modeling  

- Forgetting curves and spaced repetition modeling  
- Adaptive task sequencing  
- Personalized recommendation systems  

These approaches are **future enhancements**, built on top of the baseline logic documented here.

---

## 8. Why This Documentation Matters

This document exists to:
- Align contributors on how the system is intended to behave  
- Reduce ambiguity when implementing features  
- Support consistent architectural decisions  
- Make AMEP easier to extend responsibly  

Contributors are encouraged to update this document when introducing new analytics logic.

---

If you believe a key concept or algorithm is missing, contributions are welcome.
