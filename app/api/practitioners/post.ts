import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../';

export type T_Practitioner = {
  practitioner_id?: string;
  title?: string | null;
  created?: string;
  updated?: string | null;
  data?: Record<string, unknown> | null;
  name?: string | null;
  category?: string | null;
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

// POST /api/practitioners - Create a new practitioner
export async function POST(req: Request) {
  let body: T_Practitioner;
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
  const description = normalizeText(body.description ?? dataObject.description);
  const notes = normalizeText(body.notes ?? dataObject.notes);

  if (!name) {
    const res = makeRes({ tenant, message: 'name is required', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  const payload: T_Practitioner = {
    ...(body.practitioner_id ? { practitioner_id: body.practitioner_id } : {}),
    title: normalizeText(body.title) || name,
    data: {
      ...dataObject,
      name,
      category,
      description,
      notes,
    },
    ...(body.created ? { created: body.created } : {}),
    ...(body.updated ? { updated: body.updated } : {}),
  };

  const { data, error } = await supabase.from('practitioners').insert([payload]).select();
  if (error) {
    const res = makeRes({ tenant, message: error.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const res = makeRes({ tenant, message: 'Practitioner created', severity: 'success', data });
  return NextResponse.json(res);
}