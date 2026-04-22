import { useState, useRef, useCallback, useEffect } from "react";

interface GeminiLiveAPIOptions {
    systemInstruction: string;
    onTranscript: (text: string, role: 'user' | 'model') => void;
    onTurnComplete: () => void;
}

export function useGeminiLiveAPI({ systemInstruction, onTranscript, onTurnComplete }: GeminiLiveAPIOptions) {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [isThinking, setIsThinking] = useState(false);
    
    // Core WS/Audio Refs
    const wsRef = useRef<WebSocket | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    
    // Playback state
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const nextPlaybackTimeRef = useRef<number>(0);

    // To cleanly convert a blob/Uint8Array to base64
    const bufferToBase64 = (buffer: Uint8Array | Int16Array) => {
        const bytes = new Uint8Array(buffer.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const base64ToFloat32 = (base64: string): Float32Array => {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        // Gemini sends 16-bit PCM. We need to convert it to Float32 for Web Audio API playback
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }
        return float32Array;
    };

    const playAudioBuffer = (float32Data: Float32Array) => {
        if (!playbackCtxRef.current) return;
        
        // Gemini streams playback at 24kHz
        const audioBuffer = playbackCtxRef.current.createBuffer(1, float32Data.length, 24000);
        audioBuffer.getChannelData(0).set(float32Data);

        const source = playbackCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackCtxRef.current.destination);

        const currentTime = playbackCtxRef.current.currentTime;
        const playTime = Math.max(currentTime, nextPlaybackTimeRef.current);
        source.start(playTime);
        nextPlaybackTimeRef.current = playTime + audioBuffer.duration;
    };

    const connect = useCallback(async () => {
        try {
            setStatus('connecting');
            
            // 1. Initialize playback context properly upon user interaction
            playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
            nextPlaybackTimeRef.current = playbackCtxRef.current.currentTime;

            // 2. Setup WebSocket
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY");

            const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            const isSetupComplete = { current: false };

            ws.onopen = async () => {
                setStatus('connected');
                // Send Setup Message
                ws.send(JSON.stringify({
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        }
                    }
                }));

                // 3. Initialize Microphone Recording via Worklet
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    micStreamRef.current = stream;
                    
                    audioCtxRef.current = new AudioContext({ sampleRate: 16000 });
                    await audioCtxRef.current.audioWorklet.addModule('/worklets/audio-processor.js');
                    
                    const source = audioCtxRef.current.createMediaStreamSource(stream);
                    const processor = new AudioWorkletNode(audioCtxRef.current, 'gemini-audio-processor');
                    
                    processor.port.onmessage = (e) => {
                        // Crucial: Wait for setupComplete before pouring audio onto the socket!
                        if (ws.readyState === WebSocket.OPEN && isSetupComplete.current) {
                            const int16Buffer = e.data; // Int16Array
                            const base64Audio = bufferToBase64(int16Buffer);
                            ws.send(JSON.stringify({
                                realtimeInput: {
                                    mediaChunks: [{
                                        mimeType: "audio/pcm;rate=16000",
                                        data: base64Audio
                                    }]
                                }
                            }));
                        }
                    };
                    
                    source.connect(processor);
                } catch (micErr) {
                    console.error("Mic access error:", micErr);
                    setStatus('error');
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.setupComplete) {
                        isSetupComplete.current = true;
                        // Ask it to speak the first question by sending a "hello" message from the user text
                        ws.send(JSON.stringify({
                            clientContent: {
                                turns: [{ role: 'user', parts: [{ text: 'Hello Aria, I am ready to begin the viva.' }] }],
                                turnComplete: true
                            }
                        }));
                    }

                    // Handle Server Content (Responses)
                    if (data.serverContent) {
                        const modelTurn = data.serverContent.modelTurn;
                        if (modelTurn && modelTurn.parts) {
                            for (const part of modelTurn.parts) {
                                // 1. Audio Part -> Playback
                                if (part.inlineData && part.inlineData.mimeType.includes('audio/pcm')) {
                                    setIsThinking(false);
                                    const float32Data = base64ToFloat32(part.inlineData.data);
                                    playAudioBuffer(float32Data);
                                }
                                
                                // 2. Text Part -> Transcript
                                if (part.text) {
                                    onTranscript(part.text, 'model');
                                }
                            }
                        }

                        if (data.serverContent.turnComplete) {
                            onTurnComplete();
                        }
                    }
                } catch (parseErr) {
                    console.error("WS Parse Error:", parseErr);
                }
            };

            ws.onerror = (err) => {
                console.error("WS Error:", err);
                setStatus('error');
            };
            ws.onclose = (event) => {
                console.warn(`WS Closed: code=${event.code}, reason=${event.reason}`);
                setStatus('idle');
            };

        } catch (error) {
            console.error("Connect error:", error);
            setStatus('error');
        }
    }, [systemInstruction, onTranscript, onTurnComplete]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
        }
        if (playbackCtxRef.current) {
            playbackCtxRef.current.close();
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
        }
        setStatus('idle');
    }, []);

    // Also a handy method to send raw text if we ever needed push buttons
    const sendTextMsg = useCallback((text: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                clientContent: {
                    turns: [{ role: 'user', parts: [{ text }] }],
                    turnComplete: true
                }
            }));
            onTranscript(text, 'user');
        }
    }, [onTranscript]);

    return {
        status,
        isThinking,
        connect,
        disconnect,
        sendTextMsg
    };
}
