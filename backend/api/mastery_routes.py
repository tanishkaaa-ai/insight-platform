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
    PRACTICE_ITEMS,
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
    try:
        logger.info(f"[CALCULATE_MASTERY] Request received | student_id: {request.json.get('student_id')} | concept_id: {request.json.get('concept_id')} | is_correct: {request.json.get('is_correct')}")
        data = MasteryCalculationRequest(**request.json)

        logger.info(f"[CALCULATE_MASTERY] Calling KT engine | student_id: {data.student_id} | concept_id: {data.concept_id} | is_correct: {data.is_correct} | response_time: {data.response_time}ms")
        result = kt_engine.calculate_mastery(
            student_id=data.student_id,
            concept_id=data.concept_id,
            is_correct=data.is_correct,
            response_time=data.response_time,
            current_mastery=data.current_mastery if data.current_mastery is not None else 50.0,
            response_history=data.response_history,
            related_concepts=data.related_concepts
        )
        logger.info(f"[CALCULATE_MASTERY] KT engine completed | student_id: {data.student_id} | concept_id: {data.concept_id} | mastery_score: {result['mastery_score']:.2f} | confidence: {result['confidence']:.2f} | velocity: {result['learning_velocity']:.2f}")
        
        result['timestamp'] = datetime.utcnow()

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

        logger.info(f"[CALCULATE_MASTERY] Saving to database | doc_id: {mastery_doc['_id']}")
        update_one(
            STUDENT_CONCEPT_MASTERY,
            {'_id': mastery_doc['_id']},
            {
                '$set': mastery_doc,
                '$inc': {'times_assessed': 1}
            },
            upsert=True
        )
        logger.info(f"[CALCULATE_MASTERY] SUCCESS | student_id: {data.student_id} | concept_id: {data.concept_id} | mastery: {result['mastery_score']:.2f}")

        response = MasteryCalculationResponse(**result)

        return jsonify(response.dict()), 200

    except ValueError as e:
        logger.error(f"[CALCULATE_MASTERY] Validation error | error: {str(e)}")
        return jsonify({
            'error': 'Validation error',
            'detail': str(e)
        }), 400
    except Exception as e:
        logger.error(f"[CALCULATE_MASTERY] ERROR | error: {str(e)} | student_id: {request.json.get('student_id') if request.json else 'unknown'}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@mastery_bp.route('/student/<student_id>', methods=['GET'])
def get_student_mastery(student_id):
    try:
        subject_area = request.args.get('subject_area')
        min_mastery = request.args.get('min_mastery', type=float)
        classroom_id = request.args.get('classroom_id')
        logger.info(f"[GET_STUDENT_MASTERY] Request received | student_id: {student_id} | subject_area: {subject_area} | min_mastery: {min_mastery} | classroom_id: {classroom_id}")

        if classroom_id:
            # If classroom_id is provided, get ALL concepts for that classroom
            concept_query = {'classroom_id': classroom_id}
            if subject_area:
                concept_query['subject_area'] = subject_area
            available_concepts = list(find_many(CONCEPTS, concept_query))
        else:
            # Fallback (legacy): Get concepts from mastery records only, or all if needed
            # For now, if no class ID, we'll stick to mastery-based to avoid flooding
            available_concepts = []

        query = {'student_id': student_id}
        mastery_records = find_many(STUDENT_CONCEPT_MASTERY, query)
        mastery_map = {rec['concept_id']: rec for rec in mastery_records}
        
        logger.info(f"[GET_STUDENT_MASTERY] Data retrieved | student_id: {student_id} | class_concepts: {len(available_concepts)} | mastery_records: {len(mastery_records)}")
        
        concepts_data = []

        # If we have class concepts, use them as the base
        if available_concepts:
            for concept in available_concepts:
                record = mastery_map.get(concept['_id'], {})
                
                # Filter by min_mastery if requested
                mastery_score = record.get('mastery_score', 0)
                if min_mastery and mastery_score < min_mastery:
                    continue

                # Determine status
                status = 'available'
                if mastery_score >= 85:
                    status = 'mastered'
                elif mastery_score > 0:
                    status = 'in_progress'

                concepts_data.append({
                    'concept_id': concept['_id'],
                    'concept_name': concept.get('concept_name', concept.get('name', 'Unknown')), 
                    'classroom_id': concept.get('classroom_id'),
                    'mastery_score': mastery_score,
                    'status': status,
                    'created_at': (concept.get('created_at').isoformat() if hasattr(concept.get('created_at'), 'isoformat') else concept.get('created_at')) if concept.get('created_at') else None,
                    'last_assessed': (record.get('last_assessed').isoformat() if hasattr(record.get('last_assessed'), 'isoformat') else record.get('last_assessed')) if record.get('last_assessed') else None,
                    'times_assessed': record.get('times_assessed', 0),
                    'learning_velocity': record.get('learning_velocity', 0)
                })

        overall_mastery = sum(c['mastery_score'] for c in concepts_data) / len(concepts_data) if concepts_data else 0
        
        return jsonify({
            'student_id': student_id,
            'concepts': concepts_data,
            'overall_mastery': round(overall_mastery, 2)
        }), 200

    except Exception as e:
        logger.error(f"[GET_STUDENT_MASTERY] ERROR | student_id: {student_id} | error: {str(e)}")
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
    try:
        logger.info(f"[GENERATE_PRACTICE] Request received | student_id: {request.json.get('student_id')} | session_duration: {request.json.get('session_duration')} | classroom_id: {request.json.get('classroom_id')}")
        data = PracticeSessionRequest(**request.json)
        classroom_id = data.classroom_id # Use validated field

        mastery_records = find_many(
            STUDENT_CONCEPT_MASTERY,
            {'student_id': data.student_id}
        )
        logger.info(f"[GENERATE_PRACTICE] Mastery records retrieved | student_id: {data.student_id} | record_count: {len(mastery_records)}")

        student_mastery = {
            record['concept_id']: record['mastery_score']
            for record in mastery_records
        }

        learning_velocity = {
            record['concept_id']: record.get('learning_velocity', 0)
            for record in mastery_records
        }
        logger.info(f"[GENERATE_PRACTICE] Student mastery processed | student_id: {data.student_id} | concepts: {len(student_mastery)}")
        
        from ai_engine.adaptive_practice import ContentItem

        concept_query = {}
        if data.concept_id:
            # Focus mode: Only fetch the requested concept
            concept_query['_id'] = data.concept_id
        elif classroom_id:
            # Class mode: Fetch class-specific AND global concepts
            concept_query['$or'] = [
                {'classroom_id': classroom_id},
                {'classroom_id': None},
                {'classroom_id': {'$exists': False}}
            ]

        concepts = find_many(CONCEPTS, concept_query)
        logger.info(f"[GENERATE_PRACTICE] Concepts retrieved | count: {len(concepts)} | classroom: {classroom_id}")
        if not concepts:
            logger.info("[GENERATE_PRACTICE] No concepts found, returning empty session")
            return jsonify({
                'session_id': str(ObjectId()),
                'student_id': data.student_id,
                'content_items': [],
                'total_items': 0,
                'estimated_duration': 0,
                'cognitive_load': 0,
                'load_status': 'NO_CONTENT',
                'zpd_alignment': 'None',
                'concepts_covered': {}
            }), 200



        available_content = []
        concepts_with_content = 0
        concepts_without_content = []

        for concept in concepts:
            # Query for real items - ensure exact concept_id match
            concept_id_str = str(concept['_id'])
            real_items = find_many(PRACTICE_ITEMS, {'concept_id': concept_id_str})

            logger.info(f"[GENERATE_PRACTICE] Concept '{concept.get('name')}' | concept_id: {concept_id_str} | items_found: {len(real_items)}")

            if real_items:
                concepts_with_content += 1
                for item_doc in real_items:
                    # Verify concept_id match to prevent leakage
                    if str(item_doc.get('concept_id')) != concept_id_str:
                        logger.warning(f"[GENERATE_PRACTICE] Skipping item {item_doc['_id']} - concept_id mismatch | expected: {concept_id_str} | got: {item_doc.get('concept_id')}")
                        continue

                    # Handle difficulty conversion safely
                    diff_val = item_doc.get('difficulty', 0.5)
                    try:
                         if isinstance(diff_val, str):
                             if diff_val.lower() == 'easy': diff_val = 0.3
                             elif diff_val.lower() == 'medium': diff_val = 0.5
                             elif diff_val.lower() == 'hard': diff_val = 0.7
                             else: diff_val = float(diff_val)
                         else:
                             diff_val = float(diff_val)
                    except:
                        diff_val = 0.5

                    item = ContentItem(
                        item_id=str(item_doc['_id']),
                        concept_id=concept_id_str,
                        difficulty=diff_val,
                        weight=float(concept.get('weight', 1.0)),
                        estimated_time=5,
                        question=item_doc.get('question', 'Question text missing'),
                        options=item_doc.get('options', []),
                        correct_answer=item_doc.get('correct_answer'),
                        explanation=item_doc.get('explanation')
                    )
                    available_content.append(item)
                    logger.info(f"[GENERATE_PRACTICE] Added item | item_id: {item_doc['_id']} | concept: {concept.get('name')} | question: {item_doc.get('question', '')[:50]}...")
            else:
                # No real items found - log but do NOT generate fallback placeholders
                concepts_without_content.append(concept.get('name', 'Unknown'))
                logger.warning(f"[GENERATE_PRACTICE] No practice items found for concept '{concept.get('name')}' | concept_id: {concept_id_str}")

        logger.info(f"[GENERATE_PRACTICE] Content collection complete | total_items: {len(available_content)} | concepts_with_content: {concepts_with_content} | concepts_without_content: {len(concepts_without_content)}")

        if concepts_without_content:
            logger.warning(f"[GENERATE_PRACTICE] Concepts missing practice items: {', '.join(concepts_without_content)}")

        # If no content available at all, return empty session
        if not available_content:
            logger.warning(f"[GENERATE_PRACTICE] No practice items available for classroom {classroom_id} - returning empty session")
            return jsonify({
                'session_id': str(ObjectId()),
                'student_id': data.student_id,
                'content_items': [],
                'total_items': 0,
                'estimated_duration': 0,
                'cognitive_load': 0,
                'load_status': 'NO_CONTENT',
                'zpd_alignment': 'None',
                'concepts_covered': {},
                'message': f'No practice content available. {len(concepts_without_content)} concept(s) need questions: {", ".join(concepts_without_content[:3])}'
            }), 200

        logger.info(f"[GENERATE_PRACTICE] Calling adaptive engine | student_id: {data.student_id} | session_duration: {data.session_duration}")
        session = adaptive_engine.generate_practice_session(
            student_id=data.student_id,
            student_mastery=student_mastery,
            learning_velocity=learning_velocity,
            available_content=available_content,
            session_duration=data.session_duration
        )

        session_id = str(ObjectId())
        session['session_id'] = session_id
        logger.info(f"[GENERATE_PRACTICE] SUCCESS | student_id: {data.student_id} | session_id: {session_id} | item_count: {len(session.get('recommended_items', []))} | estimated_duration: {session.get('estimated_duration')}min")

        response = PracticeSessionResponse(**session)

        return jsonify(response.dict()), 200

    except ValueError as e:
        logger.error(f"[GENERATE_PRACTICE] Validation error | error: {str(e)}")
        return jsonify({
            'error': 'Validation error',
            'detail': str(e)
        }), 400
    except Exception as e:
        logger.error(f"[GENERATE_PRACTICE] ERROR | error: {str(e)} | student_id: {request.json.get('student_id') if request.json else 'unknown'}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@mastery_bp.route('/response/submit', methods=['POST'])
def submit_student_response():
    try:
        logger.info(f"[SUBMIT_RESPONSE] Request received | student_id: {request.json.get('student_id')} | item_id: {request.json.get('item_id')} | is_correct: {request.json.get('is_correct')}")
        data = StudentResponseCreate(**request.json)

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

        response_id = insert_one(STUDENT_RESPONSES, response_doc)
        logger.info(f"[SUBMIT_RESPONSE] SUCCESS | student_id: {data.student_id} | response_id: {response_id} | concept_id: {data.concept_id} | is_correct: {data.is_correct} | time: {data.response_time}ms")

        return jsonify({
            'response_id': response_id,
            'message': 'Response recorded successfully'
        }), 201

    except ValueError as e:
        logger.error(f"[SUBMIT_RESPONSE] Validation error | error: {str(e)}")

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
                'date': (mastery_record.get('last_assessed').isoformat() if hasattr(mastery_record.get('last_assessed'), 'isoformat') else mastery_record.get('last_assessed')) if mastery_record.get('last_assessed') else None,
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
                'concept_name': concept.get('concept_name', concept.get('name', 'Unknown')) if concept else 'Unknown',
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