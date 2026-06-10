import { NextResponse } from 'next/server';
import { getBaseurl, makeRes } from '..';

const tenant = process.env.NEXT_PUBLIC_TENANT;

export async function GET() {
  const baseURL = getBaseurl();
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

  const res = makeRes({
    tenant,
    severity: hasApiKey ? 'success' : 'warning',
    message: hasApiKey
      ? 'Claude routes ready'
      : 'Missing Anthropic env vars. Set ANTHROPIC_API_KEY.',
    data: {
      env: {
        hasApiKey,
      },
      routes: {
        claude: `${baseURL}/claude`,
      },
    },
  });

  return NextResponse.json(res, { status: hasApiKey ? 200 : 500 });
}
