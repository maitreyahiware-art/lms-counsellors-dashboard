import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectLogs() {
    const { data: logs } = await supabase.from('mentor_activity_logs').select('user_id').limit(10);
    console.log('User IDs in logs:', logs?.map(l => l.user_id));

    // Check if any of these match profiles
    if (logs && logs.length > 0) {
        const { data: p } = await supabase.from('profiles').select('id, email').in('id', logs.map(l => l.user_id));
        console.log('Matching profiles:', p);
    }
}

inspectLogs().catch(console.error);
