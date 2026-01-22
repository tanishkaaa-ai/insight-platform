"""
AMEP Engagement Detection Engine
Implements sensorless engagement monitoring with implicit signal analysis

Solves: BR4 (Inclusive Engagement Capture), BR6 (Actionable Teacher Feedback)

Research Sources:
- Paper 8h.pdf: Live Polling Impact
- Paper 2105_15106v4.pdf: Knowledge and Affect Tracing (KAT)
- Paper 6.pdf: Implicit Engagement Indicators
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

# ============================================================================
# ENGAGEMENT DETECTION (BR4)
# ============================================================================

class EngagementLevel(Enum):
    """Student engagement classification"""
    ENGAGED = "ENGAGED"
    PASSIVE = "PASSIVE"
    MONITOR = "MONITOR"
    AT_RISK = "AT_RISK"
    CRITICAL = "CRITICAL"

class DisengagementBehavior(Enum):
    """Gaming behaviors from Paper 2105_15106v4.pdf"""
    QUICK_GUESS = "quick_guess"
    BOTTOM_OUT_HINT = "bottom_out_hint"
    MANY_ATTEMPTS = "many_attempts"
    LOW_LOGIN_FREQUENCY = "low_login_frequency"
    DECLINING_PERFORMANCE = "declining_performance"
    LONG_INACTIVITY = "long_inactivity"

@dataclass
class ImplicitSignals:
    """
    BR4: Implicit Engagement Indicators from Paper 6.pdf
    
    These are captured automatically without student input
    """
    login_frequency: int  # Logins in past 7 days
    avg_session_duration: float  # Minutes per session
    time_on_task: float  # Minutes spent on learning activities
    interaction_count: int  # Clicks, responses, resource access
    response_times: List[float]  # Average time per question
    task_completion_rate: float = 0.5
    reattempt_rate: float = 0.0
    optional_resource_usage: int = 0
    discussion_participation: int = 0

@dataclass
class ExplicitSignals:
    """
    BR4: Explicit Engagement Indicators (from polls, self-reports)
    """
    poll_responses: int = 0
    understanding_level: float = 3.0
    participation_rate: float = 0.5
    quiz_accuracy: float = 0.5

class EngagementDetectionEngine:
    """
    Sensorless Engagement Monitoring System
    
    Detects disengagement patterns without physical sensors
    Based on Knowledge and Affect Tracing (KAT) from Paper 2105_15106v4.pdf
    """
    
    def __init__(self):
        # Thresholds for disengagement behaviors
        self.QUICK_GUESS_THRESHOLD = 3.0  # seconds
        self.MAX_HINTS = 3
        self.MANY_ATTEMPTS_THRESHOLD = 3
        self.MIN_LOGIN_FREQUENCY = 3  # per week
        self.MIN_SESSION_DURATION = 5  # minutes
        self.LONG_INACTIVITY_THRESHOLD = 300  # seconds (5 minutes)
        
        # Weights for engagement score calculation
        self.weights = {
            'implicit': 0.6,
            'explicit': 0.4
        }
    
    def detect_disengagement_behaviors(
        self,
        student_id: str,
        recent_responses: List[Dict],
        implicit_signals: ImplicitSignals
    ) -> List[Dict[str, any]]:
        """
        BR4: Detect gaming behaviors and disengagement patterns
        
        Returns list of detected behaviors with severity
        """
        behaviors = []
        
        # 1. Quick Guess Detection
        quick_guesses = sum(
            1 for r in recent_responses 
            if r.get('response_time', float('inf')) < self.QUICK_GUESS_THRESHOLD
        )
        if quick_guesses >= 3:
            behaviors.append({
                'type': DisengagementBehavior.QUICK_GUESS,
                'severity': 'MONITOR' if quick_guesses < 5 else 'AT_RISK',
                'count': quick_guesses,
                'description': 'Student answering without thinking (< 3 seconds)',
                'detected_at': datetime.now().isoformat()
            })
        
        # 2. Bottom-out Hint Detection
        bottom_out_hints = sum(
            1 for r in recent_responses
            if r.get('hints_used', 0) >= self.MAX_HINTS
        )
        if bottom_out_hints >= 2:
            behaviors.append({
                'type': DisengagementBehavior.BOTTOM_OUT_HINT,
                'severity': 'AT_RISK',
                'count': bottom_out_hints,
                'description': 'Student using all hints without attempting (giving up)',
                'detected_at': datetime.now().isoformat()
            })
        
        # 3. Many Attempts Detection
        many_attempts = sum(
            1 for r in recent_responses
            if r.get('attempts', 1) > self.MANY_ATTEMPTS_THRESHOLD
        )
        if many_attempts >= 3:
            behaviors.append({
                'type': DisengagementBehavior.MANY_ATTEMPTS,
                'severity': 'MONITOR',
                'count': many_attempts,
                'description': 'Random clicking/guessing on multiple questions',
                'detected_at': datetime.now().isoformat()
            })
        
        # 4. Low Login Frequency
        if implicit_signals.login_frequency < self.MIN_LOGIN_FREQUENCY:
            behaviors.append({
                'type': DisengagementBehavior.LOW_LOGIN_FREQUENCY,
                'severity': 'AT_RISK' if implicit_signals.login_frequency < 2 else 'MONITOR',
                'count': implicit_signals.login_frequency,
                'description': f'Only {implicit_signals.login_frequency} logins in past week',
                'detected_at': datetime.now().isoformat()
            })
        
        # 5. Declining Performance
        if recent_responses:
            # Compare first half vs second half of responses
            mid = len(recent_responses) // 2
            first_half_accuracy = np.mean([
                r['is_correct'] for r in recent_responses[:mid]
            ])
            second_half_accuracy = np.mean([
                r['is_correct'] for r in recent_responses[mid:]
            ])
            decline = first_half_accuracy - second_half_accuracy
            
            if decline > 0.2:  # 20% decline
                behaviors.append({
                    'type': DisengagementBehavior.DECLINING_PERFORMANCE,
                    'severity': 'AT_RISK',
                    'decline_percentage': round(decline * 100, 1),
                    'description': f'Performance declined by {round(decline * 100, 1)}%',
                    'detected_at': datetime.now().isoformat()
                })
        
        # 6. Session Duration Analysis
        if implicit_signals.avg_session_duration < self.MIN_SESSION_DURATION:
            behaviors.append({
                'type': DisengagementBehavior.LONG_INACTIVITY,
                'severity': 'MONITOR',
                'avg_duration': implicit_signals.avg_session_duration,
                'description': f'Very short sessions ({implicit_signals.avg_session_duration:.1f} min avg)',
                'detected_at': datetime.now().isoformat()
            })
        
        return behaviors
    
    def calculate_engagement_score(
        self,
        implicit_signals: ImplicitSignals,
        explicit_signals: ExplicitSignals,
        disengagement_behaviors: List[Dict]
    ) -> Dict[str, any]:
        """
        BR4: Calculate comprehensive engagement score (0-100)
        
        Combines implicit and explicit signals with detected behaviors
        """
        # Calculate implicit score (0-100)
        implicit_score = self._calculate_implicit_score(implicit_signals)
        
        # Calculate explicit score (0-100)
        explicit_score = self._calculate_explicit_score(explicit_signals)
        
        # Weighted combination
        base_score = (
            implicit_score * self.weights['implicit'] +
            explicit_score * self.weights['explicit']
        )
        
        # Apply penalties for disengagement behaviors
        penalty = 0
        for behavior in disengagement_behaviors:
            if behavior['severity'] == 'MONITOR':
                penalty += 5
            elif behavior['severity'] == 'AT_RISK':
                penalty += 10
            elif behavior['severity'] == 'CRITICAL':
                penalty += 20
        
        final_score = max(0, base_score - penalty)
        
        # Determine engagement level
        engagement_level = self._classify_engagement(final_score, disengagement_behaviors)
        
        return {
            'engagement_score': round(final_score, 2),
            'implicit_component': round(implicit_score, 2),
            'explicit_component': round(explicit_score, 2),
            'engagement_level': engagement_level.value,
            'penalty_applied': penalty,
            'behaviors_detected': len(disengagement_behaviors),
            'recommendations': self._generate_recommendations(
                engagement_level, 
                disengagement_behaviors
            )
        }
    
    def _calculate_implicit_score(self, signals: ImplicitSignals) -> float:
        """
        Calculate score from implicit indicators
        
        BR4: Implicit signals from Paper 6.pdf
        """
        # Normalize each signal to 0-100 scale
        login_score = min(100, (signals.login_frequency / 7) * 100)  # Daily ideal
        duration_score = min(100, (signals.avg_session_duration / 30) * 100)  # 30 min ideal
        time_on_task_score = min(100, (signals.time_on_task / 120) * 100)  # 2 hours/week ideal
        interaction_score = min(100, (signals.interaction_count / 50) * 100)  # 50/week ideal
        
        # Response time (faster = better, but not too fast)
        if signals.response_times:
            avg_response_time = np.mean(signals.response_times)
            if avg_response_time < 3:
                response_time_score = 50  # Too fast = guessing
            elif avg_response_time < 30:
                response_time_score = 100  # Optimal
            else:
                response_time_score = max(0, 100 - (avg_response_time - 30) * 2)
        else:
            response_time_score = 50
        
        completion_score = signals.task_completion_rate * 100
        reattempt_score = min(100, signals.reattempt_rate * 150)  # Reattempts show persistence
        resource_score = min(100, (signals.optional_resource_usage / 5) * 100)
        discussion_score = min(100, (signals.discussion_participation / 3) * 100)
        
        # Weighted average
        implicit_score = (
            login_score * 0.15 +
            duration_score * 0.15 +
            time_on_task_score * 0.15 +
            interaction_score * 0.1 +
            response_time_score * 0.1 +
            completion_score * 0.2 +
            reattempt_score * 0.05 +
            resource_score * 0.05 +
            discussion_score * 0.05
        )
        
        return implicit_score
    
    def _calculate_explicit_score(self, signals: ExplicitSignals) -> float:
        """Calculate score from explicit indicators (polls, self-reports)"""
        poll_score = min(100, (signals.poll_responses / 5) * 100)  # 5/week ideal
        understanding_score = (signals.understanding_level / 5) * 100
        participation_score = signals.participation_rate * 100
        accuracy_score = signals.quiz_accuracy * 100
        
        explicit_score = (
            poll_score * 0.2 +
            understanding_score * 0.3 +
            participation_score * 0.3 +
            accuracy_score * 0.2
        )
        
        return explicit_score
    
    def _classify_engagement(
        self, 
        score: float, 
        behaviors: List[Dict]
    ) -> EngagementLevel:
        """Classify engagement level based on score and behaviors"""
        critical_behaviors = sum(
            1 for b in behaviors if b['severity'] == 'CRITICAL'
        )
        at_risk_behaviors = sum(
            1 for b in behaviors if b['severity'] == 'AT_RISK'
        )
        
        if critical_behaviors > 0 or score < 30:
            return EngagementLevel.CRITICAL
        elif at_risk_behaviors >= 2 or score < 50:
            return EngagementLevel.AT_RISK
        elif at_risk_behaviors == 1 or score < 65:
            return EngagementLevel.MONITOR
        elif score < 75:
            return EngagementLevel.PASSIVE
        else:
            return EngagementLevel.ENGAGED
    
    def _generate_recommendations(
        self,
        level: EngagementLevel,
        behaviors: List[Dict]
    ) -> List[str]:
        """BR6: Generate actionable recommendations for teachers"""
        recommendations = []
        
        if level == EngagementLevel.CRITICAL:
            recommendations.append("URGENT: Schedule immediate 1-on-1 meeting")
            recommendations.append("Contact parents/guardians")
            recommendations.append("Consider support services referral")
        
        elif level == EngagementLevel.AT_RISK:
            recommendations.append("Schedule 1-on-1 check-in within 48 hours")
            recommendations.append("Review recent assignments for difficulty issues")
            recommendations.append("Consider peer mentoring or study group")
        
        elif level == EngagementLevel.MONITOR:
            recommendations.append("Monitor progress for next 3-5 days")
            recommendations.append("Provide encouragement and check understanding")
        
        # Behavior-specific recommendations
        behavior_types = [b['type'] for b in behaviors]
        
        if DisengagementBehavior.QUICK_GUESS in behavior_types:
            recommendations.append("Add time-lock or reflection prompts to questions")
        
        if DisengagementBehavior.BOTTOM_OUT_HINT in behavior_types:
            recommendations.append("Simplify content or provide more scaffolding")
        
        if DisengagementBehavior.LOW_LOGIN_FREQUENCY in behavior_types:
            recommendations.append("Send reminder notifications or check technology access")
        
        if DisengagementBehavior.DECLINING_PERFORMANCE in behavior_types:
            recommendations.append("Review recent topic - may indicate knowledge gap")
        
        return recommendations
    
    def analyze_class_engagement(
        self,
        student_engagements: List[Dict]
    ) -> Dict[str, any]:
        """
        BR6: Class-level engagement analysis for teacher dashboard
        
        Aggregates individual student engagement into class metrics
        """
        if not student_engagements:
            return {
                'class_engagement_index': 0,
                'distribution': {},
                'alert_count': 0
            }
        
        scores = [s['engagement_score'] for s in student_engagements]
        levels = [s['engagement_level'] for s in student_engagements]
        
        # Class engagement index (weighted average)
        class_index = np.mean(scores)
        
        # Distribution
        distribution = {
            'ENGAGED': levels.count('ENGAGED'),
            'PASSIVE': levels.count('PASSIVE'),
            'MONITOR': levels.count('MONITOR'),
            'AT_RISK': levels.count('AT_RISK'),
            'CRITICAL': levels.count('CRITICAL')
        }
        
        # Alert counts
        alert_count = distribution['AT_RISK'] + distribution['CRITICAL']
        
        # Trend analysis (if historical data available)
        trend = "stable"  # Would compare to previous period
        
        return {
            'class_engagement_index': round(class_index, 2),
            'distribution': distribution,
            'alert_count': alert_count,
            'students_needing_attention': [
                s for s in student_engagements 
                if s['engagement_level'] in ['AT_RISK', 'CRITICAL']
            ],
            'trend': trend,
            'class_size': len(student_engagements),
            'engagement_rate': round(
                (distribution['ENGAGED'] + distribution['PASSIVE']) / len(student_engagements) * 100,
                1
            )
        }

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    engine = EngagementDetectionEngine()
    
    # Sample student data
    implicit = ImplicitSignals(
        login_frequency=2,  # Low
        avg_session_duration=8.5,
        time_on_task=45.0,
        interaction_count=12,
        response_times=[2.5, 1.8, 3.2, 2.1],  # Some quick guesses
        task_completion_rate=0.65,
        reattempt_rate=0.1,
        optional_resource_usage=1,
        discussion_participation=0
    )
    
    explicit = ExplicitSignals(
        poll_responses=3,
        understanding_level=2.5,
        participation_rate=0.70,
        quiz_accuracy=0.68
    )
    
    recent_responses = [
        {'is_correct': True, 'response_time': 2.0, 'hints_used': 0, 'attempts': 1},
        {'is_correct': False, 'response_time': 1.5, 'hints_used': 3, 'attempts': 1},
        {'is_correct': False, 'response_time': 2.5, 'hints_used': 3, 'attempts': 4},
        {'is_correct': True, 'response_time': 15.0, 'hints_used': 1, 'attempts': 1},
    ]
    
    # Detect behaviors
    behaviors = engine.detect_disengagement_behaviors(
        'student_001',
        recent_responses,
        implicit
    )
    
    # Calculate engagement
    result = engine.calculate_engagement_score(
        implicit,
        explicit,
        behaviors
    )
    
    print("Student Engagement Analysis:")
    print(f"Score: {result['engagement_score']}/100")
    print(f"Level: {result['engagement_level']}")
    print(f"Behaviors Detected: {result['behaviors_detected']}")
    print("\nRecommendations:")
    for rec in result['recommendations']:
        print(f"  • {rec}")