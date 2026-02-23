// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listAllProfiles() {
    console.log('📋 Existing Profiles in DB:');
    const { data, error } = await supabase
        .from('profiles')
        .select('email, full_name, role');

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.table(data);
    }
}

listAllProfiles().catch(console.error);
