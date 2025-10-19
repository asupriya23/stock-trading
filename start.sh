#!/bin/bash

# MarketPulse AI Startup Script
echo "🚀 Starting MarketPulse AI..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Create database if it doesn't exist
echo "📊 Setting up database..."
createdb marketpulse 2>/dev/null || echo "Database already exists"

# Start backend
echo "🔧 Starting backend server..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ MarketPulse AI is running!"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait

# Cleanup
echo "🛑 Stopping services..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "✅ All services stopped"
