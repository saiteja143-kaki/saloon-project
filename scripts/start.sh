#!/bin/bash
# Start script for SalonFlow

echo "Starting SalonFlow Backend (Port 8000)..."
cd backend
# Use explicit venv python to avoid activation issues
./venv/bin/python manage.py runserver &
BACKEND_PID=$!

cd ..

echo "Starting SalonFlow Frontend (Port 8080)..."
# Simple Python HTTP server since it's just index.html, styles.css, app.js
python3 -m http.server 8080 &
FRONTEND_PID=$!

echo "Both servers are running!"
echo "Frontend available at: http://localhost:8080"
echo "Backend API available at: http://localhost:8000"

# Wait for both background processes
wait $BACKEND_PID
wait $FRONTEND_PID
