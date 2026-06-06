import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const normalizeText = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// PATCH /api/practitioners - Update a practitioner (expects { practitioner_id, ...fields })
export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      const res = makeRes({ tenant, message: 'Request body must be a JSON object', severity: 'error' });
      return NextResponse.json(res, { status: 400 });
    }

    body = parsed as Record<string, unknown>;
  } catch {
    const res = makeRes({ tenant, message: 'Invalid JSON body', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  const { practitioner_id, ...fields } = body;
  const practitionerId = typeof practitioner_id === 'string' ? practitioner_id.trim() : '';
  if (!practitionerId) {
    const res = makeRes({ tenant, message: 'Missing practitioner_id', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  if (fields.data !== undefined && fields.data !== null && typeof fields.data !== 'object') {
    const res = makeRes({ tenant, message: 'data must be a JSON object', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  const { data: existingRow, error: existingError } = await supabase
    .from('practitioners')
    .select('data')
    .eq('practitioner_id', practitionerId)
    .single();

  if (existingError) {
    const status = (existingError as any)?.code === 'PGRST116' ? 404 : 500;
    const res = makeRes({ tenant, message: existingError.message, severity: 'error' });
    return NextResponse.json(res, { status });
  }

  const currentData: Record<string, unknown> =
    existingRow?.data && typeof existingRow.data === 'object' ? { ...existingRow.data } : {};

  const incomingData: Record<string, unknown> =
    fields?.data && typeof fields.data === 'object' ? { ...fields.data } : {};

  const mergedData = {
    ...currentData,
    ...incomingData,
  } as Record<string, unknown>;

  const name = normalizeText(fields.name ?? incomingData.name);
  const category = normalizeText(fields.category ?? incomingData.category);
  const description = normalizeText(fields.description ?? incomingData.description);
  const notes = normalizeText(fields.notes ?? incomingData.notes);

  if (name !== undefined) mergedData.name = name;
  if (category !== undefined) mergedData.category = category;
  if (description !== undefined) mergedData.description = description;
  if (notes !== undefined) mergedData.notes = notes;

  const updatePayload: Record<string, unknown> = {
    data: mergedData,
  };

  if (typeof fields.title === 'string') {
    updatePayload.title = fields.title.trim() || null;
  } else if (name !== undefined) {
    updatePayload.title = name;
  }

  const { data, error } = await supabase
    .from('practitioners')
    .update(updatePayload)
    .eq('practitioner_id', practitionerId)
    .select();

  if (error) {
    const res = makeRes({ tenant, message: error.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const res = makeRes({ tenant, message: 'Practitioner updated', severity: 'success', data });
  return NextResponse.json(res);
}