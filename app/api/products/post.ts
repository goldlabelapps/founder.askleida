import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../';
import { requireProductsApiKey } from './_auth';

export type T_Product = {
  product_id?: string;
  practitioner_id?: string | null;
  title?: string | null;
  created?: string;
  updated?: string | null;
  data?: Record<string, unknown> | null;
  name?: string | null;
  category?: string | null;
  sku?: string | null;
  price?: number | null;
  description?: string | null;
  notes?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizePrice = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

// POST /api/products - Create a new product
export async function POST(req: Request) {
  const authError = requireProductsApiKey(req);
  if (authError) return authError;

  let body: T_Product;
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

  const dataObject = (body.data && typeof body.data === 'object')
    ? { ...body.data }
    : {};

  const name = normalizeText(body.name ?? dataObject.name);
  const category = normalizeText(body.category ?? dataObject.category);
  const sku = normalizeText(body.sku ?? dataObject.sku);
  const description = normalizeText(body.description ?? dataObject.description);
  const notes = normalizeText(body.notes ?? dataObject.notes);
  const price = normalizePrice(body.price ?? dataObject.price);

  if (!name) {
    const res = makeRes({ tenant, message: 'name is required', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  if ((body.price ?? dataObject.price) !== undefined && (body.price ?? dataObject.price) !== null && price === null) {
    const res = makeRes({ tenant, message: 'price must be a valid number >= 0', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  const payload: T_Product = {
    ...(body.product_id ? { product_id: body.product_id } : {}),
    ...(body.practitioner_id ? { practitioner_id: body.practitioner_id } : {}),
    title: normalizeText(body.title) || name,
    data: {
      ...dataObject,
      name,
      category,
      sku,
      price,
      description,
      notes,
    },
    ...(body.created ? { created: body.created } : {}),
    ...(body.updated ? { updated: body.updated } : {}),
  };

  const { data, error } = await supabase.from('products').insert([payload]).select();
  if (error) {
    const res = makeRes({ tenant, message: error.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const res = makeRes({ tenant, message: 'Product created', severity: 'success', data });
  return NextResponse.json(res);
}
