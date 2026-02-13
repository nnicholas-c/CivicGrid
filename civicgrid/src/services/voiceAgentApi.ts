/**
 * Voice Agent API Service
 * Handles WebSocket connection to ML backend voice agent
 */

import { io, Socket } from 'socket.io-client';

export interface VoiceAgentEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSessionStarted?: (data: { session_id: string }) => void;
  onConversation?: (data: { data: any; transcript: string }) => void;
  onThinking?: (data: { data: any; transcript: string }) => void;
  onAgentSpeaking?: (data: { data: any }) => void;
  onAgentStoppedSpeaking?: (data: { data: any }) => void;
  onAgentAudio?: (data: { audio: number[]; format: string }) => void;
  onUserStartedSpeaking?: (data: { data: any }) => void;
  onUserStoppedSpeaking?: (data: { data: any }) => void;
  onError?: (data: { data: { message: string; type?: string; details?: any } }) => void;
}

class VoiceAgentService {
  private socket: Socket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private isConnected = false;
  private audioQueue: Int16Array[] = [];
  private isPlaying = false;
  private events: VoiceAgentEvents = {};
  
  // ML Backend URL - update this based on your deployment
  private ML_BACKEND_URL = import.meta.env.VITE_ML_BACKEND_URL || 'https://localhost:3000';

  constructor() {
    // Initialize audio context when needed
  }

  private async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      console.log('Audio context created, state:', this.audioContext.state);
      
      // Resume audio context if suspended (required by browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('Audio context resumed, new state:', this.audioContext.state);
      }
    }
  }

  async connect(events: VoiceAgentEvents = {}): Promise<void> {
    this.events = events;
    
    // Initialize audio context for playing received audio
    await this.initAudioContext();

    // No need for microphone - server uses pyaudio
    console.log('Note: Voice agent uses server microphone/speakers');
    console.log('Speak into the server\'s microphone to interact');

    // Connect to Socket.IO server
    console.log('Connecting to Socket.IO at:', this.ML_BACKEND_URL);
    this.socket = io(this.ML_BACKEND_URL, {
      path: '/socket.io',
      forceNew: true,
      transports: ['websocket'],
      timeout: 20000
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to voice agent');
      this.isConnected = true;
      this.startAudioStreaming();
      this.events.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from voice agent');
      this.isConnected = false;
      this.stopAudioStreaming();
      this.events.onDisconnect?.();
    });

    this.socket.on('session_started', (data) => {
      console.log('Session started:', data);
      this.events.onSessionStarted?.(data);
    });

    this.socket.on('conversation', (data) => {
      console.log('Conversation event:', data);
      this.events.onConversation?.(data);
    });

    this.socket.on('thinking', (data) => {
      console.log('Thinking event:', data);
      this.events.onThinking?.(data);
    });

    this.socket.on('agent_speaking', (data) => {
      console.log('Agent speaking:', data);
      this.events.onAgentSpeaking?.(data);
    });

    this.socket.on('agent_stopped_speaking', (data) => {
      console.log('Agent stopped speaking:', data);
      this.events.onAgentStoppedSpeaking?.(data);
    });

    this.socket.on('agent_audio', (data) => {
      console.log('Received agent audio:', data.audio?.length);
      if (data.audio && data.audio.length > 0) {
        const audioData = new Int16Array(data.audio);
        this.audioQueue.push(audioData);
        if (!this.isPlaying) {
          this.playNextAudio();
        }
      }
      this.events.onAgentAudio?.(data);
    });

    this.socket.on('user_started_speaking', (data) => {
      console.log('User started speaking:', data);
      this.events.onUserStartedSpeaking?.(data);
    });

    this.socket.on('user_stopped_speaking', (data) => {
      console.log('User stopped speaking:', data);
      this.events.onUserStoppedSpeaking?.(data);
    });

    this.socket.on('error', (data) => {
      console.error('Voice agent error:', data);
      this.events.onError?.(data);
    });
  }

  private startAudioStreaming() {
    // Audio is handled by server-side microphone/speaker via pyaudio
    // Frontend just displays transcript
    console.log('Voice agent using server-side microphone and speakers');
  }

  private stopAudioStreaming() {
    if (this.processor) {
      this.processor.onaudioprocess = null;
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
  }


  private async playNextAudio() {
    if (this.audioQueue.length === 0 || !this.audioContext) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;

    try {
      // Convert Int16Array to Float32Array for Web Audio API
      const float32Array = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        float32Array[i] = audioData[i] / 32768.0;
      }

      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 16000);
      audioBuffer.getChannelData(0).set(float32Array);

      // Create and play source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => {
        this.playNextAudio(); // Play next audio in queue
      };
      
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
    }
  }

  async uploadPicture(pictureBase64: string): Promise<void> {
    try {
      const response = await fetch(`${this.ML_BACKEND_URL}/upload_picture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          picture: pictureBase64
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload picture');
      }
    } catch (error) {
      console.error('Error uploading picture:', error);
      throw error;
    }
  }

  async getTranscript(): Promise<{ transcript: string; session_id: string }> {
    try {
      const response = await fetch(`${this.ML_BACKEND_URL}/transcript`);
      if (!response.ok) {
        throw new Error('Failed to get transcript');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting transcript:', error);
      throw error;
    }
  }

  endCall() {
    // Tell backend to save transcript
    if (this.socket && this.socket.connected) {
      console.log('Sending end_call event to backend');
      this.socket.emit('end_call');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.stopAudioStreaming();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isConnected = false;
    this.audioQueue = [];
    this.isPlaying = false;
  }

  isActive(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export default new VoiceAgentService();
