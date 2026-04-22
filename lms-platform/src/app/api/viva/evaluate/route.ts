// POST /api/viva/evaluate
// Called after the viva conversation is complete
// Sends the full transcript to Groq for structured evaluation
// Then saves results to Supabase + triggers certificate if score >= 70

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { vivaQuestions } from '@/data/vivaQuestions';
export interface TurnHistory {
    heard: string;
    aiResponse: string;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface EvaluateRequest {
    userId: string;
    userName: string;
    userEmail: string;
    transcript: TurnHistory[]; // Full conversation transcript
}

export interface QuestionResult {
    topicId: string;
    section: string;
    question: string;
    candidateAnswer: string;
    score: number; // 0.0 – 1.0
    feedback: string;
}

export interface EvaluateResponse {
    totalScore: number; // 0 – 100
    passed: boolean;
    sectionScores: Record<string, number>;
    questionResults: QuestionResult[];
    narrativeFeedback: string;
}

export async function POST(req: NextRequest) {
    try {
        const { userId, userName, userEmail, transcript }: EvaluateRequest = await req.json();

        if (!transcript || transcript.length === 0) {
            return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
        }

        // ── Build full conversation text for Groq ──────────────────
        const conversationText = transcript
            .map((t, i) => `Turn ${i + 1}:\nAI: ${t.aiResponse}\nCandidate: ${t.heard}`)
            .join('\n\n');

        const questionList = vivaQuestions.map((q, i) =>
            `${i + 1}. [${q.id}] ${q.section}: "${q.question}"\n   Reference Answer: "${q.referenceAnswer}"`
        ).join('\n\n');

        // ── Groq: Evaluate each of the 18 topics ──────────────────
        const groqResponse = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `You are a senior examiner evaluating a candidate's oral viva for Balance Nutrition counsellor certification.

You will receive:
1. A full conversation transcript between an AI examiner and the candidate
2. The 18 required topics/questions that needed to be covered

For EACH of the 18 topics, identify what the candidate said (even if spread across multiple turns) and score them.

Respond in this exact JSON format:
{
  "questionResults": [
    {
      "topicId": "q1",
      "candidateAnswer": "summarize what they said about this topic",
      "score": 0.8,
      "feedback": "one sentence constructive note"
    },
    ... (all 18 topics)
  ],
  "narrativeFeedback": "3-4 sentence overall assessment of the candidate's performance, strengths, and areas for improvement",
  "overallImpression": "excellent|good|needs_improvement"
}`
                },
                {
                    role: 'user',
                    content: `CONVERSATION TRANSCRIPT:\n${conversationText}\n\n---\n\n18 REQUIRED TOPICS (with reference answers):\n${questionList}`
                }
            ]
        });

        const evaluation = JSON.parse(groqResponse.choices[0].message.content || '{}');

        // ── Calculate scores ──────────────────────────────────────
        const questionResults: QuestionResult[] = (evaluation.questionResults || []).map((r: {
            topicId: string;
            candidateAnswer: string;
            score: number;
            feedback: string;
        }) => {
            const q = vivaQuestions.find(vq => vq.id === r.topicId);
            return {
                topicId: r.topicId,
                section: q?.section || 'Unknown',
                question: q?.question || 'Unknown',
                candidateAnswer: r.candidateAnswer || '',
                score: Math.max(0, Math.min(1, r.score || 0)),
                feedback: r.feedback || '',
            };
        });

        // Section-wise scores
        const sectionScores: Record<string, { total: number; count: number }> = {};
        for (const result of questionResults) {
            if (!sectionScores[result.section]) {
                sectionScores[result.section] = { total: 0, count: 0 };
            }
            sectionScores[result.section].total += result.score;
            sectionScores[result.section].count += 1;
        }
        const sectionAverages: Record<string, number> = {};
        for (const [section, data] of Object.entries(sectionScores)) {
            sectionAverages[section] = Math.round((data.total / data.count) * 100);
        }

        const totalRaw = questionResults.reduce((sum, r) => sum + r.score, 0);
        const totalScore = Math.round((totalRaw / Math.max(questionResults.length, 1)) * 100);
        const passed = totalScore >= 70;

        // ── Save to Supabase ──────────────────────────────────────
        if (userId) {
            try {
                await supabaseAdmin.from('certification_attempts').insert([{
                    user_id: userId,
                    score: totalScore,
                    full_feedback: evaluation.narrativeFeedback || '',
                    answers: {
                        mode: 'viva',
                        questionResults,
                        sectionScores: sectionAverages,
                        transcriptTurns: transcript.length,
                    },
                    status: passed ? 'passed' : 'failed',
                }]);
            } catch (dbErr) {
                console.warn('[VIVA EVALUATE] DB save warning:', dbErr);
            }

            // Log activity
            try {
                await supabaseAdmin.from('mentor_activity_logs').insert([{
                    user_id: userId,
                    activity_type: 'VIVA_COMPLETED',
                    content_title: `Viva Score: ${totalScore}% — ${passed ? 'PASSED' : 'FAILED'}`,
                    module_id: 'certification',
                }]);
            } catch (logErr) {
                console.warn('[VIVA EVALUATE] Activity log warning:', logErr);
            }
        }

        // ── Trigger certificate if passed ─────────────────────────
        if (passed && userId && userEmail && userName) {
            try {
                const certId = `BN-VIVA-${Date.now().toString(36).toUpperCase()}`;
                const completionDate = new Date().toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric'
                });

                // Dispatch via internal import (avoids needing APP_URL env var)
                const { mailer, SENDER_EMAIL } = await import('@/lib/mail');
                await mailer.sendMail({
                    from: `BN Academy <${SENDER_EMAIL}>`,
                    to: [userEmail],
                    cc: ['workwithus@balancenutrition.in'],
                    replyTo: SENDER_EMAIL,
                    subject: `🎉 Congratulations ${userName}! Your BN Viva Certificate is Ready`,
                    html: `<div style="font-family:Georgia,serif;padding:40px;max-width:600px;margin:0 auto;background:#FAFCEE;">
  <h1 style="color:#0E5858">Congratulations, ${userName}! 🎉</h1>
  <p style="color:#444;">You have successfully completed your <strong>BN Conversational Viva</strong> with a score of <strong>${totalScore}%</strong>.</p>
  <p style="color:#444;">Certificate ID: <strong>${certId}</strong> | Date: ${completionDate}</p>
  <p style="color:#888;font-style:italic;">Signed, BN Academy — Khyati Rupani, Chief Nutritionist</p>
</div>`,
                });

                // Save cert record
                await supabaseAdmin.from('certification_attempts').insert([{
                    user_id: userId,
                    score: 100,
                    full_feedback: `Viva certificate issued. Score: ${totalScore}%`,
                    answers: { certificateId: certId, completionDate, mode: 'viva_cert' },
                    status: 'training_complete',
                }]);
            } catch (certErr) {
                console.warn('[VIVA EVALUATE] Certificate dispatch warning:', certErr);
            }
        }


        const response: EvaluateResponse = {
            totalScore,
            passed,
            sectionScores: sectionAverages,
            questionResults,
            narrativeFeedback: evaluation.narrativeFeedback || 'Assessment complete.',
        };

        return NextResponse.json(response);

    } catch (error: unknown) {
        console.error('[VIVA EVALUATE ERROR]:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
