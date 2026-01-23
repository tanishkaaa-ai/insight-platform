"""
AMEP Adaptive Practice Engine
Implements Zone of Proximal Development (ZPD) targeting and Cognitive Load Optimization

Solves: BR2 (Adaptive Practice Delivery), BR3 (Efficiency of Practice)

Research Source: Paper 6.pdf - Algorithm 1
"""

import numpy as np
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

# ============================================================================
# COGNITIVE LOAD MANAGEMENT (BR2)
# ============================================================================

@dataclass
class CognitiveLoadConfig:
    """
    Cognitive Load Parameters from Paper 6.pdf - Equation 5
    
    L(t) = Σ λi · Di · (1 - ki(t))
    
    Where:
    - λi = weight/importance of topic i
    - Di = difficulty level of topic i
    - ki(t) = student's proficiency in topic i
    """
    optimal_load: float = 0.65  # Optimal cognitive load threshold (0-1)
    min_load: float = 0.4       # Minimum load (below = too easy)
    max_load: float = 0.85      # Maximum load (above = overwhelming)

class DifficultyLevel(Enum):
    BASIC = 0.3
    INTERMEDIATE = 0.5
    ADVANCED = 0.7
    EXPERT = 0.9

@dataclass
class ContentItem:
    """Represents a practice question or learning activity"""
    item_id: str
    concept_id: str
    difficulty: float  # 0.0 to 1.0
    weight: float = 1.0  # Importance/priority
    estimated_time: int = 5  # Minutes
    scaffolding_available: bool = True
    prerequisites: List[str] = None
    question: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None

    def __post_init__(self):
        if self.prerequisites is None:
            self.prerequisites = []

class AdaptivePracticeEngine:
    """
    Adaptive Learning with Feedback Loops
    
    Algorithm from Paper 6.pdf - Algorithm 1:
    1. Present content at appropriate difficulty
    2. Record response and response time
    3. Update knowledge state
    4. Adjust content difficulty dynamically
    """
    
    def __init__(self, config: CognitiveLoadConfig = CognitiveLoadConfig()):
        self.config = config
        self.beta1 = 0.9  # Exponential decay for knowledge state
        self.gamma = 0.1  # Scaling factor for difficulty adjustment
        self.alpha = 0.01  # Learning rate
        
    def calculate_cognitive_load(
        self,
        content_items: List[ContentItem],
        student_mastery: Dict[str, float]
    ) -> float:
        """
        Calculate current cognitive load from Paper 6.pdf - Equation 5
        
        L(t) = Σ λi · Di · (1 - ki(t))
        
        Returns: Cognitive load value (0-1)
        """
        total_load = 0.0
        
        for item in content_items:
            # Get student proficiency for this concept (0-1 scale)
            ki = student_mastery.get(item.concept_id, 0.3) / 100.0
            
            # L(t) contribution from this item
            load_contribution = item.weight * item.difficulty * (1 - ki)
            total_load += load_contribution
        
        # Normalize by number of items
        return total_load / len(content_items) if content_items else 0.0
    
    def select_next_content(
        self,
        available_content: List[ContentItem],
        student_mastery: Dict[str, float],
        learning_velocity: Dict[str, float],
        session_time_remaining: int = 30
    ) -> List[ContentItem]:
        """
        BR2: Select content that keeps student in Zone of Proximal Development
        BR3: Skip mastered content, focus on gaps
        
        Algorithm from Paper 6.pdf - Steps 5-7
        """
        selected_items = []
        current_time = 0
        
        # Filter based on BR3 efficiency rules
        filtered_content = self._filter_by_mastery(
            available_content, 
            student_mastery
        )
        
        # Sort by priority (ZPD targeting)
        prioritized = self._prioritize_by_zpd(
            filtered_content,
            student_mastery,
            learning_velocity
        )
        
        # Select items while maintaining optimal cognitive load
        for item in prioritized:
            if current_time + item.estimated_time > session_time_remaining:
                break
            
            # Calculate projected cognitive load
            projected_items = selected_items + [item]
            projected_load = self.calculate_cognitive_load(
                projected_items,
                student_mastery
            )
            
            # Check if load is within optimal range
            if projected_load <= self.config.max_load:
                selected_items.append(item)
                current_time += item.estimated_time
            else:
                # Try with scaffolding to reduce difficulty
                if item.scaffolding_available:
                    scaffolded = ContentItem(
                        item_id=item.item_id + "_scaffolded",
                        concept_id=item.concept_id,
                        difficulty=item.difficulty * 0.7,  # Reduce difficulty
                        weight=item.weight,
                        estimated_time=item.estimated_time + 2,  # Scaffolding takes time
                        scaffolding_available=False
                    )
                    projected_items = selected_items + [scaffolded]
                    projected_load = self.calculate_cognitive_load(
                        projected_items,
                        student_mastery
                    )
                    
                    if projected_load <= self.config.max_load:
                        selected_items.append(scaffolded)
                        current_time += scaffolded.estimated_time
        
        return selected_items
    
    def _filter_by_mastery(
        self,
        content: List[ContentItem],
        student_mastery: Dict[str, float]
    ) -> List[ContentItem]:
        """
        BR3: Efficiency Optimization
        
        From Paper 4.pdf Results:
        - IF mastery > 85%: Skip (already mastered)
        - ELIF mastery > 60%: Light review (1-2 questions)
        - ELSE: Focused practice (5-10 questions)
        """
        filtered = []
        concept_counts = {}  # Track how many items per concept
        
        for item in content:
            mastery = student_mastery.get(item.concept_id, 30.0)
            
            if mastery >= 85.0:
                # SKIP - Already mastered
                continue
            elif mastery >= 60.0:
                # LIGHT REVIEW - Limit to 2 questions per concept
                count = concept_counts.get(item.concept_id, 0)
                if count < 2:
                    filtered.append(item)
                    concept_counts[item.concept_id] = count + 1
            else:
                # FOCUSED PRACTICE - Allow up to 10 questions
                count = concept_counts.get(item.concept_id, 0)
                if count < 10:
                    filtered.append(item)
                    concept_counts[item.concept_id] = count + 1
        
        return filtered
    
    def _prioritize_by_zpd(
        self,
        content: List[ContentItem],
        student_mastery: Dict[str, float],
        learning_velocity: Dict[str, float]
    ) -> List[ContentItem]:
        """
        BR2: Zone of Proximal Development Targeting
        
        Prioritize content that is:
        1. Slightly above current competency (challenge)
        2. Not too far above (frustration)
        3. Aligned with learning trajectory
        """
        scored_content = []
        
        for item in content:
            mastery = student_mastery.get(item.concept_id, 30.0) / 100.0
            velocity = learning_velocity.get(item.concept_id, 0.0)
            
            # Calculate ZPD score
            # Ideal: difficulty slightly above mastery
            zpd_distance = item.difficulty - mastery
            
            if 0.1 <= zpd_distance <= 0.3:
                # Sweet spot: challenging but achievable
                zpd_score = 1.0
            elif 0.0 <= zpd_distance < 0.1:
                # Too easy: still beneficial but lower priority
                zpd_score = 0.6
            elif 0.3 < zpd_distance <= 0.5:
                # Challenging: needs scaffolding
                zpd_score = 0.7 if item.scaffolding_available else 0.3
            else:
                # Too difficult or too easy
                zpd_score = 0.2
            
            # Boost score for concepts with positive learning velocity
            if velocity > 0:
                zpd_score *= 1.2
            
            # Prioritize prerequisite completion
            prereq_mastery = [
                student_mastery.get(prereq, 0.0) 
                for prereq in item.prerequisites
            ]
            if prereq_mastery and min(prereq_mastery) < 60.0:
                zpd_score *= 0.5  # Deprioritize if prerequisites not met
            
            scored_content.append((zpd_score, item))
        
        # Sort by ZPD score (highest first)
        scored_content.sort(key=lambda x: x[0], reverse=True)
        
        return [item for score, item in scored_content]
    
    def adjust_difficulty(
        self,
        current_difficulty: float,
        mastery_score: float,
        response_time: float,
        target_time: float = 15.0
    ) -> float:
        """
        Dynamic Difficulty Adjustment from Paper 6.pdf - Step 7
        
        Dt+1 = Dt + γ·(K̂t - 0.5)
        
        If mastery > 0.5, increase difficulty (stay in ZPD)
        If mastery < 0.5, decrease difficulty
        """
        mastery_normalized = mastery_score / 100.0
        
        # Difficulty adjustment based on mastery
        mastery_adjustment = self.gamma * (mastery_normalized - 0.5)
        
        # Additional adjustment based on response time
        # Faster than target = can handle more difficulty
        time_adjustment = self.gamma * 0.5 * (1 - response_time / target_time)
        
        new_difficulty = current_difficulty + mastery_adjustment + time_adjustment
        
        # Clamp to valid range
        return max(0.1, min(1.0, new_difficulty))
    
    def generate_practice_session(
        self,
        student_id: str,
        student_mastery: Dict[str, float],
        learning_velocity: Dict[str, float],
        available_content: List[ContentItem],
        session_duration: int = 30
    ) -> Dict:
        """
        Generate a complete adaptive practice session
        
        Returns BR2-compliant session plan
        """
        selected_content = self.select_next_content(
            available_content,
            student_mastery,
            learning_velocity,
            session_duration
        )
        
        cognitive_load = self.calculate_cognitive_load(
            selected_content,
            student_mastery
        )
        
        # Generate session summary
        concept_coverage = {}
        for item in selected_content:
            if item.concept_id not in concept_coverage:
                concept_coverage[item.concept_id] = {
                    'count': 0,
                    'avg_difficulty': 0.0,
                    'mastery': student_mastery.get(item.concept_id, 30.0)
                }
            concept_coverage[item.concept_id]['count'] += 1
            concept_coverage[item.concept_id]['avg_difficulty'] += item.difficulty
        
        for concept_id in concept_coverage:
            count = concept_coverage[concept_id]['count']
            concept_coverage[concept_id]['avg_difficulty'] /= count
        
        return {
            'session_id': f"{student_id}_{np.random.randint(10000)}",
            'student_id': student_id,
            'content_items': [
                {
                    'item_id': item.item_id,
                    'concept_id': item.concept_id,
                    'difficulty': item.difficulty,
                    'estimated_time': item.estimated_time,
                    'question': item.question,
                    'options': item.options,
                    'correct_answer': item.correct_answer,
                    'explanation': item.explanation
                }
                for item in selected_content
            ],
            'total_items': len(selected_content),
            'estimated_duration': sum(item.estimated_time for item in selected_content),
            'cognitive_load': round(cognitive_load, 3),
            'load_status': self._get_load_status(cognitive_load),
            'concepts_covered': concept_coverage,
            'zpd_alignment': 'Optimal' if self.config.min_load <= cognitive_load <= self.config.max_load else 'Needs Adjustment'
        }
    
    def _get_load_status(self, cognitive_load: float) -> str:
        """Interpret cognitive load level"""
        if cognitive_load < self.config.min_load:
            return "TOO_EASY - Increase challenge"
        elif cognitive_load > self.config.max_load:
            return "OVERWHELMING - Add scaffolding"
        else:
            return "OPTIMAL - Student in ZPD"

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Initialize engine
    adaptive_engine = AdaptivePracticeEngine()
    
    # Sample student state
    student_mastery = {
        'algebra_linear_equations': 45.0,  # Needs work
        'algebra_quadratic': 72.0,         # Light review
        'algebra_systems': 88.0,           # Mastered - skip
        'geometry_triangles': 35.0         # Needs focus
    }
    
    learning_velocity = {
        'algebra_linear_equations': 5.0,   # Improving
        'geometry_triangles': -2.0         # Struggling
    }
    
    # Sample content library
    available_content = [
        ContentItem('q1', 'algebra_linear_equations', 0.4, 1.0, 5),
        ContentItem('q2', 'algebra_linear_equations', 0.6, 1.0, 5),
        ContentItem('q3', 'algebra_quadratic', 0.7, 1.0, 6),
        ContentItem('q4', 'algebra_systems', 0.8, 1.0, 6),  # Should be skipped
        ContentItem('q5', 'geometry_triangles', 0.3, 1.5, 5),
        ContentItem('q6', 'geometry_triangles', 0.5, 1.5, 6),
    ]
    
    # Generate practice session
    session = adaptive_engine.generate_practice_session(
        student_id='student_001',
        student_mastery=student_mastery,
        learning_velocity=learning_velocity,
        available_content=available_content,
        session_duration=30
    )
    
    print("Adaptive Practice Session:")
    print(f"Total Items: {session['total_items']}")
    print(f"Duration: {session['estimated_duration']} minutes")
    print(f"Cognitive Load: {session['cognitive_load']} ({session['load_status']})")
    print(f"ZPD Alignment: {session['zpd_alignment']}")
    print(f"\nConcepts Covered:")
    for concept, data in session['concepts_covered'].items():
        print(f"  {concept}: {data['count']} items (mastery: {data['mastery']}%)")