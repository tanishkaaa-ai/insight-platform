FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create models directory for DKT weights
RUN mkdir -p models

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_DEBUG=false

# Expose port
EXPOSE 5000

# Default command (can be overridden in docker-compose)
CMD ["python", "app.py"]