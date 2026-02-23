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
    if (!profile) {
        console.log('Rahul not found');
        return;
    }
    console.log('Rahul ID:', profile.id);

    const { data: logs } = await supabase.from('mentor_activity_logs').select('*').eq('user_id', profile.id);
    console.log('Activity Logs Count:', logs?.length);
    if (logs && logs.length > 0) {
        console.log('First log:', logs[0]);
    } else {
        console.log('No logs found for this ID.');
        // Check if there are ANY logs
        const { count } = await supabase.from('mentor_activity_logs').select('*', { count: 'exact', head: true });
        console.log('Total logs in table:', count);
    }
}

checkRahul().catch(console.error);
