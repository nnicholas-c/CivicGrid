#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping CivicGrid services"
echo "---------------------------"

stop_pid() {
    local pid="$1"
    if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
        echo "Stopped process $pid"
    fi
}

if [ -f ".service-pids" ]; then
    while read -r pid; do
        [ -n "$pid" ] && stop_pid "$pid"
    done < .service-pids
    rm .service-pids
fi

for port in 3000 5173; do
    if lsof -i:"$port" >/dev/null 2>&1; then
        lsof -t -i:"$port" | xargs -r kill -9 2>/dev/null
        echo "Stopped process on port $port"
    fi
done

echo "All services stopped"
