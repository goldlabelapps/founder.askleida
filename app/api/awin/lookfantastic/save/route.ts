import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../../../';

type T_SaveAwinProductBody = {
  practitioner_id?: string;
  product_id?: string;
  title?: string;
  name?: string;
  category?: string;
  sku?: string;
  price?: number | string | null;
  description?: string;
  notes?: string;
  data?: Record<string, unknown>;
  awinProduct?: Record<string, unknown>;
  product?: Record<string, unknown>;
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

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    const text = normalizeText(value);
    if (text) {
      return text;
    }
  }

  return null;
};

export async function POST(req: Request) {
  let body: T_SaveAwinProductBody;

  try {
    body = await req.json();
  } catch {
    const res = makeRes({ tenant, severity: 'error', message: 'Invalid JSON body' });
    return NextResponse.json(res, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    const res = makeRes({ tenant, severity: 'error', message: 'Request body must be a JSON object' });
    return NextResponse.json(res, { status: 400 });
  }

  const practitionerId = normalizeText(body.practitioner_id);
  if (!practitionerId) {
    const res = makeRes({ tenant, severity: 'error', message: 'practitioner_id is required' });
    return NextResponse.json(res, { status: 400 });
  }

  const awinProduct = body.awinProduct || body.product;
  if (!awinProduct || typeof awinProduct !== 'object' || Array.isArray(awinProduct)) {
    const res = makeRes({ tenant, severity: 'error', message: 'awinProduct (or product) object is required' });
    return NextResponse.json(res, { status: 400 });
  }

  const basic =
    typeof (awinProduct as Record<string, unknown>).product_basic === 'object' &&
    (awinProduct as Record<string, unknown>).product_basic !== null &&
    !Array.isArray((awinProduct as Record<string, unknown>).product_basic)
      ? ((awinProduct as Record<string, unknown>).product_basic as Record<string, unknown>)
      : {};

  const dataObject = body.data && typeof body.data === 'object' && !Array.isArray(body.data)
    ? { ...body.data }
    : {};

  const name = firstText(
    body.name,
    dataObject.name,
    basic.title,
    basic.name,
    (awinProduct as Record<string, unknown>).title,
    (awinProduct as Record<string, unknown>).name
  );

  if (!name) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Could not infer product name from AWIN payload. Provide name explicitly.',
    });
    return NextResponse.json(res, { status: 400 });
  }

  const rawPrice =
    body.price ??
    dataObject.price ??
    (awinProduct as Record<string, unknown>).search_price ??
    (awinProduct as Record<string, unknown>).price ??
    basic.price;

  const price = normalizePrice(rawPrice);
  if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '' && price === null) {
    const res = makeRes({ tenant, severity: 'error', message: 'price must be a valid number >= 0' });
    return NextResponse.json(res, { status: 400 });
  }

  const category = firstText(
    body.category,
    dataObject.category,
    (awinProduct as Record<string, unknown>).category_name,
    (awinProduct as Record<string, unknown>).category,
    basic.category
  );

  const sku = firstText(
    body.sku,
    dataObject.sku,
    (awinProduct as Record<string, unknown>).merchant_product_id,
    (awinProduct as Record<string, unknown>).sku,
    (awinProduct as Record<string, unknown>).id,
    basic.id
  );

  const description = firstText(
    body.description,
    dataObject.description,
    basic.description,
    (awinProduct as Record<string, unknown>).description
  );

  const notes = firstText(body.notes, dataObject.notes);
  const title = firstText(body.title, name) || name;

  const payload = {
    ...(normalizeText(body.product_id) ? { product_id: normalizeText(body.product_id) } : {}),
    practitioner_id: practitionerId,
    title,
    data: {
      ...dataObject,
      source: 'awin',
      advertiser: 'lookfantastic',
      name,
      category,
      sku,
      price,
      description,
      notes,
      awinProductId: firstText((awinProduct as Record<string, unknown>).id, basic.id),
      awinDeepLink: firstText(
        (awinProduct as Record<string, unknown>).aw_deep_link,
        (awinProduct as Record<string, unknown>).deeplink,
        basic.aw_deep_link
      ),
      awinMerchantId: firstText(
        (awinProduct as Record<string, unknown>).advertiser_id,
        (awinProduct as Record<string, unknown>).merchant_id,
        basic.advertiser_id
      ),
      awin: awinProduct,
    },
  };

  const { data, error } = await supabase.from('products').insert([payload]).select().single();

  if (error) {
    const res = makeRes({ tenant, severity: 'error', message: error.message });
    return NextResponse.json(res, { status: 500 });
  }

  const res = makeRes({
    tenant,
    severity: 'success',
    message: 'Saved AWIN product to products table',
    data,
  });

  return NextResponse.json(res);
}
