import numpy as np
from typing import Dict, List
import logging
import os
import pickle

logger = logging.getLogger(__name__)

def calculate_mastery_score(student_id: int, response_data: Dict) -> float:
    """Optimized mastery calculation using hybrid approach.
    Returns score between 0-100
    """
    try:
        # Get student's learning history
        history = get_student_history(student_id)
        
        # Bayesian Knowledge Tracing (fast baseline)
        bkt_score = bayesian_knowledge_tracing(history, response_data)
        
        # Use DKT only if enough data points (>10 interactions)
        if len(history) > 10:
            dkt_score = deep_knowledge_tracing(history, response_data)
            # Weighted combination
            final_score = 0.7 * dkt_score + 0.3 * bkt_score
        else:
            final_score = bkt_score
        
        return min(100, max(0, final_score * 100))
    
    except Exception as e:
        logger.error(f"Mastery calculation failed for student {student_id}: {e}")
        return 50.0  # Default fallback

def bayesian_knowledge_tracing(history: List, current_response: Dict) -> float:
    """Fast BKT implementation"""
    # BKT parameters (can be learned from data)
    P_L0 = 0.1  # Initial knowledge
    P_T = 0.3   # Learning rate
    P_G = 0.2   # Guess probability
    P_S = 0.1   # Slip probability
    
    P_L = P_L0
    
    for response in history:
        correct = response.get('correct', False)  # Defensive check
        
        # Update probability of knowing
        if correct:
            P_L = (P_L * (1 - P_S)) / (P_L * (1 - P_S) + (1 - P_L) * P_G)
        else:
            P_L = (P_L * P_S) / (P_L * P_S + (1 - P_L) * (1 - P_G))
        
        # Learning transition
        P_L = P_L + (1 - P_L) * P_T
    
    return P_L

def deep_knowledge_tracing(history: List, current_response: Dict) -> float:
    """Simplified DKT using pre-trained weights"""
    # Use cached model weights for speed
    weights = load_cached_dkt_weights()
    
    # Feature extraction (simplified)
    features = extract_features(history, current_response)
    
    # Forward pass (simplified LSTM)
    hidden_state = np.tanh(np.dot(weights['input'], features))
    output = sigmoid(np.dot(weights['output'], hidden_state))
    
    return float(output)

def extract_features(history: List, current_response: Dict) -> np.ndarray:
    """Extract features for ML model"""
    features = []
    
    # Recent performance (last 5 responses)
    recent = history[-5:] if len(history) >= 5 else history
    accuracy = sum(r.get('correct', False) for r in recent) / len(recent) if recent else 0.5
    features.append(accuracy)
    
    # Response time pattern
    avg_time = np.mean([r.get('response_time', 30) for r in recent]) if recent else 30
    features.append(min(avg_time / 60, 1.0))  # Normalize to 0-1
    
    # Current response
    features.append(1.0 if current_response.get('correct', False) else 0.0)
    features.append(min(current_response.get('response_time', 30) / 60, 1.0))
    
    return np.array(features)

def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -500, 500)))

def load_cached_dkt_weights():
    """Load pre-computed model weights"""
    weights_path = os.getenv('DKT_WEIGHTS_PATH', 'models/dkt_weights.pkl')
    
    try:
        if os.path.exists(weights_path):
            data = np.load(weights_path)
            weights = {'input': data['input'], 'output': data['output']}
            logger.info(f"Loaded DKT weights from {weights_path}")
            return weights
        else:
            logger.warning(f"DKT weights not found at {weights_path}. Using fallback weights.")
            # Fixed fallback weights for consistency (replace with proper model in production)
            np.random.seed(42)
            return {
                'input': np.random.randn(4, 4) * 0.1,
                'output': np.random.randn(4) * 0.1
            }
    except Exception as e:
        logger.error(f"Failed to load DKT weights: {e}")
        # In production, consider failing fast here
        return {
            'input': np.random.randn(4, 4) * 0.1,
            'output': np.random.randn(4) * 0.1
        }

def get_student_history(student_id: int) -> List[Dict]:
    """Get student's response history from database"""
    from database import get_responses
    return get_responses(student_id, limit=50)  # Last 50 responses