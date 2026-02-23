import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserReadiness() {
    console.log('🔍 Checking for production-ready counsellor accounts...\n');

    // Fetch all profiles
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role');

    if (pError) {
        console.error('Error fetching profiles:', pError.message);
        return;
    }

    const readyUsers = [];

    for (const profile of profiles || []) {
        if (profile.role === 'admin') continue;

        // 1. Check assessment logs (Quizzes & Viva/Final Test)
        const { data: assessments } = await supabase
            .from('assessment_logs')
            .select('topic_code, score')
            .eq('user_id', profile.id);

        // 2. Check summary audits (Peer Reviews)
        const { data: audits } = await supabase
            .from('summary_audits')
            .select('topic_code, score')
            .eq('user_id', profile.id);

        // 3. Check progress
        const { data: progress } = await supabase
            .from('mentor_progress')
            .select('topic_code')
            .eq('user_id', profile.id);

        const hasQuizzes = (assessments?.length ?? 0) > 0;
        const hasAudits = (audits?.length ?? 0) > 0;
        const quizCount = assessments?.length ?? 0;
        const auditCount = audits?.length ?? 0;
        const progressCount = progress?.length ?? 0;

        // Criteria for "production ready":
        // At least some quiz scores and at least some peer review feedback
        const isReady = hasQuizzes && hasAudits;

        if (isReady || (progressCount > 0)) {
            readyUsers.push({
                email: profile.email,
                name: profile.full_name,
                quizzes: quizCount,
                audits: auditCount,
                progress: progressCount,
                isReady: isReady ? '✅ YES' : '⚠️ PARTIAL'
            });
        }
    }

    if (readyUsers.length === 0) {
        console.log('❌ No production-ready counsellor accounts found.');
    } else {
        console.table(readyUsers);
        console.log('\nEmails ready for production use:');
        readyUsers.filter(u => u.isReady === '✅ YES').forEach(u => console.log(`- ${u.email}`));
    }
}

checkUserReadiness().catch(console.error);
