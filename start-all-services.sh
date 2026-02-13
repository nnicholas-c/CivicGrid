#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 1
    fi
}

require_cmd lsof
require_cmd python3
require_cmd npm

echo "Starting CivicGrid services"
echo "---------------------------"

check_port() {
    local port="$1"
    if lsof -i:"$port" >/dev/null 2>&1; then
        echo "Port $port is in use; terminating existing process"
        lsof -t -i:"$port" | xargs -r kill -9 2>/dev/null
    fi
}

echo "Checking ports 3000 and 5173"
check_port 3000
check_port 5173

echo
echo "1) Starting Voice Agent Backend (port 3000)"
cd ML-backend/voice-agent-backend
if [ -f ".env" ]; then
    echo "   .env file found"
else
    echo "   Creating .env from .env.example"
    cp .env.example .env
    echo "   Add DEEPGRAM_API_KEY to ML-backend/voice-agent-backend/.env"
fi

if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment"
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
python app.py > ../../voice-agent.log 2>&1 &
VOICE_PID=$!
echo "   Voice Agent Backend started (PID: $VOICE_PID)"

echo "
2) Starting Grok Analyzer (continuous mode)"
cd ../Claude-Anaylzer
if [ -f ".env" ]; then
    echo "   .env file found"
else
    echo "   Creating .env from .env.example"
    cp .env.example .env
    echo "   Add XAI_API_KEY to ML-backend/Claude-Anaylzer/.env"
fi

(
  while true; do
    python process_uploads.py >> ../../grok-analyzer.log 2>&1
    sleep 15
  done
) &
GROK_PID=$!
echo "   Grok Analyzer started (PID: $GROK_PID)"

cd ../..

echo "
3) Starting React frontend (port 5173)"
cd civicgrid
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies"
    npm install
fi

npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend started (PID: $FRONTEND_PID)"

cd ..

echo "$VOICE_PID" > .service-pids
echo "$GROK_PID" >> .service-pids
echo "$FRONTEND_PID" >> .service-pids

sleep 3

echo
echo "All services started"
echo "Access points:"
echo "  Frontend: http://localhost:5173"
echo "  Voice Agent Backend: http://localhost:3000"
echo
echo "Logs:"
echo "  tail -f voice-agent.log"
echo "  tail -f grok-analyzer.log"
echo "  tail -f frontend.log"
echo
echo "To stop all services: ./stop-all-services.sh"
echo "Ensure API keys are added to the relevant .env files."

echo "Press Ctrl+C to stop log tailing"
tail -f voice-agent.log grok-analyzer.log frontend.log
