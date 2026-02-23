import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAnjali() {
    const email = 'anjali.m@balancenutrition.in';
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (!profile) {
        console.log('Profile not found');
        return;
    }
    console.log('Anjali Profile ID:', profile.id);

    const { data: progress } = await supabase.from('mentor_progress').select('*').eq('user_id', profile.id);
    console.log('Anjali Progress:', progress?.length);

    const { data: activity } = await supabase.from('mentor_activity_logs').select('*').eq('user_id', profile.id);
    console.log('Anjali Activity:', activity?.length);
}

checkAnjali().catch(console.error);
