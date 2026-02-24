import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syllabusData } from '@/data/syllabus';

export async function GET(request: Request) {
    try {
        // Calculate "Today" in IST (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);

        const todayStart = new Date(istNow);
        todayStart.setUTCHours(0, 0, 0, 0);
        // Correct back to UTC for Supabase query
        const utcStart = new Date(todayStart.getTime() - istOffset).toISOString();

        // 1. Fetch all counselors
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .in('role', ['counsellor', 'mentor']);

        // 2. Fetch all activity from today
        const [
            { data: progress },
            { data: assessments },
            { data: logs }
        ] = await Promise.all([
            supabaseAdmin.from('mentor_progress').select('*').gte('created_at', utcStart),
            supabaseAdmin.from('assessment_logs').select('*').gte('created_at', utcStart),
            supabaseAdmin.from('mentor_activity_logs').select('*').gte('created_at', utcStart)
        ]);

        // 3. Generate Report Object
        const report = (profiles || []).map(p => {
            const userProgress = (progress || []).filter(pr => pr.user_id === p.id);
            const userAssessments = (assessments || []).filter(a => a.user_id === p.id);
            const userLogs = (logs || []).filter(l => l.user_id === p.id);

            return {
                name: p.full_name,
                email: p.email,
                segmentsCompleted: userProgress.length,
                testsTaken: userAssessments.length,
                avgScore: userAssessments.length > 0
                    ? Math.round(userAssessments.reduce((acc, curr) => acc + curr.score, 0) / userAssessments.length)
                    : 0,
                activities: userLogs.length,
                details: userAssessments.map(a => ({
                    topic: a.topic_code,
                    score: a.score,
                    at: a.created_at
                }))
            };
        });

        // 4. Send Email placeholder 
        // In a real prod env, we'd use Resend or SendGrid here.
        // For now we log it and return it.
        console.log("Daily Report Generated for workwithus@balancenutrition.in");

        return NextResponse.json({
            date: todayStart.toDateString(),
            recipient: 'workwithus@balancenutrition.in',
            report
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
