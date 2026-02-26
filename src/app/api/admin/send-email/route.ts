import { NextResponse } from 'next/server';
import { resend, SENDER_EMAIL } from '@/lib/mail';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { to, subject, message, userName } = await request.json();

        if (!to || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const payload = {
            from: `BN Academy <${SENDER_EMAIL}>`,
            to: [to],
            replyTo: auth.email,
            cc: ['workwithus@balancenutrition.in'],
            subject: subject,
            html: `
                <div style="font-family: serif; color: #0E5858; padding: 40px; background-color: #FAFCEE;">
                    <h2 style="color: #00B6C1;">Message from BN Academy Admin</h2>
                    <p style="font-size: 16px; line-height: 1.6;">Hello ${userName || 'Team Member'},</p>
                    <div style="background-color: white; padding: 25px; border-radius: 20px; border: 1px solid #0E585810; margin: 20px 0;">
                        <p style="font-size: 15px; color: #333;">${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 30px;">
                        This is an official communication from the Balance Nutrition Internal Training Academy.
                    </p>
                </div>
            `,
        };

        console.log(`\n[EMAIL LOGGER - SEND_EMAIL API]`);
        console.log(`-> From: ${payload.from}`);
        console.log(`-> To: ${payload.to.join(', ')}`);
        console.log(`-> Reply-To: ${payload.replyTo}`);
        console.log(`-> CC: ${payload.cc.join(', ')}`);
        console.log(`-> Subject: ${payload.subject}`);
        console.log(`-> Sending via Resend SDK...`);

        const data = await resend.emails.send(payload);

        console.log(`-> Resend API Response:`, JSON.stringify(data, null, 2));

        if (data.error) {
            console.error(`-> Resend API Error returned:`, data.error);
        } else {
            console.log(`-> Email successfully sent! ID: ${data.data?.id}\n`);
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('\n[EMAIL LOGGER - SEND_EMAIL ERROR]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
