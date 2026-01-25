from flask import Blueprint, request, jsonify, url_for, current_app
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid
from utils.logger import get_logger

logger = get_logger(__name__)

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'zip', 'doc', 'docx', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            logger.error("Upload error: No 'file' part in request.files")
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        
        logger.info(f"Upload request | filename: {file.filename} | content_type: {file.content_type}")
        
        if file.filename == '':
            logger.error("Upload error: No selected file")
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            # Generate unique filename
            original_filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{original_filename}"
            
            # Ensure upload directory exists - USE ABSOLUTE PATH
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # pointing to backend root
            upload_dir = os.path.join(base_dir, 'static', 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save file
            file_path = os.path.join(upload_dir, unique_filename)
            file.save(file_path)
            
            logger.info(f"File uploaded successfully | path: {file_path}")
            
            # Generate URL - Use API route for serving
            file_url = f"/api/uploads/{unique_filename}"
            
            return jsonify({
                'message': 'File uploaded successfully',
                'file_url': file_url,
                'filename': original_filename
            }), 201
            
        return jsonify({'error': 'File type not allowed'}), 400
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

from flask import send_from_directory

@upload_bp.route('/uploads/<filename>', methods=['GET'])
def download_file(filename):
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_dir = os.path.join(base_dir, 'static', 'uploads')
        
        file_path = os.path.join(upload_dir, filename)
        logger.info(f"Download request | filename: {filename} | looking in: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"File not found on disk: {file_path}")
            return jsonify({'error': 'File not found on server'}), 404
            
        return send_from_directory(upload_dir, filename)
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({'error': 'File not found'}), 404
