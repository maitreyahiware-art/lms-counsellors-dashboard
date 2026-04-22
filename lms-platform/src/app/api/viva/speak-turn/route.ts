// POST /api/viva/speak-turn
// Receives: FormData { audio: Blob, history: JSON string of previous turns }
// Sends audio to Gemini 2.5 Flash Lite for:
//   1. Transcription of what the candidate said
//   2. Generating the next natural conversational response
// Returns: { heard, response, topicJustCovered, isComplete }

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { GEMINI_VIVA_SYSTEM } from '@/data/vivaQuestions';

export interface TurnHistory {
    heard: string;
    aiResponse: string;
    topicCovered: string | null;
}

export interface SpeakTurnResponse {
    heard: string;
    response: string;
    topicJustCovered: string | null;
    isComplete: boolean;
    error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<SpeakTurnResponse>> {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File | null;
        const historyRaw = formData.get('history') as string | null;
        const isOpening = formData.get('isOpening') === 'true'; // First turn, no audio

        // Parse conversation history for context
        const history: TurnHistory[] = historyRaw ? JSON.parse(historyRaw) : [];

        // Build the messages array for Gemini
        // Each past turn becomes a user/assistant exchange so Gemini has full context
        const pastMessages: { role: 'user' | 'assistant'; content: string }[] = [];
        for (const turn of history) {
            pastMessages.push({ role: 'user', content: turn.heard });
            pastMessages.push({ role: 'assistant', content: turn.aiResponse });
        }

        // For the opening turn (Gemini starts the viva), no audio input needed
        if (isOpening) {
            const result = await generateText({
                model: google('gemini-2.5-flash-lite'),
                system: GEMINI_VIVA_SYSTEM,
                messages: [
                    {
                        role: 'user',
                        content: 'Please begin the viva assessment now. Greet the candidate warmly and ask your first question.'
                    }
                ],
            });

            let parsed: SpeakTurnResponse;
            try {
                // Gemini should return JSON per the system prompt
                const rawText = result.text.trim();
                // Extract JSON from potential markdown code blocks
                const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/({[\s\S]*})/);
                parsed = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
            } catch {
                // Fallback: treat the whole response as the greeting
                parsed = {
                    heard: '',
                    response: result.text,
                    topicJustCovered: null,
                    isComplete: false,
                };
            }

            return NextResponse.json(parsed);
        }

        // Normal turn: Audio required
        if (!audioFile) {
            return NextResponse.json(
                { heard: '', response: '', topicJustCovered: null, isComplete: false, error: 'No audio provided' },
                { status: 400 }
            );
        }

        // Convert audio file to ArrayBuffer → Buffer for Gemini
        const audioArrayBuffer = await audioFile.arrayBuffer();
        const audioUint8 = new Uint8Array(audioArrayBuffer);
        const mediaType = (audioFile.type || 'audio/webm') as `audio/${string}`;

        // Build Gemini call with audio + conversation history
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await generateText({
            model: google('gemini-2.5-flash-lite'),
            system: GEMINI_VIVA_SYSTEM,
            messages: [
                // Inject previous conversation as context (text-only history)
                ...pastMessages,
                // Current turn: the candidate's audio answer
                {
                    role: 'user' as const,
                    content: [
                        {
                            type: 'file' as const,
                            data: audioUint8,
                            mediaType,
                        },
                        {
                            type: 'text' as const,
                            text: 'This audio contains my answer to your previous question. Please transcribe it and respond accordingly.'
                        }
                    ],
                },
            ],
        });

        // Parse the structured JSON response from Gemini
        let parsed: SpeakTurnResponse;
        try {
            const rawText = result.text.trim();
            const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/({[\s\S]*})/);
            parsed = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
        } catch {
            // Fallback: use raw text as response
            parsed = {
                heard: '[Audio processed]',
                response: result.text,
                topicJustCovered: null,
                isComplete: false,
            };
        }

        return NextResponse.json(parsed);

    } catch (error: unknown) {
        console.error('[VIVA SPEAK-TURN ERROR]:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                heard: '',
                response: 'I apologise — there was a technical issue. Please try again.',
                topicJustCovered: null,
                isComplete: false,
                error: message
            },
            { status: 500 }
        );
    }
}
