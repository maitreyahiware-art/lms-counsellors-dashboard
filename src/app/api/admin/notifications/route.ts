import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data });
}

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { userId, title, message, type, channel } = await request.json();

        if (!userId || !title || !message) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const results: { dashboard?: boolean; email?: boolean; whatsapp?: string } = {};

        // --- Channel: Dashboard (in-app notification) ---
        if (!channel || channel === 'dashboard' || channel === 'all') {
            const { error } = await supabaseAdmin
                .from('notifications')
                .insert([{
                    user_id: userId,
                    title,
                    message,
                    type: type || 'info'
                }]);

            if (error) throw error;
            results.dashboard = true;

            // Log the activity
            await supabaseAdmin
                .from('mentor_activity_logs')
                .insert([{
                    user_id: userId,
                    activity_type: 'ADMIN_NOTIFICATION',
                    content_title: title,
                    module_id: 'System'
                }]);
        }

        // --- Channel: Email (via Resend) ---
        if (channel === 'email' || channel === 'all') {
            // Get user email from profile
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('email, full_name')
                .eq('id', userId)
                .single();

            if (profile?.email) {
                try {
                    const { resend, SENDER_EMAIL } = await import('@/lib/mail');
                    await resend.emails.send({
                        from: `BN Academy <${SENDER_EMAIL}>`,
                        to: profile.email,
                        subject: title,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; color: #0E5858;">
                                <div style="background: linear-gradient(135deg, #0E5858, #00B6C1); padding: 30px; border-radius: 16px; margin-bottom: 20px;">
                                    <h2 style="color: white; margin: 0; font-size: 20px;">${title}</h2>
                                    <p style="color: rgba(255,255,255,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 8px 0 0 0;">BN Academy Notification</p>
                                </div>
                                <p>Hello <strong>${profile.full_name || 'Counsellor'}</strong>,</p>
                                <div style="background-color: #FAFCEE; padding: 20px; border-radius: 12px; border: 1px solid #00B6C120; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br/>')}</p>
                                </div>
                                <hr style="border: 0; border-top: 1px solid #0E585810; margin: 30px 0;" />
                                <p style="font-size: 11px; color: #999; text-align: center;">This is an official notification from BN Academy.</p>
                            </div>
                        `
                    });
                    results.email = true;
                } catch (emailErr: any) {
                    console.error('Email send failed:', emailErr);
                    results.email = false;
                }
            }
        }

        // --- Channel: WhatsApp (generate link) ---
        if (channel === 'whatsapp' || channel === 'all') {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('phone, full_name')
                .eq('id', userId)
                .single();

            if (profile?.phone) {
                const cleanPhone = profile.phone.replace(/[^0-9]/g, '');
                const waText = encodeURIComponent(`*${title}*\n\n${message}\n\n— BN Academy`);
                results.whatsapp = `https://wa.me/${cleanPhone}?text=${waText}`;
            } else if (channel === 'whatsapp') {
                return NextResponse.json({ error: 'No phone number found for this user.' }, { status: 400 });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    // This is for users to mark as read
    try {
        const { id, isRead } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: isRead })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, notification: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
