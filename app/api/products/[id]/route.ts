import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../../';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/products/:id - Get product by product_id

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    const res = makeRes({ tenant, message: 'Missing id parameter', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }
  const { data, error } = await supabase.from('products').select('*').eq('product_id', id).single();
  if (error) {
    const res = makeRes({ tenant, message: error.message, severity: 'error' });
    return NextResponse.json(res, { status: 404 });
  }
  const res = makeRes({ tenant, message: 'Fetched product', severity: 'success', data });
  return NextResponse.json(res);
}
