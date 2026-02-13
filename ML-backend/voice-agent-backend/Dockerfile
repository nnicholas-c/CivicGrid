FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway injects $PORT dynamically
ENV PORT=3000
EXPOSE ${PORT}

# Start with gunicorn + eventlet for WebSocket support
# Use shell form so $PORT is expanded at runtime
CMD gunicorn --worker-class eventlet -w 1 --timeout 120 --bind 0.0.0.0:$PORT app:app
