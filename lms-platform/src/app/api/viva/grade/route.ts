import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

/**
 * POST /api/viva/grade
 * 
 * Receives the full conversation transcript from a completed voice viva
 * and sends it to Groq for semantic evaluation and grading.
 */
export async function POST(req: NextRequest) {
    try {
        const { transcript } = await req.json();

        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            return NextResponse.json(
                { error: 'Transcript is required and must be a non-empty array.' },
                { status: 400 }
            );
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return NextResponse.json(
                { error: 'GROQ_API_KEY is not configured.' },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey: groqApiKey });

        // Format the transcript into a readable string
        const formattedTranscript = transcript
            .map((entry: { role: string; text: string }) =>
                `${entry.role === 'user' ? 'Candidate' : 'Examiner'}: ${entry.text}`
            )
            .join('\n');

        const gradingPrompt = `You are an expert training evaluator for Balance Nutrition, a health and wellness company. 
You have just observed a live voice viva examination between an AI Examiner and a Counsellor Candidate.

Below is the full transcript of the conversation:

---
${formattedTranscript}
---

Please evaluate the candidate's performance based on:
1. **Knowledge Accuracy** (0-25): How correct and precise are their answers about BN products, protocols, and culture?
2. **Communication Clarity** (0-25): How clearly and confidently do they articulate their responses?
3. **Depth of Understanding** (0-25): Do they demonstrate deeper comprehension beyond surface-level facts?
4. **Professional Readiness** (0-25): Do they sound ready to represent BN in a professional counsellor role?

Return your response in this exact JSON format:
{
  "score": <total score out of 100>,
  "breakdown": {
    "knowledgeAccuracy": <0-25>,
    "communicationClarity": <0-25>,
    "depthOfUnderstanding": <0-25>,
    "professionalReadiness": <0-25>
  },
  "feedback": "<2-3 paragraph detailed feedback with strengths and areas for improvement>",
  "verdict": "<PASSED or NEEDS_REVISION>"
}`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a strict but fair evaluator. Always return valid JSON.' },
                { role: 'user', content: gradingPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
        });

        const rawResponse = completion.choices[0]?.message?.content || '{}';

        let result;
        try {
            result = JSON.parse(rawResponse);
        } catch {
            // If JSON parsing fails, return a safe default
            result = {
                score: 0,
                breakdown: { knowledgeAccuracy: 0, communicationClarity: 0, depthOfUnderstanding: 0, professionalReadiness: 0 },
                feedback: 'Unable to parse evaluation. Please try the viva again.',
                verdict: 'NEEDS_REVISION'
            };
        }

        return NextResponse.json({
            score: result.score || 0,
            feedback: result.feedback || 'No feedback available.',
            breakdown: result.breakdown || null,
            verdict: result.verdict || 'NEEDS_REVISION',
            totalQuestions: transcript.filter((t: { role: string }) => t.role === 'model').length,
        });

    } catch (error: any) {
        console.error('Viva grading error:', error);
        return NextResponse.json(
            { error: error.message || 'Grading failed' },
            { status: 500 }
        );
    }
}
