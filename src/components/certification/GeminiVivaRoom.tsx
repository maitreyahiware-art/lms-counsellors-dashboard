"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, PhoneOff, AlertCircle, Loader2 } from "lucide-react";
import { GeminiLiveSession, TranscriptEntry, SessionState } from "@/lib/gemini-live";

interface GeminiVivaRoomProps {
    onComplete: (score: number, feedback: string, transcript: TranscriptEntry[]) => void;
}

export default function GeminiVivaRoom({ onComplete }: GeminiVivaRoomProps) {
    const [phase, setPhase] = useState<'intro' | 'active' | 'grading' | 'error'>('intro');
    const [connectionState, setConnectionState] = useState<SessionState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gradingProgress, setGradingProgress] = useState('');

    const sessionRef = useRef<GeminiLiveSession | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const handleStart = useCallback(async () => {
        setPhase('active');
        setError(null);

        const session = new GeminiLiveSession({
            onStateChange: (state) => {
                setConnectionState(state);
                if (state === 'error') {
                    setError('Connection to Gemini failed. Please check your network and try again.');
                    setPhase('error');
                }
            },
            onTranscript: (fullTranscript) => {
                setTranscript(fullTranscript);
            },
            onError: (err) => {
                console.error('Session error:', err);
                setError(err);
            },
        });

        sessionRef.current = session;
        await session.connect();
    }, []);

    const handleToggleMute = useCallback(() => {
        if (sessionRef.current) {
            const muted = sessionRef.current.toggleMute();
            setIsMuted(muted);
        }
    }, []);

    const handleEndCall = useCallback(async () => {
        if (!sessionRef.current) return;

        // 1. Disconnect and capture final transcript
        const finalTranscript = sessionRef.current.disconnect();
        setPhase('grading');
        setGradingProgress('Compiling session transcript...');

        try {
            // 2. Send transcript to Groq for grading
            setGradingProgress('AI is evaluating your performance...');
            const gradeRes = await fetch('/api/viva/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: finalTranscript }),
            });

            if (!gradeRes.ok) {
                throw new Error('Grading request failed');
            }

            const result = await gradeRes.json();
            setGradingProgress('Finalizing results...');

            // 3. Short delay for UX polish
            await new Promise(r => setTimeout(r, 1500));

            // 4. Pass results back to the parent certification page
            const feedbackText = result.feedback + 
                (result.breakdown ? `\n\n📊 Score Breakdown:\n• Knowledge Accuracy: ${result.breakdown.knowledgeAccuracy}/25\n• Communication Clarity: ${result.breakdown.communicationClarity}/25\n• Depth of Understanding: ${result.breakdown.depthOfUnderstanding}/25\n• Professional Readiness: ${result.breakdown.professionalReadiness}/25` : '');

            onComplete(result.score, feedbackText, finalTranscript);

        } catch (err: any) {
            console.error('Grading failed:', err);
            // Fallback — still complete with the transcript but no score
            onComplete(0, 'Grading failed. Your session transcript has been saved for manual review.', finalTranscript);
        }
    }, [onComplete]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            sessionRef.current?.disconnect();
        };
    }, []);

    return (
        <div className="bg-[#0f0f0f] rounded-3xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col border border-white/5 relative">
            <AnimatePresence mode="wait">

                {/* ── INTRO ──────────────────────────────────────────── */}
                {phase === 'intro' && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                    >
                        <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-[#00B6C1] to-[#0E5858] flex items-center justify-center shadow-[0_0_40px_rgba(0,182,193,0.3)]">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-serif text-white mb-3">Gemini Live Voice Viva</h2>
                        <p className="text-white/50 max-w-md mb-3 leading-relaxed">
                            You will speak directly with <strong className="text-[#00B6C1]">Aria</strong>, your AI Examiner, powered by Gemini.
                            The conversation is fully bidirectional — just speak naturally.
                        </p>
                        <div className="flex flex-col gap-2 text-white/30 text-xs mb-8 max-w-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1]" />
                                <span>Ensure your environment is quiet</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1]" />
                                <span>Use headphones for best experience</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1]" />
                                <span>6-8 questions covering all training areas</span>
                            </div>
                        </div>
                        <button
                            onClick={handleStart}
                            className="px-12 py-4 bg-gradient-to-r from-[#00B6C1] to-[#0E5858] text-white font-bold rounded-full hover:scale-105 transition-all text-lg shadow-lg shadow-[#00B6C1]/20"
                        >
                            Start Voice Call →
                        </button>
                    </motion.div>
                )}

                {/* ── ACTIVE SESSION ─────────────────────────────────── */}
                {phase === 'active' && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col"
                    >
                        {/* Header bar */}
                        <div className="w-full h-14 bg-[#1a1a1a] flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${connectionState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                <span className="text-white/70 font-medium text-sm">
                                    {connectionState === 'connected' ? 'Connected to Aria · AI Examiner' : 'Connecting...'}
                                </span>
                            </div>
                            <button
                                onClick={handleEndCall}
                                className="bg-red-500 hover:bg-red-600 text-white px-5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                <PhoneOff size={14} />
                                End Call & Evaluate
                            </button>
                        </div>

                        {/* Visualizer area */}
                        <div className="flex-shrink-0 flex items-center justify-center h-48 bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]">
                            <div className="relative">
                                {/* Pulsing rings */}
                                {connectionState === 'connected' && (
                                    <>
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 -m-8 rounded-full border border-[#00B6C1]/30"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                            className="absolute inset-0 -m-16 rounded-full border border-[#00B6C1]/20"
                                        />
                                    </>
                                )}
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00B6C1] to-[#0E5858] flex items-center justify-center shadow-[0_0_30px_rgba(0,182,193,0.25)] relative z-10">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Live transcript */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-[200px] max-h-[300px] scrollbar-thin">
                            {transcript.length === 0 && connectionState === 'connected' && (
                                <div className="text-center text-white/20 text-sm py-8">
                                    <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-[#00B6C1]/50" />
                                    Waiting for Aria to speak...
                                </div>
                            )}
                            {transcript.map((entry, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                        entry.role === 'user'
                                            ? 'bg-[#00B6C1]/20 text-[#00B6C1] rounded-br-md'
                                            : 'bg-white/5 text-white/80 rounded-bl-md'
                                    }`}>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 block mb-1">
                                            {entry.role === 'user' ? 'You' : 'Aria'}
                                        </span>
                                        {entry.text}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>

                        {/* Controls bar */}
                        <div className="flex items-center justify-center gap-4 p-5 bg-[#1a1a1a] border-t border-white/10">
                            <button
                                onClick={handleToggleMute}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                    isMuted
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                }`}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                            </button>
                            <button
                                onClick={handleEndCall}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/20"
                                title="End Call"
                            >
                                <PhoneOff size={22} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── GRADING ────────────────────────────────────────── */}
                {phase === 'grading' && (
                    <motion.div
                        key="grading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                    >
                        <div className="relative mb-6">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="w-20 h-20 rounded-full border-4 border-[#00B6C1]/20 border-t-[#00B6C1]"
                            />
                        </div>
                        <h3 className="text-2xl font-serif text-white mb-2">Evaluating Performance</h3>
                        <p className="text-white/40 text-sm max-w-sm mx-auto mb-3">
                            {gradingProgress}
                        </p>
                        <p className="text-white/20 text-xs">
                            {transcript.length} transcript entries captured
                        </p>
                    </motion.div>
                )}

                {/* ── ERROR ──────────────────────────────────────────── */}
                {phase === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                    >
                        <AlertCircle size={48} className="text-red-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
                        <p className="text-white/40 text-sm max-w-md mb-6">{error}</p>
                        <button
                            onClick={() => { setPhase('intro'); setError(null); }}
                            className="px-8 py-3 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all"
                        >
                            Try Again
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
