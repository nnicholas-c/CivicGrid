from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    AgentWebSocketEvents,
    SettingsOptions,
    FunctionCallRequest,
    FunctionCallResponse,
    Input,
    Output,
)
import os
import signal
import sys
import subprocess
import threading
from datetime import datetime, date, timedelta
from pathlib import Path
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

CLOUD_FUNCTION_URL = "https://adduserupload-xglsok67aq-uc.a.run.app"

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://localhost:5173",
    "https://localhost:5174",
    "https://nnicholas-c.github.io",
]

app = Flask(__name__)
# Enable CORS for React frontend
CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
socketio = SocketIO(app, 
                    cors_allowed_origins=ALLOWED_ORIGINS, 
                    path='/socket.io',
                    ping_timeout=10,
                    ping_interval=5)

# Transcript management
class TranscriptManager:
    def __init__(self):
        self.transcript_lines = []
        self.current_session_id = None
        self.picture_data = None
    
    def start_session(self):
        """Start a new transcript session"""
        self.current_session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.transcript_lines = []
        self.picture_data = None
        self.transcript_lines.append(f"=== Conversation Transcript ===")
        self.transcript_lines.append(f"Session Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.transcript_lines.append("")
        return self.current_session_id
    
    def add_user_message(self, message):
        """Add user message to transcript"""
        if message.strip():
            self.transcript_lines.append(f"[User] {message}")
    
    def add_agent_message(self, message):
        """Add agent message to transcript"""
        if message.strip():
            self.transcript_lines.append(f"[Agent] {message}")
    
    def add_thinking(self, thinking_text):
        """Add agent thinking to transcript"""
        if thinking_text.strip():
            self.transcript_lines.append(f"[Agent Thinking] {thinking_text}")
    
    def save_transcript(self):
        """Save transcript to file"""
        if not self.current_session_id:
            return None
        
        filename = f"transcripts/transcript_{self.current_session_id}.txt"
        os.makedirs("transcripts", exist_ok=True)
        
        self.transcript_lines.append("")
        self.transcript_lines.append(f"Session Ended: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        with open(filename, 'w') as f:
            f.write('\n'.join(self.transcript_lines))

        self.send_transcript_to_cloud()

        return filename
    
    def get_transcript_text(self):
        """Get current transcript as string"""
        return '\n'.join(self.transcript_lines)

    def set_picture(self, picture_base64: str | None):
        """Store the uploaded picture data for later upload"""
        self.picture_data = picture_base64

    def send_transcript_to_cloud(self):
        """Send the current transcript to the Cloud Function"""
        if not self.transcript_lines:
            return None

        payload = {
            "transcript": self.get_transcript_text(),
            "picture": self.picture_data or ""
        }

        try:
            response = requests.post(CLOUD_FUNCTION_URL, json=payload, timeout=10)
            response.raise_for_status()
            print(f"Transcript uploaded successfully: {response.text}")
            return response
        except requests.RequestException as exc:
            print(f"Failed to upload transcript: {exc}")
            return None

transcript_manager = TranscriptManager()

# Function to trigger Grok Analyzer
def trigger_grok_analyzer():
    """Trigger the Grok Analyzer to process the uploaded transcript"""
    try:
        analyzer_path = Path(__file__).parent.parent / "Claude-Anaylzer" / "process_uploads.py"
        if analyzer_path.exists():
            print("\n" + "="*50)
            print("🤖 TRIGGERING GROK ANALYZER")
            print("="*50)
            print(f"📂 Script: {analyzer_path}")
            
            # Run analyzer and capture output
            result = subprocess.Popen(
                [sys.executable, str(analyzer_path)],
                cwd=str(analyzer_path.parent),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            print(f"✅ Grok Analyzer started (PID: {result.pid})")
            print(f"⏳ Processing uploads... (this may take 10-30 seconds)")
            
            # Wait briefly and show initial output
            try:
                stdout, stderr = result.communicate(timeout=2)
                if stdout:
                    print("📤 Output:", stdout[:200])
                if stderr:
                    print("⚠️  Errors:", stderr[:200])
                print(f"✅ Analyzer completed with exit code: {result.returncode}")
            except subprocess.TimeoutExpired:
                print("ℹ️  Analyzer running in background...")
            
            print("="*50 + "\n")
            return result
        else:
            print(f"❌ Grok Analyzer not found at {analyzer_path}")
            return None
    except Exception as e:
        print(f"❌ Error triggering Grok Analyzer: {e}")
        import traceback
        traceback.print_exc()
        return None

# Signal handler to save transcript on exit
def signal_handler(sig, frame):
    """Handle SIGINT (Ctrl+C) and SIGTERM to save transcript before exit"""
    print("\n\n=== Saving transcript before shutdown ===")
    transcript_file = transcript_manager.save_transcript()
    if transcript_file:
        print(f"✓ Transcript saved to {transcript_file}")
        # Trigger Grok Analyzer
        trigger_grok_analyzer()
    print("Shutting down gracefully...")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)   # Ctrl+C
signal.signal(signal.SIGTERM, signal_handler)  # Termination signal

# Initialize Deepgram client (no local audio — we relay via WebSocket)
config = DeepgramClientOptions(
    options={
        "keepalive": "true",
    }
)
deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY", ""), config)
dg_connection = None  # Will be created per connection

# Pre-load agent prompt at startup (avoid disk read on every connection)
_prompt_path = Path(__file__).parent / 'agent_prompt.txt'
with open(_prompt_path, 'r') as _f:
    AGENT_PROMPT = _f.read()
print(f"✅ Agent prompt loaded ({len(AGENT_PROMPT)} chars)")


# --- Rate Limiter ---
class RateLimiter:
    """Simple daily call counter to control Deepgram API costs."""
    
    def __init__(self, daily_limit: int = 15):
        self.daily_limit = daily_limit
        self._today = date.today()
        self._count = 0
        self._lock = threading.Lock()
    
    def _reset_if_new_day(self):
        today = date.today()
        if today != self._today:
            self._today = today
            self._count = 0
    
    def try_acquire(self) -> bool:
        """Try to use a call slot. Returns True if allowed."""
        with self._lock:
            self._reset_if_new_day()
            if self._count >= self.daily_limit:
                return False
            self._count += 1
            print(f"📞 Call {self._count}/{self.daily_limit} today")
            return True
    
    def status(self) -> dict:
        with self._lock:
            self._reset_if_new_day()
            return {
                "used": self._count,
                "limit": self.daily_limit,
                "remaining": max(0, self.daily_limit - self._count),
                "reset_date": str(self._today + timedelta(days=1)),
            }


DAILY_CALL_LIMIT = int(os.environ.get("DAILY_CALL_LIMIT", "5"))
rate_limiter = RateLimiter(daily_limit=DAILY_CALL_LIMIT)
print(f"📞 Rate limiter: {DAILY_CALL_LIMIT} calls/day")

@app.route('/')
def index():
    return jsonify({"service": "CivicGrid Voice Agent", "status": "running"})

@app.route('/health')
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/rate-limit')
def get_rate_limit():
    """Return current rate limit status"""
    return jsonify(rate_limiter.status()), 200

@app.route('/transcript')
def get_transcript():
    """Return the current transcript as JSON"""
    return {
        'transcript': transcript_manager.get_transcript_text(),
        'session_id': transcript_manager.current_session_id
    }

@app.route('/upload_picture', methods=['POST'])
def upload_picture():
    data = request.get_json(silent=True) or {}
    picture = data.get('picture')

    if picture is None:
        return jsonify({'error': 'picture field is required'}), 400

    transcript_manager.set_picture(picture)
    return jsonify({'status': 'ok'})

@socketio.on('connect')
def handle_connect():
    global dg_connection
    
    # Check rate limit before spinning up Deepgram
    if not rate_limiter.try_acquire():
        status = rate_limiter.status()
        print(f"🚫 Rate limit reached ({status['used']}/{status['limit']})")
        socketio.emit('rate_limited', {
            'message': f"Daily voice call limit reached ({status['limit']} calls/day). Resets tomorrow.",
            **status
        })
        return False  # reject the connection
    
    # Create a fresh Deepgram connection for this session
    dg_connection = deepgram.agent.websocket.v("1")
    
    # Start a new transcript session
    session_id = transcript_manager.start_session()
    print(f"New session started: {session_id}")
    socketio.emit('session_started', {'session_id': session_id})
    
    options = SettingsOptions()

    # Configure audio input settings
    options.audio.input = Input(
        encoding="linear16",
        sample_rate=16000  # Match the output sample rate
    )

    # Configure audio output settings
    options.audio.output = Output(
        encoding="linear16",
        sample_rate=16000,
        container="none"
    )

    # LLM provider configuration
    options.agent.think.provider.type = "google"
    options.agent.think.provider.model = "gemini-2.5-flash"
    
    # Use pre-loaded prompt (cached at startup)
    options.agent.think.prompt = AGENT_PROMPT

    # Deepgram STT configuration (nova-2 for faster init)
    options.agent.listen.provider.model = "nova-2"
    options.agent.listen.provider.type = "deepgram"
    options.agent.listen.provider.endpointing = 300
    options.agent.listen.provider.interim_results = True
    options.agent.listen.provider.keyterms = ["hello", "goodbye"]
    
    # Deepgram TTS configuration (aura-helios for faster init)
    options.agent.speak.provider.type = "deepgram"
    options.agent.speak.provider.model = "aura-helios-en"

    # Sets Agent greeting
    options.agent.greeting = "Hey there! This is the AI service agent. What problem or issue can I help report for you today?"

    # Event handlers (self = Deepgram WebSocket client)
    def on_open(self, *args, **kwargs):
        open_event = kwargs.get('open') or (args[0] if args else None)
        print("Deepgram socket opened")
        if open_event:
            socketio.emit('open', {'data': open_event.__dict__})

    def on_welcome(self, *args, **kwargs):
        welcome = kwargs.get('welcome') or (args[0] if args else None)
        print("Deepgram welcome received — agent ready")
        if welcome:
            socketio.emit('welcome', {'data': welcome.__dict__})
            # Signal to frontend that Deepgram is ready for audio
            socketio.emit('deepgram_ready')

    def on_history(self, *args, **kwargs):
        """Handle History messages with audio"""
        history = kwargs.get('history') or (args[0] if args else None)
        if not history:
            return
        
        try:
            audio_data = None
            if hasattr(history, 'audio') and history.audio:
                audio_data = list(history.audio) if isinstance(history.audio, bytes) else history.audio
            elif hasattr(history, 'data') and hasattr(history.data, 'audio') and history.data.audio:
                audio_data = list(history.data.audio) if isinstance(history.data.audio, bytes) else history.data.audio
            elif hasattr(history, 'content') and isinstance(history.content, bytes):
                audio_data = list(history.content)
            
            if audio_data:
                socketio.emit('agent_audio', {'audio': audio_data, 'format': 'pcm16'})
        except Exception as e:
            print(f"Error extracting audio from history: {e}")
    
    def on_message(self, *args, **kwargs):
        """Handle generic messages including History with audio"""
        message = kwargs.get('message') or (args[0] if args else None)
        if not message:
            return
        
        try:
            if hasattr(message, 'audio') and message.audio:
                socketio.emit('agent_audio', {
                    'audio': list(message.audio) if isinstance(message.audio, (bytes, bytearray)) else message.audio,
                    'format': 'pcm16'
                })
            elif hasattr(message, 'data') and isinstance(message.data, dict) and message.data.get('audio'):
                socketio.emit('agent_audio', {
                    'audio': message.data['audio'],
                    'format': 'pcm16'
                })
        except Exception as e:
            print(f"Error handling message: {e}")

    def on_conversation_text(self, *args, **kwargs):
        conversation_text = kwargs.get('conversation_text') or (args[0] if args else None)
        if not conversation_text:
            return
        
        message = conversation_text.text if hasattr(conversation_text, 'text') else str(conversation_text)
        role = conversation_text.role if hasattr(conversation_text, 'role') else 'unknown'
        
        if role == 'user':
            transcript_manager.add_user_message(message)
        elif role == 'agent':
            transcript_manager.add_agent_message(message)
        
        socketio.emit('conversation', {
            'data': conversation_text.__dict__,
            'transcript': transcript_manager.get_transcript_text()
        })

    def on_agent_thinking(self, *args, **kwargs):
        agent_thinking = kwargs.get('agent_thinking') or (args[0] if args else None)
        if not agent_thinking:
            return
        
        thinking_text = agent_thinking.text if hasattr(agent_thinking, 'text') else str(agent_thinking)
        transcript_manager.add_thinking(thinking_text)
        
        socketio.emit('thinking', {
            'data': agent_thinking.__dict__,
            'transcript': transcript_manager.get_transcript_text()
        })

    def on_function_call_request(self, *args, **kwargs):
        function_call_request = kwargs.get('function_call_request') or (args[0] if args else None)
        if not function_call_request:
            return
        response = FunctionCallResponse(
            function_call_id=function_call_request.function_call_id,
            output="Function response here"
        )
        dg_connection.send_function_call_response(response)
        socketio.emit('function_call', {'data': function_call_request.__dict__})

    def on_agent_started_speaking(self, *args, **kwargs):
        agent_started_speaking = kwargs.get('agent_started_speaking') or (args[0] if args else None)
        if agent_started_speaking:
            socketio.emit('agent_speaking', {'data': agent_started_speaking.__dict__})

    def on_error(self, *args, **kwargs):
        error = kwargs.get('error') or (args[0] if args else None)
        if not error:
            return
        print(f"⚠️ Deepgram error: {error}")
        socketio.emit('error', {'data': {
            'message': str(error),
            'type': error.__class__.__name__,
            'details': error.__dict__
        }})

    def on_agent_stopped_speaking(self, *args, **kwargs):
        agent_stopped_speaking = kwargs.get('agent_stopped_speaking') or (args[0] if args else None)
        if agent_stopped_speaking:
            socketio.emit('agent_stopped_speaking', {'data': agent_stopped_speaking.__dict__})

    def on_audio_data(self, *args, **kwargs):
        """Handle AudioData events from agent speech"""
        audio_data_event = kwargs.get('audio_data') or kwargs.get('audio_data_event') or (args[0] if args else None)
        if not audio_data_event:
            return
        
        try:
            audio_bytes = None
            if hasattr(audio_data_event, 'audio') and audio_data_event.audio:
                audio_bytes = audio_data_event.audio
            elif hasattr(audio_data_event, 'data') and audio_data_event.data:
                audio_bytes = audio_data_event.data
            
            if audio_bytes:
                audio_list = list(audio_bytes) if isinstance(audio_bytes, (bytes, bytearray)) else audio_bytes
                socketio.emit('agent_audio', {'audio': audio_list, 'format': 'pcm16'})
        except Exception as e:
            print(f"Error handling AudioData: {e}")
    
    def on_audio(self, *args, **kwargs):
        """Handle generic audio events (fallback)"""
        audio = kwargs.get('audio') or (args[0] if args else None)
        if not audio:
            return
        
        audio_data = None
        if isinstance(audio, (bytes, bytearray)):
            audio_data = list(audio)
        elif hasattr(audio, 'audio'):
            audio_data = list(audio.audio) if isinstance(audio.audio, (bytes, bytearray)) else audio.audio
        elif isinstance(audio, list):
            audio_data = audio
        
        if audio_data:
            socketio.emit('agent_audio', {'audio': audio_data, 'format': 'pcm16'})

    def on_user_started_speaking(self, *args, **kwargs):
        user_started_speaking = kwargs.get('user_started_speaking') or (args[0] if args else None)
        if user_started_speaking:
            socketio.emit('user_started_speaking', {'data': user_started_speaking.__dict__})

    def on_user_stopped_speaking(self, *args, **kwargs):
        user_stopped_speaking = kwargs.get('user_stopped_speaking') or (args[0] if args else None)
        if user_stopped_speaking:
            socketio.emit('user_stopped_speaking', {'data': user_stopped_speaking.__dict__})

    # Register event handlers
    dg_connection.on(AgentWebSocketEvents.Open, on_open)
    dg_connection.on(AgentWebSocketEvents.Welcome, on_welcome)
    dg_connection.on(AgentWebSocketEvents.ConversationText, on_conversation_text)
    dg_connection.on(AgentWebSocketEvents.AgentThinking, on_agent_thinking)
    dg_connection.on(AgentWebSocketEvents.FunctionCallRequest, on_function_call_request)
    dg_connection.on(AgentWebSocketEvents.AgentStartedSpeaking, on_agent_started_speaking)
    dg_connection.on(AgentWebSocketEvents.AudioData, on_audio_data)
    dg_connection.on(AgentWebSocketEvents.Error, on_error)
    
    # Register additional handlers if they exist in the SDK
    try:
        dg_connection.on(AgentWebSocketEvents.AgentStoppedSpeaking, on_agent_stopped_speaking)
    except:
        pass
    try:
        dg_connection.on(AgentWebSocketEvents.UserStartedSpeaking, on_user_started_speaking)
    except:
        pass
    try:
        dg_connection.on(AgentWebSocketEvents.UserStoppedSpeaking, on_user_stopped_speaking)
    except:
        pass
    
    # Try to register History event if it exists
    try:
        dg_connection.on(AgentWebSocketEvents.History, on_history)
    except:
        pass
    
    # Generic handler for any other messages
    dg_connection.on("message", on_message)
    dg_connection.on("audio", on_audio)

    print("Starting Deepgram connection in background...")
    
    def start_deepgram():
        """Start Deepgram in a background thread so Socket.IO handler returns fast"""
        try:
            if not dg_connection.start(options):
                print("Failed to start Deepgram connection")
                socketio.emit('error', {'data': {'message': 'Failed to start connection'}})
                return
            print("✅ Deepgram connection started successfully")
        except Exception as e:
            print(f"❌ Deepgram start error: {e}")
            socketio.emit('error', {'data': {'message': f'Deepgram error: {str(e)}'}})
    
    threading.Thread(target=start_deepgram, daemon=True).start()


def save_and_process_transcript():
    """Helper function to save transcript and trigger processing"""
    try:
        transcript_file = transcript_manager.save_transcript()
        if transcript_file:
            print(f"✓ Transcript saved to {transcript_file}")
            # Trigger Grok Analyzer
            trigger_grok_analyzer()
            return True
    except Exception as e:
        print(f"Error saving transcript: {e}")
        import traceback
        traceback.print_exc()
    return False

@socketio.on('disconnect')
def handle_disconnect():
    global dg_connection
    
    print("Client disconnected, saving session")
    save_and_process_transcript()
    
    if dg_connection is not None:
        try:
            dg_connection.finish()
        except Exception as e:
            print(f"Warning: Error closing Deepgram connection: {e}")
        dg_connection = None

@socketio.on('end_call')
def handle_end_call():
    """Explicitly end call and save transcript"""
    print("\n=== End call requested ===")
    save_and_process_transcript()
    socketio.emit('call_ended', {'status': 'success'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    socketio.run(app, debug=False, port=port, host='0.0.0.0', use_reloader=False, allow_unsafe_werkzeug=True)