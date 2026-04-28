/**
 * GeminiLiveSession — WebSocket + Audio Pipeline Orchestrator
 *
 * Manages the full lifecycle of a bidirectional audio session with
 * the Gemini Multimodal Live API:
 *   1. WebSocket connection using an ephemeral token
 *   2. Mic capture via AudioWorklet (Float32 → PCM Int16 @ 16kHz)
 *   3. Speaker playback via AudioWorklet (PCM Int16 @ 24kHz → Float32)
 *   4. Transcript collection from inputTranscription / outputTranscription events
 */

export interface TranscriptEntry {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export type SessionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

export interface GeminiLiveSessionCallbacks {
    onStateChange?: (state: SessionState) => void;
    onTranscript?: (transcriptArray: TranscriptEntry[]) => void;
    onError?: (error: string) => void;
    onAudioLevel?: (level: number) => void;
}

const SYSTEM_INSTRUCTION = `You are "Aria", a warm, professional AI Examiner conducting a voice-based certification Viva for Balance Nutrition.

Your behaviour:
- Greet the candidate and introduce yourself briefly.
- Ask 15 questions across these areas: BN History & Culture, Nutrition & Program Knowledge, Operational Protocol, and Sales/MIS Intelligence.
- Ask one question at a time. Wait for the candidate's answer before asking the next.  
- If the candidate's answer is vague, probe deeper with a follow-up.
- Keep your tone encouraging but professional.
- After all questions, thank the candidate and say "This concludes your Viva. Good luck!"
- Keep your responses concise (2-3 sentences max per turn).`;

export class GeminiLiveSession {
    private ws: WebSocket | null = null;
    private captureContext: AudioContext | null = null;
    private playbackContext: AudioContext | null = null;
    private captureWorklet: AudioWorkletNode | null = null;
    private playbackWorklet: AudioWorkletNode | null = null;
    private mediaStream: MediaStream | null = null;
    private _state: SessionState = 'idle';
    private _transcript: TranscriptEntry[] = [];
    private _muted = false;
    private callbacks: GeminiLiveSessionCallbacks;

    constructor(callbacks: GeminiLiveSessionCallbacks = {}) {
        this.callbacks = callbacks;
    }

    get state(): SessionState { return this._state; }
    get transcript(): TranscriptEntry[] { return [...this._transcript]; }
    get isMuted(): boolean { return this._muted; }

    private setState(s: SessionState) {
        this._state = s;
        this.callbacks.onStateChange?.(s);
    }

    // ─── PUBLIC API ──────────────────────────────────────────────────

    /** Start the session: fetch token, open WS, start mic */
    async connect(): Promise<void> {
        try {
            this.setState('connecting');

            // 1. Fetch API key + WebSocket URL from our backend
            const tokenRes = await fetch('/api/viva/token', { method: 'POST' });
            if (!tokenRes.ok) {
                const err = await tokenRes.json();
                throw new Error(err.error || 'Failed to get session credentials');
            }
            const { wsUrl } = await tokenRes.json();

            // 2. Open WebSocket directly to Gemini using the pre-built URL
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => this.onWsOpen();
            this.ws.onmessage = (e) => this.onWsMessage(e);
            this.ws.onerror = () => this.onWsError('WebSocket connection failed');
            this.ws.onclose = () => this.onWsClose();

        } catch (err: any) {
            this.setState('error');
            this.callbacks.onError?.(err.message);
        }
    }

    /** Disconnect everything cleanly */
    disconnect(): TranscriptEntry[] {
        // Close WebSocket
        if (this.ws) {
            try { this.ws.close(); } catch { }
            this.ws = null;
        }
        // Stop mic
        this.stopAudio();
        this.setState('closed');
        return this.transcript;
    }

    /** Toggle mic mute */
    toggleMute(): boolean {
        this._muted = !this._muted;
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(t => {
                t.enabled = !this._muted;
            });
        }
        return this._muted;
    }

    // ─── WEBSOCKET HANDLERS ──────────────────────────────────────────

    private onWsOpen() {
        console.log('[GeminiLive] WebSocket opened, sending setup...');

        // Send the setup/config message as the first frame
        // Format per: https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
        // NOTE: field names follow the WebSocket/protobuf-JSON naming used by
        // the Gemini Live API — snake_case for transcription config keys.
        const setupMessage = {
            setup: {
                model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
                generation_config: {
                    response_modalities: ['AUDIO'],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: 'Aoede',
                            },
                        },
                    },
                },
                system_instruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }],
                },
                input_audio_transcription: {},
                output_audio_transcription: {},
            },
        };
        this.ws?.send(JSON.stringify(setupMessage));
        console.log('[GeminiLive] Setup message sent:', JSON.stringify(setupMessage, null, 2));
    }

    private async onWsMessage(event: MessageEvent) {
        try {
            let dataText: string;
            if (event.data instanceof Blob) {
                dataText = await event.data.text();
            } else {
                dataText = event.data;
            }

            const msg = JSON.parse(dataText);
            console.log('[GeminiLive] Received message keys:', Object.keys(msg));

            // ─── Setup complete acknowledgment ───────────────────
            if ('setupComplete' in msg) {
                console.log('[GeminiLive] Setup complete — session is live!');
                this.setState('connected');
                // Start audio capture + playback AFTER server confirms setup
                this.startAudio();
                return;
            }

            // ─── Server closing (goAway) ─────────────────────────
            if ('goAway' in msg) {
                console.warn('[GeminiLive] goAway received — server closing session soon');
                return;
            }

            const sc = msg.serverContent;
            if (!sc) return;

            // ─── Audio output from Gemini ────────────────────────
            if (sc.modelTurn?.parts) {
                for (const part of sc.modelTurn.parts) {
                    if (part.inlineData?.data) {
                        this.playAudioChunk(part.inlineData.data);
                    }
                }
            }

            // ─── User speech transcript (two possible key styles) ─
            const inputText =
                sc.inputTranscription?.text ||
                sc.input_transcription?.text ||
                '';
            if (inputText) {
                this.appendToTranscript('user', inputText);
                console.log('[GeminiLive] User transcript chunk:', inputText.trim());
            }

            // ─── Model speech transcript ─────────────────────────
            const outputText =
                sc.outputTranscription?.text ||
                sc.output_transcription?.text ||
                '';
            if (outputText) {
                this.appendToTranscript('model', outputText);
                console.log('[GeminiLive] Model transcript chunk:', outputText.trim());
            }

            // ─── Barge-in / Interruption ─────────────────────────
            if (sc.interrupted) {
                console.log('[GeminiLive] Barge-in detected, clearing playback queue');
                this.playbackWorklet?.port.postMessage('clear');
            }

            // ─── Turn complete ───────────────────────────────────
            if (sc.turnComplete) {
                console.log('[GeminiLive] Model turn complete');
            }

        } catch (err) {
            console.warn('[GeminiLive] Failed to parse WS message:', err);
        }
    }

    private appendToTranscript(role: 'user' | 'model', text: string) {
        if (!text.trim()) return;

        const last = this._transcript[this._transcript.length - 1];
        if (last && last.role === role) {
            // Only add a space if the previous text does not end with space 
            // and the new text does not start with space or punctuation
            const pre = last.text;
            const needsSpace = !pre.endsWith(' ') && 
                               !text.startsWith(' ') && 
                               !/^[.,!?]/.test(text);
                               
            last.text = pre + (needsSpace ? ' ' : '') + text;
            last.timestamp = Date.now();
        } else {
            this._transcript.push({ role, text: text.trim(), timestamp: Date.now() });
        }
        
        // Trigger React clone update
        this.callbacks.onTranscript?.(this.transcript);
    }

    private onWsError(detail: string) {
        console.error('[GeminiLive] WS Error:', detail);
        this.setState('error');
        this.callbacks.onError?.(detail);
    }

    private onWsClose() {
        console.log('[GeminiLive] WebSocket closed. Current state:', this._state);
        if (this._state !== 'closed' && this._state !== 'error') {
            this.setState('closed');
        }
    }

    // ─── AUDIO PIPELINE ─────────────────────────────────────────────

    private async startAudio() {
        try {
            // ── Capture (mic → Gemini) ───
            this.captureContext = new AudioContext({ sampleRate: 16000 });
            await this.captureContext.audioWorklet.addModule('/worklets/audio-capture-processor.js');

            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            const source = this.captureContext.createMediaStreamSource(this.mediaStream);
            this.captureWorklet = new AudioWorkletNode(this.captureContext, 'audio-capture-processor');

            this.captureWorklet.port.onmessage = (e: MessageEvent) => {
                if (this._muted || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

                const pcmBuffer: ArrayBuffer = e.data;
                const base64 = this.arrayBufferToBase64(pcmBuffer);

                // Correct Live API format: realtimeInput.mediaChunks array
                const msg = {
                    realtimeInput: {
                        mediaChunks: [
                            {
                                data: base64,
                                mimeType: 'audio/pcm;rate=16000',
                            },
                        ],
                    },
                };
                this.ws.send(JSON.stringify(msg));
            };

            source.connect(this.captureWorklet);
            this.captureWorklet.connect(this.captureContext.destination); // needed to keep the worklet alive

            // ── Playback (Gemini → speakers) ───
            this.playbackContext = new AudioContext({ sampleRate: 24000 });
            await this.playbackContext.audioWorklet.addModule('/worklets/audio-playback-processor.js');
            this.playbackWorklet = new AudioWorkletNode(this.playbackContext, 'audio-playback-processor');
            this.playbackWorklet.connect(this.playbackContext.destination);

        } catch (err: any) {
            console.error('Audio setup failed:', err);
            this.callbacks.onError?.(`Microphone access failed: ${err.message}`);
        }
    }

    private playAudioChunk(base64Data: string) {
        if (!this.playbackWorklet) return;
        const bytes = atob(base64Data);
        const buffer = new ArrayBuffer(bytes.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
            view[i] = bytes.charCodeAt(i);
        }
        this.playbackWorklet.port.postMessage(buffer, [buffer]);
    }

    private stopAudio() {
        // Stop mic tracks
        this.mediaStream?.getTracks().forEach(t => t.stop());
        this.mediaStream = null;

        // Disconnect worklets
        try { this.captureWorklet?.disconnect(); } catch { }
        try { this.playbackWorklet?.disconnect(); } catch { }
        this.captureWorklet = null;
        this.playbackWorklet = null;

        // Close audio contexts
        try { this.captureContext?.close(); } catch { }
        try { this.playbackContext?.close(); } catch { }
        this.captureContext = null;
        this.playbackContext = null;
    }

    // ─── UTIL ───────────────────────────────────────────────────────

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
