import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../../lib/makeRes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const BUCKET = 'avatars';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST /api/practitioner/avatar
// Body: multipart/form-data with `file` (image) and `practitioner_id`
export async function POST(req: Request) {
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        const res = makeRes({ tenant, message: 'Invalid form data', severity: 'error' });
        return NextResponse.json(res, { status: 400 });
    }

    const practitionerId = formData.get('practitioner_id');
    const file = formData.get('file');

    if (!practitionerId || typeof practitionerId !== 'string') {
        const res = makeRes({ tenant, message: 'Missing practitioner_id', severity: 'error' });
        return NextResponse.json(res, { status: 400 });
    }

    if (!file || !(file instanceof Blob)) {
        const res = makeRes({ tenant, message: 'Missing image file', severity: 'error' });
        return NextResponse.json(res, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        const res = makeRes({ tenant, message: 'Only JPEG, PNG, WebP, or GIF images are allowed', severity: 'error' });
        return NextResponse.json(res, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
        const res = makeRes({ tenant, message: 'Image must be smaller than 5 MB', severity: 'error' });
        return NextResponse.json(res, { status: 400 });
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `${practitionerId}/avatar.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
        });

    if (uploadError) {
        const res = makeRes({ tenant, message: uploadError.message, severity: 'error' });
        return NextResponse.json(res, { status: 500 });
    }

    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

    const avatarVersion = Date.now();
    const avatarUrl = `${urlData.publicUrl}?v=${avatarVersion}`;

    // Fetch existing practitioner data so we can merge rather than overwrite
    const { data: existingRow, error: fetchError } = await supabase
        .from('practitioners')
        .select('data')
        .eq('practitioner_id', practitionerId)
        .single();

    if (fetchError) {
        const res = makeRes({ tenant, message: fetchError.message, severity: 'error' });
        return NextResponse.json(res, { status: 404 });
    }

    const existingData = (existingRow?.data && typeof existingRow.data === 'object')
        ? existingRow.data as Record<string, unknown>
        : {};

    const { error: patchError } = await supabase
        .from('practitioners')
        .update({ data: { ...existingData, avatar: avatarUrl } })
        .eq('practitioner_id', practitionerId);

    if (patchError) {
        const res = makeRes({ tenant, message: patchError.message, severity: 'error' });
        return NextResponse.json(res, { status: 500 });
    }

    const res = makeRes({
        tenant,
        message: 'Avatar updated',
        severity: 'success',
        data: { avatar_url: avatarUrl },
    });
    return NextResponse.json(res);
}
