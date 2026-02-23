import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncIds() {
    console.log('🔄 Synchronizing Profile IDs with Auth IDs...');

    // 1. Get all Auth users
    const { data: { users } } = await supabase.auth.admin.listUsers();

    for (const authUser of users) {
        if (!authUser.email) continue;

        // 2. Find profile by email
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', authUser.email)
            .single();

        if (profile && profile.id !== authUser.id) {
            console.log(`\n📍 Mismatch for ${authUser.email}:`);
            console.log(`   Profile ID: ${profile.id}`);
            console.log(`   Auth ID:    ${authUser.id}`);

            // 3. Update related records to use new ID FIRST (to avoid FK issues)
            const tables = ['mentor_progress', 'assessment_logs', 'summary_audits', 'mentor_activity_logs'];
            for (const table of tables) {
                const { error } = await supabase
                    .from(table)
                    .update({ user_id: authUser.id })
                    .eq('user_id', profile.id);
                if (error) console.warn(`   ⚠️ Error updating ${table}:`, error.message);
                else console.log(`   ✅ Updated ${table}`);
            }

            // 4. Update Profile ID (Since ID is PK, we might need to delete and re-insert or use a temp record if FKs allow)
            // Simpler: Upsert with new ID and delete old ID
            const { data: fullProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single();

            const { error: insertError } = await supabase.from('profiles').upsert({
                ...fullProfile,
                id: authUser.id
            });

            if (insertError) {
                console.error(`   ❌ Failed to sync profile ID:`, insertError.message);
            } else {
                await supabase.from('profiles').delete().eq('id', profile.id);
                console.log(`   ✅ Profile ID synchronized.`);
            }
        }
    }

    console.log('\n🏁 Synchronization Complete!');
}

syncIds().catch(console.error);
