from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from array import array
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
import json
import signal
import sys
import subprocess
from datetime import datetime
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
                    path='/socket.io')

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

# Initialize Deepgram client with microphone/speaker support
config = DeepgramClientOptions(
    options={
        "keepalive": "true",
        "microphone_record": "true",
        "speaker_playback": "true",
    }
)
deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY", ""), config)
dg_connection = None  # Will be created per connection

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    return jsonify({"status": "ok"}), 200

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
    
    # Load system prompt from file
    prompt_path = Path(__file__).parent / 'agent_prompt.txt'
    with open(prompt_path, 'r') as f:
        options.agent.think.prompt = f.read()

    # Deepgram provider configuration
    options.agent.listen.provider.keyterms = ["hello", "goodbye"]
    options.agent.listen.provider.model = "nova-3"
    options.agent.listen.provider.type = "deepgram"
    options.agent.speak.provider.type = "deepgram"
    options.agent.speak.provider.model = "aura-2-odysseus-en"
    
    # Enable barge-in (user can interrupt agent)
    options.agent.listen.model = "nova-3"
    
    # Configure turn detection for interruption
    # Set endpointing to detect when user starts speaking
    options.agent.listen.provider.endpointing = 300  # 300ms of speech to detect user turn
    
    # Enable interim results for faster barge-in detection
    options.agent.listen.provider.interim_results = True

    # Sets Agent greeting
    options.agent.greeting = "Hey there! This is the AI service agent. What problem or issue can I help report for you today?"

    # Event handlers (self = Deepgram WebSocket client)
    def on_open(self, *args, **kwargs):
        open_event = kwargs.get('open') or (args[0] if args else None)
        print("Open event received:", open_event.__dict__ if open_event else 'None')
        if open_event:
            socketio.emit('open', {'data': open_event.__dict__})

    def on_welcome(self, *args, **kwargs):
        welcome = kwargs.get('welcome') or (args[0] if args else None)
        print("Welcome event received:", welcome.__dict__ if welcome else 'None')
        if welcome:
            socketio.emit('welcome', {'data': welcome.__dict__})
            # Signal to frontend that Deepgram is ready for audio
            socketio.emit('deepgram_ready')

    def on_history(self, *args, **kwargs):
        """Handle History messages with audio"""
        history = kwargs.get('history') or (args[0] if args else None)
        if not history:
            return
            
        print(f"\n=== History Event ===")
        print(f"Type: {type(history)}")
        print(f"Has __dict__: {hasattr(history, '__dict__')}")
        if hasattr(history, '__dict__'):
            print(f"Dict: {history.__dict__}")
            print(f"Keys: {list(history.__dict__.keys())}")
        print(f"Dir (non-private): {[attr for attr in dir(history) if not attr.startswith('_')]}")
        print("===================\n")
        
        # Try to extract audio from history - check multiple possible locations
        try:
            audio_data = None
            
            # Check various possible audio locations
            if hasattr(history, 'audio') and history.audio:
                print(f"✓ Audio found in history.audio: {len(history.audio)} bytes")
                audio_data = list(history.audio) if isinstance(history.audio, bytes) else history.audio
            elif hasattr(history, 'data') and hasattr(history.data, 'audio') and history.data.audio:
                print(f"✓ Audio found in history.data.audio: {len(history.data.audio)} bytes")
                audio_data = list(history.data.audio) if isinstance(history.data.audio, bytes) else history.data.audio
            elif hasattr(history, 'content') and isinstance(history.content, bytes):
                print(f"✓ Audio found in history.content: {len(history.content)} bytes")
                audio_data = list(history.content)
            else:
                print(f"✗ No audio in History event")
            
            if audio_data:
                print(f"🔊 Sending {len(audio_data)} audio samples to client")
                socketio.emit('agent_audio', {
                    'audio': audio_data,
                    'format': 'pcm16'
                })
        except Exception as e:
            print(f"✗ Error extracting audio from history: {e}")
            import traceback
            traceback.print_exc()
    
    def on_message(self, *args, **kwargs):
        message = kwargs.get('message') or (args[0] if args else None)
        if not message:
            return
        """Handle generic messages including History with audio"""
        msg_type = getattr(message, 'type', 'unknown')
        print(f"\n=== Message Event ===")
        print(f"Type: {msg_type}")
        print(f"Full message: {message}")
        print(f"Has __dict__: {hasattr(message, '__dict__')}")
        if hasattr(message, '__dict__'):
            print(f"Attributes: {message.__dict__.keys()}")
        print(f"Dir: {[attr for attr in dir(message) if not attr.startswith('_')]}")
        print("===================\n")
        
        # Try to extract audio from message
        try:
            if hasattr(message, 'audio') and message.audio:
                print(f"✓ Audio data found in message: {len(message.audio)} bytes")
                # Send audio to client
                socketio.emit('agent_audio', {
                    'audio': list(message.audio) if isinstance(message.audio, bytes) else message.audio,
                    'format': 'pcm16'
                })
            elif hasattr(message, 'data') and isinstance(message.data, dict) and message.data.get('audio'):
                print(f"✓ Audio data found in message.data: {len(message.data['audio'])} bytes")
                socketio.emit('agent_audio', {
                    'audio': message.data['audio'],
                    'format': 'pcm16'
                })
            else:
                print(f"✗ No audio found in message")
        except Exception as e:
            print(f"✗ Error extracting audio: {e}")
            import traceback
            traceback.print_exc()

    def on_conversation_text(self, *args, **kwargs):
        conversation_text = kwargs.get('conversation_text') or (args[0] if args else None)
        if not conversation_text:
            return
        print("Conversation event received:", conversation_text.__dict__)
        
        # Extract message and role
        message = conversation_text.text if hasattr(conversation_text, 'text') else str(conversation_text)
        role = conversation_text.role if hasattr(conversation_text, 'role') else 'unknown'
        
        # Add to transcript
        if role == 'user':
            transcript_manager.add_user_message(message)
        elif role == 'agent':
            transcript_manager.add_agent_message(message)
        
        # Emit to client with transcript update
        socketio.emit('conversation', {
            'data': conversation_text.__dict__,
            'transcript': transcript_manager.get_transcript_text()
        })

    def on_agent_thinking(self, *args, **kwargs):
        agent_thinking = kwargs.get('agent_thinking') or (args[0] if args else None)
        if not agent_thinking:
            return
        print("Thinking event received:", agent_thinking.__dict__)
        
        # Extract thinking text
        thinking_text = agent_thinking.text if hasattr(agent_thinking, 'text') else str(agent_thinking)
        
        # Add to transcript
        transcript_manager.add_thinking(thinking_text)
        
        # Emit to client with transcript update
        socketio.emit('thinking', {
            'data': agent_thinking.__dict__,
            'transcript': transcript_manager.get_transcript_text()
        })

    def on_function_call_request(self, *args, **kwargs):
        function_call_request = kwargs.get('function_call_request') or (args[0] if args else None)
        if not function_call_request:
            return
        print("Function call event received:", function_call_request.__dict__)
        response = FunctionCallResponse(
            function_call_id=function_call_request.function_call_id,
            output="Function response here"
        )
        dg_connection.send_function_call_response(response)
        socketio.emit('function_call', {'data': function_call_request.__dict__})

    def on_agent_started_speaking(self, *args, **kwargs):
        agent_started_speaking = kwargs.get('agent_started_speaking') or (args[0] if args else None)
        if not agent_started_speaking:
            return
        print("Agent speaking event received:", agent_started_speaking.__dict__)
        socketio.emit('agent_speaking', {'data': agent_started_speaking.__dict__})

    def on_error(self, *args, **kwargs):
        error = kwargs.get('error') or (args[0] if args else None)
        if not error:
            return
        print("⚠️  Error event received:", error.__dict__)
        error_data = {
            'message': str(error),
            'type': error.__class__.__name__,
            'details': error.__dict__
        }
        print("Sending error to client:", error_data)
        socketio.emit('error', {'data': error_data})
        
        # Don't crash on audio errors - continue conversation
        if 'audio' in str(error).lower() or 'alsa' in str(error).lower():
            print("ℹ️  Audio error detected but continuing conversation...")

    def on_agent_stopped_speaking(self, *args, **kwargs):
        agent_stopped_speaking = kwargs.get('agent_stopped_speaking') or (args[0] if args else None)
        if not agent_stopped_speaking:
            return
        print("Agent stopped speaking event received:", agent_stopped_speaking.__dict__)
        socketio.emit('agent_stopped_speaking', {'data': agent_stopped_speaking.__dict__})

    def on_audio_data(self, *args, **kwargs):
        """Handle AudioData events from agent speech"""
        audio_data_event = kwargs.get('audio_data') or kwargs.get('audio_data_event') or (args[0] if args else None)
        if not audio_data_event:
            return
            
        print(f"\n🔊 AudioData event received!")
        print(f"Type: {type(audio_data_event)}")
        if hasattr(audio_data_event, '__dict__'):
            print(f"Dict: {audio_data_event.__dict__}")
            print(f"Keys: {list(audio_data_event.__dict__.keys())}")
        
        try:
            # Extract audio from AudioData event
            audio_bytes = None
            if hasattr(audio_data_event, 'audio') and audio_data_event.audio:
                audio_bytes = audio_data_event.audio
                print(f"✓ Got audio from .audio: {len(audio_bytes)} bytes")
            elif hasattr(audio_data_event, 'data') and audio_data_event.data:
                audio_bytes = audio_data_event.data
                print(f"✓ Got audio from .data: {len(audio_bytes)} bytes")
            
            if audio_bytes:
                # Convert to list for JSON serialization
                audio_list = list(audio_bytes) if isinstance(audio_bytes, (bytes, bytearray)) else audio_bytes
                print(f"🔊 Sending {len(audio_list)} audio samples to client")
                socketio.emit('agent_audio', {
                    'audio': audio_list,
                    'format': 'pcm16'
                })
            else:
                print("✗ No audio data found in AudioData event")
        except Exception as e:
            print(f"✗ Error handling AudioData: {e}")
            import traceback
            traceback.print_exc()
    
    def on_audio(self, *args, **kwargs):
        """Handle generic audio events (fallback)"""
        audio = kwargs.get('audio') or (args[0] if args else None)
        if not audio:
            return
        print(f"Generic Audio event received, type: {type(audio)}, size: {len(audio) if hasattr(audio, '__len__') else 'unknown'}")
        if audio:
            # Check if it's raw bytes/array or an object with audio property
            audio_data = None
            if isinstance(audio, (bytes, bytearray)):
                audio_data = list(audio)
            elif hasattr(audio, 'audio'):
                audio_data = list(audio.audio) if isinstance(audio.audio, (bytes, bytearray)) else audio.audio
            elif isinstance(audio, list):
                audio_data = audio
            
            if audio_data:
                print(f"Sending {len(audio_data)} audio samples to client")
                socketio.emit('agent_audio', {
                    'audio': audio_data,
                    'format': 'pcm16'
                })
            else:
                print("Could not extract audio data from audio event")

    def on_user_started_speaking(self, *args, **kwargs):
        user_started_speaking = kwargs.get('user_started_speaking') or (args[0] if args else None)
        if not user_started_speaking:
            return
        print("🎤 User started speaking event received:", user_started_speaking.__dict__)
        socketio.emit('user_started_speaking', {'data': user_started_speaking.__dict__})

    def on_user_stopped_speaking(self, *args, **kwargs):
        user_stopped_speaking = kwargs.get('user_stopped_speaking') or (args[0] if args else None)
        if not user_stopped_speaking:
            return
        print("🎤 User stopped speaking event received:", user_stopped_speaking.__dict__)
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

    print("Starting Deepgram connection...")
    if not dg_connection.start(options):
        print("Failed to start Deepgram connection")
        socketio.emit('error', {'data': {'message': 'Failed to start connection'}})
        return
    print("Deepgram connection started successfully")

audio_chunk_counter = 0
first_audio_logged = False

# Audio is handled by pyaudio directly on the server
# No need to stream audio from the browser

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
    global dg_connection, audio_chunk_counter, first_audio_logged
    
    print("\n=== Client disconnected, saving session ===")
    
    # Save transcript before closing connection (includes picture if uploaded)
    save_and_process_transcript()
    
    # Close Deepgram connection if it exists
    if dg_connection is not None:
        try:
            dg_connection.finish()
        except Exception as e:
            print(f"Warning: Error closing Deepgram connection: {e}")
        dg_connection = None
    
    # Reset counters for next session
    audio_chunk_counter = 0
    first_audio_logged = False

@socketio.on('end_call')
def handle_end_call():
    """Explicitly end call and save transcript"""
    print("\n=== End call requested ===")
    save_and_process_transcript()
    socketio.emit('call_ended', {'status': 'success'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    socketio.run(app, debug=False, port=port, host='0.0.0.0', use_reloader=False, allow_unsafe_werkzeug=True)