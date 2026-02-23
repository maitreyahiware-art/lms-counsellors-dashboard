import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars from the root of the project
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const counsellors = [
    { name: 'Anjali Mehta', email: 'anjali.m@balancenutrition.in', password: 'ANJ-Mehta-51' },
    { name: 'Rahul Sharma', email: 'rahul.s@balancenutrition.in', password: 'RAH-Sharma-48' },
    { name: 'Priya Kapoor', email: 'priya.k@balancenutrition.in', password: 'PRI-Kapoor-22' },
    { name: 'Vikram Joshi', email: 'vikram.j@balancenutrition.in', password: 'VIK-Joshi-89' },
    { name: 'Sneha Reddy', email: 'sneha.r@balancenutrition.in', password: 'SNE-Reddy-33' },
    { name: 'Amit Verma', email: 'amit.v@balancenutrition.in', password: 'AMI-Verma-77' },
    { name: 'Kavita Patil', email: 'kavita.p@balancenutrition.in', password: 'KAV-Patil-65' },
    { name: 'Rohan Bakshi', email: 'rohan.b@balancenutrition.in', password: 'ROH-Bakshi-12' },
    { name: 'Neha Singh', email: 'neha.s@balancenutrition.in', password: 'NEH-Singh-44' },
    { name: 'Karan Thapar', email: 'karan.t@balancenutrition.in', password: 'KAR-Thapar-91' }
];

// Simplified syllabus for seeding
const modulesForSeed = [
    { id: 'module-1', topics: ['M1-01', 'M1-02', 'M1-03'] },
    { id: 'module-2', topics: ['M2-01', 'M2-02', 'M2-03', 'M2-04', 'M2-05'] },
    { id: 'module-3', topics: ['M3-01', 'M3-02', 'M3-03'] },
    { id: 'module-4', topics: ['M4-01', 'M4-02', 'M4-03', 'M4-04'] },
    { id: 'module-5', topics: ['M5-01', 'M5-02', 'M5-03'] }
];

async function seed() {
    console.log('🚀 Starting Real Counsellor Provisioning Flow with Progress...');

    for (const c of counsellors) {
        console.log(`\n--- Provisioning: ${c.name} ---`);

        // 1. Get/Create Auth User
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        let authUser = users.find(u => u.email === c.email);
        let userId;

        if (authUser) {
            userId = authUser.id;
            console.log(`   Updating existing auth user: ${userId}`);
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: c.password,
                user_metadata: { full_name: c.name, role: 'counsellor' }
            });
        } else {
            console.log(`   Creating new auth user...`);
            const { data: newAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: c.email,
                password: c.password,
                email_confirm: true,
                user_metadata: { full_name: c.name, role: 'counsellor' }
            });
            if (authError) {
                console.error(`   Auth Error for ${c.email}:`, authError.message);
                continue;
            }
            userId = newAuth.user.id;
        }

        // 2. Sync Profile
        console.log(`   Syncing profile...`);
        // Check if profile exists (might have different ID if manually created or deleted)
        const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id').eq('email', c.email).single();

        const targetId = existingProfile?.id || userId;

        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: targetId,
            full_name: c.name,
            email: c.email,
            role: 'mentor', // Using 'mentor' to satisfy check constraint
            created_at: new Date().toISOString()
        });

        if (profileError) {
            console.error(`   Profile Sync Error for ${c.email}:`, profileError.message);
            continue;
        }

        // 3. Inject Randomized Progress
        const progressLevel = Math.floor(Math.random() * 5) + 1; // 1 to 5 modules
        const progressEntries: any[] = [];
        const activities: any[] = [
            { user_id: targetId, activity_type: 'login', content_title: 'Platform Access', module_id: 'System' }
        ];

        for (let i = 0; i < progressLevel; i++) {
            const m = modulesForSeed[i];
            m.topics.forEach(tCode => {
                progressEntries.push({
                    user_id: targetId,
                    module_id: m.id,
                    topic_code: tCode
                });
            });
            activities.push({
                user_id: targetId,
                activity_type: 'view_topic',
                content_title: `Module ${i + 1} Completion`,
                module_id: m.id
            });
        }

        if (progressEntries.length > 0) {
            await supabaseAdmin.from('mentor_progress').upsert(progressEntries, { onConflict: 'user_id,topic_code' });
        }

        // 4. Inject Quiz Scores
        if (progressLevel >= 2) {
            console.log(`   Injecting quiz scores...`);
            const { error: quizError } = await supabaseAdmin.from('assessment_logs').insert({
                user_id: targetId,
                topic_code: `MODULE_REVIEW_${progressLevel}`,
                score: Math.floor(Math.random() * 2) + 4,
                total_questions: 5,
                raw_data: {
                    questions: [{ question: 'Compliance Protocol?', correctAnswer: 'BN Standard v2' }],
                    answers: ['BN Standard v2']
                }
            });
            if (quizError) console.error(`   Quiz Error:`, quizError.message);
        }

        // 5. Inject Audit (Peer Review)
        if (progressLevel >= 3) {
            console.log(`   Injecting peer audit...`);
            const { error: auditError } = await supabaseAdmin.from('summary_audits').insert({
                user_id: targetId,
                topic_code: 'FINAL-AUDIT',
                score: Math.floor(Math.random() * 15) + 80,
                summary_text: JSON.stringify({
                    answers: [['Correct Protocol Application', 'High']],
                    questions: ['Case Review Findings'],
                    metadata: { user_persona: 'Clinical Senior' }
                }),
                ai_feedback: `Counsellor ${c.name} shows exceptional attention to client clinical markers. Highly recommended for production.`
            });
            if (auditError) console.error(`   Audit Error:`, auditError.message);
        }

        await supabaseAdmin.from('mentor_activity_logs').insert(activities);
    }

    console.log('\n✅ Real Database Population Complete!');
}

seed().catch(err => {
    console.error('Fatal Seeding Error:', err);
    process.exit(1);
});
