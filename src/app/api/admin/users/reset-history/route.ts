import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Wipe activity
        await supabaseAdmin.from('mentor_activity_logs').delete().eq('user_id', userId);
        
        // Wipe quizzes
        await supabaseAdmin.from('assessment_logs').delete().eq('user_id', userId);
        
        // Wipe progress
        await supabaseAdmin.from('mentor_progress').delete().eq('user_id', userId);
        
        // Wipe peer reviews (audits)
        await supabaseAdmin.from('summary_audits').delete().eq('user_id', userId);

        return NextResponse.json({ success: true, message: 'History wiped successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
