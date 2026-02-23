// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testAdminLogin() {
    console.log('🔑 Testing Admin Login...');
    const email = 'workwithus@balancenutrition.in';
    const password = 'BNADMIN';

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('❌ Login Failed:', error.message);
    } else {
        console.log('✅ Login Successful!');
        console.log('User ID:', data.user?.id);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .single();

        console.log('Profile:', profile);
    }
}

testAdminLogin().catch(console.error);
