// @ts-nocheck
/**
 * One-time script: Seed the BN Admin account into Supabase
 * 
 * Run with: npx tsx scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_EMAIL = 'workwithus@balancenutrition.in';
const ADMIN_PASSWORD = 'BNADMIN';
const ADMIN_NAME = 'BN Admin';

async function seedAdmin() {
    console.log('🔑 Seeding admin account...');
    console.log(`   Email: ${ADMIN_EMAIL}`);

    // Step 1: Check if user already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role')
        .eq('email', ADMIN_EMAIL)
        .single();

    if (existingProfile) {
        console.log(`\n⚠️  Profile already exists for ${ADMIN_EMAIL}`);
        console.log(`   ID: ${existingProfile.id}`);
        console.log(`   Role: ${existingProfile.role}`);

        if (existingProfile.role !== 'admin') {
            // Update role to admin
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', existingProfile.id);

            if (updateError) {
                console.error('❌ Failed to update role:', updateError.message);
            } else {
                console.log('✅ Role updated to admin');
            }
        } else {
            console.log('✅ Already an admin — no changes needed');
        }
        return;
    }

    // Step 2: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_NAME, role: 'admin' }
    });

    if (authError) {
        // If user exists in auth but not in profiles, we still need to create the profile
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
            console.log('⚠️  Auth user already exists. Fetching ID to create profile...');

            // List users to find the existing one
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email === ADMIN_EMAIL);

            if (existingUser) {
                // Update password and metadata
                await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                    password: ADMIN_PASSWORD,
                    user_metadata: { full_name: ADMIN_NAME, role: 'admin' }
                });

                // Create profile
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: existingUser.id,
                        email: ADMIN_EMAIL,
                        full_name: ADMIN_NAME,
                        role: 'admin'
                    });

                if (profileError) {
                    console.error('❌ Profile creation failed:', profileError.message);
                } else {
                    console.log(`✅ Admin profile created/updated for existing auth user`);
                    console.log(`   ID: ${existingUser.id}`);
                }
            }
            return;
        }

        console.error('❌ Auth creation failed:', authError.message);
        process.exit(1);
    }

    const userId = authData.user?.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Step 3: Create profile
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: userId,
            email: ADMIN_EMAIL,
            full_name: ADMIN_NAME,
            role: 'admin'
        });

    if (profileError) {
        console.error('❌ Profile creation failed:', profileError.message);
        process.exit(1);
    }

    console.log('✅ Admin profile created');
    console.log('\n🎉 Admin account seeded successfully!');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role:     admin`);
    console.log(`   ID:       ${userId}`);
}

seedAdmin().catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
