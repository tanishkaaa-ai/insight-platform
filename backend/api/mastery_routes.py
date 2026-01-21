"""
AMEP Mastery Routes - MongoDB Version
API endpoints for BR1, BR2, BR3 (Mastery tracking and adaptive practice)

Location: backend/api/mastery_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId

# Import MongoDB helper functions
from models.database import (
    db,
    STUDENT_CONCEPT_MASTERY,
    STUDENT_RESPONSES,
    CONCEPTS,
    find_one,
    find_many,
    insert_one,
    update_one,
    aggregate
)

# Import schemas
from models.schemas import (
    MasteryCalculationRequest,
    MasteryCalculationResponse,
    PracticeSessionRequest,
    PracticeSessionResponse,
    StudentResponseCreate
)

# Import AI engines
from ai_engine.knowledge_tracing import HybridKnowledgeTracing
from ai_engine.adaptive_practice import AdaptivePracticeEngine

# Import logging
from utils.logger import get_logger

# Create blueprint
mastery_bp = Blueprint('mastery', __name__)

# Initialize logger
logger = get_logger(__name__)

# Initialize engines
logger.info("Initializing Mastery Engines: HybridKnowledgeTracing and AdaptivePracticeEngine")
kt_engine = HybridKnowledgeTracing()
adaptive_engine = AdaptivePracticeEngine()

# ============================================================================
# MASTERY CALCULATION ROUTES (BR1)
# ============================================================================

@mastery_bp.route('/calculate', methods=['POST'])
def calculate_mastery():
    """
    BR1: Calculate student mastery score for a concept

    POST /api/mastery/calculate
    """
    try:
        logger.info(f"Mastery calculation request | student_id: {request.json.get('student_id')} | concept_id: {request.json.get('concept_id')}")
        # Validate request data using Pydantic
        data = MasteryCalculationRequest(**request.json)
        
        # Call the knowledge tracing engine
        logger.info(f"Calling KT engine | student_id: {data.student_id} | concept_id: {data.concept_id} | is_correct: {data.is_correct}")
        result = kt_engine.calculate_mastery(
            student_id=data.student_id,
            concept_id=data.concept_id,
            is_correct=data.is_correct,
            response_time=data.response_time,
            current_mastery=data.current_mastery,
            response_history=data.response_history,
            related_concepts=data.related_concepts
        )
        logger.info(f"Mastery calculated | student_id: {data.student_id} | concept_id: {data.concept_id} | score: {result['mastery_score']}")
        
        # Add timestamp
        result['timestamp'] = datetime.utcnow()
        
        # Save to MongoDB
        mastery_doc = {
            '_id': f"{data.student_id}_{data.concept_id}",
            'student_id': data.student_id,
            'concept_id': data.concept_id,
            'mastery_score': result['mastery_score'],
            'bkt_component': result['bkt_component'],
            'dkt_component': result['dkt_component'],
            'dkvmn_component': result['dkvmn_component'],
            'confidence': result['confidence'],
            'learning_velocity': result['learning_velocity'],
            'last_assessed': datetime.utcnow()
        }
        
        # Update or insert
        update_one(
            STUDENT_CONCEPT_MASTERY,
            {'_id': mastery_doc['_id']},
            {
                '$set': mastery_doc,
                '$inc': {'times_assessed': 1}
            },
            upsert=True
        )
        
        # Validate response
        response = MasteryCalculationResponse(**result)
        
        return jsonify(response.dict()), 200
        
    except ValueError as e:
        return jsonify({
            'error': 'Validation error',
            'detail': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@mastery_bp.route('/student/<student_id>', methods=['GET'])
def get_student_mastery(student_id):
    """
    BR1: Get all concept mastery scores for a student
    
    GET /api/mastery/student/{student_id}
    """
    try:
        # Get query parameters
        subject_area = request.args.get('subject_area')
        min_mastery = request.args.get('min_mastery', type=float)
        
        # Build query
        query = {'student_id': student_id}
        
        # Get mastery records
        mastery_records = find_many(STUDENT_CONCEPT_MASTERY, query)
        
        # Get concept details and filter
        concepts_data = []
        for record in mastery_records:
            concept = find_one(CONCEPTS, {'_id': record['concept_id']})
            
            if concept:
                # Apply filters
                if subject_area and concept.get('subject_area') != subject_area:
                    continue
                if min_mastery and record.get('mastery_score', 0) < min_mastery:
                    continue
                
                concepts_data.append({
                    'concept_id': record['concept_id'],
                    'concept_name': concept.get('concept_name', 'Unknown'),
                    'mastery_score': record.get('mastery_score', 0),
                    'last_assessed': record.get('last_assessed').isoformat() if record.get('last_assessed') else None,
                    'times_assessed': record.get('times_assessed', 0),
                    'learning_velocity': record.get('learning_velocity', 0)
                })
        
        # Calculate overall mastery
        overall_mastery = sum(c['mastery_score'] for c in concepts_data) / len(concepts_data) if concepts_data else 0
        
        return jsonify({
            'student_id': student_id,
            'concepts': concepts_data,
            'overall_mastery': round(overall_mastery, 2)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@mastery_bp.route('/concept/<concept_id>/class/<class_id>', methods=['GET'])
def get_class_mastery_for_concept(concept_id, class_id):
    """
    BR1: Get class-level mastery for a specific concept
    
    GET /api/mastery/concept/{concept_id}/class/{class_id}
    """
    try:
        # Get concept details
        concept = find_one(CONCEPTS, {'_id': concept_id})
        
        if not concept:
            return jsonify({'error': 'Concept not found'}), 404
        
        # Aggregate mastery data for the class
        pipeline = [
            {'$match': {'concept_id': concept_id}},
            {'$group': {
                '_id': None,
                'average_mastery': {'$avg': '$mastery_score'},
                'total_students': {'$sum': 1},
                'students_mastered': {
                    '$sum': {'$cond': [{'$gte': ['$mastery_score', 85]}, 1, 0]}
                },
                'students_struggling': {
                    '$sum': {'$cond': [{'$lt': ['$mastery_score', 60]}, 1, 0]}
                }
            }}
        ]
        
        result = aggregate(STUDENT_CONCEPT_MASTERY, pipeline)
        
        if not result:
            return jsonify({
                'concept_id': concept_id,
                'concept_name': concept.get('concept_name'),
                'class_id': class_id,
                'average_mastery': 0,
                'students_mastered': 0,
                'students_struggling': 0,
                'total_students': 0,
                'distribution': {}
            }), 200
        
        stats = result[0]
        
        # Get distribution
        pipeline_dist = [
            {'$match': {'concept_id': concept_id}},
            {'$bucket': {
                'groupBy': '$mastery_score',
                'boundaries': [0, 20, 40, 60, 80, 100],
                'default': 'Other',
                'output': {'count': {'$sum': 1}}
            }}
        ]
        
        distribution_result = aggregate(STUDENT_CONCEPT_MASTERY, pipeline_dist)
        distribution = {f"{d['_id']}-{d['_id']+20}": d['count'] for d in distribution_result}
        
        return jsonify({
            'concept_id': concept_id,
            'concept_name': concept.get('concept_name'),
            'class_id': class_id,
            'average_mastery': round(stats['average_mastery'], 2),
            'students_mastered': stats['students_mastered'],
            'students_struggling': stats['students_struggling'],
            'total_students': stats['total_students'],
            'distribution': distribution
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# ADAPTIVE PRACTICE ROUTES (BR2, BR3)
# ============================================================================

@mastery_bp.route('/practice/generate', methods=['POST'])
def generate_practice_session():
    """
    BR2, BR3: Generate adaptive practice session
    
    POST /api/mastery/practice/generate
    """
    try:
        # Validate request
        data = PracticeSessionRequest(**request.json)
        
        # Get student's current mastery from MongoDB
        mastery_records = find_many(
            STUDENT_CONCEPT_MASTERY,
            {'student_id': data.student_id}
        )
        
        student_mastery = {
            record['concept_id']: record['mastery_score']
            for record in mastery_records
        }
        
        learning_velocity = {
            record['concept_id']: record.get('learning_velocity', 0)
            for record in mastery_records
        }
        
        # Get available content from MongoDB
        # In production, you'd have a content_items collection
        # For now, create mock content
        from ai_engine.adaptive_practice import ContentItem
        
        concepts = find_many(CONCEPTS, {})
        available_content = []
        
        for concept in concepts:
            # Create sample content items for each concept
            for i in range(3):
                item = ContentItem(
                    item_id=f"{concept['_id']}_q{i}",
                    concept_id=concept['_id'],
                    difficulty=concept.get('difficulty_level', 0.5),
                    weight=concept.get('weight', 1.0),
                    estimated_time=5
                )
                available_content.append(item)
        
        # Generate session using adaptive engine
        session = adaptive_engine.generate_practice_session(
            student_id=data.student_id,
            student_mastery=student_mastery,
            learning_velocity=learning_velocity,
            available_content=available_content,
            session_duration=data.session_duration
        )
        
        # Save session to MongoDB (optional)
        session_id = str(ObjectId())
        session['session_id'] = session_id
        
        # Validate response
        response = PracticeSessionResponse(**session)
        
        return jsonify(response.dict()), 200
        
    except ValueError as e:
        return jsonify({
            'error': 'Validation error',
            'detail': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@mastery_bp.route('/response/submit', methods=['POST'])
def submit_student_response():
    """
    Record student response to practice item
    
    POST /api/mastery/response/submit
    """
    try:
        # Validate request
        data = StudentResponseCreate(**request.json)
        
        # Create response document
        response_doc = {
            '_id': str(ObjectId()),
            'student_id': data.student_id,
            'item_id': data.item_id,
            'concept_id': data.concept_id,
            'is_correct': data.is_correct,
            'response_time': data.response_time,
            'hints_used': data.hints_used,
            'attempts': data.attempts,
            'response_text': data.response_text,
            'submitted_at': datetime.utcnow()
        }
        
        # Insert into MongoDB
        response_id = insert_one(STUDENT_RESPONSES, response_doc)
        
        return jsonify({
            'response_id': response_id,
            'message': 'Response recorded successfully'
        }), 201
        
    except ValueError as e:
        return jsonify({
            'error': 'Validation error',
            'detail': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# MASTERY HISTORY & TRENDS
# ============================================================================

@mastery_bp.route('/history/<student_id>/<concept_id>', methods=['GET'])
def get_mastery_history(student_id, concept_id):
    """
    Get historical mastery progression for a student-concept pair
    
    GET /api/mastery/history/{student_id}/{concept_id}
    """
    try:
        days = request.args.get('days', default=30, type=int)
        
        # Get mastery record
        mastery_record = find_one(
            STUDENT_CONCEPT_MASTERY,
            {'student_id': student_id, 'concept_id': concept_id}
        )
        
        # Get response history to build trend
        from datetime import timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        responses = find_many(
            STUDENT_RESPONSES,
            {
                'student_id': student_id,
                'concept_id': concept_id,
                'submitted_at': {'$gte': start_date}
            },
            sort=[('submitted_at', 1)]
        )
        
        # Build history (simplified - in production, store historical snapshots)
        history = []
        if mastery_record:
            history.append({
                'date': mastery_record.get('last_assessed').isoformat() if mastery_record.get('last_assessed') else None,
                'mastery_score': mastery_record.get('mastery_score', 0),
                'assessments_count': mastery_record.get('times_assessed', 0)
            })
        
        return jsonify({
            'student_id': student_id,
            'concept_id': concept_id,
            'history': history,
            'trend': 'improving' if mastery_record and mastery_record.get('learning_velocity', 0) > 0 else 'stable',
            'velocity': mastery_record.get('learning_velocity', 0) if mastery_record else 0
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# RECOMMENDATIONS
# ============================================================================

@mastery_bp.route('/recommendations/<student_id>', methods=['GET'])
def get_practice_recommendations(student_id):
    """
    Get personalized practice recommendations for a student
    
    GET /api/mastery/recommendations/{student_id}
    """
    try:
        # Get all mastery records for student
        mastery_records = find_many(
            STUDENT_CONCEPT_MASTERY,
            {'student_id': student_id},
            sort=[('mastery_score', 1)]  # Sort by lowest mastery first
        )
        
        recommendations = []
        
        for record in mastery_records:
            mastery = record.get('mastery_score', 0)
            
            # Determine recommendation based on BR3 rules
            if mastery >= 85:
                continue  # Skip mastered concepts
            
            concept = find_one(CONCEPTS, {'_id': record['concept_id']})
            
            if mastery >= 60:
                recommendation = 'LIGHT_REVIEW'
                priority = 'medium'
                estimated_time = 10
            else:
                recommendation = 'FOCUSED_PRACTICE'
                priority = 'high'
                estimated_time = 30
            
            recommendations.append({
                'concept_id': record['concept_id'],
                'concept_name': concept.get('concept_name', 'Unknown') if concept else 'Unknown',
                'current_mastery': mastery,
                'recommendation': recommendation,
                'priority': priority,
                'estimated_time': estimated_time
            })
        
        return jsonify({
            'student_id': student_id,
            'recommendations': recommendations[:5]  # Top 5 recommendations
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500