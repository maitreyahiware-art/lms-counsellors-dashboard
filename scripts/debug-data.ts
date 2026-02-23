import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugData() {
    console.log('--- Debugging mentor_progress ---');
    const { data: progress, error: prError } = await supabase.from('mentor_progress').select('*').limit(5);
    console.log('mentor_progress sample:', progress);

    console.log('\n--- Debugging profiles ---');
    const { data: profiles } = await supabase.from('profiles').select('id, email, role').limit(5);
    console.log('profiles sample:', profiles);

    if (progress && profiles) {
        const matchingIds = progress.filter(pr => profiles.some(p => p.id === pr.user_id));
        console.log(`\nFound ${matchingIds.length} matches in first 5 progress rows.`);
    }
}

debugData().catch(console.error);
