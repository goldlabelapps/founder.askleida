import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// DELETE /api/practitioners - Delete a practitioner (expects { practitioner_id })
export async function DELETE(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    const res = makeRes({ tenant, message: 'Invalid JSON body', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    const res = makeRes({ tenant, message: 'Request body must be a JSON object', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  const { practitioner_id } = body;
  if (!practitioner_id || typeof practitioner_id !== 'string') {
    const res = makeRes({ tenant, message: 'Missing or invalid practitioner_id', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  // Get the practitioner record to find associated auth user
  const { data: practitionerData, error: fetchError } = await supabase
    .from('practitioners')
    .select('*')
    .eq('practitioner_id', practitioner_id)
    .single();

  if (fetchError || !practitionerData) {
    const res = makeRes({ tenant, message: 'Practitioner not found', severity: 'error' });
    return NextResponse.json(res, { status: 404 });
  }

  // Delete the Supabase auth user if available
  if (practitionerData.practitioner_id) {
    const { error: authError } = await supabase.auth.admin.deleteUser(practitioner_id);
    // Note: We don't fail if auth user deletion fails, as the user may not exist in auth
    if (authError && authError.message !== 'User not found') {
      console.error('Error deleting auth user:', authError);
    }
  }

  // Delete the practitioner record from Postgres
  const { data, error } = await supabase
    .from('practitioners')
    .delete()
    .eq('practitioner_id', practitioner_id)
    .select();

  if (error) {
    const res = makeRes({ tenant, message: error.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const res = makeRes({ tenant, message: 'Practitioner deleted', severity: 'success', data });
  return NextResponse.json(res);
}