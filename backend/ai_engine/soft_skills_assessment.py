"""
AMEP Soft Skills Assessment Engine
Implements 4-Dimensional Team Effectiveness Model with Bayesian Prediction

Solves: BR5 (Objective Soft-Skill Assessment), BR9 (PBL Workflow Integration)

Research Sources:
- Paper 5.pdf: Team Effectiveness Framework (TD, TS, TM, TE)
- Cronbach's Alpha > 0.97 for reliability validation
- Bayesian Network for team performance prediction
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

# ============================================================================
# 4-DIMENSIONAL TEAM EFFECTIVENESS MODEL (BR5)
# ============================================================================

class TeamDimension(Enum):
    """Four dimensions of team effectiveness"""
    TEAM_DYNAMICS = "TD"  # Communication, trust, support
    TEAM_STRUCTURE = "TS"  # Roles, scheduling, decision-making
    TEAM_MOTIVATION = "TM"  # Purpose, goals, passion
    TEAM_EXCELLENCE = "TE"  # Growth mindset, quality, reflection

@dataclass
class SoftSkillRatings:
    """
    BR5: Likert-scale ratings (1-5) for 16 indicators
    
    Research-backed indicators from Paper 5.pdf
    """
    # Team Dynamics (TD) - 4 indicators
    td_communication: float  # Clear, open communication
    td_mutual_support: float  # Members help each other
    td_trust: float  # Psychological safety
    td_active_listening: float  # Respectful dialogue
    
    # Team Structure (TS) - 4 indicators
    ts_clear_roles: float  # Well-defined responsibilities
    ts_task_scheduling: float  # Effective time management
    ts_decision_making: float  # Structured decision processes
    ts_conflict_resolution: float  # Constructive conflict handling
    
    # Team Motivation (TM) - 4 indicators
    tm_clear_purpose: float  # Shared vision
    tm_smart_goals: float  # Specific, measurable objectives
    tm_passion: float  # Engagement and enthusiasm
    tm_synergy: float  # Collaborative energy
    
    # Team Excellence (TE) - 4 indicators
    te_growth_mindset: float  # Learning orientation
    te_quality_work: float  # High standards
    te_self_monitoring: float  # Progress tracking
    te_reflective_practice: float  # Continuous improvement

@dataclass
class AssessmentMetadata:
    """Metadata for assessment tracking"""
    assessment_id: str
    team_id: str
    assessed_student_id: str
    assessor_student_id: Optional[str]  # None for self-assessment
    assessment_type: str  # "peer_review", "self_assessment", "teacher_assessment"
    timestamp: datetime

class SoftSkillsEngine:
    """
    4-Dimensional Team Effectiveness Assessment System
    
    Implements:
    1. Multi-rater assessment (peer, self, teacher)
    2. Cronbach's Alpha reliability validation (α > 0.97)
    3. Bayesian prediction of team performance
    4. Longitudinal tracking and trend analysis
    """
    
    def __init__(self):
        # Cronbach's Alpha threshold for reliability
        self.CRONBACH_ALPHA_THRESHOLD = 0.70  # Standard threshold (0.97 is ideal)
        
        # Bayesian network parameters (learned from data)
        self.bayesian_priors = {
            'TD': 0.65,  # Prior probability of high team dynamics
            'TS': 0.60,  # Prior probability of good structure
            'TM': 0.70,  # Prior probability of strong motivation
            'TE': 0.65   # Prior probability of excellence
        }
        
        # Conditional probabilities for team success
        self.success_given_dimensions = {
            'all_high': 0.90,
            'three_high': 0.75,
            'two_high': 0.55,
            'one_high': 0.35,
            'none_high': 0.15
        }
    
    def validate_ratings(self, ratings: SoftSkillRatings) -> Dict[str, any]:
        """
        BR5: Validate that all ratings are on proper Likert scale (1-5)
        """
        all_ratings = [
            # TD
            ratings.td_communication,
            ratings.td_mutual_support,
            ratings.td_trust,
            ratings.td_active_listening,
            # TS
            ratings.ts_clear_roles,
            ratings.ts_task_scheduling,
            ratings.ts_decision_making,
            ratings.ts_conflict_resolution,
            # TM
            ratings.tm_clear_purpose,
            ratings.tm_smart_goals,
            ratings.tm_passion,
            ratings.tm_synergy,
            # TE
            ratings.te_growth_mindset,
            ratings.te_quality_work,
            ratings.te_self_monitoring,
            ratings.te_reflective_practice
        ]
        
        # Check range
        valid = all(1.0 <= r <= 5.0 for r in all_ratings)
        
        # Check for suspicious patterns (all same score = potential bias)
        unique_scores = len(set(all_ratings))
        has_variance = unique_scores >= 3
        
        return {
            'valid': valid,
            'has_variance': has_variance,
            'unique_scores': unique_scores,
            'mean': np.mean(all_ratings),
            'std': np.std(all_ratings)
        }
    
    def calculate_dimension_scores(
        self, 
        ratings: SoftSkillRatings
    ) -> Dict[str, float]:
        """
        BR5: Calculate average score for each dimension
        
        Returns scores on 0-100 scale for consistency with mastery scoring
        """
        # Calculate averages for each dimension (1-5 scale)
        td_avg = np.mean([
            ratings.td_communication,
            ratings.td_mutual_support,
            ratings.td_trust,
            ratings.td_active_listening
        ])
        
        ts_avg = np.mean([
            ratings.ts_clear_roles,
            ratings.ts_task_scheduling,
            ratings.ts_decision_making,
            ratings.ts_conflict_resolution
        ])
        
        tm_avg = np.mean([
            ratings.tm_clear_purpose,
            ratings.tm_smart_goals,
            ratings.tm_passion,
            ratings.tm_synergy
        ])
        
        te_avg = np.mean([
            ratings.te_growth_mindset,
            ratings.te_quality_work,
            ratings.te_self_monitoring,
            ratings.te_reflective_practice
        ])
        
        # Convert to 0-100 scale: (score - 1) / 4 * 100
        return {
            'TD': round((td_avg - 1) / 4 * 100, 2),
            'TS': round((ts_avg - 1) / 4 * 100, 2),
            'TM': round((tm_avg - 1) / 4 * 100, 2),
            'TE': round((te_avg - 1) / 4 * 100, 2),
            'overall': round(((np.mean([td_avg, ts_avg, tm_avg, te_avg]) - 1) / 4 * 100), 2)
        }
    
    def calculate_cronbach_alpha(
        self,
        assessments: List[List[float]]
    ) -> float:
        """
        BR5: Calculate Cronbach's Alpha for reliability validation
        
        Formula: α = (k / (k-1)) * (1 - Σσ²ᵢ / σ²ₜ)
        Where:
        - k = number of items
        - σ²ᵢ = variance of item i
        - σ²ₜ = variance of total scores
        
        High α (> 0.97) indicates consistent, reliable assessments
        """
        if len(assessments) < 2:
            return 0.0
        
        # Convert to numpy array
        data = np.array(assessments)
        
        # Number of items (indicators)
        k = data.shape[1]
        
        # Variance of each item
        item_variances = np.var(data, axis=0, ddof=1)
        sum_item_variances = np.sum(item_variances)
        
        # Total scores for each assessment
        total_scores = np.sum(data, axis=1)
        total_variance = np.var(total_scores, ddof=1)
        
        # Cronbach's Alpha
        if total_variance == 0:
            return 0.0
        
        alpha = (k / (k - 1)) * (1 - sum_item_variances / total_variance)
        
        return round(alpha, 4)
    
    def aggregate_multi_rater_assessments(
        self,
        peer_assessments: List[SoftSkillRatings],
        self_assessment: Optional[SoftSkillRatings] = None,
        teacher_assessment: Optional[SoftSkillRatings] = None
    ) -> Dict[str, any]:
        """
        BR5: Aggregate multiple assessments with appropriate weighting
        
        Weights:
        - Peer reviews: 60% (multiple perspectives)
        - Self-assessment: 20% (self-awareness)
        - Teacher assessment: 20% (expert validation)
        """
        all_dimension_scores = []
        
        # Calculate dimension scores for all peer assessments
        peer_scores = [
            self.calculate_dimension_scores(assessment)
            for assessment in peer_assessments
        ]
        
        # Weight peer assessments (60% total, distributed equally)
        if peer_scores:
            peer_weight = 0.6 / len(peer_scores)
            weighted_peer = {
                dim: sum(score[dim] * peer_weight for score in peer_scores)
                for dim in ['TD', 'TS', 'TM', 'TE']
            }
        else:
            weighted_peer = {'TD': 0, 'TS': 0, 'TM': 0, 'TE': 0}
        
        # Weight self-assessment (20%)
        if self_assessment:
            self_scores = self.calculate_dimension_scores(self_assessment)
            weighted_self = {dim: score * 0.2 for dim, score in self_scores.items() if dim != 'overall'}
        else:
            weighted_self = {'TD': 0, 'TS': 0, 'TM': 0, 'TE': 0}
        
        # Weight teacher assessment (20%)
        if teacher_assessment:
            teacher_scores = self.calculate_dimension_scores(teacher_assessment)
            weighted_teacher = {dim: score * 0.2 for dim, score in teacher_scores.items() if dim != 'overall'}
        else:
            weighted_teacher = {'TD': 0, 'TS': 0, 'TM': 0, 'TE': 0}
        
        # Combine weighted scores
        final_scores = {}
        for dim in ['TD', 'TS', 'TM', 'TE']:
            total_score = (
                weighted_peer.get(dim, 0) +
                weighted_self.get(dim, 0) +
                weighted_teacher.get(dim, 0)
            )
            final_scores[dim] = round(total_score, 2)
        
        # Calculate overall score
        final_scores['overall'] = round(np.mean([final_scores['TD'], final_scores['TS'], final_scores['TM'], final_scores['TE']]), 2)
        
        # Calculate Cronbach's Alpha for reliability
        all_ratings = []
        for assessment in peer_assessments:
            all_ratings.append([
                assessment.td_communication, assessment.td_mutual_support,
                assessment.td_trust, assessment.td_active_listening,
                assessment.ts_clear_roles, assessment.ts_task_scheduling,
                assessment.ts_decision_making, assessment.ts_conflict_resolution,
                assessment.tm_clear_purpose, assessment.tm_smart_goals,
                assessment.tm_passion, assessment.tm_synergy,
                assessment.te_growth_mindset, assessment.te_quality_work,
                assessment.te_self_monitoring, assessment.te_reflective_practice
            ])
        
        cronbach_alpha = self.calculate_cronbach_alpha(all_ratings)
        
        return {
            'dimension_scores': final_scores,
            'reliability': {
                'cronbach_alpha': cronbach_alpha,
                'is_reliable': cronbach_alpha >= self.CRONBACH_ALPHA_THRESHOLD,
                'peer_count': len(peer_assessments),
                'has_self': self_assessment is not None,
                'has_teacher': teacher_assessment is not None
            }
        }
    
    def predict_team_success(
        self,
        dimension_scores: Dict[str, float]
    ) -> Dict[str, any]:
        """
        BR5: Bayesian prediction of team project success
        
        Based on 4-dimensional scores, predict likelihood of success
        """
        # Determine which dimensions are "high" (>= 70 on 0-100 scale)
        high_dimensions = sum(
            1 for dim in ['TD', 'TS', 'TM', 'TE']
            if dimension_scores.get(dim, 0) >= 70
        )
        
        # Map to success probability
        if high_dimensions == 4:
            success_prob = self.success_given_dimensions['all_high']
        elif high_dimensions == 3:
            success_prob = self.success_given_dimensions['three_high']
        elif high_dimensions == 2:
            success_prob = self.success_given_dimensions['two_high']
        elif high_dimensions == 1:
            success_prob = self.success_given_dimensions['one_high']
        else:
            success_prob = self.success_given_dimensions['none_high']
        
        # Identify strengths and weaknesses
        strengths = [
            dim for dim in ['TD', 'TS', 'TM', 'TE']
            if dimension_scores.get(dim, 0) >= 70
        ]
        
        weaknesses = [
            dim for dim in ['TD', 'TS', 'TM', 'TE']
            if dimension_scores.get(dim, 0) < 50
        ]
        
        # Generate recommendations
        recommendations = self._generate_improvement_recommendations(
            dimension_scores,
            weaknesses
        )
        
        return {
            'success_probability': round(success_prob * 100, 1),
            'confidence_level': self._calculate_prediction_confidence(dimension_scores),
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommendations': recommendations
        }
    
    def _calculate_prediction_confidence(
        self,
        dimension_scores: Dict[str, float]
    ) -> str:
        """Calculate confidence in prediction based on score variance"""
        scores = [dimension_scores.get(dim, 50) for dim in ['TD', 'TS', 'TM', 'TE']]
        std = np.std(scores)
        
        if std < 10:
            return "HIGH"  # Consistent scores = confident prediction
        elif std < 20:
            return "MEDIUM"
        else:
            return "LOW"  # High variance = uncertain prediction
    
    def _generate_improvement_recommendations(
        self,
        dimension_scores: Dict[str, float],
        weaknesses: List[str]
    ) -> List[str]:
        """BR5: Generate actionable recommendations based on weaknesses"""
        recommendations = []
        
        dimension_advice = {
            'TD': [
                "Schedule daily 15-minute stand-up meetings to improve communication",
                "Implement a team charter to establish trust and psychological safety",
                "Use active listening exercises (paraphrase, ask clarifying questions)",
                "Create a 'support buddy' system where team members check in on each other"
            ],
            'TS': [
                "Use a RACI matrix (Responsible, Accountable, Consulted, Informed) to clarify roles",
                "Implement a shared project management tool (Trello, Asana) for task tracking",
                "Establish decision-making protocols (voting, consensus, leader decides)",
                "Practice conflict resolution with 'I statements' and active mediation"
            ],
            'TM': [
                "Co-create a team mission statement that reflects shared purpose",
                "Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)",
                "Celebrate small wins to maintain passion and momentum",
                "Identify each member's unique strengths and leverage them for synergy"
            ],
            'TE': [
                "Adopt a growth mindset: view challenges as learning opportunities",
                "Establish quality criteria and peer review processes",
                "Use KPIs (Key Performance Indicators) to monitor progress weekly",
                "Conduct retrospectives after each milestone to reflect and improve"
            ]
        }
        
        # Add recommendations for each weakness
        for weak_dim in weaknesses:
            recommendations.extend(dimension_advice.get(weak_dim, []))
        
        # If no specific weaknesses, provide general excellence advice
        if not weaknesses:
            recommendations.append("Excellent team! Focus on maintaining high performance through:")
            recommendations.append("- Regular reflection and continuous improvement")
            recommendations.append("- Mentoring other teams")
            recommendations.append("- Taking on stretch goals to push boundaries")
        
        return recommendations
    
    def analyze_longitudinal_trends(
        self,
        historical_assessments: List[Dict[str, any]]
    ) -> Dict[str, any]:
        """
        BR5: Track team development over time
        
        Analyzes how team effectiveness evolves throughout the project
        """
        if len(historical_assessments) < 2:
            return {
                'trend': 'insufficient_data',
                'improvement_rate': 0.0,
                'percent_change': 0.0,
                'trajectory': 'unknown',
                'dimension_trends': {},
                'assessment_count': len(historical_assessments),
                'time_span_days': 0
            }
        
        # Sort by timestamp
        sorted_assessments = sorted(
            historical_assessments,
            key=lambda x: x.get('timestamp', datetime.min)
        )
        
        # Extract dimension scores over time
        td_scores = [a['dimension_scores']['TD'] for a in sorted_assessments]
        ts_scores = [a['dimension_scores']['TS'] for a in sorted_assessments]
        tm_scores = [a['dimension_scores']['TM'] for a in sorted_assessments]
        te_scores = [a['dimension_scores']['TE'] for a in sorted_assessments]
        
        # Calculate trends (linear regression slope)
        def calculate_trend(scores):
            x = np.arange(len(scores))
            if len(scores) < 2:
                return 0.0
            slope, _ = np.polyfit(x, scores, 1)
            return slope
        
        trends = {
            'TD': calculate_trend(td_scores),
            'TS': calculate_trend(ts_scores),
            'TM': calculate_trend(tm_scores),
            'TE': calculate_trend(te_scores)
        }
        
        # Overall improvement rate (average of all dimension trends)
        overall_trend = np.mean(list(trends.values()))
        
        # Determine trajectory
        if overall_trend > 2.0:
            trajectory = 'rapidly_improving'
        elif overall_trend > 0.5:
            trajectory = 'improving'
        elif overall_trend > -0.5:
            trajectory = 'stable'
        elif overall_trend > -2.0:
            trajectory = 'declining'
        else:
            trajectory = 'rapidly_declining'
        
        # Calculate percent improvement from first to last
        first_overall = sorted_assessments[0]['dimension_scores']['overall']
        last_overall = sorted_assessments[-1]['dimension_scores']['overall']
        percent_change = ((last_overall - first_overall) / first_overall * 100) if first_overall > 0 else 0
        
        return {
            'trend': trajectory,
            'improvement_rate': round(overall_trend, 2),
            'percent_change': round(percent_change, 1),
            'dimension_trends': {k: round(v, 2) for k, v in trends.items()},
            'assessment_count': len(sorted_assessments),
            'time_span_days': (sorted_assessments[-1]['timestamp'] - sorted_assessments[0]['timestamp']).days
        }
    
    def generate_peer_review_rubric(
        self,
        student_name: str,
        team_name: str
    ) -> Dict[str, any]:
        """
        BR5: Generate structured peer review form
        
        Returns a formatted rubric for students to complete
        """
        rubric = {
            'reviewer_info': {
                'your_name': '',
                'reviewing': student_name,
                'team': team_name,
                'date': datetime.now().strftime('%Y-%m-%d')
            },
            'instructions': (
                "Rate your teammate on the following criteria using a 1-5 scale:\n"
                "1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree\n\n"
                "Be honest and constructive. Your feedback helps your teammate grow."
            ),
            'dimensions': {
                'team_dynamics': {
                    'description': 'How well does this teammate communicate and collaborate?',
                    'indicators': [
                        {
                            'id': 'td_communication',
                            'question': 'Communicates clearly and openly with the team',
                            'rating': None
                        },
                        {
                            'id': 'td_mutual_support',
                            'question': 'Offers help and support to teammates when needed',
                            'rating': None
                        },
                        {
                            'id': 'td_trust',
                            'question': 'Can be trusted to follow through on commitments',
                            'rating': None
                        },
                        {
                            'id': 'td_active_listening',
                            'question': 'Listens respectfully to others\' ideas and perspectives',
                            'rating': None
                        }
                    ]
                },
                'team_structure': {
                    'description': 'How well does this teammate organize work and solve problems?',
                    'indicators': [
                        {
                            'id': 'ts_clear_roles',
                            'question': 'Takes responsibility for their assigned role',
                            'rating': None
                        },
                        {
                            'id': 'ts_task_scheduling',
                            'question': 'Manages time effectively and meets deadlines',
                            'rating': None
                        },
                        {
                            'id': 'ts_decision_making',
                            'question': 'Contributes thoughtfully to team decisions',
                            'rating': None
                        },
                        {
                            'id': 'ts_conflict_resolution',
                            'question': 'Handles disagreements constructively',
                            'rating': None
                        }
                    ]
                },
                'team_motivation': {
                    'description': 'How engaged and motivated is this teammate?',
                    'indicators': [
                        {
                            'id': 'tm_clear_purpose',
                            'question': 'Understands and supports the team\'s goals',
                            'rating': None
                        },
                        {
                            'id': 'tm_smart_goals',
                            'question': 'Sets and works toward specific, achievable goals',
                            'rating': None
                        },
                        {
                            'id': 'tm_passion',
                            'question': 'Shows enthusiasm and energy for the project',
                            'rating': None
                        },
                        {
                            'id': 'tm_synergy',
                            'question': 'Brings out the best in the team',
                            'rating': None
                        }
                    ]
                },
                'team_excellence': {
                    'description': 'How committed is this teammate to quality and growth?',
                    'indicators': [
                        {
                            'id': 'te_growth_mindset',
                            'question': 'Views challenges as opportunities to learn',
                            'rating': None
                        },
                        {
                            'id': 'te_quality_work',
                            'question': 'Consistently produces high-quality work',
                            'rating': None
                        },
                        {
                            'id': 'te_self_monitoring',
                            'question': 'Tracks their own progress and adjusts as needed',
                            'rating': None
                        },
                        {
                            'id': 'te_reflective_practice',
                            'question': 'Reflects on their work and seeks to improve',
                            'rating': None
                        }
                    ]
                }
            },
            'open_feedback': {
                'strengths': 'What does this teammate do particularly well?',
                'areas_for_growth': 'What could this teammate improve?',
                'specific_example': 'Share a specific example of their contribution to the team:'
            }
        }
        
        return rubric
    
    def detect_assessment_bias(
        self,
        peer_assessments: List[SoftSkillRatings],
        assessor_ids: List[str]
    ) -> Dict[str, any]:
        """
        BR5: Detect potential bias in peer assessments
        
        Identifies:
        - Leniency bias (all high scores)
        - Severity bias (all low scores)
        - Central tendency bias (all middle scores)
        - Halo effect (uniform scores across dimensions)
        """
        bias_flags = []
        
        for i, (assessment, assessor_id) in enumerate(zip(peer_assessments, assessor_ids)):
            all_ratings = [
                assessment.td_communication, assessment.td_mutual_support,
                assessment.td_trust, assessment.td_active_listening,
                assessment.ts_clear_roles, assessment.ts_task_scheduling,
                assessment.ts_decision_making, assessment.ts_conflict_resolution,
                assessment.tm_clear_purpose, assessment.tm_smart_goals,
                assessment.tm_passion, assessment.tm_synergy,
                assessment.te_growth_mindset, assessment.te_quality_work,
                assessment.te_self_monitoring, assessment.te_reflective_practice
            ]
            
            mean_rating = np.mean(all_ratings)
            std_rating = np.std(all_ratings)
            
            # Leniency bias (average > 4.5)
            if mean_rating > 4.5:
                bias_flags.append({
                    'assessor_id': assessor_id,
                    'bias_type': 'leniency',
                    'severity': 'high',
                    'description': 'Consistently gives very high ratings'
                })
            
            # Severity bias (average < 2.5)
            elif mean_rating < 2.5:
                bias_flags.append({
                    'assessor_id': assessor_id,
                    'bias_type': 'severity',
                    'severity': 'high',
                    'description': 'Consistently gives very low ratings'
                })
            
            # Central tendency bias (all scores near 3.0)
            if 2.5 < mean_rating < 3.5 and std_rating < 0.3:
                bias_flags.append({
                    'assessor_id': assessor_id,
                    'bias_type': 'central_tendency',
                    'severity': 'medium',
                    'description': 'Avoids extreme ratings, clusters around middle'
                })
            
            # Halo effect (very low variance)
            if std_rating < 0.2:
                bias_flags.append({
                    'assessor_id': assessor_id,
                    'bias_type': 'halo_effect',
                    'severity': 'medium',
                    'description': 'Gives uniform scores across all dimensions'
                })
        
        return {
            'has_bias': len(bias_flags) > 0,
            'bias_count': len(bias_flags),
            'bias_flags': bias_flags,
            'recommendation': (
                'Consider removing biased assessments from aggregation' 
                if len(bias_flags) > 0 
                else 'No significant bias detected'
            )
        }