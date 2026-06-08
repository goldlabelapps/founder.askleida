import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
	const { data, error } = await supabase
		.schema('information_schema')
		.from('tables')
		.select('table_name, table_schema, table_type')
		.eq('table_schema', 'public')
		.eq('table_type', 'BASE TABLE')
		.order('table_name', { ascending: true });

	if (error) {
		const res = makeRes({ tenant, message: error.message, severity: 'error' });
		return NextResponse.json(res, { status: 500 });
	}

	const res = makeRes({
		tenant,
		message: 'Fetched public schema tables',
		severity: 'success',
		data,
	});
	return NextResponse.json(res);
}