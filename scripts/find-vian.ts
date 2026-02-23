// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findVian() {
    const { data } = await supabase.from('profiles').select('*').eq('email', 'vian@bn.com').single();
    console.log('Vian Profile:', data);

    const { data: progress } = await supabase.from('mentor_progress').select('*').eq('user_id', data.id);
    console.log('Vian Progress Count:', progress?.length);
}

findVian().catch(console.error);
