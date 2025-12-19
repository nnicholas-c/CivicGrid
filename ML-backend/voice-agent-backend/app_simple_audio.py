"""
Simple voice agent that plays audio on the server using pyaudio
This connects microphone/speaker directly to Deepgram Agent
"""
from deepgram import DeepgramClient, DeepgramClientOptions
from deepgram.clients.agent import SettingsOptions, Input, Output
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Initialize Deepgram with microphone/speaker support
config = DeepgramClientOptions(
    options={
        "keepalive": "true",
        "microphone_record": "true",
        "speaker_playback": "true",
    }
)

deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY", ""), config)
dg_connection = deepgram.agent.websocket.v("1")

# Configure settings
options = SettingsOptions()

# Audio settings
options.audio.input = Input(
    encoding="linear16",
    sample_rate=16000
)

options.audio.output = Output(
    encoding="linear16",
    sample_rate=16000,
    container="none"
)

# LLM configuration
options.agent.think.provider.type = "google"
options.agent.think.provider.model = "gemini-2.5-flash"

# Load prompt
prompt_path = Path(__file__).parent / 'agent_prompt.txt'
with open(prompt_path, 'r') as f:
    options.agent.think.prompt = f.read()

# Deepgram STT/TTS
options.agent.listen.provider.model = "nova-3"
options.agent.listen.provider.type = "deepgram"
options.agent.speak.provider.type = "deepgram"
options.agent.speak.provider.model = "aura-2-odysseus-en"

# Greeting
options.agent.greeting = "Hey there! This is the AI service agent. What problem or issue can I help report for you today?"

print("Starting Deepgram Agent with microphone and speaker...")
print("Speak into your microphone to interact with the agent")
print("Press Ctrl+C to stop")

if dg_connection.start(options):
    print("✓ Agent started successfully")
    print("✓ Listening...")
    try:
        # Keep alive
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping...")
        dg_connection.finish()
else:
    print("✗ Failed to start agent")
