import { NextResponse } from 'next/server';

/**
 * POST /api/viva/token
 * 
 * Returns the Gemini API key for the Live API WebSocket connection.
 * The key is kept server-side in GEMINI_API_KEY and only passed to
 * the client on-demand per session request.
 * 
 * NOTE: For production, this should be replaced with ephemeral tokens
 * using the @google/genai SDK. For now, this approach works since the
 * key is already in NEXT_PUBLIC_ for other client-side Gemini uses.
 */
export async function POST() {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not configured on the server.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            apiKey,
            model: 'gemini-2.0-flash-live-001',
            wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`,
        });

    } catch (error: any) {
        console.error('Token endpoint error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
