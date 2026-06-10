import { NextResponse } from 'next/server';
import { getBaseurl, makeRes } from '..';

const tenant = process.env.NEXT_PUBLIC_TENANT;

export async function GET() {
  const baseURL = getBaseurl();
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const model = process.env.ANTHROPIC_MODEL?.trim() || null;
  const hasModel = Boolean(model);

  const res = makeRes({
    tenant,
    severity: hasApiKey && hasModel ? 'success' : 'warning',
    message: hasApiKey && hasModel
      ? 'Claude routes ready'
      : 'Missing Anthropic env vars. Set ANTHROPIC_API_KEY and ANTHROPIC_MODEL.',
    data: {
      env: {
        hasApiKey,
        hasModel,
        model,
      },
      routes: {
        claude: `${baseURL}/claude`,
      },
      methods: ['GET', 'POST'],
    },
  });

  return NextResponse.json(res, { status: hasApiKey && hasModel ? 200 : 500 });
}
