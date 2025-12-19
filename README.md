# CivicGrid

CivicGrid is an end-to-end pipeline for turning resident reports into actionable work orders. It collects issues via a voice-driven intake, transcribes calls, enriches them with a Claude-powered analyzer (including optional photo context), and surfaces structured issues to the web dashboard so they can be routed to contractors or internal crews.

## Structure
- `civicgrid/` – Vite/React frontend for reporting and dashboard views.
- `ML-backend/voice-agent-backend/` – Flask + Deepgram voice agent for call handling and transcription.
- `ML-backend/Claude-Anaylzer/` – Claude-powered analyzer that turns transcripts (and optional photos) into structured issues.
- Root helper scripts (`start-all-services.sh`, `stop-all-services.sh`) orchestrate the stack.

## Prerequisites
- Node.js 18+ (Node 20 tested).
- Python 3.10+ with `python3-venv` and build tools.
- PortAudio dev headers for PyAudio (`sudo apt-get install -y portaudio19-dev libasound2-dev python3-dev`).

## Setup
1) Frontend
```
cd civicgrid
npm install
```
2) Voice agent + analyzer (shared venv)
```
cd ML-backend/voice-agent-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
3) Environment files
- `ML-backend/voice-agent-backend/.env` – set `DEEPGRAM_API_KEY`.
- `ML-backend/Claude-Anaylzer/.env` – set `ANTHROPIC_API_KEY` and optional `CLAUDE_MODEL`.

## Run
From repo root:
```
./start-all-services.sh   # frontend (5173), backend (3000), analyzer loop
# ... work ...
./stop-all-services.sh
```

## Useful scripts
- `start-all-services.sh` – launch backend, analyzer loop, and frontend.
- `stop-all-services.sh` – stop all running services.

## Troubleshooting
- PyAudio build errors: install PortAudio dev packages (see Prerequisites).
- Node syntax errors on Vite start: ensure Node 18+.
- ALSA warnings on headless hosts can be ignored if audio hardware is unavailable.
- If analyzer cannot reach Claude: confirm `ANTHROPIC_API_KEY` and outbound network access.
