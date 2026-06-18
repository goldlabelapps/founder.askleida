import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../../';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  _req: Request,
  context: { params: Promise<{ product_id: string }> }
) {
  const { product_id } = await context.params;

  if (!product_id || !product_id.trim()) {
    const res = makeRes({ severity: 'error', message: 'Missing product_id parameter', data: null });
    return NextResponse.json(res, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', product_id)
    .single();

  if (error || !data) {
    const res = makeRes({
      severity: 'error',
      message: 'Product not found',
      data: null,
    });
    return NextResponse.json(res, { status: 404 });
  }

  const res = makeRes({
    severity: 'success',
    message: 'Fetched product',
    data,
  });

  return NextResponse.json(res);
}
