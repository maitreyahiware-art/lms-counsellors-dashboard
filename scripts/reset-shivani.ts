// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetShivani() {
    const email = 'priya.k@balancenutrition.in';
    const newName = 'Shivani';

    console.log(`🧹 Resetting account: ${email}`);
    console.log(`📝 Renaming to: ${newName}\n`);

    // 1. Get profile and auth user
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);

    if (!profile || !authUser) {
        console.error('❌ Account not found. Check the email address.');
        return;
    }

    const uid = authUser.id;
    console.log(`User ID: ${uid}`);

    // 2. Clear ALL dummy data for this user
    console.log('\n🗑️  Clearing dummy data...');

    const { error: e1 } = await supabase.from('mentor_activity_logs').delete().eq('user_id', uid);
    console.log(e1 ? `   ❌ Activity logs: ${e1.message}` : `   ✅ Activity logs cleared`);

    const { error: e2 } = await supabase.from('mentor_progress').delete().eq('user_id', uid);
    console.log(e2 ? `   ❌ Progress: ${e2.message}` : `   ✅ Progress records cleared`);

    const { error: e3 } = await supabase.from('assessment_logs').delete().eq('user_id', uid);
    console.log(e3 ? `   ❌ Assessment logs: ${e3.message}` : `   ✅ Assessment scores cleared`);

    const { error: e4 } = await supabase.from('summary_audits').delete().eq('user_id', uid);
    console.log(e4 ? `   ❌ Audit reports: ${e4.message}` : `   ✅ Audit reports cleared`);

    // 3. Rename profile to Shivani
    console.log('\n✏️  Renaming account...');

    const { error: profileError } = await supabase.from('profiles').update({
        full_name: newName
    }).eq('id', uid);
    console.log(profileError ? `   ❌ Profile rename: ${profileError.message}` : `   ✅ Profile name updated to "${newName}"`);

    // 4. Update Supabase Auth metadata too (so it shows correctly after login)
    const { error: authError } = await supabase.auth.admin.updateUserById(uid, {
        user_metadata: {
            full_name: newName,
            role: 'counsellor'
        }
    });
    console.log(authError ? `   ❌ Auth metadata: ${authError.message}` : `   ✅ Auth display name updated to "${newName}"`);

    // 5. Verify the slate is clean
    const { count: actCount } = await supabase.from('mentor_activity_logs').select('*', { count: 'exact', head: true }).eq('user_id', uid);
    const { count: progCount } = await supabase.from('mentor_progress').select('*', { count: 'exact', head: true }).eq('user_id', uid);

    console.log(`\n📊 Account Status After Reset:`);
    console.log(`   Activity logs:    ${actCount} (should be 0)`);
    console.log(`   Progress records: ${progCount} (should be 0)`);
    console.log(`\n🏁 Done! Shivani's account (${email}) is clean and ready for the real user.`);
    console.log(`   Password remains: PRI-Kapoor-22`);
    console.log(`   All real activity from logins, quizzes, and topic completions will now flow to the admin portal automatically.`);
}

resetShivani().catch(console.error);
