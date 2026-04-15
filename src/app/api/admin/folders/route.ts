import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

// Create a folder
export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { name, prefix } = await request.json();

        if (!name || !prefix) {
            return NextResponse.json({ error: 'Missing name or prefix' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('syllabus_folders')
            .insert({ name, prefix })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, folder: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// Rename a folder
export async function PUT(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { id, name } = await request.json();

        if (!id || !name) {
            return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('syllabus_folders')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, folder: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// Delete a folder
export async function DELETE(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    try {
        const { error } = await supabaseAdmin
            .from('syllabus_folders')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
