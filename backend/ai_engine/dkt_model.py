"""
AMEP Deep Knowledge Tracing (DKT) Model
Production LSTM Implementation with PyTorch

Solves: BR1 (Personalized Concept Mastery) - Deep pattern recognition
Research Source: Paper 2105_15106v4.pdf - Section III-C-1

This module provides a production-ready LSTM neural network for knowledge tracing.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
import pickle
import os
from datetime import datetime

# Import PyTorch and NN modules
import torch
import torch.nn as nn
torch_available = True

# ============================================================================
# DEEP KNOWLEDGE TRACING LSTM MODEL
# ============================================================================

class DKTModel(nn.Module):
    """
    Deep Knowledge Tracing using LSTM Neural Networks

    Architecture from Paper 2105_15106v4.pdf:
    - Input Layer: Sequence of (exercise_id, correct/incorrect) tuples
    - Hidden Layer: LSTM cells with memory of learning history
    - Output Layer: Predicts mastery probability for all concepts

    Formula:
    h(t) = tanh(W_hs·x(t) + W_hh·h(t-1) + b_h)
    y(t) = σ(W_yh·h(t) + b_y)
    """

    def __init__(
        self,
        num_concepts: int,
        hidden_dim: int = 100,
        num_layers: int = 1,
        dropout: float = 0.2
    ):
        """
        Initialize DKT Model

        Args:
            num_concepts: Number of knowledge concepts/skills
            hidden_dim: Size of LSTM hidden state (default 100 from literature)
            num_layers: Number of LSTM layers
            dropout: Dropout rate to prevent overfitting
        """
        super(DKTModel, self).__init__()

        self.num_concepts = num_concepts
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        # Input size: num_concepts * 2 (concept_id + correct/incorrect)
        self.input_dim = num_concepts * 2

        # LSTM layer
        self.lstm = nn.LSTM(
            input_size=self.input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        # Dropout layer
        self.dropout = nn.Dropout(dropout)

        # Output layer: Predict mastery for each concept
        self.fc = nn.Linear(hidden_dim, num_concepts)

        # Sigmoid activation for probability output
        self.sigmoid = nn.Sigmoid()

    def forward(
        self,
        x: torch.Tensor,
        hidden: Optional[Tuple[torch.Tensor, torch.Tensor]] = None
    ) -> Tuple[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        """
        Forward pass through the network

        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_dim)
            hidden: Optional hidden state from previous sequence

        Returns:
            output: Predicted mastery probabilities (batch_size, sequence_length, num_concepts)
            hidden: Updated hidden state
        """
        # LSTM forward pass
        lstm_out, hidden = self.lstm(x, hidden)

        # Apply dropout
        lstm_out = self.dropout(lstm_out)

        # Fully connected layer
        output = self.fc(lstm_out)

        # Sigmoid activation for probabilities
        output = self.sigmoid(output)

        return output, hidden

    def init_hidden(self, batch_size: int) -> Tuple[torch.Tensor, torch.Tensor]:
        """Initialize hidden state"""
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_dim)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_dim)
        return (h0, c0)


# ============================================================================
# DKT TRAINING & INFERENCE ENGINE
# ============================================================================

class DKTEngine:
    """
    Production DKT Engine with training and inference capabilities
    """

    def __init__(
        self,
        num_concepts: int,
        hidden_dim: int = 100,
        learning_rate: float = 0.001,
        model_path: str = 'models/dkt_model.pt'
    ):
        """
        Initialize DKT Engine

        Args:
            num_concepts: Number of knowledge concepts
            hidden_dim: LSTM hidden dimension
            learning_rate: Optimizer learning rate
            model_path: Path to save/load model
        """
        self.num_concepts = num_concepts
        self.hidden_dim = hidden_dim
        self.model_path = model_path

        # Initialize model
        self.model = DKTModel(
            num_concepts=num_concepts,
            hidden_dim=hidden_dim
        )

        # Check for GPU
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

        # Optimizer and loss function
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        self.criterion = nn.BCELoss()  # Binary Cross Entropy for binary outcomes

        # Load model if exists
        if os.path.exists(model_path):
            self.load_model()

    def encode_interaction(
        self,
        concept_id: int,
        is_correct: bool
    ) -> np.ndarray:
        """
        Encode a single student-concept interaction

        Input encoding (one-hot):
        - First num_concepts dimensions: concept attempted
        - Next num_concepts dimensions: correctness (only if correct)

        Args:
            concept_id: Index of the concept (0 to num_concepts-1)
            is_correct: Whether the answer was correct

        Returns:
            Encoded vector of size (num_concepts * 2,)
        """
        encoded = np.zeros(self.num_concepts * 2)

        # Set concept bit
        encoded[concept_id] = 1

        # Set correctness bit if correct
        if is_correct:
            encoded[self.num_concepts + concept_id] = 1

        return encoded

    def prepare_sequence(
        self,
        interactions: List[Dict[str, any]]
    ) -> torch.Tensor:
        """
        Prepare sequence of interactions for model input

        Args:
            interactions: List of dicts with 'concept_id' and 'is_correct'

        Returns:
            Tensor of shape (1, sequence_length, input_dim)
        """
        sequence = []

        for interaction in interactions:
            encoded = self.encode_interaction(
                interaction['concept_id'],
                interaction['is_correct']
            )
            sequence.append(encoded)

        # Convert to tensor and add batch dimension
        sequence_tensor = torch.FloatTensor(sequence).unsqueeze(0)
        return sequence_tensor.to(self.device)

    def predict_mastery(
        self,
        interactions: List[Dict[str, any]],
        target_concept: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Predict mastery based on interaction history

        Args:
            interactions: List of past interactions
            target_concept: Specific concept to predict (None = all concepts)

        Returns:
            Dict with mastery predictions
        """
        if not interactions:
            # No history - return default predictions
            if target_concept is not None:
                return {
                    'mastery_score': 30.0,
                    'confidence': 0.1
                }
            else:
                return {
                    'mastery_scores': [30.0] * self.num_concepts,
                    'confidence': 0.1
                }

        self.model.eval()

        with torch.no_grad():
            # Prepare input sequence
            x = self.prepare_sequence(interactions)

            # Forward pass
            output, _ = self.model(x)

            # Get last prediction (most recent knowledge state)
            last_pred = output[0, -1, :].cpu().numpy()

            # Convert to 0-100 scale
            mastery_scores = (last_pred * 100).tolist()

            # Confidence based on sequence length
            confidence = min(1.0, len(interactions) / 20.0)

            if target_concept is not None:
                return {
                    'mastery_score': mastery_scores[target_concept],
                    'confidence': confidence,
                    'all_concepts': mastery_scores
                }
            else:
                return {
                    'mastery_scores': mastery_scores,
                    'confidence': confidence
                }

    def train_batch(
        self,
        sequences: List[List[Dict[str, any]]],
        targets: List[List[int]]
    ) -> float:
        """
        Train on a batch of student sequences

        Args:
            sequences: List of interaction sequences
            targets: List of target labels (next correct/incorrect)

        Returns:
            Batch loss
        """
        self.model.train()

        total_loss = 0.0

        for seq, target in zip(sequences, targets):
            # Prepare input and target
            x = self.prepare_sequence(seq[:-1])  # All but last

            # Forward pass
            output, _ = self.model(x)

            # Calculate loss on last step
            # Target: concept_id and correctness
            last_interaction = seq[-1]
            concept_id = last_interaction['concept_id']
            is_correct = float(last_interaction['is_correct'])

            pred_prob = output[0, -1, concept_id]
            target_tensor = torch.FloatTensor([is_correct]).to(self.device)

            loss = self.criterion(pred_prob.unsqueeze(0), target_tensor)

            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()

        return total_loss / len(sequences)

    def save_model(self):
        """Save model to disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)

        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'num_concepts': self.num_concepts,
            'hidden_dim': self.hidden_dim
        }, self.model_path)

        print(f"Model saved to {self.model_path}")

    def load_model(self):
        """Load model from disk"""
        if not os.path.exists(self.model_path):
            print(f"No model found at {self.model_path}")
            return

        checkpoint = torch.load(self.model_path, map_location=self.device)

        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

        print(f"Model loaded from {self.model_path}")


# ============================================================================
# SIMPLIFIED DKT FOR PRODUCTION USE (NO TRAINING REQUIRED)
# ============================================================================

class SimplifiedDKTEngine:
    """
    Simplified DKT using pattern analysis instead of full LSTM training

    This is used when we don't have enough training data yet.
    It approximates DKT behavior using statistical pattern recognition.
    """

    def __init__(self, sequence_length: int = 10):
        self.sequence_length = sequence_length
        self.history_weight = 0.7
        self.trend_weight = 0.3

    def analyze_pattern(
        self,
        response_history: List[Dict[str, any]]
    ) -> Dict[str, float]:
        """
        Analyze response patterns to predict mastery

        This approximates LSTM behavior without requiring training data

        Returns: {
            'predicted_mastery': float,
            'confidence': float,
            'learning_velocity': float
        }
        """
        if not response_history:
            return {
                'predicted_mastery': 30.0,
                'confidence': 0.3,
                'learning_velocity': 0.0
            }

        # Extract recent sequence
        recent = response_history[-self.sequence_length:]

        # Calculate accuracy trend
        accuracies = [float(r.get('is_correct', False)) for r in recent]
        overall_accuracy = np.mean(accuracies) * 100

        # Calculate learning velocity (improvement rate)
        if len(accuracies) >= 4:
            first_half = np.mean(accuracies[:len(accuracies)//2])
            second_half = np.mean(accuracies[len(accuracies)//2:])
            velocity = (second_half - first_half) * 100
        else:
            velocity = 0.0

        # Calculate response time patterns (faster = more mastery)
        if all('response_time' in r for r in recent):
            times = [r['response_time'] for r in recent]
            avg_time = np.mean(times)

            # Detect time improvement (getting faster)
            if len(times) >= 2:
                time_velocity = -np.polyfit(range(len(times)), times, 1)[0]
            else:
                time_velocity = 0

            # Normalize: faster responses = higher mastery bonus
            time_factor = max(0, min(20, 20 - avg_time/2 + time_velocity * 2))
        else:
            time_factor = 0

        # Combine factors (approximating LSTM hidden state)
        predicted_mastery = min(100, max(0, (
            overall_accuracy * self.history_weight +
            (50 + velocity * 2) * self.trend_weight +
            time_factor
        )))

        # Confidence based on data volume
        confidence = min(1.0, len(recent) / self.sequence_length)

        return {
            'predicted_mastery': predicted_mastery,
            'confidence': confidence,
            'learning_velocity': velocity
        }


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("AMEP Deep Knowledge Tracing (DKT) Demo")
    print("=" * 60)

    # Example 1: Using Simplified DKT (no training required)
    print("\n1. Simplified DKT (Pattern-based)")
    print("-" * 60)

    simplified_dkt = SimplifiedDKTEngine()

    sample_history = [
        {'is_correct': False, 'response_time': 25.0},
        {'is_correct': False, 'response_time': 22.0},
        {'is_correct': True, 'response_time': 18.0},
        {'is_correct': True, 'response_time': 15.0},
        {'is_correct': True, 'response_time': 12.0},
        {'is_correct': True, 'response_time': 10.0},
    ]

    result = simplified_dkt.analyze_pattern(sample_history)

    print(f"Predicted Mastery: {result['predicted_mastery']:.2f}/100")
    print(f"Confidence: {result['confidence']:.2f}")
    print(f"Learning Velocity: {result['learning_velocity']:.2f}")
    print(f"Interpretation: Student showing improvement trajectory")

    # Example 2: Full DKT Model (requires training)
    print("\n2. Full LSTM-based DKT Model")
    print("-" * 60)

    num_concepts = 10
    dkt_engine = DKTEngine(num_concepts=num_concepts)

    # Sample interaction history
    interactions = [
        {'concept_id': 0, 'is_correct': False},
        {'concept_id': 0, 'is_correct': True},
        {'concept_id': 1, 'is_correct': True},
        {'concept_id': 0, 'is_correct': True},
        {'concept_id': 2, 'is_correct': False},
    ]

    # Predict mastery
    prediction = dkt_engine.predict_mastery(interactions, target_concept=0)

    print(f"Concept 0 Mastery: {prediction['mastery_score']:.2f}/100")
    print(f"Confidence: {prediction['confidence']:.2f}")
    print(f"\nNote: Model not trained yet - using initial weights")
    print(f"In production, train on historical student data for better accuracy")

    print("\n" + "=" * 60)
    print("DKT Ready for Production Use!")
    print("=" * 60)
