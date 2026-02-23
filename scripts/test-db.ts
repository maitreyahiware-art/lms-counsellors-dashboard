// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
    console.log('🔍 Verifying syllabus_content table...');
    const { data, error } = await supabase
        .from('syllabus_content')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error finding syllabus_content table:', error.message);
        console.log('Please ensure you have run the SQL script in the Supabase Dashboard.');
    } else {
        console.log('✅ syllabus_content table found!');
    }
}

test();
