# CivicGrid

**AI-powered civic infrastructure reporting — from voice call to work order in seconds.**

CivicGrid is an end-to-end platform that lets residents report civic issues (potholes, streetlight outages, illegal dumping, etc.) through a natural voice conversation. The system transcribes calls, analyzes them with AI vision + language models, and surfaces structured work orders to government officials and contractors through a modern web dashboard.

> 🏆 Built at CalHacks 2025

## 🌐 Live Demo

**🔗 [nnicholas-c.github.io/CivicGrid](https://nnicholas-c.github.io/CivicGrid/)**

> ⚠️ **Demo Note:** Voice calls are rate-limited to **15 calls/day** to manage API costs (Deepgram STT/TTS). The counter resets daily. All other features (dashboard, map, case management) are fully available.

<details>
<summary>Infrastructure endpoints (for developers)</summary>

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | [nnicholas-c.github.io/CivicGrid](https://nnicholas-c.github.io/CivicGrid/) | GitHub Pages |
| ML Backend (Voice Agent) | [civicgrid-production.up.railway.app](https://civicgrid-production.up.railway.app) | Railway |
| Firebase API | 12 Cloud Function endpoints (`*-xglsok67aq-uc.a.run.app`) | Google Cloud |

</details>

---

## ✨ Features

### 🎙️ Voice-Powered Reporting
- **Conversational AI agent** powered by Deepgram Nova-2 STT + Aura TTS + Google Gemini 2.5 Flash
- Natural phone-style conversation to report issues — no forms to fill out
- Real-time transcript display during calls
- Photo evidence upload during or after the call

### 🤖 AI Issue Analysis
- **Grok-powered analyzer** processes transcripts + photos with vision capabilities
- Automated severity scoring (safety risk, impact scope, urgency, environmental risk)
- Priority scoring with composite formula for queue ordering
- Automatic category classification across 18 issue types
- Structured JSON output for database ingestion

### 🗺️ Interactive Map Dashboard
- **MapLibre GL** powered map with real-time case markers
- Geographic visualization of all reported issues
- Click-through to case details from map pins

### 👥 Role-Based Access
- **Civilians** — Report issues, track case status, view history
- **Contractors** — Accept assigned tasks, submit fix evidence, earn bounties
- **Government Officials** — Approve/deny work, assign contractors, manage all operations

### 📊 Government Dashboard
- Pending approval queue with AI-generated severity labels
- Contractor assignment workflow
- Self-reported completion verification
- Full case history and messaging

### 🎨 Modern UI
- Glassmorphism design with backdrop blur effects
- Vibrant gradient color system
- Framer Motion animations throughout
- Responsive mobile-first layout
- San Francisco themed landing page with background rotation

---

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────────┐
│   React Frontend│◄──────────────────► │  Voice Agent Backend │
│   (GitHub Pages)│                     │  (Railway - Flask)   │
│                 │                     │  Deepgram Nova-2 STT │
│                 │                     │  Aura TTS + Gemini   │
└────────┬────────┘                     └──────────┬───────────┘
         │ REST                                    │ triggers
         ▼                                         ▼
┌─────────────────┐                     ┌──────────────────────┐
│  Google Cloud    │◄────── POST ───────│   Grok Analyzer      │
│  Functions (12)  │                    │   (xAI Vision API)   │
│  Firebase/       │                    │   Transcript + Photo  │
│  Firestore       │                    │   → Structured JSON   │
└─────────────────┘                     └──────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Zustand, MapLibre GL |
| **Voice Agent** | Flask, Flask-SocketIO, Deepgram Agent API (Nova-2 STT, Aura TTS), Google Gemini 2.5 Flash |
| **AI Analyzer** | Python, xAI Grok API (OpenAI-compatible), Vision + Text |
| **Backend API** | Google Cloud Functions, Firebase/Firestore |
| **Hosting** | GitHub Pages (frontend), Railway (ML backend) |

---

## 📁 Project Structure

```
CivicGrid/
├── civicgrid/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/           # UI components (VoiceReportIssue, CaseMap, etc.)
│   │   ├── pages/                # Route pages (Landing, Dashboard, ReportIssue, etc.)
│   │   ├── services/             # API clients (workItemsApi, voiceAgentApi)
│   │   ├── store/                # Zustand state management
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utility helpers (assetUrl, backgrounds)
│   │   └── types/                # TypeScript interfaces
│   └── public/                   # Static assets
│
├── ML-backend/
│   ├── voice-agent-backend/      # Flask + Deepgram voice agent
│   │   ├── app.py                # Main server (WebSocket + REST)
│   │   ├── agent_prompt.txt      # Voice agent system prompt
│   │   ├── Dockerfile            # Railway deployment config
│   │   └── requirements.txt
│   │
│   ├── Claude-Anaylzer/          # Grok-powered issue analyzer
│   │   ├── process_uploads.py    # Main analyzer script
│   │   ├── system_prompt.txt     # Analysis prompt with scoring rubrics
│   │   └── requirements.txt
│   │
│   └── transcripts/              # Saved voice transcripts
│
├── .github/workflows/deploy.yml  # GitHub Pages CI/CD
└── README.md
```

---

## 🚀 Deployment

The app is fully deployed across three platforms:

### Frontend → GitHub Pages
Automatically deployed via GitHub Actions on push to `main`. The workflow builds the Vite app and publishes to the `gh-pages` branch.

### ML Backend → Railway
Dockerized Flask + SocketIO server deployed on Railway with auto-deploy from GitHub. Supports WebSocket connections for real-time voice streaming.

### Firebase API → Google Cloud Functions
12 serverless endpoints handling work item CRUD, contractor assignment, government approval workflows, and user upload management.

---

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+

### Setup

1. **Frontend**
```bash
cd civicgrid
npm install
npm run dev          # → http://localhost:5173
```

2. **Voice Agent Backend**
```bash
cd ML-backend/voice-agent-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py              # → http://localhost:3000
```

3. **Environment Variables**

Create `.env` files:

```bash
# ML-backend/voice-agent-backend/.env
DEEPGRAM_API_KEY=your_key_here
DAILY_CALL_LIMIT=15            # optional, default 15 calls/day

# ML-backend/Claude-Anaylzer/.env
XAI_API_KEY=your_key_here
GROK_MODEL=grok-3-mini-fast    # optional
```

4. **Quick Start** (optional convenience scripts)
```bash
./start-all-services.sh    # Launches frontend + voice agent
./stop-all-services.sh     # Stops all services
```

---

## 📱 Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login with role selection |
| `/signup` | Public | Create account |
| `/cases` | Public | Browse all reported cases |
| `/cases/:id` | Public | Case detail view |
| `/report` | Public | Report issue (voice + photo) |
| `/dashboard` | Civilian | Personal case tracking |
| `/contractor/dashboard` | Contractor | Assigned tasks & bounties |
| `/contractor/work-items` | Contractor | Work item management |
| `/official/dashboard` | Official | Official overview |
| `/government/dashboard` | Official | Full government management panel |
| `/admin/panel` | Official | Admin operations |

---

## 🔑 API Keys Required

| Key | Service | Get it from |
|-----|---------|-------------|
| `DEEPGRAM_API_KEY` | Voice transcription & TTS | [console.deepgram.com](https://console.deepgram.com) |
| `XAI_API_KEY` | Grok AI analysis | [console.x.ai](https://console.x.ai) |
| `VITE_MAPTILER_KEY` | Map tiles | [cloud.maptiler.com](https://cloud.maptiler.com) |

---

## 📄 License

MIT
