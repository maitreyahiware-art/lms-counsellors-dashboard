import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json();

        if (!email || !password || !fullName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create user in Supabase Auth with nutripreneur role
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'nutripreneur'
            }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const userId = authData.user?.id;

        // 2. Create the profile
        if (userId) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userId,
                    email,
                    full_name: fullName,
                    role: 'nutripreneur',
                    temp_password: password,
                    created_at: new Date().toISOString()
                });

            if (profileError) {
                console.warn('Nutripreneur profile creation warning:', profileError.message);
            }

            // 3. Initialize activity log
            await supabaseAdmin.from('mentor_activity_logs').insert([{
                user_id: userId,
                activity_type: 'signup',
                content_title: 'Nutripreneur Account Created',
                module_id: 'System'
            }]);
        }

        return NextResponse.json({
            success: true,
            user: { id: userId, email, fullName }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
