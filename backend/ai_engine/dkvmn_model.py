"""
AMEP Dynamic Key-Value Memory Networks (DKVMN) Model
Memory-Augmented Neural Network for Knowledge Tracing

Solves: BR3 (Efficiency) - Tracks which concepts are mastered vs. need work
Research Source: Paper 2105_15106v4.pdf - Section III-C-2

DKVMN uses two matrices:
- Key Matrix (M_k): Static representations of knowledge concepts
- Value Matrix (M_v): Dynamic mastery states that update over time
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
import os

# Import PyTorch and NN modules
import torch
import torch.nn as nn
import torch.nn.functional as F
torch_available = True

# ============================================================================
from typing import List, Dict, Tuple, Optional
import os

# ============================================================================
# DKVMN PYTORCH MODEL
# ============================================================================

class DKVMNModel(nn.Module):
    """
    Dynamic Key-Value Memory Network

    From Paper 2105_15106v4.pdf - Equation 10:
    w(t) = Softmax(k(t)·M_k)  -- Correlation weight
    r(t) = Σ w(t,i)·M_v(i)    -- Read operation
    erase(t) = σ(W_e·v(t) + b_e)
    M_v(t,i) = M_v(t-1,i)[1 - w(t,i)·erase(t)] + w(t,i)·add(t)
    """

    def __init__(
        self,
        num_concepts: int,
        key_memory_size: int = 50,
        value_memory_size: int = 100,
        summary_vector_size: int = 50
    ):
        """
        Initialize DKVMN Model

        Args:
            num_concepts: Number of knowledge concepts/skills
            key_memory_size: Size of static key memory matrix
            value_memory_size: Size of dynamic value memory matrix
            summary_vector_size: Size of concept embedding
        """
        super(DKVMNModel, self).__init__()

        self.num_concepts = num_concepts
        self.key_memory_size = key_memory_size
        self.value_memory_size = value_memory_size
        self.summary_vector_size = summary_vector_size

        # Key Memory Matrix (M_k) - Static concept representations
        self.key_memory = nn.Parameter(
            torch.randn(key_memory_size, value_memory_size)
        )
        nn.init.kaiming_normal_(self.key_memory)

        # Concept embedding layer
        self.concept_embed = nn.Embedding(num_concepts, summary_vector_size)

        # Value Memory initialization (will be dynamic per student)
        self.init_value_memory = nn.Parameter(
            torch.randn(key_memory_size, value_memory_size)
        )
        nn.init.kaiming_normal_(self.init_value_memory)

        # Query transformation for concept correlation
        self.query_layer = nn.Linear(
            summary_vector_size,
            value_memory_size
        )

        # Erase gate
        self.erase_layer = nn.Linear(
            value_memory_size,
            value_memory_size
        )

        # Add gate
        self.add_layer = nn.Linear(
            value_memory_size,
            value_memory_size
        )

        # Summary layer for final prediction
        self.summary_layer = nn.Linear(
            value_memory_size + summary_vector_size,
            summary_vector_size
        )

        # Output layer
        self.output_layer = nn.Linear(summary_vector_size, 1)

    def compute_correlation_weight(
        self,
        query: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute correlation weight between query and key memory

        w(t) = Softmax(k(t)·M_k)

        Args:
            query: Query vector (batch_size, value_memory_size)

        Returns:
            Correlation weights (batch_size, key_memory_size)
        """
        # Compute similarity between query and each key
        correlation = torch.matmul(query, self.key_memory.t())

        # Softmax to get attention weights
        weights = F.softmax(correlation, dim=-1)

        return weights

    def read_memory(
        self,
        value_memory: torch.Tensor,
        weights: torch.Tensor
    ) -> torch.Tensor:
        """
        Read from value memory using correlation weights

        r(t) = Σ w(t,i)·M_v(i)

        Args:
            value_memory: Current value memory (batch_size, key_memory_size, value_memory_size)
            weights: Correlation weights (batch_size, key_memory_size)

        Returns:
            Read vector (batch_size, value_memory_size)
        """
        # Weighted sum of value memory
        read_content = torch.matmul(
            weights.unsqueeze(1),
            value_memory
        ).squeeze(1)

        return read_content

    def write_memory(
        self,
        value_memory: torch.Tensor,
        weights: torch.Tensor,
        erase_vector: torch.Tensor,
        add_vector: torch.Tensor
    ) -> torch.Tensor:
        """
        Write to value memory with erase-then-add mechanism

        M_v(t,i) = M_v(t-1,i)[1 - w(t,i)·erase(t)] + w(t,i)·add(t)

        Args:
            value_memory: Current value memory
            weights: Correlation weights
            erase_vector: What to erase
            add_vector: What to add

        Returns:
            Updated value memory
        """
        batch_size = weights.size(0)

        # Reshape for broadcasting
        erase_expand = erase_vector.unsqueeze(1)  # (batch, 1, value_size)
        add_expand = add_vector.unsqueeze(1)      # (batch, 1, value_size)
        weights_expand = weights.unsqueeze(-1)    # (batch, key_size, 1)

        # Erase operation
        erase_signal = weights_expand * erase_expand
        value_memory = value_memory * (1 - erase_signal)

        # Add operation
        add_signal = weights_expand * add_expand
        value_memory = value_memory + add_signal

        return value_memory

    def forward(
        self,
        concept_ids: torch.Tensor,
        correctness: torch.Tensor,
        value_memory: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass through DKVMN

        Args:
            concept_ids: Concept indices (batch_size, seq_len)
            correctness: Correct/incorrect (batch_size, seq_len)
            value_memory: Initial value memory (optional)

        Returns:
            predictions: Mastery predictions (batch_size, seq_len)
            value_memory: Updated value memory
        """
        batch_size, seq_len = concept_ids.size()

        # Initialize value memory if not provided
        if value_memory is None:
            value_memory = self.init_value_memory.unsqueeze(0).repeat(
                batch_size, 1, 1
            )

        predictions = []

        for t in range(seq_len):
            # Get current concept
            concept_id = concept_ids[:, t]
            is_correct = correctness[:, t].unsqueeze(-1)

            # Embed concept
            concept_embedded = self.concept_embed(concept_id)

            # Transform to query
            query = self.query_layer(concept_embedded)

            # Compute correlation weights
            weights = self.compute_correlation_weight(query)

            # Read from memory
            read_content = self.read_memory(value_memory, weights)

            # Concatenate read content with concept embedding
            combined = torch.cat([read_content, concept_embedded], dim=-1)

            # Generate summary
            summary = torch.tanh(self.summary_layer(combined))

            # Predict mastery
            pred = torch.sigmoid(self.output_layer(summary))
            predictions.append(pred)

            # Prepare for memory update
            # Combine correctness with read content for context
            update_input = read_content * is_correct

            # Compute erase and add vectors
            erase_vector = torch.sigmoid(self.erase_layer(update_input))
            add_vector = torch.tanh(self.add_layer(update_input))

            # Update value memory
            value_memory = self.write_memory(
                value_memory,
                weights,
                erase_vector,
                add_vector
            )

        # Stack predictions
        predictions = torch.cat(predictions, dim=1)

        return predictions, value_memory


# ============================================================================
# DKVMN ENGINE FOR PRODUCTION USE
# ============================================================================

class DKVMNEngine:
    """
    Production DKVMN Engine with training and inference
    """

    def __init__(
        self,
        num_concepts: int,
        key_memory_size: int = 50,
        learning_rate: float = 0.001,
        model_path: str = 'models/dkvmn_model.pt'
    ):
        """
        Initialize DKVMN Engine

        Args:
            num_concepts: Number of knowledge concepts
            key_memory_size: Size of key memory
            learning_rate: Optimizer learning rate
            model_path: Path to save/load model
        """
        self.num_concepts = num_concepts
        self.key_memory_size = key_memory_size
        self.model_path = model_path

        # Initialize model
        self.model = DKVMNModel(
            num_concepts=num_concepts,
            key_memory_size=key_memory_size
        )

        # Device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

        # Optimizer
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        self.criterion = nn.BCELoss()

        # Load model if exists
        if os.path.exists(model_path):
            self.load_model()

    def predict_mastery(
        self,
        interactions: List[Dict[str, any]],
        target_concept: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Predict mastery using DKVMN

        Args:
            interactions: List of past interactions
            target_concept: Specific concept to predict

        Returns:
            Dict with mastery predictions
        """
        if not interactions:
            return {
                'mastery_score': 30.0,
                'confidence': 0.1
            }

        self.model.eval()

        with torch.no_grad():
            # Prepare data
            concept_ids = torch.LongTensor([
                int(i['concept_id']) for i in interactions
            ]).unsqueeze(0).to(self.device)

            correctness = torch.FloatTensor([
                float(i['is_correct']) for i in interactions
            ]).unsqueeze(0).to(self.device)

            # Forward pass
            predictions, value_memory = self.model(concept_ids, correctness)

            # Get last prediction
            last_pred = predictions[0, -1].item()

            # Convert to 0-100 scale
            mastery_score = last_pred * 100

            # Confidence based on sequence length
            confidence = min(1.0, len(interactions) / 20.0)

            return {
                'mastery_score': mastery_score,
                'confidence': confidence,
                'value_memory_state': value_memory.cpu().numpy()
            }

    def get_memory_state(
        self,
        interactions: List[Dict[str, any]]
    ) -> np.ndarray:
        """
        Get current value memory state

        This shows which concepts are mastered vs. need work (BR3)
        """
        if not interactions:
            return self.model.init_value_memory.detach().cpu().numpy()

        self.model.eval()

        with torch.no_grad():
            concept_ids = torch.LongTensor([
                int(i['concept_id']) for i in interactions
            ]).unsqueeze(0).to(self.device)

            correctness = torch.FloatTensor([
                float(i['is_correct']) for i in interactions
            ]).unsqueeze(0).to(self.device)

            _, value_memory = self.model(concept_ids, correctness)

            return value_memory[0].cpu().numpy()

    def save_model(self):
        """Save model to disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)

        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'num_concepts': self.num_concepts,
            'key_memory_size': self.key_memory_size
        }, self.model_path)

        print(f"DKVMN model saved to {self.model_path}")

    def load_model(self):
        """Load model from disk"""
        if not os.path.exists(self.model_path):
            print(f"No DKVMN model found at {self.model_path}")
            return

        checkpoint = torch.load(self.model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

        print(f"DKVMN model loaded from {self.model_path}")


# ============================================================================
# SIMPLIFIED DKVMN (NO TRAINING REQUIRED)
# ============================================================================

class SimplifiedDKVMNEngine:
    """
    Simplified DKVMN using dictionary-based memory

    This is used when we don't have enough training data yet.
    Approximates DKVMN behavior without neural network training.
    """

    def __init__(self, memory_size: int = 50, forgetting_rate: float = 0.05):
        self.memory_size = memory_size
        self.forgetting_rate = forgetting_rate

        # Key memory: Concept relationships
        self.key_memory = {}

        # Value memory: Mastery states
        self.value_memory = {}

        # Last access time for forgetting
        self.last_access = {}

    def read_mastery(
        self,
        concept_id: str,
        related_concepts: List[str]
    ) -> float:
        """
        Read mastery considering related concepts (BR3)

        Args:
            concept_id: Target concept
            related_concepts: Related concepts that influence mastery

        Returns:
            Estimated mastery score
        """
        if concept_id not in self.value_memory:
            return 30.0  # Default initial mastery

        # Apply forgetting if concept hasn't been accessed recently
        mastery = self._apply_forgetting(concept_id)

        # Weighted contribution from related concepts
        if related_concepts:
            related_mastery = []
            for rel_concept in related_concepts:
                if rel_concept in self.value_memory:
                    weight = self._calculate_correlation(concept_id, rel_concept)
                    related_contribution = self.value_memory[rel_concept] * weight
                    related_mastery.append(related_contribution)

            if related_mastery:
                # Combine direct and related mastery
                return 0.7 * mastery + 0.3 * np.mean(related_mastery)

        return mastery

    def write_mastery(
        self,
        concept_id: str,
        mastery_update: float,
        related_concepts: List[str],
        timestamp: Optional[int] = None
    ):
        """
        Update mastery and propagate to related concepts

        Implements erase-then-add mechanism conceptually:
        - Erase: Reduce old mastery estimate
        - Add: Incorporate new evidence
        """
        if concept_id not in self.value_memory:
            self.value_memory[concept_id] = 30.0

        # Erase-then-add mechanism
        erase_factor = 0.3  # How much to forget old estimate
        current = self.value_memory[concept_id]

        # Update: blend old and new
        self.value_memory[concept_id] = (
            current * (1 - erase_factor) +
            mastery_update * erase_factor
        )

        # Store timestamp for forgetting
        if timestamp is None:
            timestamp = 0
        self.last_access[concept_id] = timestamp

        # Store relationship keys
        for rel_concept in related_concepts:
            key = f"{concept_id}_{rel_concept}"
            if key not in self.key_memory:
                self.key_memory[key] = 0.5  # Default correlation

    def _apply_forgetting(self, concept_id: str) -> float:
        """
        Apply exponential forgetting based on time since last access

        Mastery decays over time if not practiced
        """
        if concept_id not in self.value_memory:
            return 30.0

        mastery = self.value_memory[concept_id]

        # Simple forgetting: reduce mastery over time
        # In production, use actual timestamps
        decay = 1.0 - self.forgetting_rate

        return mastery * decay

    def _calculate_correlation(self, concept_a: str, concept_b: str) -> float:
        """Calculate correlation weight between concepts"""
        key = f"{concept_a}_{concept_b}"
        return self.key_memory.get(key, 0.3)

    def get_mastered_concepts(self, threshold: float = 85.0) -> List[str]:
        """
        BR3: Identify mastered concepts to skip

        Returns list of concepts that don't need practice
        """
        mastered = []

        for concept, mastery in self.value_memory.items():
            # Apply forgetting before checking
            adjusted_mastery = self._apply_forgetting(concept)

            if adjusted_mastery >= threshold:
                mastered.append(concept)

        return mastered

    def get_weak_concepts(self, threshold: float = 60.0) -> List[Tuple[str, float]]:
        """
        BR3: Identify weak concepts needing focus

        Returns list of (concept, mastery) tuples sorted by priority
        """
        weak = []

        for concept, mastery in self.value_memory.items():
            adjusted_mastery = self._apply_forgetting(concept)

            if adjusted_mastery < threshold:
                weak.append((concept, adjusted_mastery))

        # Sort by mastery (lowest first = highest priority)
        weak.sort(key=lambda x: x[1])

        return weak

    def get_concept_relationships(self, concept_id: str) -> Dict[str, float]:
        """
        Get all concepts related to the given concept with correlation weights
        """
        relationships = {}

        for key, weight in self.key_memory.items():
            if concept_id in key:
                # Extract the other concept
                concepts = key.split('_')
                other = [c for c in concepts if c != concept_id]

                if other:
                    relationships[other[0]] = weight

        return relationships


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("AMEP DKVMN (Dynamic Key-Value Memory Networks) Demo")
    print("=" * 60)

    # Simplified DKVMN (no training required)
    print("\nSimplified DKVMN - Memory-Based Knowledge Tracking")
    print("-" * 60)

    dkvmn = SimplifiedDKVMNEngine()

    # Simulate learning progression
    concepts = {
        'algebra_variables': 45.0,
        'algebra_equations': 72.0,
        'algebra_systems': 88.0,
        'geometry_triangles': 35.0
    }

    # Store initial mastery
    for concept, mastery in concepts.items():
        dkvmn.write_mastery(
            concept,
            mastery,
            related_concepts=['algebra_variables'] if 'algebra' in concept else []
        )

    # Read mastery with related concepts
    mastery = dkvmn.read_mastery(
        'algebra_equations',
        related_concepts=['algebra_variables', 'algebra_systems']
    )

    print(f"Algebra Equations Mastery: {mastery:.2f}/100")
    print(f"(Influenced by related concepts: variables, systems)")

    # Identify what to skip (BR3)
    mastered = dkvmn.get_mastered_concepts(threshold=85.0)
    print(f"\nMastered Concepts (skip these): {mastered}")

    # Identify what needs work (BR3)
    weak = dkvmn.get_weak_concepts(threshold=60.0)
    print(f"\nWeak Concepts (focus here):")
    for concept, score in weak:
        print(f"  - {concept}: {score:.2f}/100")

    print("\n" + "=" * 60)
    print("DKVMN Ready - Efficiently Tracks Mastery & Gaps (BR3)")
    print("=" * 60)
