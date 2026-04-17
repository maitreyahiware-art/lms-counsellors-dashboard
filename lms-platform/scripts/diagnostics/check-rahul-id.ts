// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRahul() {
    const email = 'rahul.s@balancenutrition.in';
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
    console.log('Profile ID:', profile?.id);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);
    console.log('Auth ID:', authUser?.id);

    // Check logs for BOTH IDs
    const { count: profileLogs } = await supabase.from('mentor_activity_logs').select('*', { count: 'exact', head: true }).eq('user_id', profile.id);
    const { count: authLogs } = await supabase.from('mentor_activity_logs').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id);

    console.log('Logs with Profile ID:', profileLogs);
    console.log('Logs with Auth ID:', authLogs);
}

checkRahul().catch(console.error);
