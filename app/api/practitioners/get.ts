import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/practitioners - List all practitioners or fetch by id
export async function GET(req: Request) {
  const url = req?.url ? new URL(req.url) : null;
  const id = url?.searchParams.get('id');

  if (id) {
    const { data, error } = await supabase
      .from('practitioners')
      .select('*')
      .eq('practitioner_id', id)
      .single();

    if (error) {
      const res = makeRes({ tenant, message: error.message, severity: 'error' });
      return NextResponse.json(res, { status: 404 });
    }

    const res = makeRes({ tenant, message: 'Fetched practitioner', severity: 'success', data });
    return NextResponse.json(res);
  }

  const { data, error } = await supabase
    .from('practitioners')
    .select('*')
    .order('updated', { ascending: false, nullsFirst: false });

  if (error) {
    const res = makeRes({ tenant, message: error.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const res = makeRes({ tenant, message: 'Fetched practitioners', severity: 'success', data });
  return NextResponse.json(res);
}