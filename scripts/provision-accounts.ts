import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const accounts = [
    {
        email: 'workwithus@balancenutrition.in',
        password: 'BNADMIN',
        full_name: 'BN Admin',
        role: 'admin',
        seedData: false
    },
    {
        email: 'priya.k@balancenutrition.in',
        password: 'shivani-22',
        full_name: 'Shivani',
        role: 'mentor',
        seedData: false  // Real user — clean slate, no dummy data
    },
    {
        email: 'vikram.j@balancenutrition.in',
        password: 'VIK-Joshi-89',
        full_name: 'Vikram Joshi',
        role: 'mentor',
        seedData: true  // Testing account — inject sample data
    }
];

async function provisionAccounts() {
    console.log('🚀 Provisioning 3 Active Accounts...\n');

    // First, clean the DB tables of any old data
    console.log('🧹 Cleaning up old profiles and data...');
    await supabase.from('mentor_activity_logs').delete().neq('id', 0);
    await supabase.from('mentor_progress').delete().neq('id', 0);
    await supabase.from('assessment_logs').delete().neq('id', 0);
    await supabase.from('summary_audits').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    // Keep profiles to avoid FK issues — we'll upsert
    console.log('✅ Old data cleared\n');

    for (const acc of accounts) {
        console.log(`--- Provisioning: ${acc.full_name} (${acc.email}) ---`);

        // 1. Check if auth user exists
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let authUser = users.find(u => u.email === acc.email);
        let uid: string;

        if (authUser) {
            uid = authUser.id;
            console.log(`   Found existing auth user: ${uid}`);
            // Update password and metadata
            const { error } = await supabase.auth.admin.updateUserById(uid, {
                password: acc.password,
                user_metadata: { full_name: acc.full_name, role: acc.role }
            });
            if (error) console.error(`   ❌ Auth update error:`, error.message);
            else console.log(`   ✅ Auth updated (password + name)`);
        } else {
            console.log(`   Creating new auth user...`);
            const { data: newAuth, error } = await supabase.auth.admin.createUser({
                email: acc.email,
                password: acc.password,
                email_confirm: true,
                user_metadata: { full_name: acc.full_name, role: acc.role }
            });
            if (error) {
                console.error(`   ❌ Auth creation failed:`, error.message);
                continue;
            }
            uid = newAuth.user.id;
            console.log(`   ✅ New auth user created: ${uid}`);
        }

        // 2. Sync Profile (delete any stale entries with same email but wrong ID)
        await supabase.from('profiles').delete().eq('email', acc.email);

        const { error: profileError } = await supabase.from('profiles').insert({
            id: uid,
            email: acc.email,
            full_name: acc.full_name,
            role: acc.role,
            created_at: new Date().toISOString()
        });
        if (profileError) {
            // If already exists by ID, just update
            const { error: updateError } = await supabase.from('profiles').update({
                full_name: acc.full_name,
                email: acc.email,
                role: acc.role
            }).eq('id', uid);
            if (updateError) console.error(`   ❌ Profile sync error:`, updateError.message);
            else console.log(`   ✅ Profile synced`);
        } else {
            console.log(`   ✅ Profile created`);
        }

        // 3. Seed test data ONLY for Vikram (testing account)
        if (acc.seedData) {
            console.log(`   📊 Injecting test data for ${acc.full_name}...`);

            // Activity logs
            const activities = [
                { user_id: uid, activity_type: 'login', content_title: 'Platform Login', module_id: 'System' },
                { user_id: uid, activity_type: 'view_topic', content_title: 'Website Deep Dive', module_id: 'module-1' },
                { user_id: uid, activity_type: 'view_topic', content_title: 'Meet Our Founders', module_id: 'module-1' },
                { user_id: uid, activity_type: 'view_topic', content_title: 'Social Media Assessment', module_id: 'module-1' },
                { user_id: uid, activity_type: 'view_topic', content_title: 'How We Work', module_id: 'module-2' },
                { user_id: uid, activity_type: 'view_topic', content_title: 'Program Training', module_id: 'module-2' },
                { user_id: uid, activity_type: 'complete_quiz', content_title: 'Module 1 Quiz Passed', module_id: 'module-1' },
                { user_id: uid, activity_type: 'submit_assignment', content_title: 'Peer Review Audit Submitted', module_id: 'module-2' },
            ];
            await supabase.from('mentor_activity_logs').insert(activities);

            // Progress
            const progressEntries = [
                { user_id: uid, module_id: 'module-1', topic_code: 'M1-01' },
                { user_id: uid, module_id: 'module-1', topic_code: 'M1-02' },
                { user_id: uid, module_id: 'module-1', topic_code: 'M1-03' },
                { user_id: uid, module_id: 'module-2', topic_code: 'M2-01' },
                { user_id: uid, module_id: 'module-2', topic_code: 'M2-02' },
            ];
            await supabase.from('mentor_progress').upsert(progressEntries, { onConflict: 'user_id,topic_code' });

            // Quiz score
            await supabase.from('assessment_logs').insert({
                user_id: uid,
                topic_code: 'MODULE_REVIEW_1',
                score: 4,
                total_questions: 5,
                raw_data: { questions: [{ question: 'BN Vision?', correctAnswer: 'Healthy India' }], answers: ['Healthy India'] }
            });

            // Peer audit
            await supabase.from('summary_audits').insert({
                user_id: uid,
                topic_code: 'FINAL-AUDIT',
                score: 88,
                summary_text: JSON.stringify({
                    answers: [['Strong lead capture observed via WhatsApp', '88']],
                    questions: ['Lead Capture & Enquiries'],
                    metadata: { user_persona: 'Testing Counsellor', companies: ['Balance Nutrition', 'Healthify Me'] }
                }),
                ai_feedback: 'Vikram Joshi demonstrates clear understanding of peer audit methodology. Good competitor differentiation. Ready for next module.'
            });

            console.log(`   ✅ Test data injected (8 activities, 5 progress records, 1 quiz, 1 audit)`);
        } else {
            console.log(`   🏁 Clean slate — no dummy data (real activity will be tracked)`);
        }

        console.log();
    }

    console.log('====================================');
    console.log('✅ ALL ACCOUNTS PROVISIONED\n');
    console.log('Active Accounts:');
    console.log('  Admin:    workwithus@balancenutrition.in  /  BNADMIN');
    console.log('  Shivani:  priya.k@balancenutrition.in     /  shivani-22');
    console.log('  Testing:  vikram.j@balancenutrition.in    /  VIK-Joshi-89');
    console.log('====================================');
}

provisionAccounts().catch(console.error);
