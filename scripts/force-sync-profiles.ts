import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function forceSync() {
    console.log('🧨 Force Syncing Profiles from Auth...');

    const { data: { users } } = await supabase.auth.admin.listUsers();

    for (const authUser of users) {
        if (!authUser.email) continue;

        console.log(`\nProcessing ${authUser.email}...`);

        // 1. Delete ANY profile with this email or this Auth ID
        const { error: del1 } = await supabase.from('profiles').delete().eq('email', authUser.email);
        const { error: del2 } = await supabase.from('profiles').delete().eq('id', authUser.id);

        // 2. Insert fresh profile from Auth data
        const role = authUser.user_metadata?.role || 'mentor';
        const { error: insErr } = await supabase.from('profiles').insert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            role: role === 'admin' ? 'admin' : 'mentor',
            created_at: authUser.created_at
        });

        if (insErr) console.error(`   ❌ Failed to insert:`, insErr.message);
        else console.log(`   ✅ Profile synced to Auth ID: ${authUser.id}`);
    }

    console.log('\n✅ All profiles force-synced.');
}

forceSync().catch(console.error);
