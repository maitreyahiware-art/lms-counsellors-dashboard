// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectSchema() {
    console.log('🔍 Inspecting profiles table schema...');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Columns found in profiles table:', Object.keys(data[0] || {}));
    }
}

inspectSchema().catch(console.error);
