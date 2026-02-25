import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, SENDER_EMAIL } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const { userId, topicCode, score, totalQuestions, results } = await req.json();

        if (!userId || !topicCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch user profile and buddy info
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('full_name, training_buddy')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            console.error('Error fetching profile for notification:', profileError);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        let buddies = [];
        try {
            buddies = typeof profile.training_buddy === 'string'
                ? JSON.parse(profile.training_buddy)
                : profile.training_buddy;
        } catch (e) {
            console.error('Error parsing training_buddy JSON:', e);
        }

        if (!Array.isArray(buddies) || buddies.length === 0) {
            // Fallback for legacy comma-separated emails or single email string
            if (profile.training_buddy && typeof profile.training_buddy === 'string' && profile.training_buddy.includes('@')) {
                buddies = profile.training_buddy.split(',').map(email => ({
                    name: "BN Admin",
                    email: email.trim()
                }));
            } else {
                return NextResponse.json({ message: 'No buddies to notify' });
            }
        }

        const percentage = Math.round((score / (totalQuestions || 5)) * 100);
        const counselorName = profile.full_name || 'A counselor';

        // 2. Format results for email if available
        const resultsHtml = results && Array.isArray(results) ? `
          <div style="margin-top: 25px;">
            <p style="font-size: 14px; font-weight: 900; color: #0E585860; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Review Breakdown</p>
            ${results.map((r: any, i: number) => `
              <div style="background: #ffffff; border: 1px solid #0E585808; border-radius: 12px; padding: 15px; margin-bottom: 10px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #0E5858;">Q${i + 1}: ${r.type === 'text' ? 'Subjective' : 'MCQ'}</p>
                <div style="font-size: 13px; color: #333; line-height: 1.5;">
                  <p style="margin: 0 0 5px 0;"><strong>Response:</strong> ${r.providedAnswer}</p>
                  <p style="margin: 0; color: ${r.isCorrect ? '#059669' : '#dc2626'}; font-weight: bold;">
                    ${r.isCorrect ? '✓ Correct' : '✗ Needs Review'}
                  </p>
                  ${r.aiFeedback ? `<p style="margin: 5px 0 0 0; font-size: 11px; font-style: italic; color: #666;">Feedback: "${r.aiFeedback}"</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : '';

        // 3. Send email to each buddy
        const emailPromises = buddies.map((buddy: any) => {
            if (!buddy.email) return Promise.resolve();

            return resend.emails.send({
                from: `BN Academy <${SENDER_EMAIL}>`,
                to: buddy.email,
                subject: `Assessment Report: ${counselorName} [${percentage}%]`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; color: #0E5858; max-width: 600px; margin: auto;">
            <div style="background: linear-gradient(135deg, #0E5858, #00B6C1); padding: 30px; border-radius: 24px; text-align: center; color: white; margin-bottom: 25px;">
              <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.7);">Retention Check Completed</p>
              <h1 style="margin: 0; font-size: 28px; font-family: serif;">${percentage}% Score</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Counselor: ${counselorName}</p>
            </div>

            <div style="padding: 0 10px;">
              <div style="display: flex; gap: 20px; background: #FAFCEE; padding: 20px; border-radius: 16px; border: 1px solid #00B6C120; margin-bottom: 20px;">
                <div style="flex: 1;">
                  <p style="margin: 0; font-size: 10px; color: #0E585860; text-transform: uppercase; font-weight: 900; letter-spacing: 0.1em;">Topic Code</p>
                  <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold;">${topicCode}</p>
                </div>
                <div style="flex: 1; text-align: right;">
                  <p style="margin: 0; font-size: 10px; color: #0E585860; text-transform: uppercase; font-weight: 900; letter-spacing: 0.1em;">Accuracy</p>
                  <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold;">${score} / ${totalQuestions}</p>
                </div>
              </div>

              ${resultsHtml}

              <div style="margin-top: 30px; text-align: center;">
                <a href="https://lms.balancenutrition.in/admin" style="display: inline-block; background: #0E5858; color: white; padding: 12px 30px; border-radius: 12px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Open Admin Dashboard</a>
              </div>

              <hr style="border: 0; border-top: 1px solid #0E585810; margin: 40px 0;" />
              <p style="font-size: 10px; color: #999; text-align: center; line-height: 1.6;">
                This represents a counselor's understanding of the specific training module. 
                Please provide mentorship if the score falls below 70%.
              </p>
            </div>
          </div>
        `
            });
        });

        await Promise.all(emailPromises);

        return NextResponse.json({ success: true, notified: buddies.length });

    } catch (error: any) {
        console.error('Notification API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
